# 💬 SISTEMA DE MENSAJERÍA EN TIEMPO REAL - SERVITECH

## 🚀 Implementación Completa con Socket.IO

### 📋 Descripción General

El sistema de mensajería de SERVITECH proporciona comunicación en tiempo real entre usuarios utilizando **Socket.IO**, **Express** y **MongoDB**. Permite conversaciones bidireccionales, notificaciones instantáneas, indicadores de escritura y múltiples tipos de mensajes.

---

### 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Cliente)                      │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │   Socket.IO     │  │   HTML/CSS/JS   │                 │
│  │    Cliente      │  │   Interfaz UI   │                 │
│  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                               │
                    WebSocket / HTTP
                               │
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Servidor)                      │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │   Socket.IO     │  │   Express.js    │                 │
│  │    Servidor     │  │   API REST      │                 │
│  └─────────────────┘  └─────────────────┘                 │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │   Mongoose      │  │   Servicios     │                 │
│  │   Modelos       │  │   Notificaciones│                 │
│  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                               │
                          MongoDB
                               │
┌─────────────────────────────────────────────────────────────┐
│                    BASE DE DATOS                           │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │   Conversaciones│  │    Mensajes     │                 │
│  └─────────────────┘  └─────────────────┘                 │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │    Usuarios     │  │  Notificaciones │                 │
│  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

### 📁 Estructura de Archivos

```
SERVITECH/
├── backend/
│   ├── src/
│   │   ├── app.js                          # Aplicación principal
│   │   ├── services/
│   │   │   └── socketMensajeriaService.js  # Servicio Socket.IO principal
│   │   ├── models/
│   │   │   └── mensajeria.js               # Modelos de datos
│   │   └── routes/
│   │       └── mensajeria.js               # Rutas API REST
│   └── package.json                        # Dependencias
├── test_mensajeria_completa.html           # Interfaz de prueba
├── test_mensajeria_sistema.sh              # Script de prueba automatizado
└── MENSAJERIA_IMPLEMENTACION.md            # Esta documentación
```

---

### 🔧 Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Socket.IO** | 4.8.1 | WebSockets en tiempo real |
| **Express.js** | 5.1.0 | Servidor web y API REST |
| **Mongoose** | 8.16.1 | ODM para MongoDB |
| **MongoDB** | 5.0+ | Base de datos NoSQL |
| **Node.js** | 16.0+ | Runtime de JavaScript |

---

### 🚀 Instalación y Configuración

#### 1. Prerequisitos
```bash
# Node.js 16.0 o superior
node --version

# npm o yarn
npm --version

# MongoDB corriendo
mongod --version
```

#### 2. Instalación de Dependencias
```bash
cd backend
npm install
```

#### 3. Configuración de Entorno
```bash
# Crear archivo .env
cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017/servitech_mensajeria
PORT=3000
JWT_SECRET=tu_secreto_jwt_seguro
SOCKET_CORS_ORIGIN=*
EOF
```

#### 4. Iniciar el Sistema
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

---

### 📡 Eventos Socket.IO Disponibles

#### 🔐 Autenticación

##### Cliente → Servidor
```javascript
socket.emit('autenticar', {
    usuarioId: 'user123',
    token: 'jwt_token_aqui'
});
```

##### Servidor → Cliente
```javascript
socket.on('autenticado', (data) => {
    console.log('Usuario autenticado:', data.usuarioId);
});
```

#### 💬 Conversaciones

##### Unirse a Conversación
```javascript
// Cliente → Servidor
socket.emit('unirse_conversacion', {
    conversacionId: 'conv_123'
});

// Servidor → Cliente
socket.on('unido_conversacion', (data) => {
    console.log('Unido a:', data.conversacionId);
    console.log('Participantes:', data.participantes_conectados);
});
```

##### Salir de Conversación
```javascript
socket.emit('salir_conversacion', {
    conversacionId: 'conv_123'
});
```

#### 📤 Mensajes

##### Enviar Mensaje
```javascript
socket.emit('enviar_mensaje', {
    conversacionId: 'conv_123',
    contenido: {
        texto: 'Hola, ¿cómo estás?',
        tipo: 'texto',
        archivo: null, // Para archivos
        metadatos: {} // Datos adicionales
    },
    tipo: 'texto', // texto, imagen, archivo, audio
    respuestaA: 'mensaje_id', // Opcional: responder a otro mensaje
    prioridad: 'normal' // normal, alta, urgente
});
```

##### Recibir Mensaje
```javascript
socket.on('nuevo_mensaje', (data) => {
    console.log('Nuevo mensaje:', data.mensaje);
    console.log('Conversación:', data.conversacionId);
});
```

##### Confirmar Envío
```javascript
socket.on('mensaje_enviado', (data) => {
    console.log('Mensaje enviado:', data.mensajeId);
    console.log('Estado:', data.estado);
});
```

#### 👁️ Estados de Lectura

##### Marcar como Leído
```javascript
// Mensaje específico
socket.emit('marcar_leido', {
    mensajeId: 'msg_123',
    conversacionId: 'conv_123'
});

// Todos los mensajes de una conversación
socket.emit('marcar_leido', {
    conversacionId: 'conv_123'
});
```

##### Notificación de Lectura
```javascript
socket.on('mensaje_leido', (data) => {
    console.log('Mensaje leído por:', data.leidoPor);
    console.log('Mensaje ID:', data.mensajeId);
});
```

#### ✏️ Indicador de Escritura

```javascript
// Mostrar que está escribiendo
socket.emit('escribiendo', {
    conversacionId: 'conv_123',
    escribiendo: true
});

// Dejar de escribir
socket.emit('escribiendo', {
    conversacionId: 'conv_123',
    escribiendo: false
});

// Recibir notificación de escritura
socket.on('usuario_escribiendo', (data) => {
    if (data.escribiendo) {
        console.log(`${data.usuarioId} está escribiendo...`);
    } else {
        console.log(`${data.usuarioId} dejó de escribir`);
    }
});
```

#### ⭐ Reacciones

```javascript
// Agregar reacción
socket.emit('agregar_reaccion', {
    mensajeId: 'msg_123',
    tipo: 'like' // like, love, laugh, surprise, sad
});

// Recibir reacción
socket.on('reaccion_agregada', (data) => {
    console.log('Nueva reacción:', data.reacciones);
});
```

#### 🔔 Estados de Conexión

```javascript
// Usuario conectado
socket.on('usuario_conectado', (data) => {
    console.log('Usuario conectado:', data.usuarioId);
});

// Usuario desconectado
socket.on('usuario_desconectado', (data) => {
    console.log('Usuario desconectado:', data.usuarioId);
});

// Estado general de usuario
socket.on('estado_usuario_cambiado', (data) => {
    console.log('Estado cambiado:', data.usuarioId, data.conectado);
});
```

#### 🔧 Mantenimiento de Conexión

```javascript
// Ping/Pong para mantener conexión activa
socket.emit('ping');

socket.on('pong', (data) => {
    console.log('Conexión activa:', data.timestamp);
});
```

#### ❌ Manejo de Errores

```javascript
socket.on('error', (error) => {
    console.error('Error:', error.message);
    // Manejar diferentes tipos de errores
    switch(error.code) {
        case 'AUTH_REQUIRED':
            // Redirigir a login
            break;
        case 'PERMISSION_DENIED':
            // Mostrar mensaje de permisos
            break;
        default:
            // Error genérico
            break;
    }
});
```

---

### 🗄️ Modelos de Datos

#### Conversación
```javascript
{
    _id: ObjectId,
    codigoConversacion: String, // CONV-1234567890-ABC123
    participantes: [{
        usuario: ObjectId, // Referencia a Usuario
        rol: String, // cliente, experto, moderador, admin
        fechaIngreso: Date,
        activo: Boolean,
        ultimaConexion: Date,
        enLinea: Boolean,
        permisos: {
            puedeEnviar: Boolean,
            puedeEliminar: Boolean,
            puedeModerar: Boolean
        }
    }],
    asesoria: ObjectId, // Opcional: referencia a asesoría
    tipo: String, // individual, grupal, soporte
    configuracion: {
        nombrePersonalizado: String,
        descripcion: String,
        avatar: String,
        configuracionPrivacidad: Object,
        notificacionesActivas: Boolean
    },
    estadisticas: {
        totalMensajes: Number,
        ultimoMensaje: Date,
        mensajesNoLeidos: Map
    },
    activa: Boolean,
    fechaCreacion: Date,
    fechaUltimaActividad: Date
}
```

#### Mensaje
```javascript
{
    _id: ObjectId,
    conversacion: ObjectId, // Referencia a Conversación
    remitente: ObjectId, // Referencia a Usuario
    contenido: {
        texto: String,
        tipo: String, // texto, imagen, archivo, audio, video
        archivo: {
            nombre: String,
            url: String,
            tamano: Number,
            tipo: String
        },
        metadatos: Object // Datos adicionales según tipo
    },
    respuestaA: ObjectId, // Referencia a otro mensaje
    prioridad: String, // normal, alta, urgente
    estado: String, // enviado, entregado, leido, fallido
    fechaEnvio: Date,
    fechaEntrega: Date,
    lecturas: [{
        usuario: ObjectId,
        fechaLectura: Date
    }],
    reacciones: [{
        usuario: ObjectId,
        tipo: String, // like, love, laugh, surprise, sad
        fecha: Date
    }],
    editado: {
        editado: Boolean,
        fechaEdicion: Date,
        historial: Array
    },
    socketInfo: {
        socketId: String,
        ipAddress: String,
        userAgent: String
    }
}
```

---

### 🧪 Pruebas del Sistema

#### 1. Prueba Automatizada
```bash
# Ejecutar script de prueba completo
./test_mensajeria_sistema.sh
```

#### 2. Interfaz de Prueba Web
```bash
# Abrir test_mensajeria_completa.html en navegador
open test_mensajeria_completa.html
```

#### 3. Pruebas Manuales con curl

##### Verificar servidor activo
```bash
curl http://localhost:3000/
```

##### Probar endpoint de mensajería
```bash
curl -X GET http://localhost:3000/api/mensajeria/test
```

#### 4. Cliente de Prueba Programático

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000');

// Flujo completo de prueba
socket.on('connect', () => {
    console.log('Conectado');
    
    // 1. Autenticar
    socket.emit('autenticar', {
        usuarioId: 'test_user',
        token: 'test_token'
    });
});

socket.on('autenticado', () => {
    // 2. Unirse a conversación
    socket.emit('unirse_conversacion', {
        conversacionId: 'conv_test'
    });
});

socket.on('unido_conversacion', () => {
    // 3. Enviar mensaje
    socket.emit('enviar_mensaje', {
        conversacionId: 'conv_test',
        contenido: { texto: 'Hola mundo!' },
        tipo: 'texto'
    });
});

socket.on('nuevo_mensaje', (data) => {
    console.log('Mensaje recibido:', data.mensaje.contenido.texto);
    socket.disconnect();
});
```

---

### 📊 Monitoreo y Métricas

#### Estadísticas en Tiempo Real
```javascript
// Desde el servicio
const stats = socketMensajeriaService.obtenerEstadisticas();
console.log(stats);
/*
{
    usuariosConectados: 25,
    conversacionesActivas: 12,
    totalSockets: 25,
    timestamp: "2025-07-06T10:30:00.000Z"
}
*/
```

#### Logs del Sistema
```bash
# Ver logs en tiempo real
tail -f backend/server.log

# Filtrar logs de Socket.IO
grep "Socket.IO" backend/server.log
```

---

### 🔒 Seguridad y Autenticación

#### 1. Validación de JWT (Recomendado para Producción)
```javascript
// En socketMensajeriaService.js
const jwt = require('jsonwebtoken');

socket.on('autenticar', async (data) => {
    try {
        const { token } = data;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const usuarioId = decoded.userId;
        
        // Continuar con autenticación...
    } catch (error) {
        socket.emit('error', { message: 'Token inválido' });
    }
});
```

#### 2. Validación de Permisos
```javascript
// Verificar permisos antes de enviar mensaje
const conversacion = await Conversacion.findById(conversacionId);
const participante = conversacion.participantes.find(p => 
    p.usuario.toString() === usuarioId
);

if (!participante || !participante.permisos.puedeEnviar) {
    socket.emit('error', { message: 'Sin permisos para enviar' });
    return;
}
```

#### 3. Rate Limiting
```javascript
// Implementar límite de mensajes por minuto
const userMessageCount = new Map();

socket.on('enviar_mensaje', async (data) => {
    const userId = socket.usuarioId;
    const now = Date.now();
    const userMessages = userMessageCount.get(userId) || [];
    
    // Filtrar mensajes del último minuto
    const recentMessages = userMessages.filter(time => 
        now - time < 60000
    );
    
    if (recentMessages.length >= 10) {
        socket.emit('error', { 
            message: 'Límite de mensajes excedido' 
        });
        return;
    }
    
    // Agregar timestamp del mensaje actual
    recentMessages.push(now);
    userMessageCount.set(userId, recentMessages);
    
    // Continuar con envío del mensaje...
});
```

---

### 🚀 Despliegue en Producción

#### 1. Variables de Entorno Producción
```bash
# .env.production
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://usuario:password@host:27017/servitech_prod
JWT_SECRET=secreto_muy_seguro_de_produccion
SOCKET_CORS_ORIGIN=https://tusitio.com,https://app.tusitio.com
REDIS_URL=redis://localhost:6379  # Para clustering
```

#### 2. Configuración de CORS Estricta
```javascript
// En app.js
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://tusitio.com', 'https://app.tusitio.com']
        : '*',
    credentials: true
};

app.use(cors(corsOptions));

// Socket.IO CORS
socketMensajeriaService.inicializar(server, {
    cors: corsOptions
});
```

#### 3. Clustering para Escalabilidad
```javascript
// cluster.js
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    
    cluster.on('exit', (worker) => {
        console.log(`Worker ${worker.process.pid} murió`);
        cluster.fork();
    });
} else {
    require('./src/app.js');
}
```

#### 4. Docker Configuration
```dockerfile
# Dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  servitech-backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/servitech
    depends_on:
      - mongo
      
  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

---

### 🔧 Troubleshooting

#### Problemas Comunes

##### 1. Error: "Cannot connect to Socket.IO server"
```bash
# Verificar que el servidor esté corriendo
curl http://localhost:3000/socket.io/

# Verificar logs del servidor
tail -f backend/server.log
```

##### 2. Error: "Usuario no autenticado"
```javascript
// Asegurarse de autenticar antes de usar el socket
socket.on('connect', () => {
    socket.emit('autenticar', {
        usuarioId: 'tu_usuario_id',
        token: 'tu_jwt_token'
    });
});
```

##### 3. Mensajes no se entregan
```javascript
// Verificar que estés unido a la conversación
socket.emit('unirse_conversacion', {
    conversacionId: 'tu_conversacion_id'
});

// Verificar eventos de error
socket.on('error', (error) => {
    console.error('Error:', error);
});
```

##### 4. Conexión se pierde frecuentemente
```javascript
// Implementar reconexión automática
socket.on('disconnect', () => {
    console.log('Desconectado, intentando reconectar...');
    setTimeout(() => {
        socket.connect();
    }, 5000);
});
```

---

### 📈 Optimizaciones y Mejoras Futuras

#### 1. Redis para Clustering
```javascript
// Usar Redis adapter para múltiples instancias
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

#### 2. Compresión de Mensajes
```javascript
// Configurar compresión en Socket.IO
const io = new Server(server, {
    compression: true,
    httpCompression: true
});
```

#### 3. Persistencia de Sesiones
```javascript
// Guardar datos de sesión en Redis
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
```

#### 4. Notificaciones Push
```javascript
// Integrar con Firebase Cloud Messaging
const admin = require('firebase-admin');

const enviarNotificacionPush = async (usuarioId, mensaje) => {
    const token = await obtenerTokenFCM(usuarioId);
    
    const message = {
        data: {
            title: 'Nuevo mensaje',
            body: mensaje.contenido.texto
        },
        token: token
    };
    
    await admin.messaging().send(message);
};
```

---

### 📞 Soporte y Contacto

Para más información sobre la implementación o soporte técnico:

- **Documentación**: Este archivo
- **Código fuente**: `/backend/src/services/socketMensajeriaService.js`
- **Pruebas**: `test_mensajeria_completa.html`
- **Script de prueba**: `test_mensajeria_sistema.sh`

---

### 📝 Changelog

#### v1.0.0 (6 de julio de 2025)
- ✅ Implementación inicial completa
- ✅ Socket.IO configurado
- ✅ Modelos de datos MongoDB
- ✅ Eventos básicos de mensajería
- ✅ Autenticación de usuarios
- ✅ Indicadores de escritura
- ✅ Sistema de reacciones
- ✅ Interfaz de prueba web
- ✅ Script de prueba automatizado
- ✅ Documentación completa

---

### 🎯 Conclusión

El sistema de mensajería de SERVITECH está **completamente implementado y funcional**. Proporciona una base sólida para comunicación en tiempo real con todas las características modernas esperadas en una aplicación de mensajería profesional.

**🚀 Sistema listo para producción con escalabilidad y mantenibilidad en mente.**
