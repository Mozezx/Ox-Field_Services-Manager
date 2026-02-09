import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export const Profile = () => {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const [addressesOpen, setAddressesOpen] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-32 animate-fade-in bg-background-dark min-h-screen">
      <header className="sticky top-0 bg-background-dark/95 backdrop-blur-md p-4 flex justify-between items-center border-b border-white/5 z-10">
        <h2 className="text-lg font-bold text-white">Profile</h2>
        <button onClick={logout} className="text-red-400 text-sm font-medium">Sign Out</button>
      </header>

      <div className="flex flex-col items-center py-8 border-b border-white/5 bg-surface-dark">
        <div className="relative mb-4">
           <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full border-4 border-background-dark shadow-lg" />
           <button className="absolute bottom-0 right-0 p-1.5 bg-primary rounded-full text-white border-2 border-surface-dark">
             <span className="material-symbols-outlined text-[16px]">edit</span>
           </button>
        </div>
        <h1 className="text-2xl font-bold text-white">{user.name}</h1>
        <p className="text-gray-500 text-sm">{user.email}</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Addresses Accordion */}
        <div className="bg-surface-dark rounded-xl border border-white/5 overflow-hidden">
           <button 
             onClick={() => setAddressesOpen(!addressesOpen)}
             className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
           >
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                 <span className="material-symbols-outlined">location_on</span>
               </div>
               <span className="text-white font-medium">My Addresses</span>
             </div>
             <span className={`material-symbols-outlined text-gray-500 transition-transform ${addressesOpen ? 'rotate-180' : ''}`}>expand_more</span>
           </button>
           
           {addressesOpen && (
             <div className="p-4 pt-0 space-y-3 bg-black/20">
               {user.addresses.map(addr => (
                 <div key={addr.id} className="p-3 rounded-lg border border-white/10 bg-background-dark flex justify-between items-start">
                    <div>
                      <p className="text-white font-bold text-sm">{addr.label}</p>
                      <p className="text-gray-400 text-xs mt-1">{addr.fullAddress}</p>
                    </div>
                    <button className="text-accent text-xs">Edit</button>
                 </div>
               ))}
               <button 
                 onClick={() => navigate('/add-address')}
                 className="w-full py-3 mt-2 border border-dashed border-white/20 text-gray-400 rounded-lg text-sm hover:text-white hover:border-white/40 transition-colors"
               >
                 + Add New Address
               </button>
             </div>
           )}
        </div>

        {/* Payments Link */}
        <button 
          onClick={() => navigate('/payments')}
          className="w-full flex items-center justify-between p-4 bg-surface-dark rounded-xl border border-white/5 hover:bg-white/5 transition-colors"
        >
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                 <span className="material-symbols-outlined">credit_card</span>
               </div>
               <span className="text-white font-medium">Payment Methods</span>
             </div>
             <span className="material-symbols-outlined text-gray-500">chevron_right</span>
        </button>

        {/* Support */}
        <button 
          onClick={() => navigate('/support')}
          className="w-full flex items-center justify-between p-4 bg-surface-dark rounded-xl border border-white/5 hover:bg-white/5 transition-colors"
        >
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                 <span className="material-symbols-outlined">help</span>
               </div>
               <span className="text-white font-medium">Support Center</span>
             </div>
             <span className="material-symbols-outlined text-gray-500">chevron_right</span>
        </button>
      </div>
    </div>
  );
};