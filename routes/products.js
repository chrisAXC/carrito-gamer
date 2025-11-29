const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Mostrar todos los productos
router.get('/', async (req, res) => {
    try {
        const [products] = await db.promise().query('SELECT * FROM productos WHERE activo = true');
        
        // Asegurarnos de que los precios sean números
        const processedProducts = products.map(product => ({
            ...product,
            precio: Number(product.precio) || 0
        }));
        
        res.render('pages/products', { 
            products: processedProducts,
            user: req.session.user 
        });
    } catch (error) {
        console.error('Error al cargar productos:', error);
        
        // Datos de prueba en caso de error
        const processedProducts = [
            {
                id: 1,
                nombre: 'Teclado Mecánico Razer BlackWidow V3',
                descripcion: 'Teclado mecánico gaming con switches Green clicky y iluminación RGB Chroma',
                precio: 1899.00,
                imagen: 'https://assets2.razerzone.com/images/pnx.assets/61e6b001a030d66e792cad0043aa30c5/razer-blackwidow-v3-pro-usp2-mobile.jpg',
                marca: 'Razer',
                stock: 25
            },
            {
                id: 2,
                nombre: 'Mouse Logitech G Pro X Superlight',
                descripcion: 'Mouse gaming inalámbrico ultraligero 63g, sensor HERO 25K DPI',
                precio: 2499.00,
                imagen: 'https://i.makeagif.com/media/2-18-2024/pdXIms.gif',
                marca: 'Logitech',
                stock: 30
            },
            {
                id: 3,
                nombre: 'Audífonos SteelSeries Arctis Nova Pro',
                descripcion: 'Headset gaming con sonido surround, cancelación activa de ruido y micrófono retráctil',
                precio: 5499.00,
                imagen: 'https://es.gizmodo.com/app/uploads/2022/05/767895e36bc63addff1093cdb8fc6ce1.gif',
                marca: 'SteelSeries',
                stock: 15
            },
            {
                id: 4,
                nombre: 'Monitor ASUS TUF Gaming VG249Q',
                descripcion: 'Monitor gaming 23.8" Full HD 144Hz 1ms, FreeSync y tecnología Eye Care',
                precio: 5299.00,
                imagen: 'https://dlcdnwebimgs.asus.com/gain/0f372e3e-f38e-4a9b-824a-978bc7689a99/w800',
                marca: 'ASUS',
                stock: 20
            },
            {
                id: 5,
                nombre: 'Silla Gamer DXRacer Formula Series',
                descripcion: 'Silla gaming ergonómica con soporte lumbar, reposabrazos 4D y base de metal',
                precio: 7899.00,
                imagen: 'https://manuals.plus/wp-content/uploads/2023/11/DXRACER-Formula-F08-Sedia-Gaming-product.gif',
                marca: 'DXRacer',
                stock: 12
            },
            {
                id: 6,
                nombre: 'Tarjeta Gráfica NVIDIA RTX 4070 Ti',
                descripcion: 'GPU NVIDIA GeForce RTX 4070 Ti 12GB GDDR6X, DLSS 3 y ray tracing',
                precio: 18999.00,
                imagen: 'https://storage-asset.msi.com/global/picture/news/2024/vga/GraphicsCard-T2V-compressed.gif',
                marca: 'NVIDIA',
                stock: 8
            }
        ];
        
        res.render('pages/products', { 
            products: processedProducts,
            user: req.session.user 
        });
    }
});

// Ver detalles de un producto
router.get('/:id', async (req, res) => {
    try {
        const [products] = await db.promise().query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
        
        if (products.length === 0) {
            return res.status(404).render('pages/error', { 
                error: 'Producto no encontrado',
                user: req.session.user 
            });
        }
        
        // Asegurar que el precio sea número
        const product = {
            ...products[0],
            precio: Number(products[0].precio) || 0
        };
        
        res.render('pages/product-detail', { 
            product: product,
            user: req.session.user 
        });
    } catch (error) {
        console.error('Error al cargar producto:', error);
        res.status(500).render('pages/error', { 
            error: 'Error del servidor',
            user: req.session.user 
        });
    }
});

module.exports = router;