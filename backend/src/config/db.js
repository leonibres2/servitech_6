/**
 * @fileoverview
 * Configuración y exportación del pool de conexiones a la base de datos MySQL/MariaDB para Servitech.
 * Utiliza variables de entorno para mayor seguridad y flexibilidad.
 *
 * Autor: Diana Carolina Jimenez
 * Fecha: 2025-06-04
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

/**
 * Crea un pool de conexiones reutilizable para la base de datos,
 * permitiendo múltiples consultas concurrentes y mejorando el rendimiento.
 * Los parámetros de conexión se obtienen del archivo .env.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST, // Dirección del servidor de la base de datos
  user: process.env.DB_USER, // Usuario de la base de datos
  password: process.env.DB_PASS, // Contraseña de la base de datos
  database: process.env.DB_NAME, // Nombre de la base de datos
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
