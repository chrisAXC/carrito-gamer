const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'dpg-d4l70fm3jp1c73971vj0-a',
    user: process.env.DB_USER || 'carrito_user',
    password: process.env.DB_PASSWORD || 'BKW5rOtirn1vdToISJgGWfCZzzMtqjWU',
    database: process.env.DB_NAME || 'carrito_gamer',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Probar conexión
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error conectando a PostgreSQL:', err);
    } else {
        console.log('✅ Conectado a PostgreSQL correctamente');
    }
});

module.exports = pool;
