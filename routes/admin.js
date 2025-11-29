const express = require('express');
const router = express.Router();
const pool = require('../database'); // ← Cambiado a PostgreSQL pool

// Middleware para verificar admin
const requireAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.rol === 'admin') {
        next();
    } else {
        res.redirect('/login');
    }
};

// Panel de administración
router.get('/', requireAdmin, async (req, res) => {
    try {
        const productResult = await pool.query('SELECT COUNT(*) as count FROM productos');
        const userResult = await pool.query('SELECT COUNT(*) as count FROM usuarios');
        const orderResult = await pool.query('SELECT COUNT(*) as count FROM ordenes');
        const recentOrdersResult = await pool.query(`
            SELECT o.*, u.nombre as usuario_nombre 
            FROM ordenes o 
            JOIN usuarios u ON o.usuario_id = u.id 
            ORDER BY o.fecha_orden DESC 
            LIMIT 5
        `);

        // Procesar órdenes recientes
        const processedOrders = recentOrdersResult.rows.map(order => ({
            ...order,
            total: Number(order.total) || 0
        }));

        res.render('admin/dashboard', {
            productCount: parseInt(productResult.rows[0].count),
            userCount: parseInt(userResult.rows[0].count),
            orderCount: parseInt(orderResult.rows[0].count),
            recentOrders: processedOrders,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error en panel admin:', error);
        res.render('admin/dashboard', {
            productCount: 0,
            userCount: 0,
            orderCount: 0,
            recentOrders: [],
            user: req.session.user
        });
    }
});

// Gestión de productos
router.get('/products', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos ORDER BY id DESC');
        
        // Procesar productos para asegurar que los precios sean números
        const processedProducts = result.rows.map(product => ({
            ...product,
            precio: Number(product.precio) || 0
        }));

        res.render('admin/products', {
            products: processedProducts,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error al cargar productos admin:', error);
        res.render('admin/products', {
            products: [],
            user: req.session.user
        });
    }
});

// Agregar producto - GET
router.get('/products/add', requireAdmin, (req, res) => {
    res.render('admin/add-product', {
        user: req.session.user,
        error: null
    });
});

// Agregar producto - POST
router.post('/products/add', requireAdmin, async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, categoria, imagen, marca, especificaciones } = req.body;
        
        // Validar datos
        if (!nombre || !precio || !stock) {
            return res.render('admin/add-product', {
                user: req.session.user,
                error: 'Nombre, precio y stock son obligatorios'
            });
        }

        // Procesar especificaciones si están vacías
        let especificacionesJSON = '{}';
        if (especificaciones && especificaciones.trim() !== '') {
            try {
                // Intentar parsear como JSON
                JSON.parse(especificaciones);
                especificacionesJSON = especificaciones;
            } catch (e) {
                // Si no es JSON válido, crear objeto simple
                especificacionesJSON = JSON.stringify({ descripcion: especificaciones });
            }
        }

        await pool.query(
            'INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen, marca, especificaciones) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [nombre, descripcion, Number(precio), Number(stock), categoria, imagen || '/images/placeholder-product.jpg', marca, especificacionesJSON]
        );

        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error al agregar producto:', error);
        res.render('admin/add-product', {
            user: req.session.user,
            error: 'Error al agregar producto: ' + error.message
        });
    }
});

// Editar producto - GET
router.get('/products/edit/:id', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos WHERE id = $1', [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.redirect('/admin/products');
        }

        // Procesar producto
        const product = {
            ...result.rows[0],
            precio: Number(result.rows[0].precio) || 0
        };

        res.render('admin/edit-product', {
            product: product,
            user: req.session.user,
            error: null
        });
    } catch (error) {
        console.error('Error al cargar producto para editar:', error);
        res.redirect('/admin/products');
    }
});

// Editar producto - POST
router.post('/products/edit/:id', requireAdmin, async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, categoria, imagen, marca, especificaciones, activo } = req.body;
        
        // Validar datos
        if (!nombre || !precio || !stock) {
            const result = await pool.query('SELECT * FROM productos WHERE id = $1', [req.params.id]);
            return res.render('admin/edit-product', {
                product: result.rows[0],
                user: req.session.user,
                error: 'Nombre, precio y stock son obligatorios'
            });
        }

        // Procesar especificaciones
        let especificacionesJSON = '{}';
        if (especificaciones && especificaciones.trim() !== '') {
            try {
                JSON.parse(especificaciones);
                especificacionesJSON = especificaciones;
            } catch (e) {
                especificacionesJSON = JSON.stringify({ descripcion: especificaciones });
            }
        }

        await pool.query(
            'UPDATE productos SET nombre = $1, descripcion = $2, precio = $3, stock = $4, categoria = $5, imagen = $6, marca = $7, especificaciones = $8, activo = $9 WHERE id = $10',
            [nombre, descripcion, Number(precio), Number(stock), categoria, imagen, marca, especificacionesJSON, activo ? true : false, req.params.id]
        );

        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error al editar producto:', error);
        const result = await pool.query('SELECT * FROM productos WHERE id = $1', [req.params.id]);
        res.render('admin/edit-product', {
            product: result.rows[0],
            user: req.session.user,
            error: 'Error al editar producto: ' + error.message
        });
    }
});

// Eliminar producto - POST
router.post('/products/delete/:id', requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM productos WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// Toggle estado del producto
router.post('/products/toggle/:id', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT activo FROM productos WHERE id = $1', [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }

        const newStatus = !result.rows[0].activo;
        
        await pool.query('UPDATE productos SET activo = $1 WHERE id = $2', [newStatus, req.params.id]);
        
        res.json({ 
            success: true, 
            newStatus: newStatus 
        });
    } catch (error) {
        console.error('Error al cambiar estado del producto:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

module.exports = router;
