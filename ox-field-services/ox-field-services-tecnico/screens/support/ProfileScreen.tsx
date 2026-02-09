import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../../components/BottomNav';
import { techService, TechnicianProfile } from '../../services/tech';
import { authService } from '../../services/auth';

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<TechnicianProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await techService.getProfile();
        setProfile(data);
      } catch (err: any) {
        console.error('Failed to fetch profile:', err);
        setError(err.response?.data?.message || 'Erro ao carregar perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleChangePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (!file.type.startsWith('image/')) {
      setError('Selecione uma imagem (JPG, PNG ou similar).');
      return;
    }
    try {
      setUploadingPhoto(true);
      setError(null);
      const updated = await techService.uploadProfilePhoto(file);
      setProfile(updated);
    } catch (err: any) {
      console.error('Failed to upload photo:', err);
      setError(err.response?.data?.message || 'Erro ao alterar foto.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark text-white pb-24 flex items-center justify-center">
        <div className="text-center text-slate-400">
          <span className="material-symbols-outlined text-4xl mb-2 animate-spin-cw">sync</span>
          <p className="text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-bg-dark text-white pb-24 flex items-center justify-center p-4">
        <div className="text-center text-red-400">
          <span className="material-symbols-outlined text-4xl mb-2">error</span>
          <p className="text-sm">{error || 'Erro ao carregar perfil'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark text-white pb-24">
       <header className="flex items-center gap-4 p-4 sticky top-0 bg-bg-dark/95 backdrop-blur z-20">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full hover:bg-white/10"><span className="material-symbols-outlined">arrow_back</span></button>
          <h1 className="text-lg font-bold">Profile & Settings</h1>
       </header>

       <div className="flex flex-col items-center mt-6 mb-8">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelected}
          />
          <div className="relative">
             <button
               type="button"
               onClick={handleChangePhoto}
               disabled={uploadingPhoto}
               className="size-28 rounded-full border-4 border-primary overflow-hidden bg-slate-700 block relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-dark disabled:opacity-70"
               title="Alterar foto de perfil"
             >
                {uploadingPhoto ? (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-4xl animate-spin-cw">sync</span>
                  </div>
                ) : profile.avatarUrl ? (
                  <img src={profile.avatarUrl} className="w-full h-full object-cover" alt={profile.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {!uploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-full">
                    <span className="material-symbols-outlined text-3xl text-white">camera_alt</span>
                  </div>
                )}
             </button>
             <div className={`absolute bottom-1 right-1 size-6 border-4 border-bg-dark rounded-full ${
               profile.status === 'AVAILABLE' ? 'bg-green-500' :
               profile.status === 'BUSY' ? 'bg-yellow-500' : 'bg-slate-500'
             }`}></div>
          </div>
          {!uploadingPhoto && (
            <p className="text-xs text-slate-500 mt-2">Toque na foto para alterar</p>
          )}
          <h2 className="text-xl font-bold mt-4">{profile.name}</h2>
          <div className="flex items-center gap-2 mt-1">
             <span className="px-2 py-0.5 rounded bg-white/10 text-xs text-slate-300">
               {profile.skills.length > 0 ? profile.skills[0] : 'Technician'}
             </span>
             <span className="text-xs text-slate-500">Rating: {profile.rating.toFixed(1)} ⭐</span>
          </div>
          {profile.vehicleModel && (
            <div className="text-xs text-slate-400 mt-1">
              {profile.vehicleModel} {profile.vehiclePlate && `• ${profile.vehiclePlate}`}
            </div>
          )}
          <div className="mt-3 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Technician ID</p>
            <p className="text-sm font-mono text-slate-300 break-all select-all" title="Use this ID for support or location simulation">
              {profile.id}
            </p>
          </div>
       </div>

       <div className="px-4 space-y-6">
          <div>
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pl-2">General</h3>
             <div className="bg-surface-dark rounded-2xl overflow-hidden">
                {[
                   { icon: 'edit', label: 'Edit Profile' },
                   { icon: 'sync_alt', label: 'Data Sync', path: '/sync' },
                   { icon: 'notifications', label: 'Notification Preferences' },
                   { icon: 'language', label: 'Language', sub: 'English' }
                ].map((item, idx) => (
                   <div
                     key={idx}
                     onClick={() => { const p = (item as { path?: string }).path; if (p) navigate(p); }}
                     className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0"
                   >
                      <div className="flex items-center gap-4">
                         <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-accent">
                            <span className="material-symbols-outlined">{item.icon}</span>
                         </div>
                         <span className="font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         {item.sub && <span className="text-sm text-slate-500">{item.sub}</span>}
                         <span className="material-symbols-outlined text-slate-500 text-sm">chevron_right</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          <div>
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pl-2">Preferences</h3>
             <div className="bg-surface-dark rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between p-4 hover:bg-white/5 border-b border-white/5">
                   <div className="flex items-center gap-4">
                      <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-accent">
                         <span className="material-symbols-outlined">dark_mode</span>
                      </div>
                      <span className="font-medium">App Theme</span>
                   </div>
                   <div className="bg-black/20 rounded-lg p-0.5 flex">
                      <button className="px-3 py-1 rounded-md text-xs text-slate-400">Light</button>
                      <button className="px-3 py-1 rounded-md bg-white/10 text-xs font-bold">Dark</button>
                   </div>
                </div>
                <div className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer">
                   <div className="flex items-center gap-4">
                      <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-accent">
                         <span className="material-symbols-outlined">help</span>
                      </div>
                      <span className="font-medium">Help & Support</span>
                   </div>
                   <span className="material-symbols-outlined text-slate-500 text-sm">chevron_right</span>
                </div>
             </div>
          </div>
          
          <button onClick={handleLogout} className="w-full py-4 rounded-2xl border border-red-500/20 text-red-400 font-bold hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2">
             <span className="material-symbols-outlined">logout</span> Log Out
          </button>
       </div>
       <BottomNav />
    </div>
  );
};
