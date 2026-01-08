// Variables globales
let allLeads = [];
let currentFilter = 'todos';
let sessionId = generateSessionId();

// Inicializar cuando la página carga
document.addEventListener('DOMContentLoaded', () => {
  cargarLeads();
  inicializarEventos();
  
  // Actualizar cada 30 segundos
  setInterval(cargarLeads, 30000);
});

// Generar session ID único
function generateSessionId() {
  return 'web_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Inicializar eventos
function inicializarEventos() {
  // Botón de actualizar
  document.getElementById('refreshBtn').addEventListener('click', cargarLeads);

  // Filtros
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      renderLeads();
    });
  });

  // Chat widget
  const chatFloatBtn = document.getElementById('chatFloatBtn');
  const chatWidget = document.getElementById('chatWidget');
  const chatToggle = document.getElementById('chatToggle');
  const chatSend = document.getElementById('chatSend');
  const chatInput = document.getElementById('chatInput');

  chatFloatBtn.addEventListener('click', () => {
    chatWidget.classList.add('active');
    chatFloatBtn.style.display = 'none';
  });

  chatToggle.addEventListener('click', () => {
    chatWidget.classList.remove('active');
    chatFloatBtn.style.display = 'block';
  });

  chatSend.addEventListener('click', enviarMensaje);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      enviarMensaje();
    }
  });
}

// Cargar leads desde el servidor
async function cargarLeads() {
  try {
    const response = await fetch('/api/leads');
    const data = await response.json();

    if (data.success) {
      allLeads = data.data;
      renderLeads();
      actualizarEstadisticas();
    }
  } catch (error) {
    console.error('Error al cargar leads:', error);
    mostrarError('Error al cargar los leads');
  }
}

// Renderizar leads en la tabla
function renderLeads() {
  const tbody = document.getElementById('leadsTableBody');
  const emptyState = document.getElementById('emptyState');
  
  // Filtrar leads según el filtro seleccionado
  let leadsToShow = allLeads;

  if (currentFilter === 'caliente' || currentFilter === 'tibio' || currentFilter === 'frio') {
    leadsToShow = allLeads.filter(lead => lead.estado === currentFilter);
  } else if (currentFilter === 'pendientes') {
    leadsToShow = allLeads.filter(lead => lead.contactado === 0);
  } else if (currentFilter === 'contactados') {
    leadsToShow = allLeads.filter(lead => lead.contactado === 1);
  }

  // Mostrar empty state si no hay leads
  if (leadsToShow.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  // Generar HTML de la tabla
  tbody.innerHTML = leadsToShow.map(lead => `
    <tr>
      <td>#${lead.id}</td>
      <td>
        <span class="estado-badge ${lead.estado}">
          ${getEstadoIcon(lead.estado)} ${lead.estado}
        </span>
      </td>
      <td>${lead.nombre || '-'}</td>
      <td>
        ${lead.telefono ? `<a href="https://wa.me/${lead.telefono.replace(/\+/g, '')}" target="_blank">${lead.telefono}</a>` : '-'}
      </td>
      <td>${lead.servicio || '-'}</td>
      <td>${lead.comuna || '-'}</td>
      <td>${lead.urgencia || '-'}</td>
      <td>${formatearFecha(lead.fecha_creacion)}</td>
      <td>
        <span class="contactado-badge ${lead.contactado ? 'si' : 'no'}">
          ${lead.contactado ? '✅ Sí' : '⏳ No'}
        </span>
      </td>
      <td>
        <button class="btn btn-small btn-success" onclick="marcarContactado(${lead.id})" ${lead.contactado ? 'disabled' : ''}>
          ✓ Contactado
        </button>
        <button class="btn btn-small btn-primary" onclick="verDetalles(${lead.id})">
          👁️ Ver
        </button>
      </td>
    </tr>
  `).join('');
}

// Actualizar estadísticas
function actualizarEstadisticas() {
  const total = allLeads.length;
  const calientes = allLeads.filter(l => l.estado === 'caliente').length;
  const tibios = allLeads.filter(l => l.estado === 'tibio').length;
  const frios = allLeads.filter(l => l.estado === 'frio').length;
  const pendientes = allLeads.filter(l => l.contactado === 0).length;

  document.getElementById('totalLeads').textContent = total;
  document.getElementById('calienteLeads').textContent = calientes;
  document.getElementById('tibioLeads').textContent = tibios;
  document.getElementById('frioLeads').textContent = frios;
  document.getElementById('pendientesLeads').textContent = pendientes;
}

// Marcar lead como contactado
async function marcarContactado(id) {
  if (!confirm('¿Marcar este lead como contactado?')) {
    return;
  }

  try {
    const response = await fetch(`/api/leads/${id}/contactado`, {
      method: 'PUT'
    });

    const data = await response.json();

    if (data.success) {
      mostrarExito('Lead marcado como contactado');
      cargarLeads();
    } else {
      mostrarError(data.error || 'Error al actualizar el lead');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error al marcar como contactado');
  }
}

// Ver detalles de un lead
function verDetalles(id) {
  const lead = allLeads.find(l => l.id === id);
  if (!lead) return;

  const modal = document.getElementById('leadModal');
  const modalBody = document.getElementById('leadModalBody');

  modalBody.innerHTML = `
    <div class="lead-detail">
      <strong>ID</strong>
      <p>#${lead.id}</p>
    </div>
    <div class="lead-detail">
      <strong>Estado</strong>
      <p><span class="estado-badge ${lead.estado}">${getEstadoIcon(lead.estado)} ${lead.estado}</span></p>
    </div>
    <div class="lead-detail">
      <strong>Nombre</strong>
      <p>${lead.nombre || '-'}</p>
    </div>
    <div class="lead-detail">
      <strong>Teléfono</strong>
      <p>${lead.telefono ? `<a href="https://wa.me/${lead.telefono.replace(/\+/g, '')}" target="_blank">${lead.telefono}</a>` : '-'}</p>
    </div>
    <div class="lead-detail">
      <strong>Servicio</strong>
      <p>${lead.servicio || '-'}</p>
    </div>
    <div class="lead-detail">
      <strong>Comuna</strong>
      <p>${lead.comuna || '-'}</p>
    </div>
    <div class="lead-detail">
      <strong>Urgencia</strong>
      <p>${lead.urgencia || '-'}</p>
    </div>
    <div class="lead-detail">
      <strong>Notas</strong>
      <p>${lead.notas || 'Sin notas adicionales'}</p>
    </div>
    <div class="lead-detail">
      <strong>Contactado</strong>
      <p><span class="contactado-badge ${lead.contactado ? 'si' : 'no'}">${lead.contactado ? '✅ Sí' : '⏳ No'}</span></p>
    </div>
    <div class="lead-detail">
      <strong>Fecha de Creación</strong>
      <p>${formatearFechaCompleta(lead.fecha_creacion)}</p>
    </div>
    ${lead.fecha_actualizacion !== lead.fecha_creacion ? `
    <div class="lead-detail">
      <strong>Última Actualización</strong>
      <p>${formatearFechaCompleta(lead.fecha_actualizacion)}</p>
    </div>
    ` : ''}
  `;

  modal.classList.add('active');
}

// Cerrar modal
function closeModal() {
  document.getElementById('leadModal').classList.remove('active');
}

// Cerrar modal al hacer clic fuera
document.getElementById('leadModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'leadModal') {
    closeModal();
  }
});

// Enviar mensaje en el chat
async function enviarMensaje() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();

  if (!message) return;

  // Limpiar input
  input.value = '';

  // Agregar mensaje del usuario al chat
  agregarMensajeAlChat(message, 'user');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        sessionId: sessionId
      })
    });

    const data = await response.json();

    if (data.success) {
      // Agregar respuesta del asistente
      agregarMensajeAlChat(data.data.respuesta, 'assistant');
      
      // Actualizar leads
      cargarLeads();
    } else {
      agregarMensajeAlChat('Error al procesar el mensaje', 'assistant');
    }
  } catch (error) {
    console.error('Error:', error);
    agregarMensajeAlChat('Error de conexión', 'assistant');
  }
}

// Agregar mensaje al chat
function agregarMensajeAlChat(texto, tipo) {
  const chatBody = document.getElementById('chatBody');
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${tipo}`;
  messageDiv.textContent = texto;
  chatBody.appendChild(messageDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// Utilidades
function getEstadoIcon(estado) {
  const icons = {
    'caliente': '🔥',
    'tibio': '🌡️',
    'frio': '❄️'
  };
  return icons[estado] || '';
}

function formatearFecha(fecha) {
  const date = new Date(fecha);
  const dia = date.getDate().toString().padStart(2, '0');
  const mes = (date.getMonth() + 1).toString().padStart(2, '0');
  const año = date.getFullYear();
  return `${dia}/${mes}/${año}`;
}

function formatearFechaCompleta(fecha) {
  const date = new Date(fecha);
  return date.toLocaleString('es-CL');
}

function mostrarExito(mensaje) {
  alert('✅ ' + mensaje);
}

function mostrarError(mensaje) {
  alert('❌ ' + mensaje);
}

