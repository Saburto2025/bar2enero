import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CajaPOS } from './components/CajaPOS';
import { CocinaKDS } from './components/CocinaKDS';
import { MenuManager } from './components/MenuManager';
import { ReportesVentas } from './components/ReportesVentas';
import { NetworkConfigModal } from './components/NetworkConfigModal';
import type { MenuItem, Orden, MesaConfig } from './types';
import { fetchMenuItems, fetchOrdenes, fetchMesas, realtimeClient } from './lib/api';
import { soundManager } from './lib/audio';

export function App() {
  const [activeTab, setActiveTab] = useState<'caja' | 'cocina' | 'menu' | 'reportes' | 'red'>('caja');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [mesas, setMesas] = useState<MesaConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos iniciales
  const loadData = useCallback(async () => {
    try {
      const [items, ords, mList] = await Promise.all([
        fetchMenuItems(),
        fetchOrdenes(),
        fetchMesas(),
      ]);
      setMenuItems(items);
      setOrdenes(ords);
      setMesas(mList);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Polling de respaldo cada 5 segundos
    const interval = setInterval(() => {
      loadData();
    }, 5000);

    // Suscribirse a eventos en tiempo real (WebSockets)
    const unsub = realtimeClient.subscribe((event) => {
      console.log('⚡ Evento en tiempo real recibido en App:', event.type);
      
      if (event.type === 'NUEVA_ORDEN') {
        soundManager.playNewOrderSound();
        if (event.orden) {
          setOrdenes((prev) => [event.orden, ...prev.filter((o) => o.id !== event.orden.id)]);
        }
        loadData();
      } else if (event.type === 'ESTADO_CAMBIADO') {
        if (event.nuevoEstado === 'listo') {
          soundManager.playReadyOrderSound();
        }
        if (event.orden) {
          setOrdenes((prev) => prev.map((o) => (o.id === event.orden.id ? event.orden : o)));
        }
        loadData();
      } else if (event.type === 'MENU_UPDATED') {
        fetchMenuItems().then(setMenuItems).catch(console.warn);
      } else if (event.type === 'MESAS_UPDATED') {
        fetchMesas().then(setMesas).catch(console.warn);
      }
    });

    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [loadData]);

  // Contadores para insignias
  const pendingKitchenCount = ordenes.filter(o => o.estado === 'pendiente' || o.estado === 'preparando').length;
  const readyOrdersCount = ordenes.filter(o => o.estado === 'listo').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold font-serif">Cargando Bar <span className="text-amber-400">2 de Enero</span>...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      
      {/* BARRA DE NAVEGACIÓN */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingKitchenCount={pendingKitchenCount}
        readyOrdersCount={readyOrdersCount}
      />

      {/* CONTENIDO PRINCIPAL SEGÚN PESTAÑA */}
      <main>
        {activeTab === 'caja' && (
          <CajaPOS
            menuItems={menuItems}
            ordenes={ordenes}
            mesas={mesas}
            onOrdenCreated={loadData}
          />
        )}

        {activeTab === 'cocina' && (
          <CocinaKDS
            ordenes={ordenes}
            onEstadoChanged={loadData}
          />
        )}

        {activeTab === 'menu' && (
          <MenuManager
            menuItems={menuItems}
            mesas={mesas}
            onMenuUpdated={loadData}
          />
        )}

        {activeTab === 'reportes' && (
          <ReportesVentas ordenes={ordenes} />
        )}

        {activeTab === 'red' && (
          <NetworkConfigModal />
        )}
      </main>

    </div>
  );
}

export default App;
