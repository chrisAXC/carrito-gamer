const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'carrito-gamer-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

// Conexión a PostgreSQL
const pool = require('./database');

// Middleware actualizado para PostgreSQL
app.use(async (req, res, next) => {
    res.locals.user = req.session.user || null;
    
    if (req.session.user) {
        try {
            const countResult = await pool.query(
                'SELECT SUM(cantidad) as total FROM carrito WHERE usuario_id = $1',
                [req.session.user.id]
            );
            res.locals.cartCount = countResult.rows[0].total || 0;
        } catch (error) {
            console.log('Error al contar carrito:', error);
            res.locals.cartCount = 0;
        }
    } else {
        res.locals.cartCount = 0;
    }
    
    next();
});

// Importar rutas (manejaremos errores si no existen)
try {
    app.use('/', require('./routes/auth'));
} catch (error) {
    console.log('⚠️  Rutas de auth no disponibles aún');
}

try {
    app.use('/products', require('./routes/products'));
} catch (error) {
    console.log('⚠️  Rutas de products no disponibles aún');
}

try {
    app.use('/cart', require('./routes/cart'));
} catch (error) {
    console.log('⚠️  Rutas de cart no disponibles aún');
}

try {
    app.use('/orders', require('./routes/orders'));
} catch (error) {
    console.log('⚠️  Rutas de orders no disponibles aún');
}

try {
    app.use('/admin', require('./routes/admin'));
} catch (error) {
    console.log('⚠️  Rutas de admin no disponibles aún');
}

// Ruta principal - ACTUALIZADA para PostgreSQL
app.get('/', async (req, res) => {
    try {
        // Usar PostgreSQL en lugar de MySQL
        const productsResult = await pool.query(
            'SELECT * FROM productos WHERE activo = true LIMIT 8'
        );
        
        // En PostgreSQL los resultados están en .rows
        const featuredProducts = productsResult.rows.map(product => ({
            ...product,
            precio: Number(product.precio) || 0
        }));
        
        res.render('pages/index', { 
            featuredProducts: featuredProducts,
            user: req.session.user 
        });
    } catch (error) {
        console.error('Error al cargar productos, usando datos de prueba:', error);
        
        // Datos de prueba
        const featuredProducts = [
            {
                id: 1,
                nombre: 'Teclado Mecánico Razer BlackWidow V3',
                descripcion: 'Teclado mecánico gaming con switches Green clicky y iluminación RGB Chroma',
                precio: 1899.00,
                imagen: 'https://assets2.razerzone.com/images/pnx.assets/61e6b001a030d66e792cad0043aa30c5/razer-blackwidow-v3-pro-usp2-mobile.jpg',
                marca: 'Razer'
            },
            {
                id: 2,
                nombre: 'Mouse Logitech G Pro X Superlight',
                descripcion: 'Mouse gaming inalámbrico ultraligero 63g, sensor HERO 25K DPI',
                precio: 2499.00,
                imagen: 'https://i.makeagif.com/media/2-18-2024/pdXIms.gif',
                marca: 'Logitech'
            },
            {
                id: 3,
                nombre: 'Audífonos SteelSeries Arctis Nova Pro',
                descripcion: 'Headset gaming con sonido surround, cancelación activa de ruido',
                precio: 5499.00,
                imagen: 'https://es.gizmodo.com/app/uploads/2022/05/767895e36bc63addff1093cdb8fc6ce1.gif',
                marca: 'SteelSeries'
            },
            {
                id: 4,
                nombre: 'Monitor ASUS TUF Gaming VG249Q',
                descripcion: 'Monitor gaming 23.8" Full HD 144Hz 1ms, FreeSync y tecnología Eye Care',
                precio: 5299.00,
                imagen: 'https://dlcdnwebimgs.asus.com/gain/0f372e3e-f38e-4a9b-824a-978bc7689a99/w800',
                marca: 'ASUS'
            }
        ];
        
        res.render('pages/index', { 
            featuredProducts: featuredProducts,
            user: req.session.user 
        });
    }
});

// Ruta de prueba para verificar que el servidor funciona
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Servidor funcionando' });
});

// Ruta para probar la conexión a la base de datos
app.get('/db-test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as current_time');
        res.json({ 
            status: 'OK', 
            message: 'Conexión a PostgreSQL exitosa',
            time: result.rows[0].current_time
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'ERROR', 
            message: 'Error conectando a PostgreSQL',
            error: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🎮 Carrito de compras gamer listo!`);
    console.log(`🔍 Verifica en: http://localhost:${PORT}/health`);
    console.log(`🗄️  Test DB: http://localhost:${PORT}/db-test`);
});
