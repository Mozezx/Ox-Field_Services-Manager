import React from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export const Profile = () => {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl overflow-hidden pb-24">
      {/* Header */}
      <header className="bg-primary pt-12 pb-8 px-5 rounded-b-[2.5rem] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 20%, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative z-10 flex flex-col items-center">
          <div className="size-24 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20 mb-4 overflow-hidden">
            <img
              src={user?.avatar || 'https://i.pravatar.cc/150'}
              alt={user?.name || 'User'}
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-white text-xl font-bold mb-1">{user?.name || 'User'}</h1>
          <p className="text-white/70 text-sm">{user?.email || 'email@example.com'}</p>
        </div>
      </header>

      {/* Menu Options */}
      <div className="flex-1 px-5 pt-6">
        {/* Account Section */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
            Account
          </h2>
          <div className="bg-white dark:bg-[#1a2629] rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 dark:bg-white/10 text-primary dark:text-white">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
                <span className="font-semibold text-primary dark:text-white">Personal Information</span>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </button>

            <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />

            <button
              onClick={() => navigate('/addresses')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 dark:bg-white/10 text-primary dark:text-white">
                  <span className="material-symbols-outlined text-[20px]">location_on</span>
                </div>
                <span className="font-semibold text-primary dark:text-white">My Addresses</span>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </button>

            <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />

            <button
              onClick={() => navigate('/payments')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 dark:bg-white/10 text-primary dark:text-white">
                  <span className="material-symbols-outlined text-[20px]">credit_card</span>
                </div>
                <span className="font-semibold text-primary dark:text-white">Payment Methods</span>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
            Preferences
          </h2>
          <div className="bg-white dark:bg-[#1a2629] rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <button
              onClick={() => navigate('/notifications')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 dark:bg-white/10 text-primary dark:text-white">
                  <span className="material-symbols-outlined text-[20px]">notifications</span>
                </div>
                <span className="font-semibold text-primary dark:text-white">Notifications</span>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </button>

            <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />

            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 dark:bg-white/10 text-primary dark:text-white">
                  <span className="material-symbols-outlined text-[20px]">dark_mode</span>
                </div>
                <span className="font-semibold text-primary dark:text-white">Appearance</span>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Support Section */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
            Support
          </h2>
          <div className="bg-white dark:bg-[#1a2629] rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <button
              onClick={() => navigate('/support')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 dark:bg-white/10 text-primary dark:text-white">
                  <span className="material-symbols-outlined text-[20px]">help</span>
                </div>
                <span className="font-semibold text-primary dark:text-white">Help Center</span>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </button>

            <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                </div>
                <span className="font-semibold text-red-600 dark:text-red-400">Log Out</span>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};