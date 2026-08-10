export type CategoriaMenu = 
  | 'Todas' 
  | 'Bocas' 
  | 'Platos Fuertes' 
  | 'Cervezas' 
  | 'Cocteles' 
  | 'Bebidas' 
  | 'Postres';

export interface MenuItem {
  id: string;
  nombre: string;
  categoria: CategoriaMenu;
  precio: number;
  descripcion: string;
  icono: string;
  imagen_url: string;
  disponible: boolean;
}

export type EstadoOrden = 'pendiente' | 'preparando' | 'listo' | 'entregado';
export type TipoPedido = 'Mesa' | 'Barra' | 'Para Llevar';

export interface ItemOrdenDetalle {
  id?: string;
  item_id: string;
  nombre_item: string;
  cantidad: number;
  precio_unitario: number;
  notas_item?: string;
}

export interface Orden {
  id: string;
  numero_orden: number;
  mesa: string;
  tipo_pedido: TipoPedido;
  estado: EstadoOrden;
  total: number;
  notas?: string;
  creado_en: string;
  actualizado_en: string;
  items: ItemOrdenDetalle[];
}

export interface NetworkInfo {
  ips: string[];
  primaryIp: string;
  port: number;
}

export interface MesaConfig {
  id: string;
  nombre: string;
  tipo: 'Mesa' | 'Barra' | 'Para Llevar' | 'Otro';
  activa: boolean;
}
