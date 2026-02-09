import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const PaymentMethods = () => {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState('visa-1234');

  const methods = [
    { id: 'visa-1234', type: 'Visa', last4: '4242', expiry: '12/24', icon: 'credit_card' },
    { id: 'mc-5678', type: 'Mastercard', last4: '5678', expiry: '09/25', icon: 'credit_card' },
    { id: 'apple-pay', type: 'Apple Pay', last4: '', expiry: '', icon: 'smartphone' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background-dark animate-fade-in">
      <header className="px-4 pt-6 pb-2 border-b border-white/5 z-20 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-full hover:bg-surface-dark transition-colors">
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-white">Payment Methods</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Your Cards</h2>
        
        <div className="space-y-3">
          {methods.map((method) => (
            <div 
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`relative p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${
                selectedMethod === method.id 
                  ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10' 
                  : 'bg-surface-dark border-white/5 hover:border-white/20'
              }`}
            >
              <div className={`w-12 h-8 rounded flex items-center justify-center border ${
                 selectedMethod === method.id ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-gray-400'
              }`}>
                <span className="material-symbols-outlined text-[20px]">{method.icon}</span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-base">{method.type} {method.last4 && `• ${method.last4}`}</span>
                  {selectedMethod === method.id && (
                    <span className="flex items-center text-accent text-xs font-bold gap-1">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Default
                    </span>
                  )}
                </div>
                {method.expiry && <p className="text-gray-500 text-xs mt-0.5">Expires {method.expiry}</p>}
              </div>

              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                 selectedMethod === method.id ? 'border-accent' : 'border-gray-600'
              }`}>
                 {selectedMethod === method.id && <div className="w-3 h-3 rounded-full bg-accent"></div>}
              </div>
            </div>
          ))}
        </div>

        <button className="w-full mt-6 py-4 rounded-xl border border-dashed border-white/20 flex items-center justify-center gap-2 text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all active:scale-[0.98]">
           <span className="material-symbols-outlined">add_circle</span>
           <span className="font-semibold text-sm">Add New Card</span>
        </button>
      </main>

      <div className="p-6 text-center">
        <p className="text-gray-500 text-xs">
          Payments are secured by 256-bit SSL encryption.
        </p>
      </div>
    </div>
  );
};