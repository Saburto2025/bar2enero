import React from 'react';
import { Printer, X, Check } from 'lucide-react';
import type { Orden } from '../types';

interface TicketImpresionModalProps {
  orden: Orden;
  onClose: () => void;
}

export const TicketImpresionModal: React.FC<TicketImpresionModalProps> = ({ orden, onClose }) => {

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      alert('Por favor permite ventanas emergentes (popups) para imprimir el ticket.');
      return;
    }

    const itemsHtml = orden.items.map(it => `
      <tr>
        <td style="text-align: left; padding: 2px 0;">${it.cantidad}x ${it.nombre_item}${it.notas_item ? `<br><small style="font-size: 9px;">* ${it.notas_item}</small>` : ''}</td>
        <td style="text-align: right; padding: 2px 0; vertical-align: top;">&#8353;${(it.precio_unitario * it.cantidad).toLocaleString()}</td>
      </tr>
    `).join('');

    const fechaFormateada = new Date(orden.creado_en).toLocaleString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const ticketHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recibo Bar 2 de Enero - Orden #${orden.numero_orden}</title>
        <style>
          @page {
            size: 58mm auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 55mm;
            margin: 0 auto;
            padding: 4mm 2mm;
            font-size: 11px;
            color: #000;
            background: #fff;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-bottom: 1px dashed #000; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin: 5px 0; font-size: 11px; }
          .total-box {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 4px 0;
            margin-top: 5px;
            font-size: 13px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 15px;">BAR 2 DE ENERO</div>
        <div class="center" style="font-size: 10px; margin-top: 2px;">Propietario: Danny José Fernández A.</div>
        <div class="center" style="font-size: 10px;">Cédula: 1-11680291</div>
        <div class="center" style="font-size: 9px;">bar2enerobelen@gmail.com</div>
        <div class="center" style="font-size: 9px; margin-top: 2px;">Belén, Heredia, Costa Rica</div>
        
        <div class="line"></div>

        <div><span class="bold">RECIBO DE VENTA:</span> #${orden.numero_orden}</div>
        <div><span class="bold">REF:</span> ${orden.id}</div>
        <div><span class="bold">FECHA:</span> ${fechaFormateada}</div>
        <div><span class="bold">UBICACIÓN:</span> ${orden.mesa} (${orden.tipo_pedido})</div>

        <div class="line"></div>

        <table>
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="text-align: left;">CANT/DETALLE</th>
              <th style="text-align: right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        ${orden.notas ? `<div style="font-size: 10px; margin-top: 3px;"><strong>NOTAS:</strong> ${orden.notas}</div>` : ''}

        <div class="total-box">
          <div style="display: flex; justify-content: space-between;">
            <span>TOTAL PAGADO:</span>
            <span>&#8353;${orden.total.toLocaleString()}</span>
          </div>
        </div>

        <div class="center" style="margin-top: 12px; font-size: 10px;">
          ¡Gracias por su visita al<br><strong>Bar 2 de Enero</strong>! 🍻
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(ticketHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  const fechaFormateada = new Date(orden.creado_en).toLocaleString('es-CR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-scaleUp">
        
        {/* ENCABEZADO MODAL */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <h3 className="font-black text-white text-base">Vista Previa Recibo (55mm)</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENEDOR TICKET 55MM SIMULADO */}
        <div className="bg-white text-black p-4 rounded-xl font-mono text-xs space-y-2 shadow-inner border border-slate-300 max-h-[380px] overflow-y-auto">
          
          <div className="text-center font-extrabold text-sm tracking-wider">BAR 2 DE ENERO</div>
          <div className="text-center text-[10px] leading-tight">Propietario: Danny José Fernández A.</div>
          <div className="text-center text-[10px]">Cédula: 1-11680291</div>
          <div className="text-center text-[9px] text-slate-700">bar2enerobelen@gmail.com</div>

          <div className="border-b border-dashed border-black my-2"></div>

          <div><strong>RECIBO N°:</strong> #{orden.numero_orden}</div>
          <div><strong>FECHA:</strong> {fechaFormateada}</div>
          <div><strong>UBICACIÓN:</strong> {orden.mesa} ({orden.tipo_pedido})</div>

          <div className="border-b border-dashed border-black my-2"></div>

          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-black text-left">
                <th>CANT/DESCRIPCIÓN</th>
                <th className="text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {orden.items.map((it, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="py-1">
                    {it.cantidad}x {it.nombre_item}
                    {it.notas_item && <div className="text-[9px] text-slate-600 font-sans">* {it.notas_item}</div>}
                  </td>
                  <td className="text-right py-1 font-bold">₡{(it.precio_unitario * it.cantidad).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {orden.notas && (
            <div className="text-[10px] bg-slate-100 p-1.5 rounded mt-1">
              <strong>Nota:</strong> {orden.notas}
            </div>
          )}

          <div className="border-t-2 border-b-2 border-dashed border-black py-1.5 my-2 font-bold text-sm flex justify-between">
            <span>TOTAL PAGADO:</span>
            <span>₡{orden.total.toLocaleString()}</span>
          </div>

          <div className="text-center text-[10px] mt-2 font-sans font-bold text-slate-800">
            ¡Gracias por su visita al Bar 2 de Enero! 🍻
          </div>

        </div>

        {/* ACCIONES */}
        <div className="flex items-center space-x-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
          >
            Cerrar
          </button>
          
          <button
            onClick={handlePrint}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>IMPRIMIR 55MM</span>
          </button>
        </div>

      </div>
    </div>
  );
};
