// Script para el manejo de filtros de expertos
document.addEventListener("DOMContentLoaded", function () {
  // Elementos del formulario
  const filterForm = document.querySelector(".filter-form");
  const priceSlider = document.querySelector(".price-slider");
  const priceValue = document.querySelector(".price-value");
  const searchInput = document.querySelector(".filter-input");
  const availabilityOptions = document.querySelectorAll(
    ".availability-options input"
  );
  const ratingOptions = document.querySelectorAll(".rating-options input");
  const expertGrid = document.querySelector(".expert-grid");
  const expertCount = document.querySelector(".expert-count");
  const sortSelect = document.querySelector(".sort-select");

  if (!filterForm) return; // Salir si no estamos en la página correcta

  // Establecer valores iniciales
  if (priceSlider) {
    priceSlider.value = 65000; // Valor inicial del slider (65,000 pesos)
    priceValue.textContent = `$${parseInt(priceSlider.value).toLocaleString(
      "es-CO"
    )}`;
  }

  // Seleccionar "Todos los horarios" por defecto
  const todosHorarios = Array.from(availabilityOptions).find(
    (opt) => opt.nextElementSibling.textContent === "Todos los horarios"
  );
  if (todosHorarios) {
    todosHorarios.checked = true;
  }

  // Actualizar el valor mostrado del precio
  priceSlider.addEventListener("input", function () {
    const valor = parseInt(this.value);
    priceValue.textContent = `$${valor.toLocaleString("es-CO")}`;
  });

  // Manejar envío del formulario
  filterForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Recopilar todos los filtros
    const filters = {
      search: searchInput.value,
      precio: priceSlider.value,
      disponibilidad: Array.from(availabilityOptions)
        .filter((opt) => opt.checked)
        .map((opt) => opt.nextElementSibling.textContent),
      rating: Array.from(ratingOptions).find((opt) => opt.checked)
        ?.nextElementSibling.textContent,
      orderBy: sortSelect.value,
    };

    try {
      // Mostrar indicador de carga
      expertGrid.innerHTML = '<div class="loading">Buscando expertos...</div>';

      console.log("Enviando filtros:", {
        ...filters,
        precio: {
          min: parseInt(filters.precio) * 1000,
          max: parseInt(filters.precio) * 1000 + 5000,
        },
      });

      // Enviar filtros al servidor
      const response = await fetch("/api/expertos/filtrar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...filters,
          precio: {
            min: parseInt(filters.precio),
            max: parseInt(filters.precio) + 5000,
          },
          disponibilidad:
            filters.disponibilidad.length > 0
              ? filters.disponibilidad
              : ["Todos los horarios"],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Error en la respuesta del servidor"
        );
      }

      const data = await response.json();

      // Actualizar la lista de expertos
      if (data.expertos && data.expertos.length > 0) {
        actualizarListaExpertos(data.expertos);
        expertCount.textContent = `(${data.expertos.length} resultados)`;
      } else {
        expertGrid.innerHTML = `
          <div class="no-expertos">
            <p>No se encontraron expertos con los filtros seleccionados.</p>
          </div>`;
        expertCount.textContent = "(0 resultados)";
      }
    } catch (error) {
      console.error("Error al filtrar:", error);
      expertGrid.innerHTML = `
        <div class="error-message">
          <p>Hubo un error al aplicar los filtros. Por favor, intente nuevamente.</p>
        </div>`;
    }
  });

  // Manejar reset del formulario
  filterForm.addEventListener("reset", function () {
    setTimeout(() => {
      priceSlider.value = 20;
      const valorInicial = parseInt(priceSlider.value) * 1000;
      priceValue.textContent = `$${valorInicial.toLocaleString("es-CO")} - $${(
        valorInicial + 5000
      ).toLocaleString("es-CO")}`;
      filterForm.dispatchEvent(new Event("submit"));
    }, 0);
  });

  // Ordenar expertos
  sortSelect.addEventListener("change", function () {
    filterForm.dispatchEvent(new Event("submit"));
  });
});

// Función para actualizar la lista de expertos
function actualizarListaExpertos(expertos) {
  const container = document.querySelector(".expert-grid");
  container.innerHTML = expertos
    .map(
      (experto) => `
    <article class="expert-card">
      <div class="expert-card-header">
        <img src="${experto.foto}" alt="${experto.nombre} ${
        experto.apellido
      }" class="expert-photo">
        <div class="expert-info">
          <h3 class="expert-name">${experto.nombre} ${experto.apellido}</h3>
          <p class="expert-usuario"><strong>Usuario:</strong> @${
            experto.usuario
          }</p>
          <p class="expert-specialty">${experto.especialidad}</p>
          <div class="expert-rating">
            <span class="rating-stars">${"⭐".repeat(
              Math.round(experto.calificacion?.promedio || 0)
            )}</span>
            <span class="rating-value">${
              experto.calificacion?.promedio?.toFixed(1) || "0.0"
            }</span>
            ${
              experto.calificacion?.total_reviews
                ? `<span class="rating-count">(${experto.calificacion.total_reviews} reseñas)</span>`
                : ""
            }
          </div>
          <div class="expert-status">
            ${
              experto.activo !== false
                ? '<span class="badge badge-success">Disponible</span>'
                : '<span class="badge badge-warning">No disponible</span>'
            }
          </div>
        </div>
      </div>
      <div class="expert-card-body">
        <p class="expert-description">${experto.descripcion}</p>
        ${
          experto.skills && experto.skills.length > 0
            ? `
          <div class="expert-skills">
            <h4>Habilidades:</h4>
            <div class="skills-container">
              ${experto.skills
                .map(
                  (skill) => `
                <span class="skill-tag">${skill}</span>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }
      </div>
      <div class="expert-card-footer">
        <div class="expert-price">
          <span class="price-value">${experto.precio}</span>
          <span class="price-period">/hora</span>
        </div>
        <div class="expert-actions">
          ${
            experto.activo !== false
              ? `
            <a href="/expertos/${experto._id}/calendario" class="btn btn-primary btn-profile">
              <i class="fas fa-calendar-alt"></i> Agendar cita
            </a>
          `
              : `
            <button class="btn btn-secondary btn-profile" disabled>
              <i class="fas fa-clock"></i> No disponible
            </button>
          `
          }
        </div>
      </div>
      </article>
    `
    )
    .join("");
}
