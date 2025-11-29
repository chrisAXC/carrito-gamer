
CREATE DATABASE IF NOT EXISTS carrito_gamer;
USE carrito_gamer;

-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(15),
    direccion TEXT,
    estado VARCHAR(50),
    municipio VARCHAR(50),
    codigo_postal VARCHAR(10),
    rol ENUM('cliente', 'admin') DEFAULT 'cliente',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL,
    categoria VARCHAR(100),
    imagen VARCHAR(500),
    marca VARCHAR(100),
    especificaciones JSON,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Tabla del carrito
CREATE TABLE carrito (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    producto_id INT,
    cantidad INT NOT NULL,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Tabla de órdenes
CREATE TABLE ordenes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente', 'procesando', 'completada', 'cancelada') DEFAULT 'pendiente',
    metodo_pago ENUM('tarjeta', 'paypal', 'efectivo') NOT NULL,
    direccion_entrega TEXT,
    tipo_entrega ENUM('domicilio', 'tienda') NOT NULL,
    fecha_orden TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de detalles de orden
CREATE TABLE orden_detalles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orden_id INT,
    producto_id INT,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (orden_id) REFERENCES ordenes(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Insertar usuario administrador
INSERT INTO usuarios (nombre, email, password, telefono, direccion, estado, municipio, codigo_postal, rol) VALUES
('christian', 'chris1@gmail.com', '78667', '8767868', 'huehuetoca', 'Estado de México', 'urbi', '64393', 'admin');
select * from usuarios;
-- Insertar productos gamer (los 20 productos que proporcionaste)
INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen, marca, especificaciones) VALUES
('Teclado Mecánico Razer BlackWidow V3', 'Teclado mecánico gaming con switches Green clicky y iluminación RGB Chroma', 1899.00, 25, 'Periféricos', 'https://assets2.razerzone.com/images/pnx.assets/61e6b001a030d66e792cad0043aa30c5/razer-blackwidow-v3-pro-usp2-mobile.jpg', 'Razer', '{"tipo": "Mecánico", "switches": "Green Clicky", "conexion": "USB-C", "rgb": true, "anti-ghosting": "N-Key Rollover"}'),
('Mouse Logitech G Pro X Superlight', 'Mouse gaming inalámbrico ultraligero 63g, sensor HERO 25K DPI', 2499.00, 30, 'Periféricos', 'https://i.makeagif.com/media/2-18-2024/pdXIms.gif', 'Logitech', '{"dpi": 25600, "peso": "63g", "conexion": "Wireless", "bateria": "70 horas", "botones": 5}'),
('Audífonos SteelSeries Arctis Nova Pro', 'Headset gaming con sonido surround, cancelación activa de ruido y micrófono retráctil', 5499.00, 15, 'Audio', 'https://es.gizmodo.com/app/uploads/2022/05/767895e36bc63addff1093cdb8fc6ce1.gif', 'SteelSeries', '{"sonido": "Surround 7.1", "cancelacion_ruido": true, "conexion": "Wireless/USB", "bateria": "22 horas", "microfono": "Retráctil"}'),
('Monitor ASUS TUF Gaming VG249Q', 'Monitor gaming 23.8" Full HD 144Hz 1ms, FreeSync y tecnología Eye Care', 5299.00, 20, 'Monitores', 'https://dlcdnwebimgs.asus.com/gain/0f372e3e-f38e-4a9b-824a-978bc7689a99/w800', 'ASUS', '{"pulgadas": 23.8, "resolucion": "1920x1080", "hz": 144, "tiempo_respuesta": "1ms", "freesync": true}'),
('Silla Gamer DXRacer Formula Series', 'Silla gaming ergonómica con soporte lumbar, reposabrazos 4D y base de metal', 7899.00, 12, 'Muebles', 'https://manuals.plus/wp-content/uploads/2023/11/DXRACER-Formula-F08-Sedia-Gaming-product.gif', 'DXRacer', '{"material": "Cuero PVC", "soporte_lumbar": "Ajustable", "reposabrazos": "4D", "peso_max": "150kg", "garantia": "2 años"}'),
('Tarjeta Gráfica NVIDIA RTX 4070 Ti', 'GPU NVIDIA GeForce RTX 4070 Ti 12GB GDDR6X, DLSS 3 y ray tracing', 18999.00, 8, 'Componentes', 'https://storage-asset.msi.com/global/picture/news/2024/vga/GraphicsCard-T2V-compressed.gif', 'NVIDIA', '{"vram": "12GB GDDR6X", "puertos": "3x DisplayPort, 1x HDMI", "consumo": "285W", "dlss": 3}'),
('Procesador AMD Ryzen 7 7800X3D', 'CPU AMD Ryzen 7 con tecnología 3D V-Cache, 8 núcleos 16 hilos', 8999.00, 18, 'Componentes', 'https://cdn.wccftech.com/wp-content/uploads/2023/04/1751076-amd-aperture-gif-preview-500x500-gigapixel-very_compressed-scale-4_00x-Custom-1456x1049.jpg', 'AMD', '{"nucleos": 8, "hilos": 16, "frecuencia_base": "4.2GHz", "frecuencia_max": "5.0GHz", "cache": "96MB"}'),
('SSD Samsung 980 Pro 2TB NVMe', 'SSD NVMe M.2 PCIe 4.0, velocidades 7000MB/s lectura, 5000MB/s escritura', 4299.00, 35, 'Almacenamiento', 'https://m.media-amazon.com/images/I/71zhBR0KB2L.jpg', 'Samsung', '{"capacidad": "2TB", "velocidad_lectura": "7000MB/s", "velocidad_escritura": "5000MB/s", "interface": "PCIe 4.0"}'),
('Memoria RAM Corsair Vengeance RGB 32GB', 'Kit 2x16GB DDR5 6000MHz CL30, iluminación RGB personalizable', 3299.00, 25, 'Memoria', 'https://assets.corsair.com/image/upload/f_auto,q_auto/v1/akamai/pdp/loops/VengeanceSL_Sequential.gif', 'Corsair', '{"capacidad": "32GB (2x16GB)", "velocidad": "6000MHz", "latencia": "CL30", "voltaje": "1.35V", "rgb": true}'),
('Fuente Corsair RM850x 80 Plus Gold', 'Fuente 850W totalmente modular, certificación 80 Plus Gold, ventilador silencioso', 2899.00, 22, 'Fuentes', 'https://assets.corsair.com/image/upload/c_pad,q_auto,h_1024,w_1024,f_auto/products/Power-Supply-Units/CP-9020180-NA/Gallery/RM850x_PSU_02.webp', 'Corsair', '{"potencia": "850W", "certificacion": "80 Plus Gold", "modular": "Completo", "ventilador": "135mm", "garantia": "10 años"}'),
('Mousepad SteelSeries QcK Heavy XXL', 'Mousepad gaming extra grande 900x400mm, superficie optimizada para gaming', 899.00, 40, 'Accesorios', 'https://images.ctfassets.net/w5r1fvmogo3f/3ArM4tdCXkmoBdXgLyzYzm/be070f4aa708d1a973b9834fff993b20/700x_about_qck_heavy_family.png', 'SteelSeries', '{"dimensiones": "900x400x6mm", "material": "Superficie tela, base goma", "color": "Negro"}'),
('Webcam Logitech Brio 4K', 'Cámara web 4K Ultra HD, HDR, micrófonos duales con cancelación de ruido', 4299.00, 16, 'Streaming', 'https://resource.logitech.com/w_1440,h_810,ar_16:9,c_fill,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/webcams/mx-brio/learn/mx-brio-intro-video-poster.jpg', 'Logitech', '{"resolucion": "4K Ultra HD", "hdr": true, "microfonos": 2, "enfoque_automatico": true, "zoom": "5x digital"}'),
('Control Xbox Elite Series 2', 'Control inalámbrico premium, palancas intercambiables, ajustes personalizables', 3899.00, 20, 'Controles', 'https://platform.theverge.com/wp-content/uploads/sites/2/chorus/uploads/chorus_asset/file/24041446/xboxelitergb.gif?quality=90&strip=all&crop=0,0,100,100', 'Microsoft', '{"inalambrico": true, "bateria": "40 horas", "palancas": "4 intercambiables", "botones": "6 personalizables"}'),
('Laptop ASUS ROG Strix G16', 'Laptop gaming Intel i7-13650HX, RTX 4060 8GB, 16GB RAM, SSD 1TB', 32999.00, 6, 'Laptops', 'https://dlcdnwebimgs.asus.com/gain/378C75D6-8210-4DA7-AAE9-84B48458B085', 'ASUS', '{"procesador": "Intel i7-13650HX", "gpu": "RTX 4060 8GB", "ram": "16GB DDR5", "almacenamiento": "1TB SSD", "pantalla": "16\\" 165Hz"}'),
('Router ASUS ROG Rapture GT-AX11000', 'Router gaming WiFi 6, tri-band, puertos 2.5G, VPN Fusion', 8999.00, 10, 'Redes', 'https://dlcdnwebimgs.asus.com/files/media/448E0EC5-0F53-440D-B754-D537AD116C1F/v1/img/top/power_saving-2.gif', 'ASUS', '{"wifi": "WiFi 6 (802.11ax)", "bandas": "Tri-band", "velocidad": "11000Mbps", "puertos": "1x 2.5G, 4x Gigabit"}'),
('Micrófono Blue Yeti Nano', 'Micrófono condensador USB, calidad de estudio, patrones cardioide y omnidireccional', 2899.00, 18, 'Audio', 'https://cambiosystem.com/wp-content/uploads/2024/05/yeti-nano-cardioid.gif', 'Blue', '{"tipo": "Condensador", "patrones": "Cardioide, Omnidireccional", "conexion": "USB", "frecuencia": "20Hz-20kHz"}'),
('Gabinete Lian Li O11 Dynamic', 'Gabinete mid-tower, panel lateral templado, soporte para 9 ventiladores', 3299.00, 15, 'Gabinetes', 'https://i.redd.it/4ujfn3n263ca1.gif', 'Lian Li', '{"tipo": "Mid-Tower", "panel": "Templado", "ventiladores": "Soporte 9", "fuente": "No incluida"}'),
('Kit Ventiladores Corsair LL120 RGB', 'Kit de 3 ventiladores RGB 120mm, iluminación LED dual loop, control iCUE', 2199.00, 28, 'Refrigeración', 'https://cdn.cs.1worldsync.com/syndication/mediaserver/inlinecontent/all/6f4/6ea/6f46ea652b3a416b3bcbe636858b2ad8/width(1200).gif', 'Corsair', '{"cantidad": 3, "tamaño": "120mm", "rgb": "LED Dual Loop", "control": "Software iCUE"}'),
('Tableta Wacom Intuos Pro', 'Tableta gráfica profesional, lápiz Pro Pen 2, 8192 niveles de presión', 6999.00, 12, 'Creatividad', 'https://rapidfireart.com/wp-content/uploads/2017/09/RapidFireArt-Coloring-IronMan-Wacom-Intuos-Pro-Paper-Edition-.gif', 'Wacom', '{"area": "Medium", "niveles_presion": 8192, "conexion": "USB/Wireless", "compatibilidad": "Windows/Mac"}'),
('Consola PlayStation 5 Standard', 'Consola PS5 con lector de discos 4K UHD Blu-ray, SSD 825GB, control DualSense', 13999.00, 5, 'Consolas', 'https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyeXdqYjZycHljNDdidXBndGJwYTg1cGx5bnJzYmE3OWkzbGtlb3ZvbiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Sl1PEQk8fKeqcPDCEl/source.gif', 'Sony', '{"almacenamiento": "825GB SSD", "resolucion": "4K 120Hz", "control": "DualSense", "compatibilidad": "PS4"}');