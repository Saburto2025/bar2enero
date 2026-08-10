import React, { useState } from 'react';
import { 
  Plus, Edit2, X, Eye, EyeOff, Utensils, Image as ImageIcon, 
  Trash2, Layers, Camera, CheckCircle
} from 'lucide-react';
import type { MenuItem, CategoriaMenu, MesaConfig } from '../types';
import { saveMenuItem, toggleMenuItemDisponible, deleteMenuItem, saveMesa, deleteMesa } from '../lib/api';

interface MenuManagerProps {
  menuItems: MenuItem[];
  mesas?: MesaConfig[];
  onMenuUpdated: () => void;
}

export const MenuManager: React.FC<MenuManagerProps> = ({ menuItems, mesas = [], onMenuUpdated }) => {
  const [activeSubTab, setActiveSubTab] = useState<'platillos' | 'mesas' | 'fotos'>('platillos');
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Estado para formulario de nueva Mesa / Barra
  const [nuevoNombreMesa, setNuevoNombreMesa] = useState('');
  const [nuevoTipoMesa, setNuevoTipoMesa] = useState<'Mesa' | 'Barra' | 'Para Llevar' | 'Otro'>('Mesa');
  const [isSavingMesa, setIsSavingMesa] = useState(false);

  const categorias: CategoriaMenu[] = [
    'Bocas', 'Platos Fuertes', 'Entradas', 'Cervezas', 'Cocteles', 'Bebidas', 'Postres'
  ];

  const handleOpenNew = () => {
    setEditingItem({
      nombre: '',
      categoria: 'Bocas',
      precio: 3000,
      descripcion: '',
      icono: '🍽️',
      imagen_url: '',
      disponible: true
    });
    setIsNew(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem({ ...item });
    setIsNew(false);
  };

  const handleToggleDisponible = async (item: MenuItem) => {
    try {
      await toggleMenuItemDisponible(item.id, !item.disponible);
      onMenuUpdated();
    } catch (e: any) {
      alert('Error cambiando disponibilidad: ' + e.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.nombre) return;

    try {
      await saveMenuItem(editingItem);
      setEditingItem(null);
      onMenuUpdated();
    } catch (err: any) {
      alert('Error guardando platillo: ' + err.message);
    }
  };

  const handleDeleteMenuItem = async (item: MenuItem) => {
    if (!confirm(`¿Estás seguro de eliminar '${item.nombre}' del menú?`)) return;
    try {
      await deleteMenuItem(item.id);
      onMenuUpdated();
    } catch (err: any) {
      alert('Error eliminando platillo: ' + err.message);
    }
  };

  // Agregar Mesa o Barra
  const handleAddMesa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombreMesa.trim()) return;

    setIsSavingMesa(true);
    try {
      await saveMesa({
        nombre: nuevoNombreMesa.trim(),
        tipo: nuevoTipoMesa
      });
      setNuevoNombreMesa('');
      onMenuUpdated();
    } catch (err: any) {
      alert('Error guardando mesa: ' + err.message);
    } finally {
      setIsSavingMesa(false);
    }
  };

  // Eliminar Mesa o Barra
  const handleDeleteMesa = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar '${nombre}'?`)) return;
    try {
      await deleteMesa(id);
      onMenuUpdated();
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const mesasSolo = mesas.filter(m => m.tipo === 'Mesa');
  const barrasSolo = mesas.filter(m => m.tipo === 'Barra');
  const otrosSolo = mesas.filter(m => m.tipo !== 'Mesa' && m.tipo !== 'Barra');

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-6">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            ADMINISTRACIÓN DEL SISTEMA <span className="text-amber-400 font-mono text-sm">(Bar 2 de Enero)</span>
          </h2>
          <p className="text-xs text-slate-400">Gestiona platillos, configuración de mesas/barras y especificaciones visuales</p>
        </div>

        {/* SELECTOR DE PESTAÑAS DE ADMINISTRACIÓN */}
        <div className="flex items-center space-x-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('platillos')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 ${
              activeSubTab === 'platillos'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Platillos ({menuItems.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('mesas')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 ${
              activeSubTab === 'mesas'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Mesas y Barras ({mesas.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('fotos')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 ${
              activeSubTab === 'fotos'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Medidas de Fotos</span>
          </button>
        </div>
      </div>

      {/* VISTA 1: PLATILLOS DEL MENÚ */}
      {activeSubTab === 'platillos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleOpenNew}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 rounded-xl font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-5 h-5" />
              <span>AÑADIR PLATILLO O BEBIDA</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className={`bg-slate-900/70 border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                  item.disponible ? 'border-slate-800' : 'border-rose-900/50 bg-rose-950/10 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-lg">
                      {item.categoria}
                    </span>

                    <button
                      onClick={() => handleToggleDisponible(item)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center space-x-1 border ${
                        item.disponible
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                      title="Clic para cambiar disponibilidad"
                    >
                      {item.disponible ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Disponible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Agotado</span>
                        </>
                      )}
                    </button>
                  </div>

                  <h4 className="font-extrabold text-white text-base mt-1">{item.nombre}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.descripcion}</p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
                  <span className="text-lg font-black text-amber-400">
                    ₡{item.precio.toLocaleString()}
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-xl border border-slate-700 transition"
                      title="Editar Producto"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMenuItem(item)}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 p-2 rounded-xl border border-rose-500/30 transition"
                      title="Eliminar Producto del Menú"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA 2: GESTIÓN DE MESAS Y BARRAS */}
      {activeSubTab === 'mesas' && (
        <div className="space-y-6">
          
          {/* FORMULARIO AGREGAR NUEVA MESA O BARRA */}
          <form 
            onSubmit={handleAddMesa} 
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row items-stretch sm:items-end gap-4 shadow-xl"
          >
            <div className="flex-1">
              <label className="text-xs font-bold text-amber-400 block mb-1">Nombre o Número de Mesa / Barra:</label>
              <input
                type="text"
                required
                placeholder="Ejemplo: Mesa 16, Barra 4, VIP Terraza..."
                value={nuevoNombreMesa}
                onChange={(e) => setNuevoNombreMesa(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="w-full sm:w-48">
              <label className="text-xs font-bold text-amber-400 block mb-1">Tipo de Área:</label>
              <select
                value={nuevoTipoMesa}
                onChange={(e) => setNuevoTipoMesa(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:border-amber-400"
              >
                <option value="Mesa">🪑 Mesa</option>
                <option value="Barra">🍺 Barra</option>
                <option value="Para Llevar">📦 Para Llevar</option>
                <option value="Otro">📍 Otro</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSavingMesa}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-5 h-5" />
              <span>AGREGAR PUNTO</span>
            </button>
          </form>

          {/* LISTADO DE MESAS DISPONIBLES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* SECCIÓN MESAS */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <span>🪑 Mesas</span>
                  <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                    {mesasSolo.length}
                  </span>
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2.5 max-h-[400px] overflow-y-auto pr-1">
                {mesasSolo.map(m => (
                  <div key={m.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between group">
                    <span className="font-bold text-sm text-slate-200">{m.nombre}</span>
                    <button
                      onClick={() => handleDeleteMesa(m.id, m.nombre)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition"
                      title="Eliminar Mesa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* SECCIÓN BARRAS */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <span>🍺 Barras</span>
                  <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-mono">
                    {barrasSolo.length}
                  </span>
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2.5 max-h-[400px] overflow-y-auto pr-1">
                {barrasSolo.map(m => (
                  <div key={m.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between group">
                    <span className="font-bold text-sm text-cyan-300">{m.nombre}</span>
                    <button
                      onClick={() => handleDeleteMesa(m.id, m.nombre)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition"
                      title="Eliminar Barra"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* SECCIÓN OTROS / PARA LLEVAR */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <span>📦 Para Llevar / Otros</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                    {otrosSolo.length}
                  </span>
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2.5 max-h-[400px] overflow-y-auto pr-1">
                {otrosSolo.map(m => (
                  <div key={m.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between group">
                    <span className="font-bold text-sm text-emerald-300">{m.nombre}</span>
                    <button
                      onClick={() => handleDeleteMesa(m.id, m.nombre)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition"
                      title="Eliminar Registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* VISTA 3: GUÍA DE MEDIDAS DE FOTOS DEL MENÚ */}
      {activeSubTab === 'fotos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div>
            <h3 className="text-xl font-black text-amber-400 flex items-center gap-2">
              <ImageIcon className="w-6 h-6" />
              GUÍA DE DIMENSIONES Y PESO RECOMENDADO PARA FOTOGRAFÍAS
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Sigue estas recomendaciones para que el menú visual de la Caja se cargue rápido y se vea nítido en cualquier pantalla.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/30 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold font-mono">
                4:3
              </div>
              <h4 className="font-extrabold text-white text-base">Tarjetas del Menú (Recomendado)</h4>
              <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
                <li>• **Dimensión:** <span className="text-amber-400 font-bold">800 x 600 px</span></li>
                <li>• **Relación de aspecto:** 4:3</li>
                <li>• **Peso ideal:** Menos de 300 KB</li>
                <li>• **Formato:** WebP o JPG</li>
              </ul>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-cyan-500/30 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold font-mono">
                1:1
              </div>
              <h4 className="font-extrabold text-white text-base">Formato Cuadrado (Instagram/Redes)</h4>
              <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
                <li>• **Dimensión:** <span className="text-cyan-400 font-bold">600 x 600 px</span></li>
                <li>• **Relación de aspecto:** 1:1</li>
                <li>• **Peso ideal:** Menos de 250 KB</li>
                <li>• **Formato:** WebP o JPG</li>
              </ul>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/30 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold font-mono">
                HD
              </div>
              <h4 className="font-extrabold text-white text-base">Alta Definición (Pantallas Grandes)</h4>
              <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
                <li>• **Dimensión:** <span className="text-emerald-400 font-bold">1200 x 900 px</span></li>
                <li>• **Relación de aspecto:** 4:3</li>
                <li>• **Peso ideal:** Menos de 500 KB</li>
                <li>• **Formato:** WebP o JPG</li>
              </ul>
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2">
            <h5 className="font-extrabold text-white flex items-center gap-1.5 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Consejos de fotografía para Bar 2 de Enero:
            </h5>
            <p>1. Centra el platillo o copa dejando un pequeño margen alrededor para que no se corte al recortarse en dispositivos móviles.</p>
            <p>2. Utiliza imágenes en formato <strong>WebP</strong> para lograr una velocidad de carga hasta 3x más rápida en la red WiFi local.</p>
          </div>

        </div>
      )}

      {/* MODAL CREAR / EDITAR PLATILLO */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleSave}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scaleUp"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xl font-black text-white">
                {isNew ? 'Añadir Nuevo Producto' : 'Editar Producto'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Nombre del Platillo / Bebida:</label>
              <input
                type="text"
                required
                value={editingItem.nombre || ''}
                onChange={(e) => setEditingItem({ ...editingItem, nombre: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Categoría:</label>
                <select
                  value={editingItem.categoria || 'Bocas'}
                  onChange={(e) => setEditingItem({ ...editingItem, categoria: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-amber-400 font-bold focus:outline-none focus:border-amber-400"
                >
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Precio (₡ Colones):</label>
                <input
                  type="number"
                  required
                  step="100"
                  value={editingItem.precio || 0}
                  onChange={(e) => setEditingItem({ ...editingItem, precio: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Descripción / Ingredientes:</label>
              <textarea
                rows={2}
                value={editingItem.descripcion || ''}
                onChange={(e) => setEditingItem({ ...editingItem, descripcion: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">URL de Imagen (Opcional - Recomendado 800x600 px):</label>
              <input
                type="url"
                placeholder="https://..."
                value={editingItem.imagen_url || ''}
                onChange={(e) => setEditingItem({ ...editingItem, imagen_url: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-sm shadow-lg shadow-amber-500/20"
              >
                Guardar Cambios
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
};
