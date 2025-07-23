// Middleware de subida de archivos para mensajería (usando multer)
// Este archivo define la configuración y las restricciones para la carga de archivos en el sistema de mensajería.
// Utiliza la librería multer para gestionar la recepción y almacenamiento de archivos enviados por los usuarios.

// Importa la librería multer, que facilita la gestión de archivos subidos a través de formularios multipart/form-data.
const multer = require("multer");
// Importa el módulo path para manejar rutas de archivos y directorios de forma segura y multiplataforma.
const path = require("path");

// Configura el almacenamiento de archivos en disco usando multer.diskStorage.
// Permite definir la carpeta de destino y el nombre final del archivo subido.
const storage = multer.diskStorage({
  // Define la carpeta donde se guardarán los archivos subidos.
  destination: function (req, file, cb) {
    // Usa path.join para asegurar la ruta correcta, apuntando a /uploads/mensajeria.
    cb(null, path.join(__dirname, "../../uploads/mensajeria"));
  },
  // Define el nombre del archivo guardado para evitar colisiones y mantener unicidad.
  filename: function (req, file, cb) {
    // Crea un sufijo único usando timestamp y un número aleatorio.
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Reemplaza espacios en el nombre original por guiones bajos para evitar problemas en rutas.
    cb(null, uniqueSuffix + "-" + file.originalname.replace(/\s+/g, "_"));
  },
});

// Define el filtro de archivos permitidos según su tipo MIME.
// Solo se aceptan imágenes y documentos comunes para mayor seguridad.
const fileFilter = (req, file, cb) => {
  // Lista de tipos MIME permitidos (imágenes y documentos de oficina).
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  // Si el tipo de archivo está permitido, acepta la carga.
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Si no está permitido, rechaza la carga y devuelve un error.
    cb(new Error("Tipo de archivo no permitido"), false);
  }
};

// Inicializa el middleware de multer con la configuración definida.
// Limita el tamaño máximo de archivo a 10MB para evitar abusos y problemas de almacenamiento.
const upload = multer({
  storage, // Usa la configuración de almacenamiento personalizada.
  fileFilter, // Aplica el filtro de tipos de archivo permitidos.
  limits: { fileSize: 10 * 1024 * 1024 }, // Límite de tamaño: 10MB.
}); // 10MB máx

// Exporta el middleware configurado para ser usado en las rutas que requieran subida de archivos.
module.exports = upload;
