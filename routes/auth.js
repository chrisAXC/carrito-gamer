const express = require('express');
const router = express.Router();
const pool = require('../database'); // ← Cambiado a PostgreSQL pool

// Login
router.get('/login', (req, res) => {
    const redirect = req.query.redirect || '/';
    res.render('pages/login', { 
        error: null, 
        user: req.session.user,
        redirect: redirect
    });
});

router.post('/login', async (req, res) => {
    try {
        const { email, password, redirect = '/' } = req.body;
        
        // PostgreSQL - Cambiado a pool.query y parámetros $1, $2
        const result = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1 AND password = $2', 
            [email, password]
        );
        
        if (result.rows.length > 0) {
            req.session.user = result.rows[0];
            res.redirect(redirect);
        } else {
            res.render('pages/login', { 
                error: 'Credenciales incorrectas', 
                user: null,
                redirect: redirect
            });
        }
    } catch (error) {
        console.error('Error en login:', error);
        res.render('pages/login', { 
            error: 'Error del servidor', 
            user: null,
            redirect: req.body.redirect || '/'
        });
    }
});

// Registro
router.get('/register', (req, res) => {
    const redirect = req.query.redirect || '/';
    res.render('pages/register', { 
        error: null, 
        user: req.session.user,
        redirect: redirect
    });
});

router.post('/register', async (req, res) => {
    try {
        const { nombre, email, password, telefono, direccion, estado, municipio, codigo_postal, redirect = '/' } = req.body;
        
        // Verificar si el usuario ya existe - PostgreSQL
        const existingResult = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1', 
            [email]
        );
        
        if (existingResult.rows.length > 0) {
            return res.render('pages/register', { 
                error: 'El email ya está registrado', 
                user: null,
                redirect: redirect
            });
        }
        
        // Crear nuevo usuario - PostgreSQL (RETURNING * para obtener el usuario creado)
        const result = await pool.query(
            'INSERT INTO usuarios (nombre, email, password, telefono, direccion, estado, municipio, codigo_postal) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [nombre, email, password, telefono, direccion, estado, municipio, codigo_postal]
        );
        
        // Iniciar sesión automáticamente
        req.session.user = result.rows[0];
        
        res.redirect(redirect);
    } catch (error) {
        console.error('Error en registro:', error);
        res.render('pages/register', { 
            error: 'Error al crear la cuenta', 
            user: null,
            redirect: req.body.redirect || '/'
        });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
