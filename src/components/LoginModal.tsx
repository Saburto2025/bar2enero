import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  onSuccess: () => void;
  isKitchenOnly?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess, isKitchenOnly = false }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim().toLowerCase() === 'ribera') {
      setError(false);
      localStorage.setItem('bar2enero_auth', 'true');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900/90 border-2 border-amber-500/30 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl shadow-amber-500/10 animate-scaleUp">
        
        {/* LOGO & ENCABEZADO */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 p-0.5 shadow-xl shadow-amber-500/20 mx-auto flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-serif">
              BAR <span className="text-amber-400">2 DE ENERO</span>
            </h2>
            <p className="text-xs font-bold text-amber-300/80 mt-1 uppercase tracking-wider">
              {isKitchenOnly ? '🍳 Acceso a Pantalla de Cocina (KDS)' : '🔐 Acceso Protegido (Admin & Cocina)'}
            </p>
          </div>
        </div>

        {/* FORMULARIO DE CLAVE DE ACCESO */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-xs font-extrabold text-slate-300 block mb-2">
              Ingresa la Clave de Acceso:
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Escribe la clave de acceso..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                className={`w-full bg-slate-950 border-2 rounded-2xl pl-11 pr-11 py-3 text-base text-white placeholder-slate-600 focus:outline-none transition-all font-mono tracking-wider ${
                  error
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/50'
                    : 'border-slate-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                }`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* MENSAJE DE ERROR DE CLAVE */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Clave de acceso incorrecta. Verifique la contraseña.</span>
            </div>
          )}

          {/* BOTÓN DE INGRESAR */}
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 rounded-2xl font-black text-base shadow-xl shadow-amber-500/20 hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>INGRESAR AL SISTEMA 🔓</span>
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800">
          <p className="text-[11px] text-slate-500">
            Bar 2 de Enero • Sistema Seguro POS & KDS
          </p>
        </div>

      </div>
    </div>
  );
};
