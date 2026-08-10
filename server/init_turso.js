import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.TURSO_DATABASE_URL || "libsql://bar2deenero-saburto2025.aws-us-east-1.turso.io";
const token = process.argv[2] || process.env.TURSO_AUTH_TOKEN;

if (!token) {
  console.error("❌ ERROR: Debes proporcionar el Token de Turso.");
  console.log("Uso: node server/init_turso.js <TU_TURSO_AUTH_TOKEN>");
  process.exit(1);
}

const turso = createClient({
  url: url,
  authToken: token.trim(),
});

async function main() {
  console.log("⚡ Conectando a Turso:", url);

  try {
    // 1. MENU_ITEMS
    console.log("1/4 Creando tabla 'menu_items'...");
    await turso.execute(`
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
    `);

    // 2. ORDENES
    console.log("2/4 Creando tabla 'ordenes'...");
    await turso.execute(`
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
    `);

    // 3. ORDEN_DETALLES
    console.log("3/4 Creando tabla 'orden_detalles'...");
    await turso.execute(`
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
    `);

    // 4. MESAS
    console.log("4/4 Creando tabla 'mesas'...");
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS mesas (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        tipo TEXT NOT NULL DEFAULT 'Mesa',
        activa INTEGER DEFAULT 1,
        orden_posicion INTEGER DEFAULT 0
      );
    `);

    // SEMBRAR MESAS
    console.log("🌱 Sembrando Mesas y Barras...");
    const defaultMesas = [];
    for (let i = 1; i <= 15; i++) {
      defaultMesas.push({ id: `MESA-${i}`, nombre: `Mesa ${i}`, tipo: 'Mesa', orden: i });
    }
    for (let i = 1; i <= 5; i++) {
      defaultMesas.push({ id: `BARRA-${i}`, nombre: `Barra ${i}`, tipo: 'Barra', orden: 100 + i });
    }
    defaultMesas.push({ id: 'LLEVAR-1', nombre: 'Para Llevar', tipo: 'Para Llevar', orden: 200 });

    for (const m of defaultMesas) {
      await turso.execute({
        sql: "INSERT OR IGNORE INTO mesas (id, nombre, tipo, activa, orden_posicion) VALUES (?, ?, ?, 1, ?)",
        args: [m.id, m.nombre, m.tipo, m.orden]
      });
    }

    // SEMBRAR MENÚ
    console.log("🌱 Sembrando Menú Oficial del Bar 2 de Enero...");
    const defaultMenu = [
      { id: '1', nombre: 'TRIO DE BOQUITAS', categoria: 'Bocas', precio: 3100, descripcion: 'Frijoles molidos, pico de gallo, carne mechada y patacones', icono: '🧆', imagen_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400&q=80' },
      { id: '2', nombre: 'TORTA DE HUEVO', categoria: 'Bocas', precio: 1500, descripcion: 'Tortilla palmeada con cebolla y cebollino fresco', icono: '🍳', imagen_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80' },
      { id: '3', nombre: 'TACOS DE CARNE', categoria: 'Platos Fuertes', precio: 2500, descripcion: 'Servidos con repollo picado y papas fritas tostadas', icono: '🌮', imagen_url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&q=80' },
      { id: '4', nombre: 'SALCHICHÓN c/s', categoria: 'Bocas', precio: 2000, descripcion: 'Con repollo fresco y tortilla palmeada artesanal', icono: '🌭', imagen_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80' },
      { id: '5', nombre: 'PAPA NACHOS', categoria: 'Bocas', precio: 3900, descripcion: 'Papas fritas con frijoles molidos, carne mechada, lechuga, pico gallo y salsas', icono: '🍟', imagen_url: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&q=80' },
      { id: '6', nombre: 'NACHOS', categoria: 'Bocas', precio: 3800, descripcion: 'Frijoles molidos, carne mechada, lechuga, pico de gallo y salsa especial', icono: '🧀', imagen_url: 'https://images.unsplash.com/photo-1582169505937-b9992bd01ed9?w=400&q=80' },
      { id: '7', nombre: 'COSTILLA', categoria: 'Platos Fuertes', precio: 3800, descripcion: 'Jugosa costilla bañada en salsa barbacoa servida con papas fritas', icono: '🍖', imagen_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80' },
      { id: '8', nombre: 'CHIFRIJO', categoria: 'Bocas', precio: 3800, descripcion: 'Frijoles tiernos, arroz blanco, pico de gallo y chicharrón crujiente', icono: '🍲', imagen_url: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400&q=80' },
      { id: '9', nombre: 'PEZUÑA', categoria: 'Bocas', precio: 2800, descripcion: 'Servida con arroz caliente y frijoles tiernos sazonados', icono: '🥩', imagen_url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&q=80' },
      { id: '10', nombre: 'PESCADO EMPANIZADO', categoria: 'Platos Fuertes', precio: 3800, descripcion: 'Crujiente pescado empanizado con papas y ensalada fresca', icono: '🐟', imagen_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80' },
      { id: '11', nombre: 'GALLO MORCILLA', categoria: 'Bocas', precio: 3000, descripcion: 'Servido sobre 2 tortillas palmeadas calientes', icono: '🫓', imagen_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80' },
      { id: '12', nombre: 'CARNE EN SALSA', categoria: 'Platos Fuertes', precio: 4000, descripcion: 'Carne suave en salsa artesanal servida con arroz y tortillas tostadas', icono: '🍲', imagen_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&q=80' },
      { id: '13', nombre: 'DEDOS DE QUESO', categoria: 'Entradas', precio: 2500, descripcion: 'Crujientes bastones de queso empanizados con dip de la casa', icono: '🧀', imagen_url: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=400&q=80' },
      { id: '14', nombre: 'RABIOL', categoria: 'Platos Fuertes', precio: 2800, descripcion: 'Servido con repollo fresco y papas fritas doradas', icono: '🥟', imagen_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&q=80' },
      { id: '15', nombre: 'FRIJOLES TIERNOS', categoria: 'Bocas', precio: 2400, descripcion: 'Servidos con arroz blanco y tortilla tostada', icono: '🥣', imagen_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80' },
      { id: '16', nombre: 'ALITAS', categoria: 'Bocas', precio: 4100, descripcion: 'Alitas bañadas en salsa barbacoa servidas con papas fritas', icono: '🍗', imagen_url: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&q=80' },
      { id: '17', nombre: 'CERVEZA NACIONAL (Imperial / Pilsen)', categoria: 'Cervezas', precio: 1500, descripcion: 'Cerveza nacional bien fría', icono: '🍺', imagen_url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80' },
      { id: '18', nombre: 'CERVEZA IMPORTADA (Corona / Heineken)', categoria: 'Cervezas', precio: 2200, descripcion: 'Cerveza importada helada con limón', icono: '🍻', imagen_url: 'https://images.unsplash.com/photo-1584225064785-c62a8b43d148?w=400&q=80' },
      { id: '19', nombre: 'MICHELADA', categoria: 'Cervezas', precio: 2500, descripcion: 'Vaso escarchado con sal, limón y la cerveza de su elección', icono: '🍹', imagen_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80' },
      { id: '20', nombre: 'GASEOSA / SODA (500ml)', categoria: 'Bebidas', precio: 1200, descripcion: 'Coca-Cola, Fanta, Sprite o Té Frío', icono: '🥤', imagen_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80' },
      { id: '21', nombre: 'SHOT GUARO / TEQUILA', categoria: 'Cocteles', precio: 1200, descripcion: 'Shot con borde escarchado', icono: '🥃', imagen_url: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=400&q=80' }
    ];

    for (const item of defaultMenu) {
      await turso.execute({
        sql: "INSERT OR IGNORE INTO menu_items (id, nombre, categoria, precio, descripcion, icono, imagen_url, disponible) VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
        args: [item.id, item.nombre, item.categoria, item.precio, item.descripcion, item.icono, item.imagen_url]
      });
    }

    console.log("🎉 ¡BASE DE DATOS EN TURSO CREADA E INICIALIZADA CON ÉXITO!");
  } catch (error) {
    console.error("❌ Error conectando a Turso:", error.message);
  }
}

main();
