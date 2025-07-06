const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/servitech', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Base de datos conectada exitosamente');
    } catch (error) {
        console.error('❌ Error de conexión a MongoDB:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
