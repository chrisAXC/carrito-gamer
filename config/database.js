const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
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