const express = require('express');
const router = express.Router();
const db = require('../config/database');

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
        
        const [users] = await db.promise().query(
            'SELECT * FROM usuarios WHERE email = ? AND password = ?', 
            [email, password]
        );
        
        if (users.length > 0) {
            req.session.user = users[0];
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
        
        // Verificar si el usuario ya existe
        const [existingUsers] = await db.promise().query(
            'SELECT * FROM usuarios WHERE email = ?', 
            [email]
        );
        
        if (existingUsers.length > 0) {
            return res.render('pages/register', { 
                error: 'El email ya está registrado', 
                user: null,
                redirect: redirect
            });
        }
        
        // Crear nuevo usuario
        const [result] = await db.promise().query(
            'INSERT INTO usuarios (nombre, email, password, telefono, direccion, estado, municipio, codigo_postal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [nombre, email, password, telefono, direccion, estado, municipio, codigo_postal]
        );
        
        // Iniciar sesión automáticamente
        req.session.user = {
            id: result.insertId,
            nombre,
            email,
            rol: 'cliente'
        };
        
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