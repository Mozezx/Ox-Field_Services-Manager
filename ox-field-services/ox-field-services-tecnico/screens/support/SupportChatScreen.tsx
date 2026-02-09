import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const SupportChatScreen: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { id: 1, sender: 'agent', text: 'Bom dia. Por favor, envie a foto do disjuntor danificado.', time: '10:15' },
    { id: 2, sender: 'me', text: '', image: 'https://picsum.photos/id/13/300/200', caption: 'Foto do painel elétrico', time: '10:16' },
    { id: 3, sender: 'me', text: 'A fiação está exposta. Vou precisar de aprovação para troca.', time: '10:17' },
    { id: 4, sender: 'agent', text: 'Aprovação concedida. Prossiga com cuidado.', time: '10:18' }
  ]);

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col font-sans">
      <header className="flex items-center justify-between px-4 py-3 bg-bg-dark border-b border-white/10 sticky top-0 z-20">
         <div className="flex items-center gap-3">
             <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white">
                <span className="material-symbols-outlined">arrow_back</span>
             </button>
             <div>
                <h2 className="text-white font-bold">Central de Suporte</h2>
                <div className="flex items-center gap-1.5">
                   <span className="size-2 rounded-full bg-secondary"></span>
                   <span className="text-xs text-slate-300">Online</span>
                </div>
             </div>
         </div>
         <div className="flex items-center gap-2">
            <button className="size-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white"><span className="material-symbols-outlined">search</span></button>
            <button className="size-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white"><span className="material-symbols-outlined">more_vert</span></button>
         </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
         <div className="flex justify-center my-2">
            <span className="text-xs text-slate-500 bg-white/5 px-3 py-1 rounded-full">Hoje, 10 Out</span>
         </div>
         
         {messages.map(msg => (
            <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'me' ? 'flex-row-reverse' : ''}`}>
               {msg.sender === 'agent' && (
                  <img src="https://picsum.photos/id/65/40/40" className="size-8 rounded-full bg-slate-700" />
               )}
               <div className={`max-w-[80%] rounded-2xl p-3 ${msg.sender === 'me' ? 'bg-primary/50 text-white rounded-tr-none border border-white/5' : 'bg-surface-dark text-slate-200 rounded-tl-none border border-white/5'}`}>
                  {msg.sender === 'agent' && <p className="text-xs text-slate-400 mb-1">Central</p>}
                  {msg.image && (
                     <div className="mb-2 rounded-lg overflow-hidden relative">
                        <img src={msg.image} className="w-full object-cover" />
                        {msg.caption && <div className="absolute bottom-0 w-full bg-black/60 p-1 text-xs text-white truncate">{msg.caption}</div>}
                     </div>
                  )}
                  {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
                  <p className={`text-[10px] mt-1 text-right ${msg.sender === 'me' ? 'text-slate-300' : 'text-slate-500'}`}>{msg.time} {msg.sender === 'me' && '✓'}</p>
               </div>
            </div>
         ))}
      </div>

      <div className="p-3 bg-bg-dark border-t border-white/10 sticky bottom-0">
         <div className="flex items-center gap-2">
            <button className="size-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300">
               <span className="material-symbols-outlined">add</span>
            </button>
            <button className="size-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300">
               <span className="material-symbols-outlined">photo_camera</span>
            </button>
            <div className="flex-1 bg-surface-dark rounded-full h-10 px-4 flex items-center border border-white/5">
               <input type="text" placeholder="Descreva o problema..." className="bg-transparent border-none text-white text-sm w-full focus:ring-0 placeholder-slate-500" />
            </div>
            <button className="size-10 rounded-full bg-primary flex items-center justify-center text-white shadow hover:bg-primary/80">
               <span className="material-symbols-outlined">mic</span>
            </button>
         </div>
      </div>
    </div>
  );
};
