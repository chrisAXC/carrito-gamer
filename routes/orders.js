const express = require('express');
const router = express.Router();
const db = require('../config/database');
const PDFDocument = require('pdfkit');

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Middleware para verificar admin
const requireAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.rol === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, error: 'No autorizado' });
    }
};

// Historial de órdenes
router.get('/', requireAuth, async (req, res) => {
    try {
        let orders;
        let isAdmin = req.session.user.rol === 'admin';
        
        if (isAdmin) {
            // Admin ve todas las órdenes
            [orders] = await db.promise().query(`
                SELECT o.*, u.nombre as usuario_nombre, u.email 
                FROM ordenes o 
                JOIN usuarios u ON o.usuario_id = u.id 
                ORDER BY o.fecha_orden DESC
            `);
        } else {
            // Cliente ve solo sus órdenes
            [orders] = await db.promise().query(
                'SELECT * FROM ordenes WHERE usuario_id = ? ORDER BY fecha_orden DESC',
                [req.session.user.id]
            );
        }
        
        // Procesar órdenes
        const processedOrders = orders.map(order => ({
            ...order,
            total: Number(order.total) || 0
        }));
        
        res.render('pages/order-history', { 
            orders: processedOrders,
            isAdmin: isAdmin
        });
    } catch (error) {
        console.error('Error al cargar historial:', error);
        res.render('pages/order-history', { 
            orders: [],
            isAdmin: req.session.user.rol === 'admin'
        });
    }
});

// Checkout
router.get('/checkout', requireAuth, async (req, res) => {
    try {
        // Solo clientes pueden hacer checkout
        if (req.session.user.rol !== 'cliente') {
            return res.redirect('/');
        }

        const [cartItems] = await db.promise().query(
            `SELECT c.*, p.nombre, p.precio, p.imagen 
             FROM carrito c 
             JOIN productos p ON c.producto_id = p.id 
             WHERE c.usuario_id = ?`,
            [req.session.user.id]
        );

        if (cartItems.length === 0) {
            return res.redirect('/cart');
        }

        let total = 0;
        cartItems.forEach(item => {
            const precio = Number(item.precio) || 0;
            total += precio * item.cantidad;
        });

        res.render('pages/checkout', { 
            cartItems: cartItems,
            total: total
        });
    } catch (error) {
        console.error('Error en checkout:', error);
        res.redirect('/cart');
    }
});

// Procesar orden
router.post('/process', requireAuth, async (req, res) => {
    try {
        // Solo clientes pueden procesar órdenes
        if (req.session.user.rol !== 'cliente') {
            return res.status(403).json({ success: false, error: 'No autorizado' });
        }

        const { metodo_pago, direccion_entrega, tipo_entrega } = req.body;
        const userId = req.session.user.id;

        const [cartItems] = await db.promise().query(
            `SELECT c.*, p.nombre, p.precio, p.stock
             FROM carrito c 
             JOIN productos p ON c.producto_id = p.id 
             WHERE c.usuario_id = ?`,
            [userId]
        );

        if (cartItems.length === 0) {
            return res.status(400).json({ success: false, error: 'Carrito vacío' });
        }

        // Calcular total con IVA
        let subtotal = 0;
        cartItems.forEach(item => {
            const precio = Number(item.precio) || 0;
            subtotal += precio * item.cantidad;
        });
        
        const iva = subtotal * 0.16;
        const total = subtotal + iva;

        // Crear orden con estado 'procesando' inicial
        const [orderResult] = await db.promise().query(
            'INSERT INTO ordenes (usuario_id, total, metodo_pago, direccion_entrega, tipo_entrega, estado) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, total, metodo_pago, direccion_entrega, tipo_entrega, 'procesando']
        );

        const orderId = orderResult.insertId;

        // Crear detalles de la orden
        for (const item of cartItems) {
            const precio = Number(item.precio) || 0;
            await db.promise().query(
                'INSERT INTO orden_detalles (orden_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                [orderId, item.producto_id, item.cantidad, precio]
            );

            // Actualizar stock
            await db.promise().query(
                'UPDATE productos SET stock = stock - ? WHERE id = ?',
                [item.cantidad, item.producto_id]
            );
        }

        // Vaciar carrito
        await db.promise().query('DELETE FROM carrito WHERE usuario_id = ?', [userId]);

        // Simular proceso de pago y cambiar estado a 'completada' después de 2 segundos
        setTimeout(async () => {
            try {
                await db.promise().query(
                    'UPDATE ordenes SET estado = ? WHERE id = ?',
                    ['completada', orderId]
                );
                console.log(`Orden #${orderId} marcada como completada`);
            } catch (error) {
                console.error('Error al actualizar estado de orden:', error);
            }
        }, 2000);

        res.json({ 
            success: true, 
            orderId: orderId 
        });
    } catch (error) {
        console.error('Error al procesar orden:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// Página de éxito después del pago
router.get('/success/:id', requireAuth, async (req, res) => {
    try {
        const [orders] = await db.promise().query(
            'SELECT * FROM ordenes WHERE id = ? AND usuario_id = ?',
            [req.params.id, req.session.user.id]
        );

        if (orders.length === 0) {
            return res.redirect('/');
        }

        const order = {
            ...orders[0],
            total: Number(orders[0].total) || 0
        };

        res.render('pages/order-success', {
            order: order
        });
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/');
    }
});

// Ver detalles de orden
router.get('/:id', requireAuth, async (req, res) => {
    try {
        let orders;
        let isAdmin = req.session.user.rol === 'admin';
        
        if (isAdmin) {
            // Admin puede ver cualquier orden
            [orders] = await db.promise().query(`
                SELECT o.*, u.nombre as usuario_nombre 
                FROM ordenes o 
                JOIN usuarios u ON o.usuario_id = u.id 
                WHERE o.id = ?`,
                [req.params.id]
            );
        } else {
            // Cliente solo ve sus órdenes
            [orders] = await db.promise().query(
                'SELECT * FROM ordenes WHERE id = ? AND usuario_id = ?',
                [req.params.id, req.session.user.id]
            );
        }

        if (orders.length === 0) {
            return res.status(404).render('pages/error', { 
                error: 'Orden no encontrada'
            });
        }

        const order = {
            ...orders[0],
            total: Number(orders[0].total) || 0
        };

        const [orderDetails] = await db.promise().query(
            `SELECT od.*, p.nombre, p.imagen 
             FROM orden_detalles od 
             JOIN productos p ON od.producto_id = p.id 
             WHERE od.orden_id = ?`,
            [req.params.id]
        );

        const processedDetails = orderDetails.map(item => ({
            ...item,
            precio_unitario: Number(item.precio_unitario) || 0
        }));

        res.render('pages/order-details', { 
            order: order,
            orderDetails: processedDetails,
            isAdmin: isAdmin
        });
    } catch (error) {
        console.error('Error al cargar orden:', error);
        res.status(500).render('pages/error', { 
            error: 'Error del servidor'
        });
    }
});

// Generar PDF de ticket
router.get('/:id/ticket', requireAuth, async (req, res) => {
    try {
        let orders;
        let isAdmin = req.session.user.rol === 'admin';
        
        if (isAdmin) {
            [orders] = await db.promise().query(`
                SELECT o.*, u.nombre as usuario_nombre, u.email, u.telefono 
                FROM ordenes o 
                JOIN usuarios u ON o.usuario_id = u.id 
                WHERE o.id = ?`,
                [req.params.id]
            );
        } else {
            [orders] = await db.promise().query(
                `SELECT o.*, u.nombre as usuario_nombre, u.email, u.telefono 
                 FROM ordenes o 
                 JOIN usuarios u ON o.usuario_id = u.id 
                 WHERE o.id = ? AND o.usuario_id = ?`,
                [req.params.id, req.session.user.id]
            );
        }

        if (orders.length === 0) {
            return res.status(404).render('pages/error', { 
                error: 'Orden no encontrada'
            });
        }

        const order = {
            ...orders[0],
            total: Number(orders[0].total) || 0
        };

        const [orderDetails] = await db.promise().query(
            `SELECT od.*, p.nombre 
             FROM orden_detalles od 
             JOIN productos p ON od.producto_id = p.id 
             WHERE od.orden_id = ?`,
            [req.params.id]
        );

        const processedDetails = orderDetails.map(item => ({
            ...item,
            precio_unitario: Number(item.precio_unitario) || 0
        }));

        const doc = new PDFDocument();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=ticket-orden-${req.params.id}.pdf`);

        doc.pipe(res);

        // Encabezado del ticket
        doc.fontSize(20).font('Helvetica-Bold').text('ChrisShop - Ticket de Compra', { align: 'center' });
        doc.moveDown();
        
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Información de la orden
        doc.fontSize(12).font('Helvetica');
        doc.text(`Número de Orden: #${order.id}`);
        doc.text(`Fecha: ${new Date(order.fecha_orden).toLocaleDateString('es-MX')}`);
        doc.text(`Hora: ${new Date(order.fecha_orden).toLocaleTimeString('es-MX')}`);
        doc.text(`Cliente: ${order.usuario_nombre}`);
        doc.text(`Email: ${order.email}`);
        doc.text(`Estado: ${order.estado.toUpperCase()}`);
        if (order.telefono) {
            doc.text(`Teléfono: ${order.telefono}`);
        }
        doc.moveDown();

        // Información de entrega y pago
        doc.text(`Método de pago: ${order.metodo_pago.toUpperCase()}`);
        doc.text(`Tipo de entrega: ${order.tipo_entrega.toUpperCase()}`);
        if (order.direccion_entrega) {
            doc.text('Dirección de entrega:');
            doc.text(order.direccion_entrega, { indent: 20 });
        }
        doc.moveDown();

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Detalles de productos
        doc.font('Helvetica-Bold').text('PRODUCTOS', { underline: true });
        doc.moveDown(0.5);

        let yPosition = doc.y;
        let subtotal = 0;

        processedDetails.forEach((item, index) => {
            const itemTotal = item.precio_unitario * item.cantidad;
            subtotal += itemTotal;

            doc.font('Helvetica');
            doc.text(`${item.nombre}`, 50, yPosition);
            doc.text(`Cantidad: ${item.cantidad}`, 300, yPosition);
            doc.text(`$${itemTotal.toFixed(2)}`, 450, yPosition, { width: 100, align: 'right' });
            yPosition += 20;

            if (yPosition > 700) {
                doc.addPage();
                yPosition = 50;
            }
        });

        doc.moveDown();
        
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Totales
        const iva = subtotal * 0.16;
        const totalCalculado = subtotal + iva;

        doc.font('Helvetica');
        doc.text(`Subtotal: $${subtotal.toFixed(2)}`, { align: 'right' });
        doc.text(`IVA (16%): $${iva.toFixed(2)}`, { align: 'right' });
        doc.font('Helvetica-Bold');
        doc.text(`TOTAL: $${totalCalculado.toFixed(2)}`, { align: 'right' });
        doc.moveDown(2);

        // Pie de página
        doc.font('Helvetica');
        doc.fontSize(10).text('¡Gracias por tu compra!', { align: 'center' });
        doc.text('ChrisShop - Tu tienda gamer de confianza', { align: 'center' });
        doc.text('www.chrisshop.com | contacto@gmailChrisShop.com', { align: 'center' });

        doc.end();
    } catch (error) {
        console.error('Error al generar PDF:', error);
        res.status(500).render('pages/error', { 
            error: 'Error al generar el ticket'
        });
    }
});

// API para cambiar estado de orden (solo admin)
router.put('/:id/status', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { estado } = req.body;
        const ordenId = req.params.id;

        // Validar estado
        const estadosValidos = ['pendiente', 'procesando', 'completada', 'cancelada'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ success: false, error: 'Estado inválido' });
        }

        await db.promise().query(
            'UPDATE ordenes SET estado = ? WHERE id = ?',
            [estado, ordenId]
        );

        res.json({ 
            success: true,
            message: `Estado de orden #${ordenId} actualizado a ${estado}`
        });
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// API para cancelar orden (cliente)
router.post('/:id/cancel', requireAuth, async (req, res) => {
    try {
        const ordenId = req.params.id;
        const userId = req.session.user.id;

        // Verificar que la orden pertenece al usuario y está en estado pendiente o procesando
        const [orders] = await db.promise().query(
            'SELECT * FROM ordenes WHERE id = ? AND usuario_id = ? AND estado IN (?, ?)',
            [ordenId, userId, 'pendiente', 'procesando']
        );

        if (orders.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Orden no encontrada o no se puede cancelar' 
            });
        }

        // Cambiar estado a cancelada
        await db.promise().query(
            'UPDATE ordenes SET estado = ? WHERE id = ?',
            ['cancelada', ordenId]
        );

        // Devolver productos al stock
        const [orderDetails] = await db.promise().query(
            'SELECT * FROM orden_detalles WHERE orden_id = ?',
            [ordenId]
        );

        for (const item of orderDetails) {
            await db.promise().query(
                'UPDATE productos SET stock = stock + ? WHERE id = ?',
                [item.cantidad, item.producto_id]
            );
        }

        res.json({ 
            success: true,
            message: `Orden #${ordenId} cancelada exitosamente`
        });
    } catch (error) {
        console.error('Error al cancelar orden:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

module.exports = router;