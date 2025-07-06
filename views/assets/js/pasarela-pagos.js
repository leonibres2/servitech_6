document.addEventListener('DOMContentLoaded', function() {
  // Elementos del DOM
  const paymentMethods = document.querySelectorAll('.payment-method');
  const creditCardForm = document.getElementById('creditCardForm');
  const pseForm = document.getElementById('pseForm');
  const nequiForm = document.getElementById('nequiForm');
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
      
      // Ocultar todos los formularios
      ocultarTodosLosFormularios();
      
      // Mostrar formulario específico según método
      if (selectedMethod === 'credit-card') {
        mostrarFormulario('credit-card');
      } else if (selectedMethod === 'pse') {
        mostrarFormulario('pse');
      } else if (selectedMethod === 'nequi') {
        mostrarFormulario('nequi');
      } else {
        // Para otros métodos de pago, solo mostrar como seleccionado
        paymentMethodSection.style.display = 'block';
      }
  });
  
  /**
   * Oculta todos los formularios de pago
   */
  function ocultarTodosLosFormularios() {
    paymentMethodSection.style.display = 'none';
    if (creditCardForm) creditCardForm.style.display = 'none';
    if (pseForm) pseForm.style.display = 'none';
    if (nequiForm) nequiForm.style.display = 'none';
  }
  
  /**
   * Muestra el formulario específico del método de pago
   */
  function mostrarFormulario(metodo) {
    switch (metodo) {
      case 'credit-card':
        if (creditCardForm) {
          creditCardForm.style.display = 'block';
          configurarFormateoTarjeta();
        }
        break;
      case 'pse':
        if (pseForm) {
          pseForm.style.display = 'block';
          configurarFormateoPSE();
        }
        break;
      case 'nequi':
        if (nequiForm) {
          nequiForm.style.display = 'block';
          configurarFormateoNequi();
        }
        break;
    }
  }
  
  // Evento para botón volver
  returnBtn.addEventListener('click', function() {
    ocultarTodosLosFormularios();
    paymentMethodSection.style.display = 'block';
    
    // Remover selección de métodos de pago
    paymentMethods.forEach(m => m.classList.remove('selected'));
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
    } else if (metodoSeleccionado.dataset.method === 'pse') {
      if (!validarDatosPSE()) {
        return; // La función validarDatosPSE ya muestra el error
      }
    } else if (metodoSeleccionado.dataset.method === 'nequi') {
      if (!validarDatosNequi()) {
        return; // La función validarDatosNequi ya muestra el error
      }
    } else if (metodoSeleccionado.dataset.method === 'nequi') {
      if (!validarDatosNequi()) {
        return; // La función validarDatosNequi ya muestra el error
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
    } else if (metodoSeleccionado.dataset.method === 'pse') {
      datosCompletos.pago.pse = {
        banco: document.getElementById('bankSelect').value,
        tipoPersona: document.getElementById('personType').value,
        tipoDocumento: document.getElementById('documentType').value,
        numeroDocumento: document.getElementById('documentNumber').value
      };
    } else if (metodoSeleccionado.dataset.method === 'nequi') {
      datosCompletos.pago.nequi = {
        numeroCelular: document.getElementById('nequiPhone').value,
        pin: document.getElementById('nequiPin').value // En producción, NO guardar el PIN
      };
    }
    
    // Guardar datos completos para la confirmación
    localStorage.setItem('pagoCompleto', JSON.stringify(datosCompletos));
    
    // Mostrar mensaje de procesamiento específico según método
    const originalText = continueBtn.innerHTML;
    continueBtn.disabled = true;
    
    if (metodoSeleccionado.dataset.method === 'pse') {
      continueBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redirigiendo al banco...';
      
      // Simular redirección a PSE (3 segundos)
      setTimeout(() => {
        continueBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Autorizando transacción...';
        
        // Simular autorización bancaria (3 segundos más)
        setTimeout(() => {
          finalizarProcesamiento(datosCompletos);
        }, 3000);
      }, 3000);
    } else if (metodoSeleccionado.dataset.method === 'nequi') {
      // Mostrar flujo específico de Nequi
      mostrarProcesamientoNequi(datosCompletos);
    } else {
      continueBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando pago...';
      
      // Simulación de procesamiento de pago (3 segundos)
      setTimeout(() => {
        finalizarProcesamiento(datosCompletos);
      }, 3000);
    }
  });
  
  /**
   * Finaliza el procesamiento del pago
   */
  function finalizarProcesamiento(datosCompletos) {
    // Generar ID de transacción simulado
    const transactionId = 'ST-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    // Agregar ID de transacción a los datos
    datosCompletos.pago.transactionId = transactionId;
    localStorage.setItem('pagoCompleto', JSON.stringify(datosCompletos));
    
    console.log('💳 Pago procesado exitosamente:', datosCompletos);
    
    // Redirigir a la página de confirmación
    window.location.href = '/confirmacion-asesoria.html';
  }
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
   * Valida los datos del formulario PSE
   */
  function validarDatosPSE() {
    const banco = document.getElementById('bankSelect').value;
    const tipoPersona = document.getElementById('personType').value;
    const tipoDocumento = document.getElementById('documentType').value;
    const numeroDocumento = document.getElementById('documentNumber').value.trim();
    
    if (!banco) {
      mostrarError('Por favor selecciona tu banco.');
      document.getElementById('bankSelect').focus();
      return false;
    }
    
    if (!tipoPersona) {
      mostrarError('Por favor selecciona el tipo de persona.');
      document.getElementById('personType').focus();
      return false;
    }
    
    if (!tipoDocumento) {
      mostrarError('Por favor selecciona el tipo de documento.');
      document.getElementById('documentType').focus();
      return false;
    }
    
    if (!numeroDocumento) {
      mostrarError('Por favor ingresa tu número de documento.');
      document.getElementById('documentNumber').focus();
      return false;
    }
    
    // Validar formato del documento según el tipo
    if (!validarFormatoDocumento(tipoDocumento, numeroDocumento)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Valida los datos del formulario Nequi
   */
  function validarDatosNequi() {
    const numeroCelular = document.getElementById('nequiPhone').value.trim();
    const pin = document.getElementById('nequiPin').value.trim();
    
    if (!numeroCelular) {
      mostrarError('Por favor ingresa tu número de celular asociado a Nequi.');
      document.getElementById('nequiPhone').focus();
      return false;
    }
    
    // Validar formato del número celular (10 dígitos)
    const numeroLimpio = numeroCelular.replace(/\D/g, '');
    if (numeroLimpio.length !== 10 || !numeroLimpio.startsWith('3')) {
      mostrarError('Ingresa un número de celular válido (debe iniciar con 3 y tener 10 dígitos).');
      document.getElementById('nequiPhone').focus();
      return false;
    }
    
    if (!pin) {
      mostrarError('Por favor ingresa tu PIN de Nequi.');
      document.getElementById('nequiPin').focus();
      return false;
    }
    
    // Validar PIN de 4 dígitos
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      mostrarError('El PIN de Nequi debe tener exactamente 4 dígitos.');
      document.getElementById('nequiPin').focus();
      return false;
    }
    
    return true;
  }
  
  /**
   * Valida el formato del documento según su tipo
   */
  function validarFormatoDocumento(tipo, numero) {
    const numeroLimpio = numero.replace(/\D/g, '');
    
    switch (tipo) {
      case 'cc':
        if (numeroLimpio.length < 7 || numeroLimpio.length > 10) {
          mostrarError('La cédula debe tener entre 7 y 10 dígitos.');
          return false;
        }
        break;
      case 'ce':
        if (numeroLimpio.length < 6 || numeroLimpio.length > 12) {
          mostrarError('La cédula de extranjería debe tener entre 6 y 12 caracteres.');
          return false;
        }
        break;
      case 'ti':
        if (numeroLimpio.length < 10 || numeroLimpio.length > 11) {
          mostrarError('La tarjeta de identidad debe tener 10 u 11 dígitos.');
          return false;
        }
        break;
      case 'nit':
        if (numeroLimpio.length < 9 || numeroLimpio.length > 10) {
          mostrarError('El NIT debe tener entre 9 y 10 dígitos.');
          return false;
        }
        break;
      case 'pp':
        if (numero.length < 6 || numero.length > 20) {
          mostrarError('El pasaporte debe tener entre 6 y 20 caracteres.');
          return false;
        }
        break;
    }
    
    return true;
  }
  
  /**
   * Configura formateo para campos PSE
   */
  function configurarFormateoPSE() {
    const documentNumberInput = document.getElementById('documentNumber');
    const documentTypeSelect = document.getElementById('documentType');
    
    // Formateo del número de documento
    if (documentNumberInput && documentTypeSelect) {
      documentNumberInput.addEventListener('input', function(e) {
        const tipoDocumento = documentTypeSelect.value;
        let value = e.target.value;
        
        // Para documentos numéricos, solo permitir números
        if (['cc', 'ce', 'ti', 'nit'].includes(tipoDocumento)) {
          value = value.replace(/\D/g, '');
        }
        
        e.target.value = value;
      });
    }
  }
  
  /**
   * Muestra el procesamiento específico de Nequi con animación
   */
  function mostrarProcesamientoNequi(datosCompletos) {
    continueBtn.innerHTML = '<i class="fas fa-mobile-alt"></i> Enviando notificación a Nequi...';
    
    // Fase 1: Validación de datos (2 segundos)
    setTimeout(() => {
      continueBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validando datos con Nequi...';
      
      // Fase 2: Envío de notificación push (2 segundos)
      setTimeout(() => {
        continueBtn.innerHTML = '<i class="fas fa-bell fa-pulse"></i> Esperando autorización en tu celular...';
        
        // Fase 3: Simulación de autorización por parte del usuario (3 segundos)
        setTimeout(() => {
          continueBtn.innerHTML = '<i class="fas fa-check fa-pulse"></i> Autorizando transacción...';
          
          // Fase 4: Finalización (1 segundo)
          setTimeout(() => {
            finalizarProcesamiento(datosCompletos);
          }, 1000);
        }, 3000);
      }, 2000);
    }, 2000);
  }

  /**
   * Configura formateo para campos de Nequi
   */
  function configurarFormateoNequi() {
    const nequiPhoneInput = document.getElementById('nequiPhone');
    const nequiPinInput = document.getElementById('nequiPin');
    const nequiAmountDisplay = document.getElementById('nequiAmount');
    
    // Formateo del número de celular
    if (nequiPhoneInput) {
      nequiPhoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        // Limitar a 10 dígitos
        if (value.length > 10) {
          value = value.substring(0, 10);
        }
        
        // Formatear como xxx xxx xxxx
        if (value.length > 6) {
          value = value.substring(0, 3) + ' ' + value.substring(3, 6) + ' ' + value.substring(6);
        } else if (value.length > 3) {
          value = value.substring(0, 3) + ' ' + value.substring(3);
        }
        
        e.target.value = value;
      });
    }
    
    // Formateo del PIN (solo números, máximo 4 dígitos)
    if (nequiPinInput) {
      nequiPinInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
      });
    }
    
    // Actualizar el monto mostrado según los datos de la cita
    if (nequiAmountDisplay && citaData) {
      const precio = calcularPrecio(citaData.servicio);
      nequiAmountDisplay.textContent = precio;
    }
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