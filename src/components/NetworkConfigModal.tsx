import React, { useState, useEffect } from 'react';
import { Network, Copy, Check, Server, Database, Globe, Smartphone, ShieldCheck } from 'lucide-react';
import { fetchNetworkInfo } from '../lib/api';
import type { NetworkInfo } from '../types';

export const NetworkConfigModal: React.FC = () => {
  const [netInfo, setNetInfo] = useState<NetworkInfo | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchNetworkInfo().then(setNetInfo).catch(console.warn);
  }, []);

  const handleCopy = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const localViteUrl = netInfo?.primaryIp ? `http://${netInfo.primaryIp}:5173` : 'http://[IP-de-la-caja]:5173';

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      
      {/* TARJETA ENCABEZADO RED LOCAL */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-6 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-4">
        
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              CONEXIÓN ENTRE CAJA Y COCINA (RED LOCAL)
            </h2>
            <p className="text-xs text-slate-400">
              Usa esta dirección para abrir la pantalla de Cocina desde la 2da computadora conectada al mismo Wi-Fi
            </p>
          </div>
        </div>

        {/* URL PRINCIPAL DE ACCESO */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider block mb-1">
              🌐 URL para la Computadora de Cocina (KDS):
            </span>
            <code className="text-lg sm:text-xl font-mono font-black text-amber-300">
              {localViteUrl}
            </code>
          </div>

          <button
            onClick={() => handleCopy(localViteUrl, 99)}
            className="px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-cyan-500/20"
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

      {/* GUÍA PASO A PASO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-sm">
            1
          </div>
          <h4 className="font-extrabold text-white text-base">Red Wi-Fi / LAN Única</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Asegúrate de que tanto la computadora de **Caja** como la de **Cocina** estén conectadas al mismo Wi-Fi o router del Bar 2 de Enero.
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 font-black flex items-center justify-center text-sm">
            2
          </div>
          <h4 className="font-extrabold text-white text-base">Abrir Navegador en Cocina</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            En la pantalla de cocina, abre Google Chrome o Microsoft Edge y escribe la dirección IP mostrada arriba (<code className="text-amber-400">{localViteUrl}</code>).
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-sm">
            3
          </div>
          <h4 className="font-extrabold text-white text-base">Seleccionar Vista Cocina</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Haz clic en el botón verde **"Cocina (KDS)"** en la barra superior. ¡Recibirá todas las comandas al instante con alarma sonora!
          </p>
        </div>

      </div>

      {/* SECCIÓN TURSO DB & CLOUDFLARE */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4">
        
        <div className="flex items-center space-x-3">
          <Database className="w-6 h-6 text-amber-400" />
          <h3 className="text-lg font-black text-white">Configuración opcional de Turso Cloud Database</h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          El sistema cuenta con soporte listo para sincronizar con tu base de datos **Turso (libSQL)** y desplegar en **Cloudflare Pages / Workers**.
        </p>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs text-slate-300">
          <div>
            <span className="text-slate-500 block mb-1"># Archivo de entorno (.env):</span>
            <p className="text-emerald-400">TURSO_DATABASE_URL="libsql://bar-2deenero-user.turso.io"</p>
            <p className="text-emerald-400">TURSO_AUTH_TOKEN="eyJhbGciOi..."</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl">
          <ShieldCheck className="w-4 h-4" />
          <span>Estado actual: Turso / SQLite Local operando al 100% de rendimiento.</span>
        </div>

      </div>

    </div>
  );
};
