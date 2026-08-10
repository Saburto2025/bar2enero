import type { MenuItem, Orden, EstadoOrden, NetworkInfo, MesaConfig } from '../types';
import { createClient } from '@libsql/client/web';

const TURSO_URL = import.meta.env.VITE_TURSO_DATABASE_URL || 'https://bar2deenero-saburto2025.aws-us-east-1.turso.io';
const TURSO_TOKEN = import.meta.env.VITE_TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODYzODUxMjUsImlkIjoiMDE5ZmVjZDktMTYwMS03ZDcyLTgxN2EtNzg2ZDk5YWU2YWUxIiwia2lkIjoiNTVvaVVyR1hrMUg3a1YyVVdfRER6SEtvNlI0TGJkajNzMk8zRUlUdGRRQSIsInJpZCI6ImYzYmNlYWJkLTY4ZjUtNDk0My05M2UxLTEzOGZjZTdhNDM5ZiJ9.Xfj1Zp89YSIiw09Zazx2UULKnbDdLJrgPeFpF--9XJELjxPjKlKopdlAbQsrDUUK7ENC-ZDbFHQJH8-L5hliCw';

const turso = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN,
});

const API_BASE = '/api';

export async function fetchNetworkInfo(): Promise<NetworkInfo> {
  try {
    const res = await fetch(`${API_BASE}/network-info`);
    if (res.ok) return res.json();
  } catch (e) {
    console.warn('Uso de modo directo Turso DB para info de red');
  }
  return { primaryIp: 'bar2enero.migrantecr.org', ips: ['bar2enero.migrantecr.org'], port: 5173 };
}

export async function fetchMenuItems(): Promise<MenuItem[]> {
  try {
    const result = await turso.execute("SELECT * FROM menu_items ORDER BY categoria ASC, nombre ASC");
    return result.rows.map(r => ({
      id: String(r.id),
      nombre: String(r.nombre),
      categoria: r.categoria as any,
      precio: Number(r.precio),
      descripcion: String(r.descripcion || ''),
      icono: String(r.icono || '🍽️'),
      imagen_url: String(r.imagen_url || ''),
      disponible: Boolean(Number(r.disponible) === 1)
    }));
  } catch (err) {
    console.warn('Fallback local /api/menu:', err);
    const res = await fetch(`${API_BASE}/menu`);
    if (!res.ok) throw new Error('Error al cargar el menú');
    return res.json();
  }
}

export async function saveMenuItem(item: Partial<MenuItem>): Promise<{ success: boolean; id: string }> {
  const itemId = item.id || String(Date.now());
  try {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO menu_items (id, nombre, categoria, precio, descripcion, icono, imagen_url, disponible)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [itemId, item.nombre || '', item.categoria || 'Bocas', Number(item.precio || 0), item.descripcion || '', item.icono || '🍽️', item.imagen_url || '', item.disponible !== false ? 1 : 0]
    });
    realtimeClient.broadcast({ type: 'MENU_UPDATED', itemId });
    return { success: true, id: itemId };
  } catch (err) {
    const res = await fetch(`${API_BASE}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Error al guardar platillo');
    return res.json();
  }
}

export async function toggleMenuItemDisponible(id: string, disponible: boolean): Promise<boolean> {
  try {
    await turso.execute({
      sql: "UPDATE menu_items SET disponible = ? WHERE id = ?",
      args: [disponible ? 1 : 0, id]
    });
    realtimeClient.broadcast({ type: 'MENU_UPDATED', itemId: id });
    return true;
  } catch (e) {
    const res = await fetch(`${API_BASE}/menu/${id}/disponible`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disponible }),
    });
    return res.ok;
  }
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  try {
    await turso.execute({
      sql: "DELETE FROM menu_items WHERE id = ?",
      args: [id]
    });
    realtimeClient.broadcast({ type: 'MENU_UPDATED', itemId: id });
    return true;
  } catch (e) {
    const res = await fetch(`${API_BASE}/menu/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  }
}

export async function fetchMesas(): Promise<MesaConfig[]> {
  try {
    const result = await turso.execute("SELECT * FROM mesas WHERE activa = 1 ORDER BY orden_posicion ASC");
    return result.rows.map(r => ({
      id: String(r.id),
      nombre: String(r.nombre),
      tipo: String(r.tipo) as any,
      activa: Boolean(Number(r.activa) === 1),
      orden_posicion: Number(r.orden_posicion || 0)
    }));
  } catch (err) {
    const res = await fetch(`${API_BASE}/mesas`);
    if (!res.ok) throw new Error('Error al cargar mesas');
    return res.json();
  }
}

export async function saveMesa(mesa: { id?: string; nombre: string; tipo: string }): Promise<{ success: boolean; id: string }> {
  const mesaId = mesa.id || `${mesa.tipo.toUpperCase()}-${Date.now().toString().slice(-4)}`;
  try {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO mesas (id, nombre, tipo, activa, orden_posicion)
            VALUES (?, ?, ?, 1, 99)`,
      args: [mesaId, mesa.nombre, mesa.tipo]
    });
    realtimeClient.broadcast({ type: 'MESAS_UPDATED' });
    return { success: true, id: mesaId };
  } catch (err) {
    const res = await fetch(`${API_BASE}/mesas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mesa),
    });
    return res.json();
  }
}

export async function deleteMesa(id: string): Promise<boolean> {
  try {
    await turso.execute({
      sql: "DELETE FROM mesas WHERE id = ?",
      args: [id]
    });
    realtimeClient.broadcast({ type: 'MESAS_UPDATED' });
    return true;
  } catch (e) {
    const res = await fetch(`${API_BASE}/mesas/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  }
}

export async function fetchOrdenes(): Promise<Orden[]> {
  try {
    const resOrdenes = await turso.execute("SELECT * FROM ordenes ORDER BY creado_en DESC LIMIT 100");
    const ordenes: Orden[] = [];

    for (const r of resOrdenes.rows) {
      const resDetalles = await turso.execute({
        sql: "SELECT * FROM orden_detalles WHERE orden_id = ?",
        args: [r.id]
      });

      ordenes.push({
        id: String(r.id),
        numero_orden: Number(r.numero_orden),
        mesa: String(r.mesa),
        tipo_pedido: String(r.tipo_pedido) as any,
        estado: String(r.estado) as EstadoOrden,
        total: Number(r.total),
        notas: String(r.notas || ''),
        creado_en: String(r.creado_en),
        actualizado_en: String(r.actualizado_en),
        items: resDetalles.rows.map(d => ({
          id: String(d.id),
          item_id: String(d.item_id),
          nombre_item: String(d.nombre_item),
          cantidad: Number(d.cantidad),
          precio_unitario: Number(d.precio_unitario),
          notas_item: String(d.notas_item || '')
        }))
      });
    }

    return ordenes;
  } catch (err) {
    console.warn('Fallback local /api/ordenes:', err);
    const res = await fetch(`${API_BASE}/ordenes`);
    if (!res.ok) throw new Error('Error al cargar órdenes');
    return res.json();
  }
}

export async function crearOrden(ordenData: {
  mesa: string;
  tipo_pedido: string;
  items: Array<{ item_id: string; nombre_item: string; cantidad: number; precio_unitario: number; notas_item?: string }>;
  notas?: string;
  total: number;
}): Promise<{ success: boolean; orden: Orden }> {
  const maxNumRes = await turso.execute("SELECT COALESCE(MAX(numero_orden), 0) + 1 as next_num FROM ordenes");
  const numero_orden = Number(maxNumRes.rows[0].next_num);
  const orden_id = 'ORD-' + String(Date.now()).slice(-6) + '-' + Math.floor(Math.random() * 100);
  const now = new Date().toISOString();

  await turso.execute({
    sql: `INSERT INTO ordenes (id, numero_orden, mesa, tipo_pedido, estado, total, notas, creado_en, actualizado_en)
          VALUES (?, ?, ?, ?, 'pendiente', ?, ?, ?, ?)`,
    args: [orden_id, numero_orden, ordenData.mesa || 'Mesa 1', ordenData.tipo_pedido || 'Mesa', Number(ordenData.total), ordenData.notas || '', now, now]
  });

  const detalles = [];
  for (const item of ordenData.items) {
    const detalle_id = 'DET-' + String(Math.random()).slice(2, 10);
    await turso.execute({
      sql: `INSERT INTO orden_detalles (id, orden_id, item_id, nombre_item, cantidad, precio_unitario, notas_item)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [detalle_id, orden_id, String(item.item_id), String(item.nombre_item), Number(item.cantidad), Number(item.precio_unitario), item.notas_item || '']
    });

    detalles.push({
      id: detalle_id,
      item_id: String(item.item_id),
      nombre_item: String(item.nombre_item),
      cantidad: Number(item.cantidad),
      precio_unitario: Number(item.precio_unitario),
      notas_item: item.notas_item || ''
    });
  }

  const nuevaOrden: Orden = {
    id: orden_id,
    numero_orden,
    mesa: ordenData.mesa || 'Mesa 1',
    tipo_pedido: ordenData.tipo_pedido as any || 'Mesa',
    estado: 'pendiente',
    total: Number(ordenData.total),
    notas: ordenData.notas || '',
    creado_en: now,
    actualizado_en: now,
    items: detalles
  };

  realtimeClient.broadcast({ type: 'NUEVA_ORDEN', orden: nuevaOrden });
  return { success: true, orden: nuevaOrden };
}

export async function cambiarEstadoOrden(id: string, estado: EstadoOrden): Promise<{ success: boolean; orden: Orden }> {
  const now = new Date().toISOString();
  await turso.execute({
    sql: "UPDATE ordenes SET estado = ?, actualizado_en = ? WHERE id = ?",
    args: [estado, now, id]
  });

  const ordenes = await fetchOrdenes();
  const ordenActualizada = ordenes.find(o => o.id === id)!;

  realtimeClient.broadcast({
    type: 'ESTADO_CAMBIADO',
    ordenId: id,
    nuevoEstado: estado,
    orden: ordenActualizada
  });

  return { success: true, orden: ordenActualizada };
}

// Client-side Broadcast / WebSockets Event Bus
export class RealtimeClient {
  private listeners: Array<(event: any) => void> = [];
  private statusListeners: Array<(connected: boolean) => void> = [];
  private channel: BroadcastChannel | null = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('bar2enero_channel') : null;

  constructor() {
    if (this.channel) {
      this.channel.onmessage = (e) => {
        this.listeners.forEach(cb => cb(e.data));
      };
    }
    setTimeout(() => this.notifyStatus(true), 500);
  }

  public subscribe(callback: (event: any) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  public subscribeStatus(callback: (connected: boolean) => void) {
    this.statusListeners.push(callback);
    callback(true);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== callback);
    };
  }

  private notifyStatus(connected: boolean) {
    this.statusListeners.forEach((callback) => callback(connected));
  }

  public broadcast(data: any) {
    this.listeners.forEach(cb => cb(data));
    if (this.channel) {
      try { this.channel.postMessage(data); } catch (e) {}
    }
  }
}

export const realtimeClient = new RealtimeClient();
