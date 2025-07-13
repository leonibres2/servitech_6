// Menú hamburguesa moderno para dispositivos pequeños
// Requiere: .mobile-menu-toggle, .mobile-nav-overlay, .close-btn, .nav-item

document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.querySelector(".mobile-menu-toggle");
  const navOverlay = document.querySelector(".mobile-nav-overlay");
  const closeBtn = document.querySelector(".close-btn");

  if (!menuToggle || !navOverlay || !closeBtn) return;

  // Abrir menú
  menuToggle.addEventListener("click", function (e) {
    navOverlay.classList.add("active");
    document.body.classList.add("no-scroll");
  });

  // Cerrar menú con botón
  closeBtn.addEventListener("click", function (e) {
    navOverlay.classList.remove("active");
    document.body.classList.remove("no-scroll");
  });

  // Cerrar menú al hacer click fuera del menú
  navOverlay.addEventListener("click", function (e) {
    if (e.target === navOverlay) {
      navOverlay.classList.remove("active");
      document.body.classList.remove("no-scroll");
    }
  });

  // Cerrar menú al hacer click en un enlace del menú
  navOverlay.querySelectorAll(".nav-item").forEach(function (item) {
    item.addEventListener("click", function () {
      navOverlay.classList.remove("active");
      document.body.classList.remove("no-scroll");
    });
  });
});
