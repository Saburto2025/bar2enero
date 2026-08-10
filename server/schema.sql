-- ========================================================
-- ESTRUCTURA DE BASE DE DATOS Y DATOS INICIALES - BAR 2 DE ENERO
-- Base de Datos Turso / SQLite
-- ========================================================

-- 1. TABLA DE MENÚ Y PLATILLOS
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  precio REAL NOT NULL,
  descripcion TEXT,
  icono TEXT,
  imagen_url TEXT,
  disponible INTEGER DEFAULT 1,
  creado_en TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA DE ÓRDENES / COMANDAS
CREATE TABLE IF NOT EXISTS ordenes (
  id TEXT PRIMARY KEY,
  numero_orden INTEGER NOT NULL,
  mesa TEXT NOT NULL,
  tipo_pedido TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  total REAL NOT NULL,
  notas TEXT,
  creado_en TEXT DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA DE DETALLES DE ÓRDENES
CREATE TABLE IF NOT EXISTS orden_detalles (
  id TEXT PRIMARY KEY,
  orden_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  nombre_item TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario REAL NOT NULL,
  notas_item TEXT,
  FOREIGN KEY (orden_id) REFERENCES ordenes(id) ON DELETE CASCADE
);

-- 4. TABLA DE MESAS Y BARRAS
CREATE TABLE IF NOT EXISTS mesas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Mesa',
  activa INTEGER DEFAULT 1,
  orden_posicion INTEGER DEFAULT 0
);

-- ========================================================
-- POBLAR MESAS Y BARRAS INICIALES
-- ========================================================
INSERT OR IGNORE INTO mesas (id, nombre, tipo, activa, orden_posicion) VALUES
('MESA-1', 'Mesa 1', 'Mesa', 1, 1),
('MESA-2', 'Mesa 2', 'Mesa', 1, 2),
('MESA-3', 'Mesa 3', 'Mesa', 1, 3),
('MESA-4', 'Mesa 4', 'Mesa', 1, 4),
('MESA-5', 'Mesa 5', 'Mesa', 1, 5),
('MESA-6', 'Mesa 6', 'Mesa', 1, 6),
('BARRA-1', 'Barra 1', 'Barra', 1, 101),
('BARRA-2', 'Barra 2', 'Barra', 1, 102),
('BARRA-3', 'Barra 3', 'Barra', 1, 103),
('BARRA-4', 'Barra 4', 'Barra', 1, 104),
('BARRA-5', 'Barra 5', 'Barra', 1, 105),
('BARRA-6', 'Barra 6', 'Barra', 1, 106),
('BARRA-7', 'Barra 7', 'Barra', 1, 107),
('BARRA-8', 'Barra 8', 'Barra', 1, 108),
('BARRA-9', 'Barra 9', 'Barra', 1, 109),
('BARRA-10', 'Barra 10', 'Barra', 1, 110),
('BARRA-11', 'Barra 11', 'Barra', 1, 111),
('BARRA-12', 'Barra 12', 'Barra', 1, 112),
('BARRA-13', 'Barra 13', 'Barra', 1, 113),
('BARRA-14', 'Barra 14', 'Barra', 1, 114),
('BARRA-15', 'Barra 15', 'Barra', 1, 115),
('LLEVAR-1', 'Para Llevar', 'Para Llevar', 1, 200);

-- ========================================================
-- POBLAR MENÚ DE PLATILLOS Y BEBIDAS INICIALES
-- ========================================================
INSERT OR IGNORE INTO menu_items (id, nombre, categoria, precio, descripcion, icono, imagen_url, disponible) VALUES
('1', 'TRIO DE BOQUITAS', 'Bocas', 3100, 'Frijoles molidos, pico de gallo, carne mechada y patacones', '🧆', 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400&q=80', 1),
('2', 'TORTA DE HUEVO', 'Bocas', 1500, 'Tortilla palmeada con cebolla y cebollino fresco', '🍳', 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80', 1),
('3', 'TACOS DE CARNE', 'Platos Fuertes', 2500, 'Servidos con repollo picado y papas fritas tostadas', '🌮', 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&q=80', 1),
('4', 'SALCHICHÓN c/s', 'Bocas', 2000, 'Con repollo fresco y tortilla palmeada artesanal', '🌭', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80', 1),
('5', 'PAPA NACHOS', 'Bocas', 3900, 'Papas fritas con frijoles molidos, carne mechada, lechuga, pico gallo y salsas', '🍟', 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&q=80', 1),
('6', 'NACHOS', 'Bocas', 3800, 'Frijoles molidos, carne mechada, lechuga, pico de gallo y salsa especial', '🧀', 'https://images.unsplash.com/photo-1582169505937-b9992bd01ed9?w=400&q=80', 1),
('7', 'COSTILLA', 'Platos Fuertes', 3800, 'Jugosa costilla bañada en salsa barbacoa servida con papas fritas', '🍖', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80', 1),
('8', 'CHIFRIJO', 'Bocas', 3800, 'Frijoles tiernos, arroz blanco, pico de gallo y chicharrón crujiente', '🍲', 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400&q=80', 1),
('9', 'PEZUÑA', 'Bocas', 2800, 'Servida con arroz caliente y frijoles tiernos sazonados', '🥩', 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&q=80', 1),
('10', 'PESCADO EMPANIZADO', 'Platos Fuertes', 3800, 'Crujiente pescado empanizado con papas y ensalada fresca', '🐟', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80', 1),
('11', 'GALLO MORCILLA', 'Bocas', 3000, 'Servido sobre 2 tortillas palmeadas calientes', '🫓', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80', 1),
('12', 'CARNE EN SALSA', 'Platos Fuertes', 4000, 'Carne suave en salsa artesanal servida con arroz y tortillas tostadas', '🍲', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&q=80', 1),
('13', 'DEDOS DE QUESO', 'Entradas', 2500, 'Crujientes bastones de queso empanizados con dip de la casa', '🧀', 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=400&q=80', 1),
('14', 'RABIOL', 'Platos Fuertes', 2800, 'Servido con repollo fresco y papas fritas doradas', '🥟', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&q=80', 1),
('15', 'FRIJOLES TIERNOS', 'Bocas', 2400, 'Servidos con arroz blanco y tortilla tostada', '🥣', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', 1),
('16', 'ALITAS', 'Bocas', 4100, 'Alitas bañadas en salsa barbacoa servidas con papas fritas', '🍗', 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&q=80', 1),
('17', 'CERVEZA NACIONAL (Imperial / Pilsen)', 'Cervezas', 1500, 'Cerveza nacional bien fría', '🍺', 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80', 1),
('18', 'CERVEZA IMPORTADA (Corona / Heineken)', 'Cervezas', 2200, 'Cerveza importada helada con limón', '🍻', 'https://images.unsplash.com/photo-1584225064785-c62a8b43d148?w=400&q=80', 1),
('19', 'MICHELADA', 'Cervezas', 2500, 'Vaso escarchado con sal, limón y la cerveza de su elección', '🍹', 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80', 1),
('20', 'GASEOSA / SODA (500ml)', 'Bebidas', 1200, 'Coca-Cola, Fanta, Sprite o Té Frío', '🥤', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80', 1),
('21', 'SHOT GUARO / TEQUILA', 'Cocteles', 1200, 'Shot con borde escarchado', '🥃', 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=400&q=80', 1);
