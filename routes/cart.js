const express = require('express');
const router = express.Router();
const pool = require('../database'); // ← Cambiado a PostgreSQL pool

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Ver carrito
router.get('/', requireAuth, async (req, res) => {
    try {
        const query = `
            SELECT c.*, p.nombre, p.precio, p.imagen, p.stock, p.marca
            FROM carrito c 
            JOIN productos p ON c.producto_id = p.id 
            WHERE c.usuario_id = $1
        `;
        
        const result = await pool.query(query, [req.session.user.id]);
        
        // Procesar items para asegurar que los precios sean números
        const processedCartItems = result.rows.map(item => ({
            ...item,
            precio: Number(item.precio) || 0
        }));
        
        let total = 0;
        processedCartItems.forEach(item => {
            total += item.precio * item.cantidad;
        });
        
        res.render('pages/cart', { 
            cartItems: processedCartItems, 
            total: total,
            user: req.session.user 
        });
    } catch (error) {
        console.error('Error al cargar carrito:', error);
        res.render('pages/cart', { 
            cartItems: [], 
            total: 0,
            user: req.session.user 
        });
    }
});

// Agregar al carrito
router.post('/add', requireAuth, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.session.user.id;

        // Verificar si el producto existe y tiene stock
        const productResult = await pool.query(
            'SELECT * FROM productos WHERE id = $1 AND activo = true AND stock > 0',
            [productId]
        );

        if (productResult.rows.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Producto no disponible' 
            });
        }

        // Verificar si el producto ya está en el carrito
        const existingResult = await pool.query(
            'SELECT * FROM carrito WHERE usuario_id = $1 AND producto_id = $2',
            [userId, productId]
        );

        if (existingResult.rows.length > 0) {
            // Verificar stock disponible
            const newQuantity = existingResult.rows[0].cantidad + quantity;
            if (newQuantity > productResult.rows[0].stock) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'No hay suficiente stock disponible' 
                });
            }

            // Actualizar cantidad
            await pool.query(
                'UPDATE carrito SET cantidad = cantidad + $1 WHERE usuario_id = $2 AND producto_id = $3',
                [quantity, userId, productId]
            );
        } else {
            // Verificar stock disponible
            if (quantity > productResult.rows[0].stock) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'No hay suficiente stock disponible' 
                });
            }

            // Agregar nuevo item
            await pool.query(
                'INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES ($1, $2, $3)',
                [userId, productId, quantity]
            );
        }

        // Obtener nuevo conteo del carrito
        const countResult = await pool.query(
            'SELECT SUM(cantidad) as total FROM carrito WHERE usuario_id = $1',
            [userId]
        );

        res.json({ 
            success: true, 
            cartCount: parseInt(countResult.rows[0].total) || 0 
        });
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// Actualizar cantidad en carrito
router.put('/update/:id', requireAuth, async (req, res) => {
    try {
        const { quantity } = req.body;
        const itemId = req.params.id;
        const userId = req.session.user.id;

        // Verificar que la cantidad sea válida
        if (quantity < 1) {
            return res.status(400).json({ success: false, error: 'Cantidad inválida' });
        }

        // Obtener información del producto
        const cartItemResult = await pool.query(
            `SELECT c.*, p.stock 
             FROM carrito c 
             JOIN productos p ON c.producto_id = p.id 
             WHERE c.id = $1 AND c.usuario_id = $2`,
            [itemId, userId]
        );

        if (cartItemResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Item no encontrado' });
        }

        // Verificar stock
        if (quantity > cartItemResult.rows[0].stock) {
            return res.status(400).json({ 
                success: false, 
                error: 'No hay suficiente stock disponible' 
            });
        }

        await pool.query(
            'UPDATE carrito SET cantidad = $1 WHERE id = $2 AND usuario_id = $3',
            [quantity, itemId, userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error al actualizar carrito:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// Eliminar del carrito
router.delete('/remove/:id', requireAuth, async (req, res) => {
    try {
        const itemId = req.params.id;
        const userId = req.session.user.id;

        const result = await pool.query(
            'DELETE FROM carrito WHERE id = $1 AND usuario_id = $2',
            [itemId, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Item no encontrado' });
        }

        // Obtener nuevo conteo del carrito
        const countResult = await pool.query(
            'SELECT SUM(cantidad) as total FROM carrito WHERE usuario_id = $1',
            [userId]
        );

        res.json({ 
            success: true, 
            cartCount: parseInt(countResult.rows[0].total) || 0 
        });
    } catch (error) {
        console.error('Error al eliminar del carrito:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

module.exports = router;
