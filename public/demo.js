// Simulador de Clientes para Demos Comerciales

let currentScenario = null;
let currentStep = 0;
let sessionId = null;
let stats = {
    total: 0,
    leads: 0
};

// Escenarios predefinidos con mensajes realistas
const scenarios = {
    urgente: {
        title: '🔥 Cliente Urgente - María González',
        subtitle: 'Necesita servicio hoy, alta probabilidad de cierre',
        messages: [
            { role: 'user', text: 'Hola, necesito ayuda urgente' },
            { role: 'bot', text: '...' },
            { role: 'user', text: 'Mi aire acondicionado dejó de funcionar y hace mucho calor' },
            { role: 'bot', text: '...' },
            { role: 'user', text: 'Estoy en Las Condes' },
            { role: 'bot', text: '...' },
            { role: 'user', text: 'María González, +56912345678' },
            { role: 'bot', text: '...' }
        ]
    },
    corporativo: {
        title: '🏢 Cliente Corporativo - Roberto Silva',
        subtitle: 'Empresa con múltiples equipos, contrato recurrente',
        messages: [
            { role: 'user', text: 'Buenos días, llamo de una empresa' },
            { role: 'bot', text: '...' },
            { role: 'user', text: 'Necesitamos mantenimiento preventivo mensual para 15 equipos' },
            { role: 'bot', text: '...' },
            { role: 'user', text: 'Estamos en Providencia, soy Roberto Silva' },
            { role: 'bot', text: '...' },
            { role: 'user', text: 'Mi teléfono es +56912345603' },
            { role: 'bot', text: '...' }
        ]
    },
    referido: {
        title: '👥 Cliente Referido - Francisca Pinto',
        subtitle: 'Viene recomendado, alta confianza',
        messages: [
            { role: 'user', text: 'Hola, me recomendaron con Diego Morales' },
            { role: 'bot', text: '...' },
            { role: 'user', text: 'Necesito instalar 2 aires acondicionados esta semana' },
            { role: 'bot', text: '...' },
            { role: 'user', text: 'Soy Francisca Pinto, estoy en Estación Central' },
            { role: 'bot', text: '...' },
            { role: 'user', text: '+56912345612' },
            { role: 'bot', text: '...' }
        ]
    },
    cotizacion: {
        title: '💰 Solicita Cotización - Andrea Rojas',
        subtitle: 'Comparando precios, necesita seguimiento',
        messages: [
            { role: 'user', text: 'Hola, quisiera cotizar una reparación' },
            { role: 'bot', text: '...' },
            { role: 'user', text: 'Mi equipo no enfría bien' },
            { role: 'bot', text: '...' },
            { role: 'user', text: 'Estoy en Ñuñoa, soy Andrea Rojas' },
            { role: 'bot', text: '...' },
            { role: 'user', text: 'Mi número es +56912345604' },
            { role: 'bot', text: '...' }
        ]
    },
    mantenimiento: {
        title: '🔧 Mantenimiento Preventivo - Carlos Muñoz',
        subtitle: 'Consulta sobre servicio regular',
        messages: [
            { role: 'user', text: 'Hola, quiero información sobre mantenimiento' },
            { role: 'bot', text: '...' },
            { role: 'user', text: '¿Cada cuánto se debe hacer?' },
            { role: 'bot', text: '...' },
            { role: 'user', text: 'Soy Carlos Muñoz, estoy en La Reina' },
            { role: 'bot', text: '...' },
            { role: 'user', text: '+56912345605, me gustaría una cotización' },
            { role: 'bot', text: '...' }
        ]
    },
    consulta: {
        title: '❓ Consulta General - Pedro Soto',
        subtitle: 'Solo pregunta, sin compromiso inmediato',
        messages: [
            { role: 'user', text: 'Hola' },
            { role: 'bot', text: '...' },
            { role: 'user', text: '¿Qué servicios ofrecen?' },
            { role: 'bot', text: '...' },
            { role: 'user', text: '¿Cuánto cuesta una instalación aprox?' },
            { role: 'bot', text: '...' }
        ]
    }
};

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    
    // Event listeners para escenarios
    document.querySelectorAll('.scenario').forEach(scenario => {
        scenario.addEventListener('click', () => selectScenario(scenario.dataset.scenario));
    });
});

function selectScenario(scenarioName) {
    currentScenario = scenarios[scenarioName];
    currentStep = 0;
    sessionId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // UI updates
    document.querySelectorAll('.scenario').forEach(s => s.classList.remove('active'));
    document.querySelector(`[data-scenario="${scenarioName}"]`).classList.add('active');
    
    document.getElementById('chat-title').textContent = currentScenario.title;
    document.getElementById('chat-subtitle').textContent = currentScenario.subtitle;
    
    document.getElementById('btn-start').disabled = false;
    
    resetChat();
}

function resetChat() {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '<div class="loading">▶️ Presiona "Iniciar Simulación" para comenzar</div>';
    currentStep = 0;
    document.getElementById('btn-start').disabled = false;
    document.getElementById('btn-start').textContent = '▶️ Iniciar Simulación';
}

async function startSimulation() {
    if (!currentScenario) {
        alert('Selecciona un escenario primero');
        return;
    }
    
    document.getElementById('btn-start').disabled = true;
    document.getElementById('btn-start').textContent = '⏸️ Simulación en curso...';
    
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';
    
    // Comenzar con el primer mensaje
    await nextStep();
}

async function nextStep() {
    if (currentStep >= currentScenario.messages.length) {
        // Fin de la simulación
        document.getElementById('btn-start').disabled = false;
        document.getElementById('btn-start').textContent = '▶️ Iniciar Simulación';
        stats.total++;
        
        // Verificar si se capturó un lead
        setTimeout(async () => {
            const captured = await checkLeadCaptured();
            if (captured) {
                stats.leads++;
                showSuccessMessage();
            }
            saveStats();
            updateStatsDisplay();
        }, 1000);
        
        return;
    }
    
    const message = currentScenario.messages[currentStep];
    
    if (message.role === 'user') {
        // Mostrar mensaje del usuario
        addMessageToUI('user', message.text);
        currentStep++;
        
        // Auto-continuar después de un momento
        setTimeout(() => nextStep(), 800);
    } else {
        // Mensaje del bot - hacer request real a la API
        addMessageToUI('bot', '...', true);
        
        try {
            const userMessage = currentScenario.messages[currentStep - 1].text;
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: userMessage,
                    sessionId: sessionId
                })
            });
            
            const data = await response.json();
            
            // Reemplazar el "..." con la respuesta real
            setTimeout(() => {
                const loadingMsg = document.querySelector('.message.bot:last-child .message-bubble');
                if (loadingMsg) {
                    // La respuesta está en data.data.respuesta
                    const respuesta = data.data?.respuesta || data.reply || 'Error al obtener respuesta';
                    loadingMsg.textContent = respuesta;
                    loadingMsg.style.opacity = '1';
                }
                currentStep++;
                
                // Continuar automáticamente si hay más mensajes
                setTimeout(() => {
                    if (currentStep < currentScenario.messages.length) {
                        nextStep();
                    }
                }, 800);
            }, 500);
            
        } catch (error) {
            console.error('Error:', error);
            const loadingMsg = document.querySelector('.message.bot:last-child .message-bubble');
            if (loadingMsg) {
                loadingMsg.textContent = 'Error al obtener respuesta. Verifica que el servidor esté corriendo.';
            }
        }
    }
}

function addMessageToUI(role, text, isLoading = false) {
    const messagesDiv = document.getElementById('messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;
    
    if (isLoading) {
        bubble.style.opacity = '0.6';
    }
    
    messageDiv.appendChild(bubble);
    messagesDiv.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function checkLeadCaptured() {
    try {
        const response = await fetch('/api/leads');
        const data = await response.json();
        
        // Buscar si hay un lead con este sessionId
        if (data.success && data.data) {
            return data.data.some(lead => {
                // Aproximación: verificar leads recientes
                const createdAt = new Date(lead.fecha_creacion);
                const now = new Date();
                const diff = now - createdAt;
                return diff < 60000; // Últimos 60 segundos
            });
        }
        
        return false;
    } catch (error) {
        console.error('Error checking leads:', error);
        return false;
    }
}

function showSuccessMessage() {
    const messagesDiv = document.getElementById('messages');
    
    const successDiv = document.createElement('div');
    successDiv.style.cssText = 'background: #2ed573; color: white; padding: 15px; border-radius: 10px; text-align: center; margin: 20px 0; font-weight: bold;';
    successDiv.innerHTML = '✅ LEAD CAPTURADO EXITOSAMENTE<br><small style="font-weight: normal; opacity: 0.9;">El lead fue guardado en la base de datos</small>';
    
    messagesDiv.appendChild(successDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function loadStats() {
    const saved = localStorage.getItem('demo_stats');
    if (saved) {
        stats = JSON.parse(saved);
        updateStatsDisplay();
    }
}

function saveStats() {
    localStorage.setItem('demo_stats', JSON.stringify(stats));
}

function updateStatsDisplay() {
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-leads').textContent = stats.leads;
    
    const conversion = stats.total > 0 ? ((stats.leads / stats.total) * 100).toFixed(1) : 0;
    document.getElementById('stat-conversion').textContent = conversion + '%';
}

