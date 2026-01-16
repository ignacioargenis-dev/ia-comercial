require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Importar logging y manejo de errores
const Logger = require('./src/infrastructure/logging/Logger');
const { 
  errorHandler, 
  notFoundHandler, 
  initializeGlobalHandlers 
} = require('./src/infrastructure/http/middleware/errorHandler');
const { 
  requestLogger, 
  requestId 
} = require('./src/infrastructure/http/middleware/requestLogger');

// Importar rutas desde la nueva estructura
const chatRoutes = require('./src/infrastructure/http/routes/chat');
const leadsRoutes = require('./src/infrastructure/http/routes/leads');
const whatsappRoutes = require('./src/infrastructure/http/routes/whatsapp');
const instagramRoutes = require('./src/infrastructure/http/routes/instagram');
const followupsRoutes = require('./src/infrastructure/http/routes/followups');
const healthRoutes = require('./src/infrastructure/http/routes/health');
const systemRoutes = require('./src/infrastructure/http/routes/system'); // Rutas de configuración del sistema
const simulateRoutes = require('./src/infrastructure/http/routes/simulate'); // Rutas de simulación para demos
const commercialStrategyRoutes = require('./src/infrastructure/http/routes/commercial-strategy'); // Estrategia comercial IA

// Importar contenedor para seguimientos automáticos
const container = require('./src/infrastructure/container');

// Inicializar manejadores globales de errores
initializeGlobalHandlers();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales (orden importa)
app.use(requestId);        // Agregar ID a cada request
app.use(requestLogger);    // Loguear requests
app.use(cors());
app.use(express.json({ limit: '1mb' })); // Limitar tamaño de body
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
app.use('/api/chat', chatRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/followups', followupsRoutes);
app.use('/api/system', systemRoutes); // Configuración del sistema
app.use('/api/simulate', simulateRoutes); // Simulación para demos
app.use('/api/commercial-strategy', commercialStrategyRoutes); // Estrategia comercial IA

// Health checks (sin /api para load balancers)
app.use('/health', healthRoutes);

// Rutas Web
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'demo.html'));
});

app.get('/estrategia-comercial', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'estrategia-comercial.html'));
});

// Manejo de errores 404 (debe ir después de todas las rutas)
app.use(notFoundHandler);

// Manejo de errores global (debe ser el último middleware)
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  Logger.systemStart('server', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });

  console.log('='.repeat(60));
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log('='.repeat(60));
  console.log('📊 Sistema de captura de leads con IA');
  console.log('🏗️  Arquitectura limpia con patrón Repository');
  console.log('⚡ Logging estructurado con Winston');
  console.log('🛡️  Manejo robusto de errores');
  console.log('✅ Validaciones de inputs');
  console.log('='.repeat(60));
  console.log('');
  console.log('📍 Rutas disponibles:');
  console.log(`   🌐 Web:        http://localhost:${PORT}/`);
  console.log(`   📊 Dashboard:  http://localhost:${PORT}/dashboard`);
  console.log(`   🔗 API Chat:   http://localhost:${PORT}/api/chat`);
  console.log(`   🔗 API Leads:  http://localhost:${PORT}/api/leads`);
  console.log(`   💚 Health:     http://localhost:${PORT}/health/detailed`);
  console.log('');
  console.log('='.repeat(60));

  // Iniciar seguimientos automáticos si está habilitado
  const enableFollowUps = process.env.ENABLE_FOLLOW_UPS !== 'false'; // Habilitado por defecto
  
  if (enableFollowUps) {
    console.log('');
    console.log('⏰ Inicializando sistema de seguimientos automáticos...');
    try {
      const scheduler = container.getFollowUpScheduler();
      scheduler.start();
    } catch (error) {
      console.error('❌ Error al iniciar seguimientos automáticos:', error.message);
      console.log('ℹ️  El sistema continuará sin seguimientos automáticos');
    }
  } else {
    console.log('');
    console.log('ℹ️  Seguimientos automáticos deshabilitados (ENABLE_FOLLOW_UPS=false)');
  }
  
  console.log('');
});

// Variable global para el scheduler
let followUpScheduler = null;

// Manejo de cierre graceful
process.on('SIGINT', () => {
  Logger.systemStop('server', { reason: 'SIGINT' });
  console.log('\n👋 Cerrando servidor gracefully...');
  
  // Detener seguimientos automáticos
  try {
    const scheduler = container.getFollowUpScheduler();
    if (scheduler && scheduler.isRunning) {
      scheduler.stop();
    }
  } catch (error) {
    Logger.error('Error stopping scheduler', { error: error.message });
  }
  
  // Dar tiempo para finalizar operaciones en curso
  setTimeout(() => {
    Logger.systemStop('server', { reason: 'shutdown complete' });
    process.exit(0);
  }, 1000);
});

process.on('SIGTERM', () => {
  Logger.systemStop('server', { reason: 'SIGTERM' });
  console.log('\n👋 SIGTERM recibido, cerrando...');
  process.exit(0);
});
