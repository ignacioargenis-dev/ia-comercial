// Estado global
let options = {};
let currentStrategy = {};

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    await loadOptions();
    await loadCurrentStrategy();
    renderForm();
    document.getElementById('loading').classList.remove('show');
    document.getElementById('content').style.display = 'block';
});

// Cargar opciones disponibles desde la API
async function loadOptions() {
    try {
        const response = await fetch('/api/commercial-strategy/options');
        const result = await response.json();
        
        if (result.success) {
            options = result.data;
        } else {
            showNotification('error', 'Error al cargar opciones');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('error', 'Error de conexión');
    }
}

// Cargar estrategia actual
async function loadCurrentStrategy() {
    try {
        const response = await fetch('/api/commercial-strategy');
        const result = await response.json();
        
        if (result.success) {
            currentStrategy = result.data.strategy;
        } else {
            showNotification('error', 'Error al cargar estrategia actual');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Renderizar el formulario dinámicamente
function renderForm() {
    // 1. Objetivo principal (radio buttons)
    const mainObjectiveContainer = document.getElementById('mainObjective');
    mainObjectiveContainer.innerHTML = options.mainObjective.map(opt => `
        <label class="option">
            <input type="radio" name="mainObjective" value="${opt.value}" 
                   ${currentStrategy.mainObjective === opt.value ? 'checked' : ''}>
            <div class="option-label">
                <strong>${opt.label}</strong>
                <small>${opt.description}</small>
            </div>
        </label>
    `).join('');

    // 2. Criterios de Lead Caliente (checkboxes)
    const hotLeadCriteriaContainer = document.getElementById('hotLeadCriteria');
    hotLeadCriteriaContainer.innerHTML = options.hotLeadCriteria.map(opt => `
        <label class="option">
            <input type="checkbox" name="hotLeadCriteria" value="${opt.key}"
                   ${currentStrategy.hotLeadCriteria?.[opt.key] ? 'checked' : ''}>
            <div class="option-label">
                <strong>${opt.label}</strong>
            </div>
        </label>
    `).join('');

    // 3. Acciones ante Lead Caliente (checkboxes)
    const hotLeadActionsContainer = document.getElementById('hotLeadActions');
    hotLeadActionsContainer.innerHTML = options.hotLeadActions.map(opt => `
        <label class="option">
            <input type="checkbox" name="hotLeadActions" value="${opt.key}"
                   ${currentStrategy.hotLeadActions?.[opt.key] ? 'checked' : ''}>
            <div class="option-label">
                <strong>${opt.label}</strong>
            </div>
        </label>
    `).join('');

    // 4. Nivel de Insistencia (radio buttons)
    const insistenceLevelContainer = document.getElementById('insistenceLevel');
    insistenceLevelContainer.innerHTML = options.insistenceLevel.map(opt => `
        <label class="option">
            <input type="radio" name="insistenceLevel" value="${opt.value}"
                   ${currentStrategy.insistenceLevel === opt.value ? 'checked' : ''}>
            <div class="option-label">
                <strong>${opt.label}</strong>
                <small>${opt.description}</small>
            </div>
        </label>
    `).join('');

    // 5. Tono de Comunicación (radio buttons)
    const communicationToneContainer = document.getElementById('communicationTone');
    communicationToneContainer.innerHTML = options.communicationTone.map(opt => `
        <label class="option">
            <input type="radio" name="communicationTone" value="${opt.value}"
                   ${currentStrategy.communicationTone === opt.value ? 'checked' : ''}>
            <div class="option-label">
                <strong>${opt.label}</strong>
                <small>${opt.description}</small>
            </div>
        </label>
    `).join('');

    // Agregar event listener al formulario
    document.getElementById('strategyForm').addEventListener('submit', handleSubmit);
}

// Obtener datos del formulario
function getFormData() {
    const form = document.getElementById('strategyForm');
    const formData = new FormData(form);
    
    // Obtener objetivo principal (radio)
    const mainObjective = formData.get('mainObjective');
    
    // Obtener criterios de lead caliente (checkboxes)
    const hotLeadCriteria = {};
    options.hotLeadCriteria.forEach(opt => {
        hotLeadCriteria[opt.key] = formData.getAll('hotLeadCriteria').includes(opt.key);
    });
    
    // Obtener acciones de lead caliente (checkboxes)
    const hotLeadActions = {};
    options.hotLeadActions.forEach(opt => {
        hotLeadActions[opt.key] = formData.getAll('hotLeadActions').includes(opt.key);
    });
    
    // Obtener nivel de insistencia (radio)
    const insistenceLevel = formData.get('insistenceLevel');
    
    // Obtener tono de comunicación (radio)
    const communicationTone = formData.get('communicationTone');
    
    return {
        mainObjective,
        hotLeadCriteria,
        hotLeadActions,
        insistenceLevel,
        communicationTone
    };
}

// Manejar envío del formulario
async function handleSubmit(e) {
    e.preventDefault();
    
    const data = getFormData();
    
    // Validar que se hayan seleccionado las opciones requeridas
    if (!data.mainObjective || !data.insistenceLevel || !data.communicationTone) {
        showNotification('error', 'Por favor completa todos los campos requeridos');
        return;
    }
    
    // Deshabilitar botón mientras se guarda
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Guardando...';
    
    try {
        const response = await fetch('/api/commercial-strategy', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('success', '✅ Estrategia guardada exitosamente. El prompt se generó automáticamente.');
            
            // Mostrar resumen
            setTimeout(() => {
                displaySummary(result.data.summary);
            }, 500);
        } else {
            showNotification('error', `Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('error', 'Error al guardar la estrategia');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '💾 Guardar Estrategia';
    }
}

// Vista previa de la estrategia
async function previewStrategy() {
    const data = getFormData();
    
    try {
        const response = await fetch('/api/commercial-strategy/preview-prompt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Crear modal con la vista previa
            showPreviewModal(result.data.prompt);
        } else {
            showNotification('error', 'Error al generar vista previa');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('error', 'Error de conexión');
    }
}

// Mostrar modal con vista previa del prompt
function showPreviewModal(prompt) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            max-width: 800px;
            max-height: 80vh;
            border-radius: 12px;
            padding: 30px;
            overflow-y: auto;
        ">
            <h3 style="margin-bottom: 20px;">Vista Previa del Prompt Generado</h3>
            <pre style="
                background: #f5f5f5;
                padding: 20px;
                border-radius: 8px;
                overflow-x: auto;
                white-space: pre-wrap;
                font-size: 12px;
                line-height: 1.6;
            ">${prompt}</pre>
            <button onclick="this.closest('div[style*=fixed]').remove()" class="btn btn-primary" style="margin-top: 20px;">
                Cerrar
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Mostrar resumen de la estrategia guardada
function displaySummary(summary) {
    const existingSummary = document.getElementById('summary-box');
    if (existingSummary) {
        existingSummary.remove();
    }
    
    const summaryBox = document.createElement('div');
    summaryBox.id = 'summary-box';
    summaryBox.className = 'summary-box';
    summaryBox.innerHTML = `
        <h4>📊 Resumen de tu Estrategia Comercial</h4>
        <ul>
            <li><strong>Objetivo:</strong> ${summary.objetivo}</li>
            <li><strong>Criterios de Lead Caliente:</strong> ${summary.criteriosCaliente.join(', ')}</li>
            <li><strong>Acciones Automáticas:</strong> ${summary.accionesCaliente.join(', ')}</li>
            <li><strong>Nivel de Insistencia:</strong> ${summary.insistencia}</li>
            <li><strong>Tono:</strong> ${summary.tono}</li>
            <li><strong>Última Actualización:</strong> ${new Date(summary.ultimaActualizacion).toLocaleString('es-CL')}</li>
        </ul>
    `;
    
    document.querySelector('.content').appendChild(summaryBox);
}

// Mostrar notificación
function showNotification(type, message) {
    const notification = document.getElementById('notification');
    const icon = document.getElementById('notificationIcon');
    const messageEl = document.getElementById('notificationMessage');
    
    notification.className = `notification ${type} show`;
    icon.textContent = type === 'success' ? '✅' : '❌';
    messageEl.textContent = message;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

