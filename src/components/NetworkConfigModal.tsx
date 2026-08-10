import { useState } from 'react';
import { Network, Copy, Check, Globe, Laptop, UtensilsCrossed } from 'lucide-react';

export const NetworkConfigModal: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const targetUrl = 'https://bar2enero.migrantecr.org/cocina';

  const handleCopy = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      
      {/* TARJETA ENCABEZADO RED / ENLACE OFICIAL */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-6 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-4">
        
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              CONEXIÓN SISTEMA EN RED (CAJA & COCINA)
            </h2>
            <p className="text-xs text-slate-400">
              Enlace oficial de acceso directo para la pantalla de Cocina (KDS) y dispositivos del bar
            </p>
          </div>
        </div>

        {/* URL PRINCIPAL DE ACCESO */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider block mb-1">
              🌐 Enlace Web de la Pantalla de Cocina (KDS):
            </span>
            <code className="text-lg sm:text-xl font-mono font-black text-amber-300">
              {targetUrl}
            </code>
          </div>

          <button
            onClick={() => handleCopy(targetUrl, 99)}
            className="px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-cyan-500/20 shrink-0"
          >
            {copiedIndex === 99 ? (
              <>
                <Check className="w-4 h-4" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Enlace</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* GUÍA PASO A PASO CORRECTA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-sm shrink-0">
              1
            </div>
            <Globe className="w-5 h-5 text-amber-400" />
          </div>
          <h4 className="font-extrabold text-white text-base">Acceso Web Global</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Abre el navegador web (Chrome, Edge o Safari) desde la pantalla de **Cocina**, tablet o computadora conectada a internet.
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 font-black flex items-center justify-center text-sm shrink-0">
              2
            </div>
            <Laptop className="w-5 h-5 text-cyan-400" />
          </div>
          <h4 className="font-extrabold text-white text-base">Ingresar Enlace Oficial</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Escribe en la barra de navegación la dirección web oficial: <code className="text-amber-300 font-mono font-bold block mt-1">bar2enero.migrantecr.org/cocina</code>
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-sm shrink-0">
              3
            </div>
            <UtensilsCrossed className="w-5 h-5 text-emerald-400" />
          </div>
          <h4 className="font-extrabold text-white text-base">Pantalla de Cocina (KDS)</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Al cargar el enlace, la pantalla se sincronizará automáticamente para recibir todas las nuevas comandas enviadas desde Caja en tiempo real con alerta sonora 🛎️.
          </p>
        </div>

      </div>

    </div>
  );
};
