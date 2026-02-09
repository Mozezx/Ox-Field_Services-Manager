import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  sender: 'user' | 'technician';
  text: string;
  time: string;
  read?: boolean;
}

export const Support = () => {
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'technician',
      text: "I'm about 10 minutes away. Is the gate code still #1234?",
      time: '2:30 PM'
    },
    {
      id: '2',
      sender: 'user',
      text: "Yes, that's correct. See you soon.",
      time: '2:32 PM',
      read: true
    },
    {
      id: '3',
      sender: 'technician',
      text: 'Great, thanks!',
      time: '2:33 PM'
    }
  ]);

  const technician = {
    name: 'Carlos',
    role: 'Electrician',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCY86NuYAQuMwewDmz41vdzj_jeWeg3B22YrTxufzp4mLaiQYD13I-xOiOBUeDZETibDdYCdi7Z2Fxd6p8W9lAAM-ygij7UvWDdY1t2wlEB0AQNfhI3-Cyf7TAsu3-1n8-aSG3LxyOOfKn5WDbLcyL2aDymDsb51dAsz24GP2PXwwjE41elP572X0DbsN4fP2y1HQ10BwDQKpjYsYiGllh_CAwY8ldwgYXyZZWfa2X_iviEWXqQB3qFAAkN0RFoionJNGJnkINiWvM',
    isOnline: true
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'user',
      text: newMessage,
      time
    }]);
    setNewMessage('');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display antialiased text-slate-900 dark:text-slate-100 h-screen flex flex-col overflow-hidden max-w-md mx-auto">
      {/* Top Navigation Bar */}
      <header className="flex-none bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-20 pt-2 pb-3 px-4">
        <div className="h-2 w-full" />
        <div className="flex items-center justify-between gap-3">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors rounded-full active:bg-slate-200 dark:active:bg-slate-800"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
          </button>

          {/* Technician Profile */}
          <div className="flex flex-1 items-center gap-3 overflow-hidden">
            <div className="relative shrink-0">
              <div
                className="size-10 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700 shadow-sm"
                style={{ backgroundImage: `url("${technician.avatar}")` }}
              />
              {technician.isOnline && (
                <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-background-light dark:border-background-dark rounded-full" />
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {technician.name} - {technician.role}
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#11add4] opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-[#11add4]" />
                </span>
                <span className="text-xs font-medium text-[#11add4]">Live</span>
              </div>
            </div>
          </div>

          {/* Service Details Shortcut */}
          <button className="shrink-0 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 shadow-sm active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-[16px] text-[#11add4]">assignment</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Details</span>
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6 bg-background-light dark:bg-background-dark scroll-smooth">
        {/* Timestamp */}
        <div className="flex justify-center">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-full">
            Today 2:30 PM
          </span>
        </div>

        {messages.map(message => (
          message.sender === 'technician' ? (
            // Technician Message (Received)
            <div key={message.id} className="flex items-end gap-3 max-w-[85%] sm:max-w-[70%] group">
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 shrink-0 mb-1"
                style={{ backgroundImage: `url("${technician.avatar}")` }}
              />
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">{technician.name}</span>
                <div className="p-4 bg-white dark:bg-[#1e2e34] border border-slate-100 dark:border-slate-800 rounded-2xl rounded-bl-sm shadow-sm text-[15px] leading-relaxed text-slate-800 dark:text-slate-100">
                  {message.text}
                </div>
              </div>
            </div>
          ) : (
            // User Message (Sent)
            <div key={message.id} className="flex items-end justify-end gap-3 w-full pl-12">
              <div className="flex flex-col gap-1 items-end max-w-[85%] sm:max-w-[70%]">
                <div className="p-4 bg-[#0B242A] dark:bg-[#1F4D58] rounded-2xl rounded-br-sm shadow-md text-[15px] leading-relaxed text-white">
                  {message.text}
                </div>
                {message.read && (
                  <span className="text-[10px] text-slate-400 font-medium mr-1">Read {message.time}</span>
                )}
              </div>
            </div>
          )
        ))}

        <div ref={messagesEndRef} className="h-2" />
      </main>

      {/* Composer / Input Area */}
      <footer className="flex-none z-20 bg-background-light dark:bg-background-dark border-t border-slate-200 dark:border-slate-800">
        <div className="p-2 sm:p-4 pb-6 sm:pb-6 w-full max-w-4xl mx-auto">
          <div className="flex items-end gap-2 bg-white dark:bg-[#1e2e34] border border-slate-200 dark:border-slate-700 rounded-[24px] p-2 shadow-sm focus-within:ring-2 focus-within:ring-[#11add4]/20 focus-within:border-[#11add4] transition-all">
            {/* Attachment Button */}
            <button className="shrink-0 size-10 flex items-center justify-center rounded-full text-slate-400 hover:text-[#11add4] hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <span className="material-symbols-outlined text-[22px]">add_a_photo</span>
            </button>

            {/* Text Input */}
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              className="flex-1 bg-transparent border-none text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-0 px-2 py-2.5 resize-none max-h-32 min-h-[44px]"
              placeholder="Type a message..."
              rows={1}
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              className="shrink-0 size-10 flex items-center justify-center rounded-full bg-[#11add4] text-white shadow-md hover:bg-[#11add4]/90 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px] ml-0.5">send</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Support;
