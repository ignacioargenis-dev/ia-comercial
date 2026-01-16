/**
 * Script de Prueba: Estrategia Comercial IA
 * 
 * Verifica que el sistema funciona correctamente:
 * - API endpoints responden
 * - Estrategia se guarda en BD
 * - Prompt se genera correctamente
 * - Validaciones funcionan
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Colores para consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(emoji, message, color = colors.reset) {
  console.log(`${emoji} ${color}${message}${colors.reset}`);
}

async function test1_getOptions() {
  log('🧪', 'TEST 1: Obtener opciones disponibles');
  try {
    const response = await fetch(`${BASE_URL}/api/commercial-strategy/options`);
    const result = await response.json();
    
    if (result.success && result.data.mainObjective.length === 4) {
      log('✅', 'Opciones disponibles cargadas correctamente', colors.green);
      return true;
    } else {
      log('❌', 'Error: Opciones no se cargaron correctamente', colors.red);
      return false;
    }
  } catch (error) {
    log('❌', `Error: ${error.message}`, colors.red);
    return false;
  }
}

async function test2_getCurrentStrategy() {
  log('🧪', 'TEST 2: Obtener estrategia actual');
  try {
    const response = await fetch(`${BASE_URL}/api/commercial-strategy`);
    const result = await response.json();
    
    if (result.success && result.data.strategy) {
      log('✅', 'Estrategia actual obtenida', colors.green);
      log('ℹ️', `Objetivo: ${result.data.summary.objetivo}`, colors.blue);
      return true;
    } else {
      log('❌', 'Error: No se pudo obtener estrategia', colors.red);
      return false;
    }
  } catch (error) {
    log('❌', `Error: ${error.message}`, colors.red);
    return false;
  }
}

async function test3_updateStrategy() {
  log('🧪', 'TEST 3: Actualizar estrategia');
  try {
    const newStrategy = {
      mainObjective: 'agendar_reuniones',
      hotLeadCriteria: {
        pidePrecio: false,
        pideCita: true,
        dejaTelefono: true,
        mencionaUrgencia: true,
        consultaDisponibilidad: false
      },
      hotLeadActions: {
        enviarEmail: true,
        enviarWhatsApp: false,
        mostrarCTA: true,
        derivarHumano: false
      },
      insistenceLevel: 'alto',
      communicationTone: 'directo'
    };

    const response = await fetch(`${BASE_URL}/api/commercial-strategy`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newStrategy)
    });

    const result = await response.json();
    
    if (result.success && result.data.promptGenerated) {
      log('✅', 'Estrategia actualizada y prompt generado', colors.green);
      log('ℹ️', `Nuevo objetivo: ${result.data.summary.objetivo}`, colors.blue);
      return true;
    } else {
      log('❌', `Error: ${result.error || 'No se pudo actualizar'}`, colors.red);
      return false;
    }
  } catch (error) {
    log('❌', `Error: ${error.message}`, colors.red);
    return false;
  }
}

async function test4_previewPrompt() {
  log('🧪', 'TEST 4: Vista previa de prompt');
  try {
    const testConfig = {
      mainObjective: 'generar_leads',
      hotLeadCriteria: {
        pidePrecio: true,
        pideCita: true,
        dejaTelefono: true,
        mencionaUrgencia: false,
        consultaDisponibilidad: false
      },
      hotLeadActions: {
        enviarEmail: true,
        enviarWhatsApp: false,
        mostrarCTA: false,
        derivarHumano: false
      },
      insistenceLevel: 'medio',
      communicationTone: 'profesional'
    };

    const response = await fetch(`${BASE_URL}/api/commercial-strategy/preview-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testConfig)
    });

    const result = await response.json();
    
    if (result.success && result.data.prompt.length > 100) {
      log('✅', 'Vista previa generada correctamente', colors.green);
      log('ℹ️', `Longitud del prompt: ${result.data.prompt.length} caracteres`, colors.blue);
      log('ℹ️', `Líneas: ${result.data.lines}`, colors.blue);
      return true;
    } else {
      log('❌', 'Error: No se pudo generar vista previa', colors.red);
      return false;
    }
  } catch (error) {
    log('❌', `Error: ${error.message}`, colors.red);
    return false;
  }
}

async function test5_invalidStrategy() {
  log('🧪', 'TEST 5: Validación de estrategia inválida');
  try {
    const invalidStrategy = {
      mainObjective: 'objetivo_invalido',
      insistenceLevel: 'medio',
      communicationTone: 'profesional'
    };

    const response = await fetch(`${BASE_URL}/api/commercial-strategy`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidStrategy)
    });

    const result = await response.json();
    
    if (!result.success && result.error) {
      log('✅', 'Validación funcionando correctamente (rechazó estrategia inválida)', colors.green);
      return true;
    } else {
      log('❌', 'Error: Validación no rechazó estrategia inválida', colors.red);
      return false;
    }
  } catch (error) {
    log('❌', `Error: ${error.message}`, colors.red);
    return false;
  }
}

async function test6_history() {
  log('🧪', 'TEST 6: Historial de estrategias');
  try {
    const response = await fetch(`${BASE_URL}/api/commercial-strategy/history?limit=5`);
    const result = await response.json();
    
    if (result.success && Array.isArray(result.data.history)) {
      log('✅', 'Historial obtenido correctamente', colors.green);
      log('ℹ️', `Estrategias en historial: ${result.data.count}`, colors.blue);
      return true;
    } else {
      log('❌', 'Error: No se pudo obtener historial', colors.red);
      return false;
    }
  } catch (error) {
    log('❌', `Error: ${error.message}`, colors.red);
    return false;
  }
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  log('🚀', 'INICIANDO TESTS DE ESTRATEGIA COMERCIAL IA', colors.yellow);
  console.log('='.repeat(60) + '\n');

  const results = [];
  
  results.push(await test1_getOptions());
  console.log('');
  
  results.push(await test2_getCurrentStrategy());
  console.log('');
  
  results.push(await test3_updateStrategy());
  console.log('');
  
  results.push(await test4_previewPrompt());
  console.log('');
  
  results.push(await test5_invalidStrategy());
  console.log('');
  
  results.push(await test6_history());
  console.log('');

  // Resumen
  console.log('='.repeat(60));
  const passed = results.filter(r => r === true).length;
  const total = results.length;
  
  if (passed === total) {
    log('✅', `TODOS LOS TESTS PASARON (${passed}/${total})`, colors.green);
  } else {
    log('⚠️', `${passed}/${total} tests pasaron`, colors.yellow);
  }
  console.log('='.repeat(60) + '\n');
}

// Ejecutar
runAllTests().catch(error => {
  log('❌', `Error fatal: ${error.message}`, colors.red);
  process.exit(1);
});

