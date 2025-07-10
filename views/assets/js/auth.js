/**
 * @fileoverview
 * Funciones de autenticación para el views de Servitech.
 * Permite iniciar sesión (login) y obtener el token JWT, así como acceder a rutas protegidas del backend.
 * Utiliza localStorage para almacenar el token y los datos del usuario autenticado.
 *
 * Autor: Diana Carolina Jimenez
 * Fecha: 2025-06-04
 */

/**
 * Inicia sesión enviando las credenciales al backend.
 * Si el login es exitoso, guarda el token y los datos del usuario en localStorage.
 * @param {string} email - Correo electrónico del usuario.
 * @param {string} password - Contraseña del usuario.
 * @returns {Promise<Object>} - Objeto usuario autenticado.
 * @throws {Error} - Si las credenciales son inválidas o hay error de red.
 */
async function login(email, password) {
  const res = await fetch("http://localhost:3001/api/usuarios/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.token) {
    localStorage.setItem("token", data.token); // Guarda el token JWT
    localStorage.setItem("currentUser", JSON.stringify(data.usuario)); // Guarda los datos del usuario
    return data.usuario;
  } else {
    throw new Error(data.error || "Login fallido");
  }
}

/**
 * Obtiene la lista de usuarios desde una ruta protegida del backend.
 * Envía el token JWT en el encabezado Authorization.
 * @returns {Promise<Array>} - Lista de usuarios.
 * @throws {Error} - Si el usuario no está autorizado.
 */
async function getUsuarios() {
  const token = localStorage.getItem("token");
  const res = await fetch("http://localhost:3001/api/usuarios", {
    headers: {
      Authorization: "Bearer " + token,
    },
  });
  if (res.status === 401) {
    throw new Error("No autorizado");
  }
  return await res.json();
}
