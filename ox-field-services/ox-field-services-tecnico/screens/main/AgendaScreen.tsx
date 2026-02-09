import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../../components/BottomNav';
import { techService, AgendaItem, getLocalDateString, addDaysToDate, formatAgendaDateLabel } from '../../services/tech';
import { authService } from '../../services/auth';
import { useLocationTracking } from '../../hooks/useLocationTracking';

export const AgendaScreen: React.FC = () => {
  const navigate = useNavigate();
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [currentTask, setCurrentTask] = useState<AgendaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [agendaDate, setAgendaDate] = useState(() => getLocalDateString());

  const user = authService.getStoredUser();
  const isPending = user?.status?.toLowerCase() === 'pending';
  const isApproved = user?.status?.toLowerCase() === 'approved';

  const [hasSubmittedDocuments, setHasSubmittedDocuments] = useState<boolean | null>(null);
  const [registrationCompleteDismissed, setRegistrationCompleteDismissed] = useState(() => {
    try {
      const key = user?.id ? `tech_registration_complete_dismissed_${user.id}` : 'tech_registration_complete_dismissed';
      return localStorage.getItem(key) === 'true';
    } catch {
      return false;
    }
  });

  // When PENDING, fetch documents to know if we show "complete registration" vs "reviewing documents"
  useEffect(() => {
    if (!isPending) {
      setHasSubmittedDocuments(null);
      return;
    }
    let cancelled = false;
    techService
      .getDocuments()
      .then((docs) => {
        if (!cancelled) setHasSubmittedDocuments((docs?.length ?? 0) > 0);
      })
      .catch(() => {
        if (!cancelled) setHasSubmittedDocuments(false);
      });
    return () => { cancelled = true; };
  }, [isPending]);

  const handleDismissRegistrationComplete = () => {
    setRegistrationCompleteDismissed(true);
    try {
      const key = user?.id ? `tech_registration_complete_dismissed_${user.id}` : 'tech_registration_complete_dismissed';
      localStorage.setItem(key, 'true');
    } catch {
      // ignore
    }
  };

  const showRegistrationCompleteBanner = isApproved && !registrationCompleteDismissed;

  // Rastrear localização quando há uma OS ativa
  useLocationTracking(currentTask?.id || null, true);

  const fetchAgenda = React.useCallback(async () => {
    if (user?.status?.toLowerCase() === 'pending') {
      setLoading(false);
      setAgenda([]);
      setCurrentTask(null);
      setError(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await techService.getAgenda(agendaDate);

      // Find current task (in progress or in route)
      const activeTask = data.find(item =>
        item.status === 'IN_PROGRESS' || item.status === 'EN_ROUTE'
      );
      setCurrentTask(activeTask || null);

      // Filter upcoming tasks (scheduled)
      const upcoming = data.filter(item => item.status === 'SCHEDULED');
      setAgenda(upcoming);
    } catch (err: any) {
      if (err.response?.status === 401) {
        authService.logout();
        return;
      }
      console.error('Failed to fetch agenda:', err);
      setError(err.response?.data?.message || 'Failed to load agenda');
      setAgenda([]);
      setCurrentTask(null);
    } finally {
      setLoading(false);
    }
  }, [user?.status, agendaDate]);

  useEffect(() => {
    fetchAgenda();

    // Refresh agenda every 30 seconds (only when approved)
    const interval = setInterval(fetchAgenda, 30000);
    return () => clearInterval(interval);
  }, [fetchAgenda]);

  // Refetch when user returns to the tab/app so new orders assigned from dispatch appear
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAgenda();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [fetchAgenda]);

  // Timer for current task
  useEffect(() => {
    if (!currentTask || !currentTask.actualStartTime) {
      setElapsedTime(0);
      return;
    }

    // Calculate initial elapsed time from actualStartTime
    const startTime = new Date(currentTask.actualStartTime).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
    };

    updateElapsed(); // Initial calculation
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [currentTask]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', weekday: 'long' });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
      case 'URGENT':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'MEDIUM':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const completedCount = agenda.filter(a => a.status === 'COMPLETED').length + (currentTask ? 1 : 0);
  const totalCount = agenda.length + (currentTask ? 1 : 0);

  return (
    <div className="min-h-screen bg-bg-dark pb-24">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-bg-dark/95 backdrop-blur-md p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/notifications')} className="relative text-slate-300 hover:text-white">
            <span className="material-symbols-outlined text-3xl">notifications</span>
            <span className="absolute top-0 right-0 size-2.5 bg-red-500 rounded-full border border-bg-dark"></span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">My Agenda</h1>
            <div className="flex items-center gap-2">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs text-slate-400 font-medium">Online • {loading ? 'Syncing...' : 'Synced'}</span>
                <button
                  type="button"
                  onClick={() => fetchAgenda()}
                  disabled={loading}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
                  title="Refresh agenda"
                  aria-label="Refresh agenda"
                >
                  <span className="material-symbols-outlined text-xl">refresh</span>
                </button>
            </div>
          </div>
        </div>
        <button className="h-10 w-10 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-700" onClick={() => navigate('/profile')}>
           {user?.avatarUrl ? (
             <img src={user.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
           ) : (
             <div className="h-full w-full flex items-center justify-center bg-slate-600 text-white font-bold">
               {user?.name?.charAt(0)?.toUpperCase() || 'T'}
             </div>
           )}
        </button>
      </header>

      <div className="px-4 py-6">
         <h2 className="text-2xl font-bold text-white">{getGreeting()}, {user?.name?.split(' ')[0] || 'Tech'}</h2>
         <p className="text-slate-400 text-sm mt-1">{formatDate()}</p>

         {!isPending && isApproved && (
           <div className="mt-4 flex flex-col gap-2">
             <p className="text-xs text-slate-400 font-medium">A ver agenda: {formatAgendaDateLabel(agendaDate)}</p>
             <div className="flex gap-2">
               <button
                 type="button"
                 onClick={() => setAgendaDate(addDaysToDate(agendaDate, -1))}
                 className="px-3 py-1.5 rounded-lg bg-surface-dark border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-700/50 transition-colors"
               >
                 Ontem
               </button>
               <button
                 type="button"
                 onClick={() => setAgendaDate(getLocalDateString())}
                 className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${agendaDate === getLocalDateString() ? 'bg-accent text-primary border-accent' : 'bg-surface-dark border-slate-700 text-slate-300 hover:bg-slate-700/50'}`}
               >
                 Hoje
               </button>
               <button
                 type="button"
                 onClick={() => setAgendaDate(addDaysToDate(agendaDate, 1))}
                 className="px-3 py-1.5 rounded-lg bg-surface-dark border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-700/50 transition-colors"
               >
                 Amanhã
               </button>
             </div>
           </div>
         )}
      </div>

      {showRegistrationCompleteBanner && (
        <div className="mx-4 mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-between gap-4">
          <p className="text-green-200 font-semibold flex-1">Your registration is complete</p>
          <button
            onClick={handleDismissRegistrationComplete}
            className="shrink-0 p-2 rounded-lg text-green-200 hover:bg-green-500/20 transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
      )}

      {isPending && !isApproved && hasSubmittedDocuments === false && (
        <div className="mx-4 mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-amber-200 font-semibold">Complete your registration</p>
            <p className="text-amber-200/80 text-sm mt-0.5">Upload documents so your company can approve you.</p>
          </div>
          <button
            onClick={() => navigate('/documents')}
            className="shrink-0 py-2.5 px-4 rounded-lg bg-amber-500 text-[#0B242A] font-bold text-sm"
          >
            Upload
          </button>
        </div>
      )}

      {isPending && !isApproved && hasSubmittedDocuments === true && (
        <div className="mx-4 mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-amber-200 font-semibold">We are reviewing your documents, please wait for approval.</p>
          </div>
          <button
            onClick={() => navigate('/documents')}
            className="shrink-0 py-2 px-3 rounded-lg bg-amber-500/20 text-amber-200 font-medium text-sm hover:bg-amber-500/30"
          >
            View documents
          </button>
        </div>
      )}

      {isPending && !isApproved && hasSubmittedDocuments === null && (
        <div className="mx-4 mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-amber-200 font-semibold">Complete your registration</p>
            <p className="text-amber-200/80 text-sm mt-0.5">Upload documents so your company can approve you.</p>
          </div>
          <button
            onClick={() => navigate('/documents')}
            className="shrink-0 py-2.5 px-4 rounded-lg bg-amber-500 text-[#0B242A] font-bold text-sm"
          >
            Upload
          </button>
        </div>
      )}

      {error && (
        <div className="mx-4 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {loading && agenda.length === 0 && !currentTask && !isPending && (
        <div className="px-4 py-8 text-center text-slate-400">
          <span className="material-symbols-outlined text-4xl mb-2 animate-spin-cw">sync</span>
          <p className="text-sm">Loading agenda...</p>
        </div>
      )}

      {!loading && agenda.length === 0 && !currentTask && !isPending && (
        <div className="px-4 py-8 text-center text-slate-400">
          <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
          <p className="text-sm">No jobs scheduled for today</p>
        </div>
      )}

      {isPending && !isApproved && (
        <div className="px-4 py-8 text-center text-slate-400">
          <span className="material-symbols-outlined text-4xl mb-2">pending_actions</span>
          <p className="text-sm">
            {hasSubmittedDocuments === true
              ? 'We are reviewing your documents. You will be able to receive service orders once approved.'
              : 'Complete your registration above to start receiving service orders.'}
          </p>
        </div>
      )}

      <div className="px-4 mb-6">
        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
          <div className="flex justify-between items-end mb-2">
             <p className="text-sm font-semibold text-slate-200">Daily Progress</p>
             <p className="text-xs font-medium text-slate-400">{completedCount}/{totalCount} Jobs Completed</p>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-700 overflow-hidden">
             <div 
               className="h-full bg-secondary rounded-full transition-all duration-500" 
               style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
             ></div>
          </div>
        </div>
      </div>

      {currentTask && (
        <div className="px-4 mb-8">
          <div className="flex items-center justify-between mb-3">
             <h3 className="text-lg font-bold text-white">Current Task</h3>
             <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent/20 text-accent border border-accent/30 animate-pulse">Live</span>
          </div>
          
          <div 
            onClick={() => navigate(`/task/${currentTask.id}`)}
            className="relative overflow-hidden rounded-2xl bg-[#18363e] border border-accent/30 shadow-lg cursor-pointer active:scale-[0.99] transition-transform"
          >
             <div className="p-5 flex flex-col gap-4 relative z-10">
                <div className="flex flex-col">
                   <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-accent/80">{currentTask.orderNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityColor(currentTask.priority)}`}>
                        {currentTask.priority} PRIORITY
                      </span>
                   </div>
                   <h4 className="text-xl font-bold text-white leading-tight">{currentTask.title}</h4>
                </div>
                
                <div className="flex items-center gap-3 py-2">
                   <div className="p-2 rounded-lg bg-black/20 text-accent">
                      <span className="material-symbols-outlined text-2xl">timer</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Time Elapsed</span>
                      <span className="text-3xl font-mono font-bold text-white tracking-widest tabular-nums">{formatTime(elapsedTime)}</span>
                   </div>
                </div>

                <div className="flex items-start gap-3 bg-black/20 p-3 rounded-lg border border-white/5">
                   <span className="material-symbols-outlined text-slate-400 mt-0.5 text-lg">location_on</span>
                   <div className="flex flex-col">
                      <span className="text-white font-medium text-sm">{currentTask.customer.address}</span>
                      <span className="text-slate-400 text-xs mt-0.5">{currentTask.customer.name}</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-1">
                   <button onClick={(e) => { e.stopPropagation(); }} className="flex items-center justify-center gap-2 py-3 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold">
                      <span className="material-symbols-outlined">pause</span> Pause
                   </button>
                   <button onClick={(e) => { e.stopPropagation(); navigate(`/task/${currentTask.id}/complete`); }} className="flex items-center justify-center gap-2 py-3 rounded-lg bg-secondary hover:bg-secondary/90 text-primary font-bold">
                      <span className="material-symbols-outlined">check_circle</span> Complete
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      <div className="px-4">
         <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white">Up Next</h3>
            <span className="text-sm text-slate-400">{agenda.length} Jobs</span>
         </div>
         <div className="flex flex-col gap-3">
            {agenda.map(job => (
              <div 
                key={job.id} 
                onClick={() => navigate(`/task/${job.id}`)}
                className="p-4 rounded-xl bg-surface-dark border border-slate-800 flex flex-col gap-2 active:scale-[0.99] transition-transform cursor-pointer"
              >
                 <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-mono text-slate-400">{job.orderNumber}</span>
                       <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityColor(job.priority)}`}>{job.priority}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                       <span className="material-symbols-outlined text-base">schedule</span>
                       <span className="text-xs font-semibold">{job.scheduledStartTime}</span>
                    </div>
                 </div>
                 <h4 className="text-base font-bold text-white">{job.title}</h4>
                 <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <span className="material-symbols-outlined text-base">location_on</span>
                    <span className="truncate">{job.customer.address}</span>
                 </div>
              </div>
            ))}
         </div>
      </div>
      
      <button onClick={() => navigate('/chat')} className="fixed bottom-24 right-4 z-30 h-14 w-14 rounded-full bg-accent text-primary shadow-lg hover:scale-105 transition-all flex items-center justify-center">
         <span className="material-symbols-outlined text-3xl">support_agent</span>
      </button>

      <BottomNav />
    </div>
  );
};
