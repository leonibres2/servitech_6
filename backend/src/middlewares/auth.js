/**
 * @fileoverview
 * Middleware de autenticación para rutas protegidas en Servitech.
 * Verifica la validez del token JWT enviado en el encabezado Authorization.
 * Si el token es válido, agrega la información del usuario al objeto req.
 * Si no es válido o no se proporciona, responde con error 401.
 *
 * Autor: Diana Carolina Jimenez
 * Fecha: 2025-06-04
 */

const jwt = require("jsonwebtoken");

/**
 * Middleware que protege rutas privadas validando el token JWT.
 * @param {Request} req - Objeto de solicitud HTTP.
 * @param {Response} res - Objeto de respuesta HTTP.
 * @param {Function} next - Función para continuar con la siguiente middleware.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secreto123");
    req.user = decoded; // Agrega la información del usuario autenticado a la solicitud
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

module.exports = authMiddleware;
