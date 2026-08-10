import { useState, useEffect } from 'react';
import { ShoppingCart, UtensilsCrossed, Wifi, WifiOff, Volume2, VolumeX, Menu, Network, Sparkles, FileText } from 'lucide-react';
import { soundManager } from '../lib/audio';
import { realtimeClient } from '../lib/api';

interface NavbarProps {
  activeTab: 'caja' | 'cocina' | 'menu' | 'reportes' | 'red';
  setActiveTab: (tab: 'caja' | 'cocina' | 'menu' | 'reportes' | 'red') => void;
  pendingKitchenCount: number;
  readyOrdersCount: number;
  isKitchenOnly?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingKitchenCount,
  readyOrdersCount,
  isKitchenOnly = false,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  useEffect(() => {
    const unsub = realtimeClient.subscribeStatus((connected) => {
      setIsConnected(connected);
    });

    return unsub;
  }, []);

  const handleToggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-amber-500/20 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* LOGO & BRANDING */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => !isKitchenOnly && setActiveTab('caja')}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="text-amber-400 font-extrabold text-xl tracking-wider">2E</span>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-serif">
                  BAR <span className="text-amber-400">2 DE ENERO</span>
                </h1>
                {isKitchenOnly ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <UtensilsCrossed className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> PANTALLA DE COCINA (KDS)
                  </span>
                ) : (
                  <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <Sparkles className="w-3 h-3 mr-1" /> POS & KDS
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {isKitchenOnly ? 'Vista Exclusiva para Cocineros' : 'Sistema Integrado Caja ⟷ Cocina'}
              </p>
            </div>
          </div>

          {/* VISTAS PRINCIPALES (SOLO SI NO ES MODO COCINA EXCLUSIVO) */}
          {!isKitchenOnly && (
            <nav className="flex items-center space-x-1 sm:space-x-2">
              
              {/* BOTÓN CAJA / MESERO */}
              <button
                onClick={() => setActiveTab('caja')}
                className={`relative px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === 'caja'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-700/50'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Caja / Mesero</span>
                {readyOrdersCount > 0 && (
                  <span className="ml-1 bg-emerald-500 text-slate-950 text-xs px-2 py-0.5 rounded-full font-black animate-pulse">
                    {readyOrdersCount} Listo!
                  </span>
                )}
              </button>

              {/* BOTÓN PANTALLA COCINA (KDS) */}
              <button
                onClick={() => setActiveTab('cocina')}
                className={`relative px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === 'cocina'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-700/50'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span className="hidden sm:inline">Cocina (KDS)</span>
                {pendingKitchenCount > 0 && (
                  <span className="ml-1 bg-amber-500 text-slate-950 text-xs px-2 py-0.5 rounded-full font-black animate-bounce">
                    {pendingKitchenCount}
                  </span>
                )}
              </button>

              {/* GESTIÓN MENÚ */}
              <button
                onClick={() => setActiveTab('menu')}
                className={`px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center space-x-1.5 ${
                  activeTab === 'menu'
                    ? 'bg-slate-800 text-amber-400 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
                title="Administrar carta y precios"
              >
                <Menu className="w-4 h-4" />
                <span className="hidden lg:inline">Menú & Precios</span>
              </button>

              {/* REPORTES DE VENTAS */}
              <button
                onClick={() => setActiveTab('reportes')}
                className={`px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center space-x-1.5 ${
                  activeTab === 'reportes'
                    ? 'bg-slate-800 text-amber-400 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
                title="Ver ventas y exportar PDF por fechas"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden lg:inline">Ventas (PDF)</span>
              </button>

              {/* CONEXIÓN DE RED */}
              <button
                onClick={() => setActiveTab('red')}
                className={`px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center space-x-1.5 ${
                  activeTab === 'red'
                    ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
                title="Ver enlace de conexión"
              >
                <Network className="w-4 h-4" />
                <span className="hidden lg:inline">Red / IP</span>
              </button>
            </nav>
          )}

          {/* ESTADOS DE RED & AUDIO */}
          <div className="flex items-center space-x-3">
            
            {/* BOTÓN SILENCIAR AUDIO */}
            <button
              onClick={handleToggleSound}
              className={`p-2.5 rounded-xl transition-all ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-slate-800 text-amber-400 border border-slate-700/60 hover:bg-slate-700'
              }`}
              title={isMuted ? 'Audio silenciado (Clic para activar)' : 'Audio activado'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* BADGE CONEXIÓN EN TIEMPO REAL */}
            <div
              onClick={() => setActiveTab('red')}
              className={`cursor-pointer px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-2 border transition-all ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
              }`}
            >
              {isConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <Wifi className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">En Línea</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Desconectado</span>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
