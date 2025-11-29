const express = require('express');
const router = express.Router();
const db = require('../config/database');

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
        const [productCount] = await db.promise().query('SELECT COUNT(*) as count FROM productos');
        const [userCount] = await db.promise().query('SELECT COUNT(*) as count FROM usuarios');
        const [orderCount] = await db.promise().query('SELECT COUNT(*) as count FROM ordenes');
        const [recentOrders] = await db.promise().query(`
            SELECT o.*, u.nombre as usuario_nombre 
            FROM ordenes o 
            JOIN usuarios u ON o.usuario_id = u.id 
            ORDER BY o.fecha_orden DESC 
            LIMIT 5
        `);

        // Procesar órdenes recientes
        const processedOrders = recentOrders.map(order => ({
            ...order,
            total: Number(order.total) || 0
        }));

        res.render('admin/dashboard', {
            productCount: productCount[0].count,
            userCount: userCount[0].count,
            orderCount: orderCount[0].count,
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
        const [products] = await db.promise().query('SELECT * FROM productos ORDER BY id DESC');
        
        // Procesar productos para asegurar que los precios sean números
        const processedProducts = products.map(product => ({
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

        await db.promise().query(
            'INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen, marca, especificaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
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
        const [products] = await db.promise().query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
        
        if (products.length === 0) {
            return res.redirect('/admin/products');
        }

        // Procesar producto
        const product = {
            ...products[0],
            precio: Number(products[0].precio) || 0
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
            const [products] = await db.promise().query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
            return res.render('admin/edit-product', {
                product: products[0],
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

        await db.promise().query(
            'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, categoria = ?, imagen = ?, marca = ?, especificaciones = ?, activo = ? WHERE id = ?',
            [nombre, descripcion, Number(precio), Number(stock), categoria, imagen, marca, especificacionesJSON, activo ? 1 : 0, req.params.id]
        );

        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error al editar producto:', error);
        const [products] = await db.promise().query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
        res.render('admin/edit-product', {
            product: products[0],
            user: req.session.user,
            error: 'Error al editar producto: ' + error.message
        });
    }
});

// Eliminar producto - POST
router.post('/products/delete/:id', requireAdmin, async (req, res) => {
    try {
        await db.promise().query('DELETE FROM productos WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// Toggle estado del producto
router.post('/products/toggle/:id', requireAdmin, async (req, res) => {
    try {
        const [product] = await db.promise().query('SELECT activo FROM productos WHERE id = ?', [req.params.id]);
        
        if (product.length === 0) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }

        const newStatus = product[0].activo ? 0 : 1;
        
        await db.promise().query('UPDATE productos SET activo = ? WHERE id = ?', [newStatus, req.params.id]);
        
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