import type { MenuItem, Orden, EstadoOrden, NetworkInfo, MesaConfig } from '../types';

const API_BASE = '/api';

export async function fetchNetworkInfo(): Promise<NetworkInfo> {
  const res = await fetch(`${API_BASE}/network-info`);
  if (!res.ok) throw new Error('Error obteniendo info de red');
  return res.json();
}

export async function fetchMenuItems(): Promise<MenuItem[]> {
  const res = await fetch(`${API_BASE}/menu`);
  if (!res.ok) throw new Error('Error al cargar el menú');
  return res.json();
}

export async function saveMenuItem(item: Partial<MenuItem>): Promise<{ success: boolean; id: string }> {
  const res = await fetch(`${API_BASE}/menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Error al guardar platillo');
  return res.json();
}

export async function toggleMenuItemDisponible(id: string, disponible: boolean): Promise<boolean> {
  const res = await fetch(`${API_BASE}/menu/${id}/disponible`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ disponible }),
  });
  return res.ok;
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/menu/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar platillo');
  return res.ok;
}

export async function fetchMesas(): Promise<MesaConfig[]> {
  const res = await fetch(`${API_BASE}/mesas`);
  if (!res.ok) throw new Error('Error al cargar mesas');
  return res.json();
}

export async function saveMesa(mesa: { id?: string; nombre: string; tipo: string }): Promise<{ success: boolean; id: string }> {
  const res = await fetch(`${API_BASE}/mesas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mesa),
  });
  if (!res.ok) throw new Error('Error al guardar mesa');
  return res.json();
}

export async function deleteMesa(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/mesas/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar mesa');
  return res.ok;
}

export async function fetchOrdenes(): Promise<Orden[]> {
  const res = await fetch(`${API_BASE}/ordenes`);
  if (!res.ok) throw new Error('Error al cargar órdenes');
  return res.json();
}

export async function crearOrden(ordenData: {
  mesa: string;
  tipo_pedido: string;
  items: Array<{ item_id: string; nombre_item: string; cantidad: number; precio_unitario: number; notas_item?: string }>;
  notas?: string;
  total: number;
}): Promise<{ success: boolean; orden: Orden }> {
  const res = await fetch(`${API_BASE}/ordenes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ordenData),
  });
  if (!res.ok) throw new Error('Error al enviar comanda');
  return res.json();
}

export async function cambiarEstadoOrden(id: string, estado: EstadoOrden): Promise<{ success: boolean; orden: Orden }> {
  const res = await fetch(`${API_BASE}/ordenes/${id}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  });
  if (!res.ok) throw new Error('Error al cambiar estado de comanda');
  return res.json();
}

// WebSocket Manager con Reconexión Automática
export class RealtimeClient {
  private ws: WebSocket | null = null;
  private listeners: Array<(event: any) => void> = [];
  private isConnected: boolean = false;
  private statusListeners: Array<(connected: boolean) => void> = [];

  constructor() {
    this.connect();
  }

  private connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('⚡ Conectado en tiempo real al WebSocket del servidor');
        this.isConnected = true;
        this.notifyStatus(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.listeners.forEach((callback) => callback(data));
        } catch (err) {
          console.error('Error parseando mensaje WS:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notifyStatus(false);
        // Reconectar en 3 segundos
        setTimeout(() => this.connect(), 3000);
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        this.notifyStatus(false);
        try { this.ws?.close(); } catch (e) {}
      };
    } catch (e) {
      console.error('Error iniciando WebSocket:', e);
      setTimeout(() => this.connect(), 3000);
    }
  }

  public subscribe(callback: (event: any) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public subscribeStatus(callback: (connected: boolean) => void) {
    this.statusListeners.push(callback);
    callback(this.isConnected);
    return () => {
      this.statusListeners = this.statusListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyStatus(connected: boolean) {
    this.statusListeners.forEach((cb) => cb(connected));
  }
}

export const realtimeClient = new RealtimeClient();
