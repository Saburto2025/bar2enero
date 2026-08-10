import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import os from 'os';
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Configuracion de Turso / SQLite
const databaseUrl = process.env.TURSO_DATABASE_URL || "file:bar_2deenero.db";
const authToken = process.env.TURSO_AUTH_TOKEN || "";

const turso = createClient({
  url: databaseUrl,
  authToken: authToken.trim() ? authToken : undefined,
});

// Inicializacion de Tablas en Turso/SQLite
async function initDb() {
  try {
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

    await turso.execute(`
      CREATE TABLE IF NOT EXISTS mesas (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        tipo TEXT NOT NULL DEFAULT 'Mesa',
        activa INTEGER DEFAULT 1,
        orden_posicion INTEGER DEFAULT 0
      );
    `);

    // Sembrar mesas por defecto si está vacía
    const mesasRes = await turso.execute("SELECT COUNT(*) as count FROM mesas");
    const mesasCount = Number(mesasRes.rows[0].count);
    if (mesasCount === 0) {
      console.log("🪑 Inicializando mesas y barras por defecto...");
      const defaultMesas = [];
      for (let i = 1; i <= 6; i++) {
        defaultMesas.push({ id: `MESA-${i}`, nombre: `Mesa ${i}`, tipo: 'Mesa', orden: i });
      }
      for (let i = 1; i <= 15; i++) {
        defaultMesas.push({ id: `BARRA-${i}`, nombre: `Barra ${i}`, tipo: 'Barra', orden: 100 + i });
      }
      defaultMesas.push({ id: 'LLEVAR-1', nombre: 'Para Llevar', tipo: 'Para Llevar', orden: 200 });

      for (const m of defaultMesas) {
        await turso.execute({
          sql: "INSERT INTO mesas (id, nombre, tipo, activa, orden_posicion) VALUES (?, ?, ?, 1, ?)",
          args: [m.id, m.nombre, m.tipo, m.orden]
        });
      }
    }

    // Sembrar menú por defecto si está vacío
    const itemsRes = await turso.execute("SELECT COUNT(*) as count FROM menu_items");
    const count = Number(itemsRes.rows[0].count);
    
    if (count === 0) {
      console.log("🌱 Inicializando menú oficial de la fotografía para Bar 2 de Enero...");
      const defaultMenu = [
        // PLATILLOS DEL MENÚ OFICIAL (FOTOGRAFÍA)
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

        // BEBIDAS Y CERVEZAS PARA COMPLETAR EL MENÚ DE CAJA
        { id: '17', nombre: 'CERVEZA NACIONAL (Imperial / Pilsen)', categoria: 'Cervezas', precio: 1500, descripcion: 'Cerveza nacional bien fría', icono: '🍺', imagen_url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80' },
        { id: '18', nombre: 'CERVEZA IMPORTADA (Corona / Heineken)', categoria: 'Cervezas', precio: 2200, descripcion: 'Cerveza importada helada con limón', icono: '🍻', imagen_url: 'https://images.unsplash.com/photo-1584225064785-c62a8b43d148?w=400&q=80' },
        { id: '19', nombre: 'MICHELADA', categoria: 'Cervezas', precio: 2500, descripcion: 'Vaso escarchado con sal, limón y la cerveza de su elección', icono: '🍹', imagen_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80' },
        { id: '20', nombre: 'GASEOSA / SODA (500ml)', categoria: 'Bebidas', precio: 1200, descripcion: 'Coca-Cola, Fanta, Sprite o Té Frío', icono: '🥤', imagen_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80' },
        { id: '21', nombre: 'SHOT GUARO / TEQUILA', categoria: 'Cocteles', precio: 1200, descripcion: 'Shot con borde escarchado', icono: '🥃', imagen_url: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=400&q=80' }
      ];

      for (const item of defaultMenu) {
        await turso.execute({
          sql: `INSERT INTO menu_items (id, nombre, categoria, precio, descripcion, icono, imagen_url, disponible)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          args: [item.id, item.nombre, item.categoria, item.precio, item.descripcion, item.icono, item.imagen_url]
        });
      }
      console.log("✅ Menú por defecto creado exitosamente.");
    }
  } catch (err) {
    console.error("❌ Error inicializando base de datos:", err);
  }
}

initDb();

// WebSocket Broadcast helper
function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('📱 Cliente WebSocket conectado');
  ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Conectado en tiempo real al Bar 2 de Enero' }));

  ws.on('message', (msg) => {
    try {
      const parsed = JSON.parse(msg);
      console.log('📩 Evento recibido por WebSocket:', parsed.type);
    } catch (e) {
      console.error('Error parseando WebSocket msg:', e);
    }
  });
});

// Helper para obtener las IPs de la red local (para mostrar en la UI de Caja)
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push({ interface: name, address: net.address });
      }
    }
  }
  return ips;
}

// REST API ENDPOINTS

// 1. Informacion de Red Local
app.get('/api/network-info', (req, res) => {
  const ips = getLocalIpAddresses();
  const port = process.env.PORT || 3001;
  res.json({
    ips: ips.map(i => `http://${i.address}:${port}`),
    primaryIp: ips.length > 0 ? ips[0].address : 'localhost',
    port
  });
});

// 2. Obtener Menú
app.get('/api/menu', async (req, res) => {
  try {
    const result = await turso.execute("SELECT * FROM menu_items ORDER BY categoria ASC, nombre ASC");
    const items = result.rows.map(r => ({
      id: String(r.id),
      nombre: String(r.nombre),
      categoria: String(r.categoria),
      precio: Number(r.precio),
      descripcion: String(r.descripcion || ''),
      icono: String(r.icono || '🍽️'),
      imagen_url: String(r.imagen_url || ''),
      disponible: Boolean(r.disponible === 1 || r.disponible === true)
    }));
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Crear/Editar Item de Menú
app.post('/api/menu', async (req, res) => {
  try {
    const { id, nombre, categoria, precio, descripcion, icono, imagen_url, disponible } = req.body;
    const itemId = id || String(Date.now());
    
    await turso.execute({
      sql: `INSERT OR REPLACE INTO menu_items (id, nombre, categoria, precio, descripcion, icono, imagen_url, disponible)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [itemId, nombre, categoria, Number(precio), descripcion || '', icono || '🍽️', imagen_url || '', disponible !== false ? 1 : 0]
    });

    broadcast({ type: 'MENU_UPDATED', itemId });
    res.json({ success: true, id: itemId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Cambiar disponibilidad de item de menú
app.patch('/api/menu/:id/disponible', async (req, res) => {
  try {
    const { id } = req.params;
    const { disponible } = req.body;
    await turso.execute({
      sql: "UPDATE menu_items SET disponible = ? WHERE id = ?",
      args: [disponible ? 1 : 0, id]
    });
    broadcast({ type: 'MENU_UPDATED', id, disponible });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4.0 Eliminar item de menú
app.delete('/api/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await turso.execute({
      sql: "DELETE FROM menu_items WHERE id = ?",
      args: [id]
    });
    broadcast({ type: 'MENU_UPDATED', id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4.1 Obtener todas las Mesas / Barras
app.get('/api/mesas', async (req, res) => {
  try {
    const result = await turso.execute("SELECT * FROM mesas WHERE activa = 1 ORDER BY orden_posicion ASC, nombre ASC");
    const mesas = result.rows.map(r => ({
      id: String(r.id),
      nombre: String(r.nombre),
      tipo: String(r.tipo),
      activa: Boolean(r.activa === 1 || r.activa === true)
    }));
    res.json(mesas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4.2 Crear o Editar Mesa / Barra
app.post('/api/mesas', async (req, res) => {
  try {
    const { id, nombre, tipo } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }
    const mesaId = id || 'MESA-' + String(Date.now());
    const tipoVal = tipo || 'Mesa';
    
    await turso.execute({
      sql: `INSERT OR REPLACE INTO mesas (id, nombre, tipo, activa, orden_posicion)
            VALUES (?, ?, ?, 1, (SELECT COALESCE(MAX(orden_posicion), 0) + 1 FROM mesas))`,
      args: [mesaId, nombre, tipoVal]
    });

    broadcast({ type: 'MESAS_UPDATED' });
    res.json({ success: true, id: mesaId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4.3 Eliminar Mesa / Barra
app.delete('/api/mesas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await turso.execute({
      sql: "DELETE FROM mesas WHERE id = ?",
      args: [id]
    });
    broadcast({ type: 'MESAS_UPDATED' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Obtener Todas las Ordenes
app.get('/api/ordenes', async (req, res) => {
  try {
    const ordenesRes = await turso.execute(`
      SELECT * FROM ordenes ORDER BY creado_en DESC LIMIT 100
    `);
    
    const ordenes = [];
    for (const row of ordenesRes.rows) {
      const detallesRes = await turso.execute({
        sql: "SELECT * FROM orden_detalles WHERE orden_id = ?",
        args: [row.id]
      });
      
      const items = detallesRes.rows.map(d => ({
        id: String(d.id),
        item_id: String(d.item_id),
        nombre_item: String(d.nombre_item),
        cantidad: Number(d.cantidad),
        precio_unitario: Number(d.precio_unitario),
        notas_item: String(d.notas_item || '')
      }));

      ordenes.push({
        id: String(row.id),
        numero_orden: Number(row.numero_orden),
        mesa: String(row.mesa),
        tipo_pedido: String(row.tipo_pedido),
        estado: String(row.estado),
        total: Number(row.total),
        notas: String(row.notas || ''),
        creado_en: String(row.creado_en),
        actualizado_en: String(row.actualizado_en),
        items
      });
    }

    res.json(ordenes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Crear nueva orden (Caja / Mesero)
app.post('/api/ordenes', async (req, res) => {
  try {
    const { mesa, tipo_pedido, items, notas, total } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "La orden no contiene items" });
    }

    // Calcular proximo numero de orden correlativo
    const maxNumRes = await turso.execute("SELECT COALESCE(MAX(numero_orden), 0) + 1 as next_num FROM ordenes");
    const numero_orden = Number(maxNumRes.rows[0].next_num);
    
    const orden_id = 'ORD-' + String(Date.now()).slice(-6) + '-' + Math.floor(Math.random() * 100);
    const now = new Date().toISOString();

    await turso.execute({
      sql: `INSERT INTO ordenes (id, numero_orden, mesa, tipo_pedido, estado, total, notas, creado_en, actualizado_en)
            VALUES (?, ?, ?, ?, 'pendiente', ?, ?, ?, ?)`,
      args: [orden_id, numero_orden, mesa || 'Mesa 1', tipo_pedido || 'Mesa', Number(total), notas || '', now, now]
    });

    for (const item of items) {
      const detalle_id = 'DET-' + String(Math.random()).slice(2, 10);
      await turso.execute({
        sql: `INSERT INTO orden_detalles (id, orden_id, item_id, nombre_item, cantidad, precio_unitario, notas_item)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [detalle_id, orden_id, String(item.item_id), String(item.nombre_item), Number(item.cantidad), Number(item.precio_unitario), item.notas_item || '']
      });
    }

    // Obtener objeto orden completo para transmitir por WS
    const nuevaOrden = {
      id: orden_id,
      numero_orden,
      mesa: mesa || 'Mesa 1',
      tipo_pedido: tipo_pedido || 'Mesa',
      estado: 'pendiente',
      total: Number(total),
      notas: notas || '',
      creado_en: now,
      actualizado_en: now,
      items
    };

    // Emitir WebSocket instantaneo a Pantalla de Cocina (KDS)
    broadcast({
      type: 'NUEVA_ORDEN',
      orden: nuevaOrden
    });

    res.json({ success: true, orden: nuevaOrden });
  } catch (error) {
    console.error("Error creando orden:", error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Cambiar Estado de Orden (Cocina KDS / Caja)
app.patch('/api/ordenes/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const now = new Date().toISOString();

    await turso.execute({
      sql: "UPDATE ordenes SET estado = ?, actualizado_en = ? WHERE id = ?",
      args: [estado, now, id]
    });

    // Obtener datos actualizados de la orden
    const ordRes = await turso.execute({
      sql: "SELECT * FROM ordenes WHERE id = ?",
      args: [id]
    });
    
    if (ordRes.rows.length === 0) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    const row = ordRes.rows[0];
    const detallesRes = await turso.execute({
      sql: "SELECT * FROM orden_detalles WHERE orden_id = ?",
      args: [id]
    });

    const ordenActualizada = {
      id: String(row.id),
      numero_orden: Number(row.numero_orden),
      mesa: String(row.mesa),
      tipo_pedido: String(row.tipo_pedido),
      estado: String(row.estado),
      total: Number(row.total),
      notas: String(row.notas || ''),
      creado_en: String(row.creado_en),
      actualizado_en: String(row.actualizado_en),
      items: detallesRes.rows.map(d => ({
        id: String(d.id),
        item_id: String(d.item_id),
        nombre_item: String(d.nombre_item),
        cantidad: Number(d.cantidad),
        precio_unitario: Number(d.precio_unitario),
        notas_item: String(d.notas_item || '')
      }))
    };

    // Emitir WebSocket instantaneo a Caja y Cocina
    broadcast({
      type: 'ESTADO_CAMBIADO',
      orden: ordenActualizada,
      nuevoEstado: estado
    });

    res.json({ success: true, orden: ordenActualizada });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 SERVIDOR BAR 2 DE ENERO INICIADO EN PUERTO ${PORT}`);
  console.log(`-----------------------------------------------------`);
  console.log(`🌐 Acceso local (esta PC): http://localhost:${PORT}`);
  const ips = getLocalIpAddresses();
  if (ips.length > 0) {
    console.log(`📡 Acceso en Red Local (para Cocina u otras PCs):`);
    ips.forEach(i => console.log(`   ➜ http://${i.address}:${PORT}`));
  }
  console.log(`-----------------------------------------------------\n`);
});
