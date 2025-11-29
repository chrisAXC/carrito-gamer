const mysql = require('pg');
require('dotenv').config();

const connection = mysql.createConnection({

    host: process.env.DB_HOST || 'dpg-d4l70fm3jp1c73971vj0-a',
    user: process.env.DB_USER || 'carrito_user',
    password: process.env.DB_PASSWORD || 'BKW5rOtirn1vdToISJgGWfCZzzMtqjWU',
});

connection.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos POSTEGRES');
});

module.exports = connection;
