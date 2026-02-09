import React from 'react';
import { useApp } from '../context/AppContext';

export const Documents = () => {
  const { pastServices } = useApp();

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-32 animate-fade-in bg-background-dark min-h-screen">
      <header className="sticky top-0 z-10 bg-background-dark/95 backdrop-blur-md pt-6 px-4 pb-4 border-b border-white/5">
        <h1 className="text-2xl font-bold text-white mb-4">Document Center</h1>
        <div className="relative">
           <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500">search</span>
           <input 
             type="text" 
             placeholder="Search by date or service..." 
             className="w-full bg-surface-dark border border-white/10 rounded-xl h-12 pl-12 pr-4 text-white placeholder-gray-600 focus:ring-1 focus:ring-primary outline-none"
           />
        </div>
      </header>

      <main className="p-4 space-y-4">
        <div className="flex justify-between items-center mb-2">
           <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Recent History</h3>
           <button className="text-accent text-xs font-bold">View All</button>
        </div>

        {pastServices.map(service => (
          <div key={service.id} className="bg-surface-dark rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-accent border border-white/5">
                  <span className="material-symbols-outlined text-[24px]">
                    {service.type === 'HVAC' ? 'mode_fan' : 'plumbing'}
                  </span>
                </div>
                <div>
                  <h4 className="text-white font-bold">{service.type} {service.type === 'HVAC' ? 'Maintenance' : 'Repair'}</h4>
                  <span className="text-gray-500 text-xs font-medium">{service.date}</span>
                </div>
              </div>
              <div className="bg-accent/10 text-accent px-2 py-1 rounded text-[10px] font-bold border border-accent/20 uppercase">
                {service.status}
              </div>
            </div>
            
            <div className="h-px w-full bg-white/5 mb-4"></div>
            
            <div className="flex gap-3">
              <button className="flex-1 h-10 flex items-center justify-center gap-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-light transition-colors">
                <span className="material-symbols-outlined text-[18px]">photo_library</span>
                View Photos
              </button>
              <button className="flex-1 h-10 flex items-center justify-center gap-2 rounded-lg border border-white/10 text-gray-300 text-sm font-bold hover:bg-white/5 transition-colors">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Invoice
              </button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};