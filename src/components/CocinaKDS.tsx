import { useState, useEffect } from 'react';
import { 
  Clock, Flame, CheckCircle2, Utensils, 
  RefreshCw, Check
} from 'lucide-react';
import type { Orden, EstadoOrden } from '../types';
import { cambiarEstadoOrden } from '../lib/api';
import { soundManager } from '../lib/audio';

interface CocinaKDSProps {
  ordenes: Orden[];
  onEstadoChanged: () => void;
}

export const CocinaKDS: React.FC<CocinaKDSProps> = ({ ordenes, onEstadoChanged }) => {
  const [filtroEstado, setFiltroEstado] = useState<'activas' | 'pendiente' | 'preparando' | 'listo'>('activas');
  const [now, setNow] = useState<Date>(new Date());

  // Actualizar el reloj cada 10 segundos para calcular tiempos transcurridos
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Filtrado de comandes
  const ordenesFiltradas = ordenes.filter(o => {
    if (filtroEstado === 'activas') return o.estado !== 'entregado';
    return o.estado === filtroEstado;
  });

  // Conteo por estado
  const countPendientes = ordenes.filter(o => o.estado === 'pendiente').length;
  const countPreparando = ordenes.filter(o => o.estado === 'preparando').length;
  const countListos = ordenes.filter(o => o.estado === 'listo').length;

  // Calcular tiempo transcurrido en minutos
  const getMinutosTranscurridos = (fechaIso: string) => {
    const inicio = new Date(fechaIso).getTime();
    const difMs = now.getTime() - inicio;
    return Math.floor(difMs / (1000 * 60));
  };

  // Cambiar estado con respuesta en tiempo real
  const handleAvanzarEstado = async (ordenId: string, estadoActual: EstadoOrden) => {
    let nuevoEstado: EstadoOrden = 'preparando';
    if (estadoActual === 'pendiente') nuevoEstado = 'preparando';
    else if (estadoActual === 'preparando') nuevoEstado = 'listo';
    else if (estadoActual === 'listo') nuevoEstado = 'entregado';

    try {
      await cambiarEstadoOrden(ordenId, nuevoEstado);
      if (nuevoEstado === 'listo') {
        soundManager.playReadyOrderSound();
      }
      onEstadoChanged();
    } catch (e: any) {
      alert('Error cambiando estado: ' + e.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-950 text-slate-100 p-4 sm:p-6 flex flex-col space-y-6">
      
      {/* HEADER DE COCINA: ESTADÍSTICAS & FILTROS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/80 p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-xl">
        
        {/* TITULO */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              PANTALLA DE COCINA <span className="text-emerald-400 font-mono text-lg">(KDS)</span>
            </h2>
            <p className="text-xs text-slate-400">Comandas en tiempo real para el Chef y Cocineros</p>
          </div>
        </div>

        {/* CONTADORES & FILTROS DE ESTADO */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          
          <button
            onClick={() => setFiltroEstado('activas')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition border flex items-center space-x-2 ${
              filtroEstado === 'activas'
                ? 'bg-slate-800 text-white border-amber-500/50 shadow-md'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <span>Todas Activas</span>
            <span className="bg-slate-700 text-amber-300 text-xs px-2 py-0.5 rounded-full">
              {ordenes.filter(o => o.estado !== 'entregado').length}
            </span>
          </button>

          <button
            onClick={() => setFiltroEstado('pendiente')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition border flex items-center space-x-2 ${
              filtroEstado === 'pendiente'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <span>🟧 NUEVAS</span>
            <span className="bg-slate-950 text-amber-400 text-xs px-2 py-0.5 rounded-full font-black animate-pulse">
              {countPendientes}
            </span>
          </button>

          <button
            onClick={() => setFiltroEstado('preparando')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition border flex items-center space-x-2 ${
              filtroEstado === 'preparando'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20'
                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
            }`}
          >
            <span>🟦 EN COCINA</span>
            <span className="bg-slate-950 text-cyan-400 text-xs px-2 py-0.5 rounded-full font-black">
              {countPreparando}
            </span>
          </button>

          <button
            onClick={() => setFiltroEstado('listo')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition border flex items-center space-x-2 ${
              filtroEstado === 'listo'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            <span>🟩 LISTAS</span>
            <span className="bg-slate-950 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-black">
              {countListos}
            </span>
          </button>

          <button
            onClick={onEstadoChanged}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition active:scale-95"
            title="Refrescar Comandas"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refrescar</span>
          </button>

        </div>

      </div>

      {/* GRID DE TARJETAS DE COMANDA KDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {ordenesFiltradas.map((ord) => {
          const mins = getMinutosTranscurridos(ord.creado_en);
          
          // Codigo de color por tiempo
          let colorTiempoClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
          if (mins >= 10 && mins < 20) {
            colorTiempoClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
          } else if (mins >= 20) {
            colorTiempoClass = 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse';
          }

          // Estilo según estado
          let borderEstadoClass = 'border-amber-500/50 bg-slate-900/90';
          if (ord.estado === 'preparando') borderEstadoClass = 'border-cyan-500/60 bg-slate-900/90 shadow-lg shadow-cyan-950/30';
          if (ord.estado === 'listo') borderEstadoClass = 'border-emerald-500/70 bg-emerald-950/20 shadow-lg shadow-emerald-950/40';

          return (
            <div
              key={ord.id}
              className={`border-2 rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 ${borderEstadoClass}`}
            >
              
              {/* ENCABEZADO DE COMANDA */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">
                        {ord.tipo_pedido === 'Barra' || ord.mesa.toLowerCase().includes('barra') ? '🍺' : ord.tipo_pedido === 'Para Llevar' || ord.mesa.toLowerCase().includes('llevar') ? '📦' : '🪑'}
                      </span>
                      <h3 className="text-2xl font-black text-amber-400 tracking-wide">
                        {ord.mesa}
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-slate-400 font-bold block mt-0.5">
                      Orden #{ord.numero_orden} • <span className="text-amber-300 font-extrabold">{ord.tipo_pedido}</span>
                    </span>
                  </div>

                  {/* MINUTERO TRANS CURRIDO */}
                  <div className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center space-x-1.5 ${colorTiempoClass}`}>
                    <Clock className="w-4 h-4" />
                    <span>{mins} min</span>
                  </div>
                </div>

                {/* NOTAS GENERALES DE LA ORDEN */}
                {ord.notas && (
                  <div className="mt-3 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-xs font-bold text-amber-300">
                    ⚠️ NOTA GENERAL: "{ord.notas}"
                  </div>
                )}

                {/* DETALLE DE PLATILLOS */}
                <div className="mt-4 space-y-3">
                  {ord.items.map((it, idx) => (
                    <div key={idx} className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                      <div className="flex items-start justify-between">
                        <span className="font-extrabold text-white text-base leading-tight">
                          {it.nombre_item}
                        </span>
                        <span className="ml-2 bg-amber-500 text-slate-950 font-black text-base px-2.5 py-0.5 rounded-lg">
                          x{it.cantidad}
                        </span>
                      </div>

                      {/* NOTAS ESPECÍFICAS DE CADA PRODUCTO */}
                      {it.notas_item && (
                        <div className="mt-1 text-xs font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded">
                          📝 {it.notas_item}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* BOTÓN INTERACTIVO DE CAMBIO DE ESTADO */}
              <div className="mt-5 pt-4 border-t border-slate-800">
                {ord.estado === 'pendiente' && (
                  <button
                    onClick={() => handleAvanzarEstado(ord.id, ord.estado)}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 rounded-2xl font-black text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2"
                  >
                    <Flame className="w-4 h-4" />
                    <span>EMPEZAR A PREPARAR 👨‍🍳</span>
                  </button>
                )}

                {ord.estado === 'preparando' && (
                  <button
                    onClick={() => handleAvanzarEstado(ord.id, ord.estado)}
                    className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:brightness-110 text-slate-950 rounded-2xl font-black text-sm transition shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2 animate-pulse"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡MARCAR COMO LISTO! 🛎️</span>
                  </button>
                )}

                {ord.estado === 'listo' && (
                  <button
                    onClick={() => handleAvanzarEstado(ord.id, ord.estado)}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>ENTREGADO AL MESERO 📦</span>
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {ordenesFiltradas.length === 0 && (
        <div className="py-24 text-center text-slate-500 flex flex-col items-center justify-center bg-slate-900/40 rounded-3xl border border-slate-800">
          <Utensils className="w-16 h-16 text-slate-700 mb-3" />
          <h3 className="text-xl font-bold text-slate-300">No hay comandas activas en cocina</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            Los nuevos pedidos enviados desde la computadora de caja aparecerán aquí al instante con sonido de campana.
          </p>
        </div>
      )}

    </div>
  );
};
