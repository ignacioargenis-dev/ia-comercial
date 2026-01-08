const express = require('express');
const router = express.Router();
const Logger = require('../../logging/Logger');
const container = require('../../container');

/**
 * Rutas de Health Check
 * 
 * Proporciona endpoints para monitorear la salud del sistema:
 * - Health check básico
 * - Health check detallado
 * - Readiness check (listo para recibir tráfico)
 * - Liveness check (proceso vivo)
 */

/**
 * GET /health
 * Health check básico - retorna rápido para load balancers
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /health/detailed
 * Health check detallado con estado de todos los componentes
 */
router.get('/detailed', async (req, res) => {
  const startTime = Date.now();
  const checks = {
    overall: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    components: {}
  };

  try {
    // 1. Check de Base de Datos
    try {
      const db = container.getDatabaseConnection();
      const testQuery = db.prepare('SELECT 1 as result').get();
      
      checks.components.database = {
        status: 'healthy',
        message: 'Database connection OK'
      };
    } catch (error) {
      checks.components.database = {
        status: 'unhealthy',
        message: error.message
      };
      checks.overall = 'degraded';
    }

    // 2. Check de OpenAI
    try {
      const openAIClient = container.getOpenAIClient();
      const isHealthy = await Promise.race([
        openAIClient.healthCheck(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);

      checks.components.openai = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        message: isHealthy ? 'OpenAI API accessible' : 'OpenAI API not responding'
      };

      if (!isHealthy) {
        checks.overall = 'degraded';
      }
    } catch (error) {
      checks.components.openai = {
        status: 'unhealthy',
        message: error.message
      };
      checks.overall = 'degraded';
    }

    // 3. Check de WhatsApp (opcional)
    try {
      const whatsappClient = container.getWhatsAppClient();
      const isConfigured = whatsappClient.isConfigured();

      if (isConfigured) {
        try {
          await Promise.race([
            whatsappClient.getPhoneNumberInfo(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
          ]);

          checks.components.whatsapp = {
            status: 'healthy',
            message: 'WhatsApp API accessible'
          };
        } catch (error) {
          checks.components.whatsapp = {
            status: 'unhealthy',
            message: error.message
          };
        }
      } else {
        checks.components.whatsapp = {
          status: 'not_configured',
          message: 'WhatsApp not configured'
        };
      }
    } catch (error) {
      checks.components.whatsapp = {
        status: 'error',
        message: error.message
      };
    }

    // 4. Check de Instagram (opcional)
    try {
      const instagramService = container.getInstagramService();
      const isConfigured = instagramService.isConfigured();

      if (isConfigured) {
        const healthResult = await instagramService.healthCheck();
        checks.components.instagram = {
          status: healthResult.status === 'ok' ? 'healthy' : 'unhealthy',
          message: healthResult.message
        };
      } else {
        checks.components.instagram = {
          status: 'not_configured',
          message: 'Instagram not configured'
        };
      }
    } catch (error) {
      checks.components.instagram = {
        status: 'error',
        message: error.message
      };
    }

    // 5. Check de Email (si está configurado)
    checks.components.email = {
      status: process.env.EMAIL_USER && process.env.EMAIL_PASS ? 'configured' : 'not_configured',
      message: process.env.EMAIL_USER && process.env.EMAIL_PASS ? 
        'Email notifications configured' : 
        'Email not configured'
    };

    // 6. Check de Memoria
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };

    const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    checks.components.memory = {
      status: heapUsagePercent > 90 ? 'warning' : 'healthy',
      usage: memoryUsageMB,
      heapUsagePercent: Math.round(heapUsagePercent)
    };

    // 7. Check de Scheduler
    try {
      const scheduler = container.getFollowUpScheduler();
      const schedulerStatus = scheduler.getStatus();

      checks.components.scheduler = {
        status: schedulerStatus.running ? 'healthy' : 'not_running',
        running: schedulerStatus.running,
        jobs: schedulerStatus.jobs
      };
    } catch (error) {
      checks.components.scheduler = {
        status: 'error',
        message: error.message
      };
    }

    // 7. Estadísticas de leads
    try {
      const leadRepository = container.getLeadRepository();
      const stats = leadRepository.getStatistics();

      checks.components.leads = {
        status: 'healthy',
        stats: {
          total: stats.total,
          pending: stats.pendientes,
          contacted: stats.contactados
        }
      };
    } catch (error) {
      checks.components.leads = {
        status: 'error',
        message: error.message
      };
    }

  } catch (error) {
    Logger.error('Health check failed', { error: error.message });
    checks.overall = 'unhealthy';
    checks.error = error.message;
  }

  const duration = Date.now() - startTime;
  checks.checkDuration = `${duration}ms`;

  // Determinar código de respuesta HTTP
  const statusCode = checks.overall === 'healthy' ? 200 :
                     checks.overall === 'degraded' ? 207 : // Multi-Status
                     503; // Service Unavailable

  Logger.info('Health check completed', {
    status: checks.overall,
    duration,
    components: Object.keys(checks.components).length
  });

  res.status(statusCode).json(checks);
});

/**
 * GET /health/ready
 * Readiness check - ¿El sistema está listo para recibir tráfico?
 */
router.get('/ready', async (req, res) => {
  try {
    // Verificar componentes críticos
    const db = container.getDatabaseConnection();
    db.prepare('SELECT 1').get();

    // Si llegamos aquí, estamos listos
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    Logger.error('Readiness check failed', { error: error.message });
    res.status(503).json({
      status: 'not_ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /health/live
 * Liveness check - ¿El proceso está vivo?
 */
router.get('/live', (req, res) => {
  // Si respondemos, estamos vivos
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  });
});

/**
 * GET /health/metrics
 * Métricas del sistema
 */
router.get('/metrics', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    process: {
      pid: process.pid,
      version: process.version,
      platform: process.platform
    }
  });
});

module.exports = router;

