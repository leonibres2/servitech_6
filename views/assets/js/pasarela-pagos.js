document.addEventListener('DOMContentLoaded', function() {
  // Elementos del DOM
  const paymentMethods = document.querySelectorAll('.payment-method');
  const creditCardForm = document.getElementById('creditCardForm');
  const paymentMethodSection = document.querySelector('.payment-method-section');
  const returnBtn = document.getElementById('returnBtn');
  const continueBtn = document.getElementById('continueBtn');
  
  // Variables para los datos de la cita
  let citaData = null;
  
  // Inicializar la página con datos del calendario
  inicializarPasarelaPagos();
  
  // Evento para seleccionar método de pago
  paymentMethods.forEach(method => {
    method.addEventListener('click', function() {
      const selectedMethod = this.dataset.method;
      
      // Eliminar selección previa
      paymentMethods.forEach(m => m.classList.remove('selected'));
      
      // Marcar como seleccionado
      this.classList.add('selected');
      
      // Mostrar formulario específico según método
      if (selectedMethod === 'credit-card') {
        paymentMethodSection.style.display = 'none';
        creditCardForm.style.display = 'block';
      }
    });
  });
  
  // Evento para botón volver
  returnBtn.addEventListener('click', function() {
    creditCardForm.style.display = 'none';
    paymentMethodSection.style.display = 'block';
  });
    // Evento para continuar
  continueBtn.addEventListener('click', function() {
    // Validar que hay datos de cita
    if (!citaData) {
      mostrarError('No se pueden procesar el pago sin datos de la cita.');
      return;
    }
    
    // Validar método de pago seleccionado
    const metodoSeleccionado = document.querySelector('.payment-method.selected');
    if (!metodoSeleccionado) {
      mostrarError('Por favor selecciona un método de pago.');
      return;
    }
    
    // Validar email
    const email = document.getElementById('email').value;
    if (!email || !validarEmail(email)) {
      mostrarError('Por favor ingresa un email válido.');
      document.getElementById('email').focus();
      return;
    }
    
    // Validar campos de tarjeta si está seleccionada
    if (metodoSeleccionado.dataset.method === 'credit-card') {
      if (!validarDatosTarjeta()) {
        return; // La función validarDatosTarjeta ya muestra el error
      }
    }
    
    // Preparar datos completos para el procesamiento
    const datosCompletos = {
      cita: citaData,
      pago: {
        metodo: metodoSeleccionado.dataset.method,
        email: email,
        monto: calcularPrecio(citaData.servicio),
        timestamp: new Date().toISOString()
      }
    };
    
    // Si es tarjeta de crédito, agregar datos de la tarjeta
    if (metodoSeleccionado.dataset.method === 'credit-card') {
      datosCompletos.pago.tarjeta = {
        nombre: document.getElementById('cardName').value,
        numero: document.getElementById('cardNumber').value.replace(/\s/g, ''),
        vencimiento: document.getElementById('expiryDate').value,
        cvv: document.getElementById('cvv').value,
        cuotas: document.getElementById('cuotas').value
      };
    }
    
    // Guardar datos completos para la confirmación
    localStorage.setItem('pagoCompleto', JSON.stringify(datosCompletos));
    
    // Mostrar mensaje de procesamiento
    const originalText = continueBtn.innerHTML;
    continueBtn.disabled = true;
    continueBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando pago...';
    
    // Simulación de procesamiento de pago (3 segundos)
    setTimeout(function() {
      // Generar ID de transacción simulado
      const transactionId = 'ST-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      // Agregar ID de transacción a los datos
      datosCompletos.pago.transactionId = transactionId;
      localStorage.setItem('pagoCompleto', JSON.stringify(datosCompletos));
      
      console.log('💳 Pago procesado exitosamente:', datosCompletos);
      
      // Redirigir a la página de confirmación
      window.location.href = '/confirmacion-asesoria.html';
    }, 3000);
  });
  
  /**
   * Valida formato de email
   */
  function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
  
  /**
   * Valida los datos de la tarjeta de crédito
   */
  function validarDatosTarjeta() {
    const cardName = document.getElementById('cardName').value.trim();
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;
    
    if (!cardName) {
      mostrarError('Ingresa el nombre como aparece en la tarjeta.');
      document.getElementById('cardName').focus();
      return false;
    }
    
    if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
      mostrarError('Ingresa un número de tarjeta válido.');
      document.getElementById('cardNumber').focus();
      return false;
    }
    
    if (!expiryDate || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
      mostrarError('Ingresa una fecha de vencimiento válida (MM/AA).');
      document.getElementById('expiryDate').focus();
      return false;
    }
    
    if (!cvv || cvv.length < 3 || cvv.length > 4) {
      mostrarError('Ingresa un CVV válido (3 o 4 dígitos).');
      document.getElementById('cvv').focus();
      return false;
    }
    
    return true;
  }
  
  /**
   * Inicializa la pasarela de pagos con los datos del calendario
   */
  function inicializarPasarelaPagos() {
    // Recuperar datos de la cita desde localStorage
    const citaSeleccionada = localStorage.getItem('citaSeleccionada');
    
    if (!citaSeleccionada) {
      mostrarError('No se encontraron datos de la cita. Serás redirigido al calendario.');
      setTimeout(() => {
        window.location.href = '/calendario.html';
      }, 3000);
      return;
    }
    
    try {
      citaData = JSON.parse(citaSeleccionada);
      console.log('📅 Datos de cita recuperados:', citaData);
      
      // Actualizar interfaz con datos de la cita
      actualizarInformacionCita();
      
    } catch (error) {
      console.error('Error al parsear datos de cita:', error);
      mostrarError('Error al cargar los datos de la cita.');
    }
  }
  
  /**
   * Actualiza la interfaz con la información de la cita
   */
  function actualizarInformacionCita() {
    if (!citaData) return;
    
    // Actualizar información del servicio en el header
    const serviceInfo = document.querySelector('.service-info p');
    const priceElement = document.querySelector('.price');
    
    if (serviceInfo) {
      serviceInfo.textContent = `Asesoría: ${citaData.servicio} - ${citaData.duracion}`;
    }
    
    // Calcular precio según el servicio
    const precio = calcularPrecio(citaData.servicio);
    if (priceElement) {
      priceElement.textContent = precio;
    }
    
    // Agregar resumen de la cita en la página
    agregarResumenCita();
  }
  
  /**
   * Calcula el precio según el tipo de servicio
   */
  function calcularPrecio(servicio) {
    const precios = {
      'Desarrollo Web': '$25.000 COP',
      'Soporte Técnico': '$20.000 COP',
      'Consultoría IT': '$30.000 COP',
      'Diseño UX/UI': '$28.000 COP',
      'Base de Datos': '$22.000 COP',
      'Seguridad Informática': '$35.000 COP'
    };
    
    return precios[servicio] || '$25.000 COP';
  }
  
  /**
   * Agrega un resumen de la cita antes de los métodos de pago
   */
  function agregarResumenCita() {
    // Verificar si ya existe el resumen
    if (document.getElementById('citaResumen')) return;
    
    const resumenHTML = `
      <div id="citaResumen" class="cita-resumen" style="
        background: #f8f9fa;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 25px;
        border-left: 4px solid #007bff;
      ">
        <h3 style="color: #333; margin-bottom: 15px; font-size: 1.1rem;">
          <i class="fas fa-calendar-check" style="color: #007bff; margin-right: 8px;"></i>
          Resumen de tu cita
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div class="resumen-item">
            <span style="font-weight: 500; color: #666;">📅 Fecha:</span>
            <span style="color: #333; margin-left: 8px;">${formatearFecha(citaData.fecha)}</span>
          </div>
          <div class="resumen-item">
            <span style="font-weight: 500; color: #666;">🕐 Hora:</span>
            <span style="color: #333; margin-left: 8px;">${citaData.hora}</span>
          </div>
          <div class="resumen-item">
            <span style="font-weight: 500; color: #666;">👨‍💻 Experto:</span>
            <span style="color: #333; margin-left: 8px;">${citaData.experto}</span>
          </div>
          <div class="resumen-item">
            <span style="font-weight: 500; color: #666;">🔧 Servicio:</span>
            <span style="color: #333; margin-left: 8px;">${citaData.servicio}</span>
          </div>
        </div>
      </div>
    `;
    
    // Insertar antes de la sección de métodos de pago
    const metodosSection = document.querySelector('.payment-method-section');
    if (metodosSection) {
      metodosSection.insertAdjacentHTML('beforebegin', resumenHTML);
    }
  }
  
  /**
   * Formatea la fecha para mostrar de forma legible
   */
  function formatearFecha(fechaString) {
    try {
      const fecha = new Date(fechaString + 'T00:00:00');
      const opciones = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      };
      
      return fecha.toLocaleDateString('es-ES', opciones);
    } catch (error) {
      return fechaString; // Fallback al string original
    }
  }
  
  /**
   * Muestra mensajes de error al usuario
   */
  function mostrarError(mensaje) {
    // Crear elemento de error
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 9999;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    errorDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <i class="fas fa-exclamation-triangle"></i>
        <span>${mensaje}</span>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
  }
  
  // Agregar formateo automático a los campos de tarjeta
  function configurarFormateoTarjeta() {
    const cardNumberInput = document.getElementById('cardNumber');
    const expiryDateInput = document.getElementById('expiryDate');
    const cvvInput = document.getElementById('cvv');
    
    // Formateo del número de tarjeta
    if (cardNumberInput) {
      cardNumberInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
        let formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
        
        if (formattedValue.length > 23) { // 16 dígitos + 3 espacios
          formattedValue = formattedValue.substring(0, 23);
        }
        
        e.target.value = formattedValue;
      });
    }
    
    // Formateo de fecha de vencimiento
    if (expiryDateInput) {
      expiryDateInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length >= 2) {
          value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        
        e.target.value = value;
      });
    }
    
    // Solo números en CVV
    if (cvvInput) {
      cvvInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
      });
    }
  }
  
  // Configurar formateo cuando se muestre el formulario de tarjeta
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.target.id === 'creditCardForm' && 
          mutation.target.style.display === 'block') {
        configurarFormateoTarjeta();
      }
    });
  });
  
  const creditCardFormElement = document.getElementById('creditCardForm');
  if (creditCardFormElement) {
    observer.observe(creditCardFormElement, { 
      attributes: true, 
      attributeFilter: ['style'] 
    });
  }

});
