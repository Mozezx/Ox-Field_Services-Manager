import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: 'home', label: 'Home', path: '/home' },
    { icon: 'calendar_month', label: 'Bookings', path: '/active-services' },
    { icon: 'storefront', label: 'Marketplace', path: '/marketplace' },
    { icon: 'location_on', label: 'Track', path: '/tracking' },
    { icon: 'person', label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-white dark:bg-[#1A2629] border-t border-gray-100 dark:border-white/5 pb-6 pt-3 px-6 z-50">
      <div className="flex justify-between items-center">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 transition-colors ${isActive(item.path)
              ? 'text-primary dark:text-white'
              : 'text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-white'
              }`}
          >
            <div className={isActive(item.path) ? 'bg-primary/10 dark:bg-white/10 p-1.5 rounded-full' : 'p-1.5'}>
              <span
                className="material-symbols-outlined"
                style={isActive(item.path) ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
            </div>
            <span className={`text-[10px] ${isActive(item.path) ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};