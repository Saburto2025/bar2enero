import { useState, useMemo } from 'react';
import { 
  FileText, Download, Calendar, ShoppingBag, 
  TrendingUp, Award 
} from 'lucide-react';
import type { Orden } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportesVentasProps {
  ordenes: Orden[];
}

export const ReportesVentas: React.FC<ReportesVentasProps> = ({ ordenes }) => {
  // Fecha inicio por defecto: hace 7 días, Fecha fin: hoy
  const hoyStr = new Date().toISOString().split('T')[0];
  const hace7diasStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [fechaInicio, setFechaInicio] = useState(hace7diasStr);
  const [fechaFin, setFechaFin] = useState(hoyStr);

  // Acciones rápidas de fecha
  const setRangoHoy = () => {
    setFechaInicio(hoyStr);
    setFechaFin(hoyStr);
  };

  const setRangoAyer = () => {
    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setFechaInicio(ayer);
    setFechaFin(ayer);
  };

  const setRangoEsteMes = () => {
    const d = new Date();
    const inicioMes = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    setFechaInicio(inicioMes);
    setFechaFin(hoyStr);
  };

  const setRangoTodas = () => {
    setFechaInicio('');
    setFechaFin('');
  };

  // Filtrar órdenes por fecha
  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter(o => {
      if (!fechaInicio && !fechaFin) return true;
      const fOrden = o.creado_en.split('T')[0];
      if (fechaInicio && fOrden < fechaInicio) return false;
      if (fechaFin && fOrden > fechaFin) return false;
      return true;
    });
  }, [ordenes, fechaInicio, fechaFin]);

  // Cálculos estadísticos
  const totalVentas = ordenesFiltradas.reduce((sum, o) => sum + o.total, 0);
  const totalComandas = ordenesFiltradas.length;
  const promedioPorComanda = totalComandas > 0 ? Math.round(totalVentas / totalComandas) : 0;

  // Desglose por platillo
  const conteoPlatillos = useMemo(() => {
    const map = new Map<string, { nombre: string; cantidad: number; ingresos: number }>();
    ordenesFiltradas.forEach(o => {
      o.items.forEach(it => {
        const key = it.nombre_item;
        const actual = map.get(key) || { nombre: key, cantidad: 0, ingresos: 0 };
        actual.cantidad += it.cantidad;
        actual.ingresos += it.cantidad * it.precio_unitario;
        map.set(key, actual);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.cantidad - a.cantidad);
  }, [ordenesFiltradas]);

  // Generación de PDF oficial
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Encabezado institucional
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 32, 'F');

    doc.setTextColor(245, 158, 11); // amber-500
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('BAR 2 DE ENERO', 14, 15);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('REPORTE OFICIAL DE VENTAS Y FACTURACIÓN', 14, 22);

    doc.setFontSize(8);
    doc.text('Propietario: Danny José Fernández Alvarado | Cédula: 1-11680291 | bar2enerobelen@gmail.com', 14, 27);

    // Información del rango seleccionado
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('1. RESUMEN DEL PERÍODO SELECCIONADO', 14, 40);

    const rangoTexto = fechaInicio && fechaFin 
      ? `Del ${fechaInicio} al ${fechaFin}` 
      : 'Histórico Completo de Ventas';

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Rango de fechas: ${rangoTexto}`, 14, 47);
    doc.text(`• Total Facturado: C${totalVentas.toLocaleString('es-CR')}`, 14, 53);
    doc.text(`• Total de Órdenes / Recibos: ${totalComandas}`, 14, 59);
    doc.text(`• Promedio por Comanda: C${promedioPorComanda.toLocaleString('es-CR')}`, 14, 65);

    // Tabla Resumen de Métricas de Productos
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('2. PLATILLOS Y BEBIDAS MÁS VENDIDOS', 14, 76);

    const topPlatillosData = conteoPlatillos.slice(0, 10).map((p, idx) => [
      `#${idx + 1}`,
      p.nombre,
      `${p.cantidad} und.`,
      `C${p.ingresos.toLocaleString('es-CR')}`
    ]);

    autoTable(doc, {
      startY: 80,
      head: [['Rank', 'Producto / Bebida', 'Cantidad Vendida', 'Ingresos Generated']],
      body: topPlatillosData,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11], textColor: [15, 23, 42], fontStyle: 'bold' },
      styles: { fontSize: 9 }
    });

    // Tabla de Detalle de Órdenes
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('3. DESGLOSE INDIVIDUAL DE RECIBOS Y VENTAS', 14, finalY);

    const ordenesData = ordenesFiltradas.map(o => [
      `#${o.numero_orden}`,
      new Date(o.creado_en).toLocaleString('es-CR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
      o.mesa,
      o.tipo_pedido,
      o.estado.toUpperCase(),
      `C${o.total.toLocaleString('es-CR')}`
    ]);

    autoTable(doc, {
      startY: finalY + 4,
      head: [['N° Recibo', 'Fecha / Hora', 'Ubicación', 'Tipo', 'Estado', 'Monto Total']],
      body: ordenesData,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5 }
    });

    // Pie de página
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generado el ${new Date().toLocaleString('es-CR')} — Bar 2 de Enero System — Página ${i} de ${totalPages}`, 14, 287);
    }

    doc.save(`Reporte_Ventas_Bar2deEnero_${fechaInicio || 'inicio'}_a_${fechaFin || 'fin'}.pdf`);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-6">
      
      {/* ENCABEZADO Y ACCIÓN DE EXPORTACIÓN */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            REPORTES Y CONTROL DE VENTAS <span className="text-amber-400 font-mono text-sm">(Bar 2 de Enero)</span>
          </h2>
          <p className="text-xs text-slate-400">Consulta los ingresos por fechas, analiza tus platillos más vendidos y exporta reportes en PDF</p>
        </div>

        <button
          onClick={handleExportPDF}
          disabled={ordenesFiltradas.length === 0}
          className={`px-6 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 shadow-lg transition-all ${
            ordenesFiltradas.length === 0
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 shadow-amber-500/20 active:scale-95'
          }`}
        >
          <Download className="w-5 h-5" />
          <span>EXPORTAR REPORTE PDF</span>
        </button>
      </div>

      {/* BARRA DE FILTROS DE FECHAS */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-lg">
        <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
          <Calendar className="w-4 h-4" />
          <span>FILTRAR VENTA POR PERÍODO DE FECHAS:</span>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* INPUTS DE FECHA INICIO Y FIN */}
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
            <div className="w-full sm:w-auto flex-1">
              <label className="text-xs font-bold text-slate-400 block mb-1">Fecha Inicial:</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="hidden sm:block text-slate-500 font-bold mt-5">➔</div>

            <div className="w-full sm:w-auto flex-1">
              <label className="text-xs font-bold text-slate-400 block mb-1">Fecha Final:</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* BOTONES DE SELECCIÓN RÁPIDA */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={setRangoHoy}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs border border-slate-700 transition"
            >
              Hoy
            </button>
            <button
              onClick={setRangoAyer}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs border border-slate-700 transition"
            >
              Ayer
            </button>
            <button
              onClick={setRangoEsteMes}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs border border-slate-700 transition"
            >
              Este Mes
            </button>
            <button
              onClick={setRangoTodas}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl font-bold text-xs border border-slate-700 transition"
            >
              Todo
            </button>
          </div>

        </div>
      </div>

      {/* TARJETAS DE MÉTRICAS CLAVE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* TOTAL VENTAS */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-amber-500/30 p-5 rounded-3xl space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Ingresos Totales</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              ₡
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            ₡{totalVentas.toLocaleString('es-CR')}
          </div>
          <p className="text-xs text-amber-400 font-medium">Facturado en el período seleccionado</p>
        </div>

        {/* CANTIDAD COMANDAS */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-cyan-500/30 p-5 rounded-3xl space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total de Recibos</span>
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {totalComandas} <span className="text-sm font-normal text-slate-400">órdenes</span>
          </div>
          <p className="text-xs text-cyan-400 font-medium">Comandas registradas en caja</p>
        </div>

        {/* PROMEDIO VENTA */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-emerald-500/30 p-5 rounded-3xl space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Ticket Promedio</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            ₡{promedioPorComanda.toLocaleString('es-CR')}
          </div>
          <p className="text-xs text-emerald-400 font-medium">Promedio de consumo por cliente/mesa</p>
        </div>

      </div>

      {/* TOP PLATILLOS Y VISTA TABULAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RANKING TOP PRODUCTOS VENDIDOS (1 COLUMNA) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <h3 className="font-extrabold text-white text-base flex items-center gap-2 pb-3 border-b border-slate-800">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Productos más Vendidos</span>
          </h3>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {conteoPlatillos.slice(0, 8).map((p, idx) => (
              <div key={p.nombre} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black font-mono ${
                    idx === 0 ? 'bg-amber-500 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-extrabold text-white text-xs">{p.nombre}</h4>
                    <span className="text-[11px] text-amber-400 font-mono font-bold">₡{p.ingresos.toLocaleString('es-CR')}</span>
                  </div>
                </div>

                <span className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-xl font-mono font-black">
                  {p.cantidad} unds
                </span>
              </div>
            ))}

            {conteoPlatillos.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-8">No hay datos de productos en este rango de fechas.</p>
            )}
          </div>
        </div>

        {/* TABLA DE RECIBOS INDIVIDUALES (2 COLUMNAS) */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <h3 className="font-extrabold text-white text-base flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>Listado de Recibos y Comandas</span>
            </div>
            <span className="text-xs font-mono bg-slate-800 text-amber-300 px-2.5 py-1 rounded-full font-bold">
              {ordenesFiltradas.length} recibos
            </span>
          </h3>

          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold sticky top-0">
                <tr>
                  <th className="p-3">Recibo</th>
                  <th className="p-3">Fecha / Hora</th>
                  <th className="p-3">Ubicación</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Monto Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {ordenesFiltradas.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-950/50 transition">
                    <td className="p-3 font-bold text-amber-400">#{ord.numero_orden}</td>
                    <td className="p-3 text-slate-300">
                      {new Date(ord.creado_en).toLocaleString('es-CR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 font-bold text-white">{ord.mesa}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                        ord.estado === 'entregado' ? 'bg-emerald-500/20 text-emerald-300' :
                        ord.estado === 'listo' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {ord.estado}
                      </span>
                    </td>
                    <td className="p-3 text-right font-black text-white text-sm">
                      ₡{ord.total.toLocaleString('es-CR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {ordenesFiltradas.length === 0 && (
              <div className="py-12 text-center text-slate-500">
                No hay ventas registradas en el período seleccionado.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
