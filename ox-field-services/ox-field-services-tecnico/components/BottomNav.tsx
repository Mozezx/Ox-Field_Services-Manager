import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 z-40 w-full bg-[#0B242A]/95 backdrop-blur-lg border-t border-white/10 pb-6 pt-3 px-6">
      <ul className="flex justify-between items-center max-w-md mx-auto">
        <li>
          <button
            onClick={() => navigate('/agenda')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('/agenda') ? 'text-accent' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className={`material-symbols-outlined ${isActive('/agenda') ? 'filled' : ''}`}>
              calendar_today
            </span>
            <span className="text-[10px] font-medium">Agenda</span>
          </button>
        </li>
        <li>
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('/dashboard') ? 'text-accent' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className={`material-symbols-outlined ${isActive('/dashboard') ? 'filled' : ''}`}>
              bar_chart
            </span>
            <span className="text-[10px] font-medium">Stats</span>
          </button>
        </li>
         <li>
          <div className="relative -top-5">
             <button
              onClick={() => navigate('/map')}
              className={`flex flex-col items-center gap-1 transition-colors ${isActive('/map') ? 'text-accent' : 'text-slate-400 hover:text-white'}`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-[#0B242A] shadow-[0_4px_14px_0_rgba(19,236,91,0.4)] hover:scale-105 transition-all">
                <span className="material-symbols-outlined text-3xl">map</span>
              </div>
              <span className="text-[10px] font-medium -mt-1">Mapa</span>
            </button>
          </div>
        </li>
        <li>
          <button
            onClick={() => navigate('/history')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('/history') ? 'text-accent' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className={`material-symbols-outlined ${isActive('/history') ? 'filled' : ''}`}>
              history
            </span>
            <span className="text-[10px] font-medium">History</span>
          </button>
        </li>
        <li>
          <button
            onClick={() => navigate('/profile')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('/profile') ? 'text-accent' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className={`material-symbols-outlined ${isActive('/profile') ? 'filled' : ''}`}>
              person
            </span>
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </li>
      </ul>
    </nav>
  );
};
