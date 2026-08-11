import { useState } from 'react';
import { 
  Search, Plus, Minus, Trash2, Send, CheckCircle2, 
  ChefHat, MessageSquare, ShoppingBag, X, Bell, Printer
} from 'lucide-react';
import type { MenuItem, Orden, CategoriaMenu, TipoPedido, MesaConfig } from '../types';
import { crearOrden, cambiarEstadoOrden } from '../lib/api';
import { soundManager } from '../lib/audio';
import { TicketImpresionModal } from './TicketImpresionModal';

interface CajaPOSProps {
  menuItems: MenuItem[];
  ordenes: Orden[];
  mesas?: MesaConfig[];
  onOrdenCreated: () => void;
}

interface CartItem {
  item: MenuItem;
  cantidad: number;
  notas_item: string;
}

export const CajaPOS: React.FC<CajaPOSProps> = ({ menuItems, ordenes, mesas, onOrdenCreated }) => {
  const [categoriaSel, setCategoriaSel] = useState<CategoriaMenu>('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [mesa, setMesa] = useState('Mesa 1');
  const [tipoPedido, setTipoPedido] = useState<TipoPedido>('Mesa');
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [notasOrden, setNotasOrden] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedItemModal, setSelectedItemModal] = useState<MenuItem | null>(null);
  const [modalCantidad, setModalCantidad] = useState(1);
  const [modalNotas, setModalNotas] = useState('');
  const [notifSuccess, setNotifSuccess] = useState<string | null>(null);
  const [selectedTicketOrden, setSelectedTicketOrden] = useState<Orden | null>(null);
  const [ultimaOrden, setUltimaOrden] = useState<Orden | null>(null);

  // Categorias disponibles
  const categorias: CategoriaMenu[] = [
    'Todas', 'Bocas', 'Platos Fuertes', 'Entradas', 'Cervezas', 'Cocteles', 'Bebidas'
  ];

  // Mesas rápidas dinámicas
  const opcionesMesa = mesas && mesas.length > 0 
    ? mesas.map(m => m.nombre)
    : [...Array.from({ length: 15 }, (_, i) => `Mesa ${i + 1}`), 'Barra 1', 'Barra 2', 'Barra 3', 'Para Llevar'];

  // Filtrado de Platillos
  const itemsFiltrados = menuItems.filter((item) => {
    const coincideCategoria = categoriaSel === 'Todas' || item.categoria === categoriaSel;
    const coincideBusqueda = item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                             item.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  // Ordenes en estado 'listo' (Alertas de entrega para el mesero)
  const ordenesListas = ordenes.filter(o => o.estado === 'listo');

  // Modal para agregar item con notas
  const handleOpenItemModal = (item: MenuItem) => {
    setSelectedItemModal(item);
    setModalCantidad(1);
    setModalNotas('');
  };

  const handleAgregarAlCarrito = () => {
    if (!selectedItemModal) return;

    setCarrito((prev) => {
      const idx = prev.findIndex(ci => ci.item.id === selectedItemModal.id && ci.notas_item === modalNotas);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].cantidad += modalCantidad;
        return copy;
      }
      return [...prev, { item: selectedItemModal, cantidad: modalCantidad, notas_item: modalNotas }];
    });

    setSelectedItemModal(null);
  };

  // Ajustar cantidad en el carrito
  const updateCantidadCarrito = (index: number, delta: number) => {
    setCarrito((prev) => {
      const copy = [...prev];
      const newCant = copy[index].cantidad + delta;
      if (newCant <= 0) {
        return copy.filter((_, i) => i !== index);
      }
      copy[index].cantidad = newCant;
      return copy;
    });
  };

  // Calcular Totales
  const subtotal = carrito.reduce((sum, ci) => sum + (ci.item.precio * ci.cantidad), 0);
  const total = subtotal; // Sin impuestos ocultos

  // Enviar Comanda a Cocina
  const handleEnviarComanda = async () => {
    if (carrito.length === 0) return;
    setIsSending(true);

    try {
      const itemsPayload = carrito.map(ci => ({
        item_id: ci.item.id,
        nombre_item: ci.item.nombre,
        cantidad: ci.cantidad,
        precio_unitario: ci.item.precio,
        notas_item: ci.notas_item
      }));

      const res = await crearOrden({
        mesa,
        tipo_pedido: tipoPedido,
        items: itemsPayload,
        notas: notasOrden,
        total
      });

      if (res.orden) {
        setUltimaOrden(res.orden);
      }

      // Limpiar Formulario
      setCarrito([]);
      setNotasOrden('');
      setNotifSuccess(`¡Comanda enviada a cocina para ${mesa}! 🚀`);
      soundManager.playNewOrderSound();
      onOrdenCreated();

      setTimeout(() => setNotifSuccess(null), 8000);
    } catch (error: any) {
      alert('Error enviando la comanda: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  // Marcar pedido entregado al cliente
  const handleMarcarEntregado = async (ordenId: string) => {
    try {
      await cambiarEstadoOrden(ordenId, 'entregado');
      onOrdenCreated();
    } catch (e: any) {
      alert('Error al actualizar: ' + e.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-950 text-slate-100 flex flex-col lg:flex-row overflow-hidden">
      
      {/* SECCIÓN IZQUIERDA: MENÚ & FILTROS (65% ANCHO) */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col space-y-5 border-r border-slate-800/80">
        
        {/* ENCABEZADO DE SELECCIÓN DE MESA Y BÚSQUEDA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          
          {/* SELECTOR DE MESA */}
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
              📍 Ubicación:
            </span>
            <select
              value={mesa}
              onChange={(e) => {
                const val = e.target.value;
                setMesa(val);
                if (val.toLowerCase().includes('barra')) setTipoPedido('Barra');
                else if (val.toLowerCase().includes('llevar')) setTipoPedido('Para Llevar');
                else setTipoPedido('Mesa');
              }}
              className="bg-slate-800 text-amber-300 font-extrabold text-base rounded-xl px-4 py-2 border border-amber-500/30 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {opcionesMesa.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* BARRA DE BÚSQUEDA */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar platillo, bocas o cerveza..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/70 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            {busqueda && (
              <button 
                onClick={() => setBusqueda('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* NOTIFICACIÓN DE ÉXITO Y BOTÓN DE IMPRESIÓN DE TICKET */}
        {notifSuccess && (
          <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl font-bold flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 animate-fadeIn shadow-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{notifSuccess}</span>
            </div>
            {ultimaOrden && (
              <button
                onClick={() => setSelectedTicketOrden(ultimaOrden)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/20 transition active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>🖨️ Imprimir Recibo (55mm)</span>
              </button>
            )}
          </div>
        )}

        {/* ALERTA DE PEDIDOS LISTOS PARA ENTREGAR */}
        {ordenesListas.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border-2 border-emerald-500/60 p-4 rounded-2xl shadow-xl shadow-emerald-900/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-emerald-400 animate-bounce" />
                <h3 className="text-base font-black text-emerald-300">
                  ¡PEDIDOS LISTOS EN COCINA PARA SERVIR! ({ordenesListas.length})
                </h3>
              </div>
              <span className="text-xs font-semibold text-emerald-400/80">Entregar al cliente 🛎️</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ordenesListas.map((ord) => (
                <div key={ord.id} className="bg-slate-900/90 border border-emerald-500/40 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-amber-400 text-sm">{ord.mesa}</span>
                      <span className="text-xs text-slate-400">#{ord.numero_orden}</span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-1">
                      {ord.items.map(i => `${i.cantidad}x ${i.nombre_item}`).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setSelectedTicketOrden(ord)}
                      className="bg-slate-800 hover:bg-slate-700 text-amber-400 p-2 rounded-lg border border-slate-700 transition"
                      title="Imprimir Recibo 55mm"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMarcarEntregado(ord.id)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-lg font-black text-xs transition shadow-md"
                    >
                      ✔ Entregado a Cliente
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORÍAS BOTONES SLIDER */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaSel(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 border ${
                categoriaSel === cat
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 scale-105'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* GRID DE PLATILLOS / MENÚ DE CAJA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {itemsFiltrados.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenItemModal(item)}
              className="group bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5"
            >
              <div>
                {/* IMAGEN O ICONO DE PRODUCTO */}
                <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-950 mb-3 flex items-center justify-center">
                  {item.imagen_url ? (
                    <img 
                      src={item.imagen_url} 
                      alt={item.nombre}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-4xl">{item.icono}</span>
                  )}
                  <span className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-xs font-bold text-amber-400 border border-amber-500/30">
                    {item.categoria}
                  </span>
                </div>

                <div className="flex items-start justify-between">
                  <h4 className="font-extrabold text-white text-base group-hover:text-amber-400 transition-colors">
                    {item.nombre}
                  </h4>
                </div>
                
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 font-normal">
                  {item.descripcion}
                </p>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60">
                <span className="text-lg font-black text-amber-400">
                  ₡{item.precio.toLocaleString()}
                </span>
                
                <button 
                  className="bg-amber-500/10 group-hover:bg-amber-500 text-amber-400 group-hover:text-slate-950 p-2 rounded-xl border border-amber-500/30 transition-all"
                  title="Agregar comanda"
                >
                  <Plus className="w-4 h-4 font-bold" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {itemsFiltrados.length === 0 && (
          <div className="py-16 text-center text-slate-500">
            <p className="text-base font-semibold">No se encontraron productos en esta categoría</p>
          </div>
        )}
      </div>

      {/* SECCIÓN DERECHA: COMANDA ACTUAL / CARRITO (35% ANCHO) */}
      <div className="w-full lg:w-96 bg-slate-900/90 border-l border-slate-800 p-5 flex flex-col justify-between shadow-2xl">
        
        <div>
          {/* ENCABEZADO DE CARRITO CON SELECTOR PROMINENTE DE MESA O BARRA */}
          <div className="bg-slate-950/90 p-4 rounded-2xl border border-amber-500/40 mb-4 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-black text-white">Comanda Actual</h2>
              </div>
              <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-1 rounded-lg font-mono font-black border border-amber-500/30">
                {tipoPedido}
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                📍 UBICACIÓN DESTINO (MESA / BARRA):
              </label>
              <select
                value={mesa}
                onChange={(e) => {
                  const val = e.target.value;
                  setMesa(val);
                  if (val.toLowerCase().includes('barra')) setTipoPedido('Barra');
                  else if (val.toLowerCase().includes('llevar')) setTipoPedido('Para Llevar');
                  else setTipoPedido('Mesa');
                }}
                className="w-full bg-slate-900 text-amber-300 font-black text-base rounded-xl px-3.5 py-2.5 border border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
              >
                {opcionesMesa.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* LISTA DE ITEMS SELECCIONADOS */}
          <div className="space-y-3 max-h-[calc(100vh-25rem)] overflow-y-auto pr-1">
            {carrito.length === 0 ? (
              <div className="py-12 text-center text-slate-500 flex flex-col items-center">
                <ChefHat className="w-12 h-12 text-slate-700 mb-2 stroke-[1.5]" />
                <p className="text-sm font-medium">Selecciona platillos del menú para armar el pedido de {mesa}</p>
              </div>
            ) : (
              carrito.map((ci, index) => (
                <div 
                  key={index}
                  className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex flex-col space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-white text-sm">{ci.item.nombre}</h4>
                      <span className="text-xs text-amber-400 font-bold">
                        ₡{ci.item.precio.toLocaleString()} c/u
                      </span>
                    </div>

                    <span className="text-sm font-black text-amber-300">
                      ₡{(ci.item.precio * ci.cantidad).toLocaleString()}
                    </span>
                  </div>

                  {/* NOTAS DEL ITEM */}
                  {ci.notas_item && (
                    <div className="bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded text-xs text-amber-300 font-medium">
                      📝 "{ci.notas_item}"
                    </div>
                  )}

                  {/* CONTROLES DE CANTIDAD */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateCantidadCarrito(index, -1)}
                        className="bg-slate-800 hover:bg-slate-700 text-white p-1 rounded-lg"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-black px-2 text-white">{ci.cantidad}</span>
                      <button
                        onClick={() => updateCantidadCarrito(index, 1)}
                        className="bg-slate-800 hover:bg-slate-700 text-white p-1 rounded-lg"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => updateCantidadCarrito(index, -ci.cantidad)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PIE CON TOTAL Y BOTÓN DE ENVIAR A COCINA */}
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
          
          {/* NOTA GENERAL DE ORDEN */}
          <div>
            <label className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Nota para Cocina (opcional):
            </label>
            <input
              type="text"
              placeholder="Ej: Servir bebidas primero, sacar todo junto..."
              value={notasOrden}
              onChange={(e) => setNotasOrden(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* CÁLCULO DE PRECIO TOTAL */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>Subtotal:</span>
              <span>₡{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base font-black text-white pt-1 border-t border-slate-800">
              <span>TOTAL COMANDA:</span>
              <span className="text-amber-400">₡{total.toLocaleString()}</span>
            </div>
          </div>

          {/* BOTÓN ENVIAR A COCINA */}
          <button
            onClick={handleEnviarComanda}
            disabled={carrito.length === 0 || isSending}
            className={`w-full py-3.5 rounded-xl font-black text-base transition-all duration-200 shadow-xl flex items-center justify-center space-x-2 ${
              carrito.length === 0 || isSending
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 hover:brightness-110 shadow-amber-500/20 active:scale-[0.99]'
            }`}
          >
            {isSending ? (
              <span>Enviando Comanda...</span>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>ENVIAR A COCINA (KDS)</span>
              </>
            )}
          </button>

        </div>

      </div>

      {/* MODAL DETALLE DE ITEM (CANTIDAD Y NOTAS) */}
      {selectedItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scaleUp">
            
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-md">
                  {selectedItemModal.categoria}
                </span>
                <h3 className="text-xl font-black text-white mt-1">{selectedItemModal.nombre}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedItemModal.descripcion}</p>
              </div>
              <button
                onClick={() => setSelectedItemModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CONTROL DE CANTIDAD */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">Cantidad:</label>
              <div className="flex items-center space-x-4 bg-slate-950 p-2 rounded-2xl border border-slate-800 justify-center">
                <button
                  onClick={() => setModalCantidad(Math.max(1, modalCantidad - 1))}
                  className="bg-slate-800 hover:bg-slate-700 text-white w-10 h-10 rounded-xl font-bold flex items-center justify-center text-lg"
                >
                  -
                </button>
                <span className="text-2xl font-black text-amber-400 w-12 text-center">
                  {modalCantidad}
                </span>
                <button
                  onClick={() => setModalCantidad(modalCantidad + 1)}
                  className="bg-slate-800 hover:bg-slate-700 text-white w-10 h-10 rounded-xl font-bold flex items-center justify-center text-lg"
                >
                  +
                </button>
              </div>
            </div>

            {/* NOTAS ESPECÍFICAS DE ESTE PLATILLO */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Instrucciones especiales para el cocinero (opcional):
              </label>
              <textarea
                rows={2}
                placeholder="Ej: Sin cebolla, extra salsa barbacoa, bien tostado..."
                value={modalNotas}
                onChange={(e) => setModalNotas(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* ACCIONES */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setSelectedItemModal(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleAgregarAlCarrito}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-sm shadow-lg shadow-amber-500/20"
              >
                Agregar (₡{(selectedItemModal.precio * modalCantidad).toLocaleString()})
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL TICKET 55MM IMPRESIÓN */}
      {selectedTicketOrden && (
        <TicketImpresionModal
          orden={selectedTicketOrden}
          onClose={() => setSelectedTicketOrden(null)}
        />
      )}

    </div>
  );
};
