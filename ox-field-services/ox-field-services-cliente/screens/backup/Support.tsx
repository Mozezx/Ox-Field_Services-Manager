import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const Support = () => {
  const navigate = useNavigate();
  const { notifications } = useApp();
  const [activeTab, setActiveTab] = useState<'notifications' | 'chat'>('notifications');

  return (
    <div className="flex flex-col h-screen bg-background-dark animate-fade-in">
      {/* Header */}
      <header className="bg-primary pt-12 pb-6 px-4 shrink-0 shadow-lg z-10">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full text-white">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-2xl font-bold text-white">Help & Alerts</h1>
        </div>
        <div className="flex p-1 bg-black/20 rounded-xl">
           <button 
             onClick={() => setActiveTab('notifications')}
             className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'notifications' ? 'bg-white text-primary shadow-sm' : 'text-white/70 hover:text-white'}`}
           >
             Notifications
           </button>
           <button 
             onClick={() => setActiveTab('chat')}
             className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'chat' ? 'bg-white text-primary shadow-sm' : 'text-white/70 hover:text-white'}`}
           >
             Chat Support
           </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar bg-background-dark">
        {activeTab === 'notifications' ? (
          <div className="p-4 space-y-4">
             {notifications.map(notif => (
               <div 
                 key={notif.id} 
                 onClick={() => { if(notif.title.includes('Technician')) navigate('/tracking'); }}
                 className="bg-surface-dark border border-white/5 p-4 rounded-xl flex gap-4 hover:bg-white/5 cursor-pointer transition-colors"
               >
                 <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                   <span className="material-symbols-outlined">notifications</span>
                 </div>
                 <div className="flex-1">
                   <h4 className="text-white font-bold text-sm mb-1">{notif.title}</h4>
                   <p className="text-gray-400 text-xs leading-relaxed">{notif.message}</p>
                   <span className="text-gray-600 text-[10px] mt-2 block">{notif.time}</span>
                 </div>
                 {!notif.read && <div className="w-2 h-2 rounded-full bg-accent mt-2"></div>}
               </div>
             ))}
             
             {/* FAQ Accordion Mockup */}
             <div className="mt-8">
               <h3 className="text-white font-bold mb-4 px-2">Frequently Asked Questions</h3>
               <div className="space-y-2">
                 <details className="bg-surface-dark rounded-lg border border-white/5 overflow-hidden group">
                   <summary className="p-4 cursor-pointer flex justify-between items-center font-medium text-gray-300 group-open:text-white">
                     How do I reschedule?
                     <span className="material-symbols-outlined text-sm group-open:rotate-180 transition-transform">expand_more</span>
                   </summary>
                   <p className="px-4 pb-4 text-sm text-gray-400">Go to your Appointments tab and select the service to see rescheduling options.</p>
                 </details>
                 <details className="bg-surface-dark rounded-lg border border-white/5 overflow-hidden group">
                   <summary className="p-4 cursor-pointer flex justify-between items-center font-medium text-gray-300 group-open:text-white">
                     Payment methods?
                     <span className="material-symbols-outlined text-sm group-open:rotate-180 transition-transform">expand_more</span>
                   </summary>
                   <p className="px-4 pb-4 text-sm text-gray-400">We accept Visa, Mastercard, and Apple Pay.</p>
                 </details>
               </div>
             </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 p-4 space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-600"></div>
                <div className="bg-surface-dark p-3 rounded-2xl rounded-tl-none border border-white/5 max-w-[80%]">
                  <p className="text-gray-300 text-sm">Hello! How can I help you today?</p>
                </div>
              </div>
              <div className="flex gap-3 flex-row-reverse">
                <div className="bg-primary p-3 rounded-2xl rounded-tr-none text-white max-w-[80%]">
                  <p className="text-sm">Where is my technician?</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-surface-dark border-t border-white/5 flex gap-2">
              <input type="text" placeholder="Type a message..." className="flex-1 bg-background-dark border border-white/10 rounded-full px-4 h-10 text-white text-sm focus:outline-none focus:border-primary" />
              <button className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary font-bold">
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};