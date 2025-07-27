/**
 * @fileoverview
 * Funcionalidad y validación del formulario de registro para Servitech.
 * Valida campos, muestra mensajes de error, y gestiona la experiencia de usuario en el registro.
 * (Nota: Este script solo valida en views, el envío real al backend debe implementarse aparte.)
 *
 * Autor: Diana Carolina Jimenez
 * Fecha: 2025-06-04
 */

document.addEventListener("DOMContentLoaded", function () {
  // Mostrar/ocultar contraseña
  document.querySelectorAll(".toggle-password").forEach((icon) => {
    icon.addEventListener("click", function () {
      const input = this.previousElementSibling;
      const type =
        input.getAttribute("type") === "password" ? "text" : "password";
      input.setAttribute("type", type);
      this.classList.toggle("fa-eye");
      this.classList.toggle("fa-eye-slash");
    });
  });

  // Animación de inputs al enfocar y desenfocar
  const inputs = document.querySelectorAll(
    'input[type="text"], input[type="email"], input[type="password"]'
  );
  inputs.forEach((input) => {
    input.addEventListener("focus", function () {
      this.parentElement.style.transform = "translateY(-2px)";
      this.parentElement.style.transition = "all 0.3s";
      this.parentElement.style.boxShadow = "0 5px 15px rgba(0, 0, 0, 0.1)";
    });

    input.addEventListener("blur", function () {
      this.parentElement.style.transform = "";
      this.parentElement.style.boxShadow = "";
    });
  });

  // Efectos visuales en botones sociales
  const socialButtons = document.querySelectorAll(".btn-social");
  socialButtons.forEach((button) => {
    button.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-2px)";
      this.style.boxShadow = "0 5px 15px rgba(0, 0, 0, 0.1)";
    });

    button.addEventListener("mouseleave", function () {
      this.style.transform = "";
      this.style.boxShadow = "";
    });
  });

  // Validación y gestión del formulario de registro
  const form = document.getElementById("registerForm");
  if (form) {
    // Elementos de entrada y mensajes de error
    const emailInput = document.getElementById("email");
    const nombreInput = document.getElementById("nombre");
    const apellidoInput = document.getElementById("apellido");
    const passwordInput = document.getElementById("password");
    const password2Input = document.getElementById("password2");
    const termsCheckbox = document.getElementById("terms");
    const privacyCheckbox = document.getElementById("privacy");

    const emailError = document.getElementById("emailError");
    const nombreError = document.getElementById("nombreError");
    const apellidoError = document.getElementById("apellidoError");
    const passwordError = document.getElementById("passwordError");
    const password2Error = document.getElementById("password2Error");
    const termsError = document.getElementById("termsError");
    const privacyError = document.getElementById("privacyError");

    // Requisitos visuales de la contraseña
    const reqLength = document.getElementById("req-length");
    const reqUppercase = document.getElementById("req-uppercase");
    const reqNumber = document.getElementById("req-number");
    const reqSpecial = document.getElementById("req-special");

    /**
     * Valida el formato del correo electrónico.
     * @param {string} email
     * @returns {boolean}
     */
    function validateEmail(email) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    }

    /**
     * Valida la contraseña y actualiza los requisitos visuales.
     * @param {string} password
     * @returns {boolean}
     */
    function validatePassword(password) {
      const lengthValid = password.length >= 8;
      const uppercaseValid = /[A-Z]/.test(password);
      const numberValid = /[0-9]/.test(password);
      const specialValid = /[$@!%*#?&]/.test(password);

      updateRequirement(reqLength, lengthValid);
      updateRequirement(reqUppercase, uppercaseValid);
      updateRequirement(reqNumber, numberValid);
      updateRequirement(reqSpecial, specialValid);

      return lengthValid && uppercaseValid && numberValid && specialValid;
    }

    /**
     * Actualiza el estado visual de un requisito de contraseña.
     * @param {HTMLElement} element
     * @param {boolean} isValid
     */
    function updateRequirement(element, isValid) {
      if (element) {
        if (isValid) {
          element.classList.add("requirement-met");
          element.classList.remove("requirement-not-met");
          element.querySelector("i").className = "fas fa-check-circle";
        } else {
          element.classList.add("requirement-not-met");
          element.classList.remove("requirement-met");
          element.querySelector("i").className = "fas fa-circle";
        }
      }
    }

    /**
     * Muestra un mensaje de error para un campo.
     */
    function showError(input, errorElement, message) {
      if (input && errorElement) {
        input.classList.add("input-error");
        errorElement.style.display = "block";
        errorElement.textContent = message;
      }
    }

    /**
     * Oculta el mensaje de error de un campo.
     */
    function hideError(input, errorElement) {
      if (input && errorElement) {
        input.classList.remove("input-error");
        errorElement.style.display = "none";
      }
    }

    // Validaciones en tiempo real para cada campo
    if (emailInput && emailError) {
      emailInput.addEventListener("input", function () {
        if (validateEmail(this.value)) {
          hideError(this, emailError);
        }
      });
    }

    if (nombreInput && nombreError) {
      nombreInput.addEventListener("input", function () {
        if (this.value.trim() !== "") {
          hideError(this, nombreError);
        }
      });
    }

    if (apellidoInput && apellidoError) {
      apellidoInput.addEventListener("input", function () {
        if (this.value.trim() !== "") {
          hideError(this, apellidoError);
        }
      });
    }

    if (passwordInput && passwordError) {
      passwordInput.addEventListener("input", function () {
        validatePassword(this.value);

        // Si las contraseñas ya no coinciden, actualizar mensaje de error
        if (
          password2Input &&
          password2Error &&
          password2Input.value &&
          this.value !== password2Input.value
        ) {
          showError(
            password2Input,
            password2Error,
            "Las contraseñas no coinciden"
          );
        } else if (password2Input && password2Error && password2Input.value) {
          hideError(password2Input, password2Error);
        }
      });
    }

    if (password2Input && password2Error && passwordInput) {
      password2Input.addEventListener("input", function () {
        if (this.value === passwordInput.value) {
          hideError(this, password2Error);
        } else {
          showError(this, password2Error, "Las contraseñas no coinciden");
        }
      });
    }

    if (termsCheckbox && termsError) {
      termsCheckbox.addEventListener("change", function () {
        if (this.checked) {
          hideError(this, termsError);
        }
      });
    }

    if (privacyCheckbox && privacyError) {
      privacyCheckbox.addEventListener("change", function () {
        if (this.checked) {
          hideError(this, privacyError);
        }
      });
    }

    // Validación final y mis-asesoriasback al enviar el formulario
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      let isValid = true;

      if (emailInput && emailError) {
        if (!validateEmail(emailInput.value)) {
          showError(
            emailInput,
            emailError,
            "Ingresa un correo electrónico válido"
          );
          isValid = false;
        } else {
          hideError(emailInput, emailError);
        }
      }

      if (nombreInput && nombreError) {
        if (nombreInput.value.trim() === "") {
          showError(nombreInput, nombreError, "El nombre es obligatorio");
          isValid = false;
        } else {
          hideError(nombreInput, nombreError);
        }
      }

      if (apellidoInput && apellidoError) {
        if (apellidoInput.value.trim() === "") {
          showError(apellidoInput, apellidoError, "El apellido es obligatorio");
          isValid = false;
        } else {
          hideError(apellidoInput, apellidoError);
        }
      }

      if (passwordInput && passwordError) {
        if (!validatePassword(passwordInput.value)) {
          showError(
            passwordInput,
            passwordError,
            "La contraseña no cumple con los requisitos"
          );
          isValid = false;
        } else {
          hideError(passwordInput, passwordError);
        }
      }

      if (passwordInput && password2Input && password2Error) {
        if (passwordInput.value !== password2Input.value) {
          showError(
            password2Input,
            password2Error,
            "Las contraseñas no coinciden"
          );
          isValid = false;
        } else {
          hideError(password2Input, password2Error);
        }
      }

      if (termsCheckbox && termsError) {
        if (!termsCheckbox.checked) {
          showError(
            termsCheckbox,
            termsError,
            "Debes aceptar los términos y condiciones"
          );
          isValid = false;
        } else {
          hideError(termsCheckbox, termsError);
        }
      }

      if (privacyCheckbox && privacyError) {
        if (!privacyCheckbox.checked) {
          showError(
            privacyCheckbox,
            privacyError,
            "Debes aceptar la política de privacidad"
          );
          isValid = false;
        } else {
          hideError(privacyCheckbox, privacyError);
        }
      }

      if (isValid) {
        // Enviar datos al backend
        fetch("http://localhost:3001/api/usuarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: nombreInput.value,
            apellido: apellidoInput.value,
            email: emailInput.value,
            password: passwordInput.value,
          }),
        })
          .then(async (res) => {
            const data = await res.json();
            if (res.ok) {
              // Registro exitoso
              const registroExitoso =
                document.getElementById("registroExitoso");
              if (registroExitoso) {
                registroExitoso.style.display = "block";
                form.querySelectorAll("input, button").forEach((el) => {
                  el.disabled = true;
                });
                setTimeout(function () {
                  window.location.href = "login.html";
                }, 2000);
              }
            } else {
              // Mostrar error del backend
              alert(data.error || "Error al registrar usuario");
            }
          })
          .catch((err) => {
            alert("Error de red o de servidor");
            console.error(err);
          });
      }
    });
  }
});
