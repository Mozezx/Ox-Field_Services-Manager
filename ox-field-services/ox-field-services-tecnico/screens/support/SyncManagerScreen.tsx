import React from 'react';
import { useNavigate } from 'react-router-dom';

export const SyncManagerScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col text-white font-display">
      <header className="flex items-center px-4 py-3 justify-between bg-bg-dark border-b border-white/5 sticky top-0 z-20">
         <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
         </button>
         <h2 className="text-lg font-bold">Data Sync Manager</h2>
         <div className="size-10"></div>
      </header>

      <div className="flex-1 overflow-y-auto pb-6">
         <div className="flex flex-col items-center pt-8 pb-4">
            <div className="flex items-center gap-2 mb-1 px-4 py-1.5 rounded-full bg-surface-dark border border-slate-700">
               <div className="size-2.5 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_#13ec5b]"></div>
               <h2 className="text-sm font-bold tracking-wide uppercase">Connected - LTE</h2>
            </div>
            <p className="text-slate-400 text-xs mt-2">Last synced: Today, 10:42 AM</p>
         </div>

         <div className="px-6 py-6 flex justify-center relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-secondary/20 blur-[50px] rounded-full pointer-events-none"></div>
            <button className="relative group flex flex-col items-center justify-center w-56 h-56 rounded-full bg-bg-dark border-[6px] border-slate-700 shadow-2xl active:scale-95 transition-all">
               <div className="absolute inset-2 rounded-full border border-dashed border-white/20"></div>
               <span className="material-symbols-outlined text-secondary text-6xl mb-3 group-hover:rotate-180 transition-transform duration-700">sync</span>
               <span className="text-2xl font-bold tracking-wider">SYNC NOW</span>
               <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded bg-surface-dark/50">
                  <span className="material-symbols-outlined text-secondary text-sm">bolt</span>
                  <span className="text-secondary text-[10px] font-bold uppercase tracking-widest">Ready</span>
               </div>
            </button>
         </div>

         <div className="px-4 pb-6">
            <div className="grid grid-cols-2 gap-3">
               <div className="flex flex-col justify-center gap-1 rounded-xl border border-slate-700 bg-surface-dark p-4 items-center text-center">
                  <p className="text-3xl font-bold font-mono">15</p>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Items Pending</p>
               </div>
               <div className="flex flex-col justify-center gap-1 rounded-xl border border-slate-700 bg-surface-dark p-4 items-center text-center">
                  <p className="text-3xl font-bold font-mono">45<span className="text-base ml-1 text-slate-400">MB</span></p>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Size</p>
               </div>
            </div>
         </div>

         <div className="px-4 pb-8">
            <div className="flex items-center gap-4 rounded-xl bg-surface-dark border border-slate-700 px-4 py-3">
               <div className="flex items-center justify-center rounded-lg bg-[#28392e] size-12 text-white">
                  <span className="material-symbols-outlined">wifi_off</span>
               </div>
               <div className="flex flex-col flex-1">
                  <p className="text-base font-bold">Offline Mode</p>
                  <p className="text-slate-400 text-xs">Force offline to save battery & data</p>
               </div>
               <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                  <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                  <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer"></label>
               </div>
            </div>
         </div>

         <div className="px-4">
            <div className="flex justify-between mb-3 px-1">
               <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest">Pending Queue</h3>
               <span className="text-secondary text-xs font-bold cursor-pointer">Clear All</span>
            </div>
            <div className="flex flex-col gap-3">
               {[
                 { name: 'Site Photos', job: '1024', size: '12MB', icon: 'photo_camera', status: 'uploading' },
                 { name: 'Customer Signature', job: '1024', size: '4KB', icon: 'ink_pen', status: 'waiting' },
                 { name: 'Safety Checklist', job: '1021', size: 'Failed', icon: 'checklist', status: 'failed' }
               ].map((item, idx) => (
                  <div key={idx} className={`group relative flex items-center gap-3 bg-surface-dark border ${item.status === 'failed' ? 'border-red-900' : 'border-slate-700'} p-3 rounded-xl`}>
                     <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${item.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                     <div className={`ml-2 flex items-center justify-center rounded-lg size-10 ${item.status === 'failed' ? 'bg-red-900/20 text-red-500' : 'bg-[#28392e] text-white'}`}>
                        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                     </div>
                     <div className="flex flex-col flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{item.name}</p>
                        <div className="flex items-center gap-2">
                           <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400">Job #{item.job}</span>
                           <span className={`text-[10px] font-mono ${item.status === 'failed' ? 'text-red-500 font-bold' : 'text-slate-500'}`}>{item.size}</span>
                        </div>
                     </div>
                     <div className={`shrink-0 flex items-center justify-center size-8 rounded-full ${item.status === 'failed' ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
                        <span className={`material-symbols-outlined text-lg ${item.status === 'failed' ? 'text-red-500' : 'text-yellow-500'} ${item.status === 'uploading' ? 'animate-spin-cw' : ''}`}>
                           {item.status === 'failed' ? 'refresh' : item.status === 'uploading' ? 'progress_activity' : 'hourglass_top'}
                        </span>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};
