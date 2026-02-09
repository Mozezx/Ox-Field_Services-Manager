import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const Schedule = () => {
  const navigate = useNavigate();
  const { serviceRequestFlow, updateServiceRequestFlow } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Generate next 7 days for scheduling
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      // Skip weekends
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push({
          date: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          dayNum: date.getDate()
        });
      }
    }
    return dates.slice(0, 10); // Max 10 days
  };

  const availableDates = getAvailableDates();

  // Set first available date as default
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0].date);
    }
  }, []);

  const timeSlots = [
    { id: '08:00', label: '08:00 AM' },
    { id: '09:00', label: '09:00 AM' },
    { id: '10:00', label: '10:00 AM' },
    { id: '11:00', label: '11:00 AM' },
    { id: '13:00', label: '01:00 PM' },
    { id: '14:00', label: '02:00 PM' },
    { id: '15:00', label: '03:00 PM' },
    { id: '16:00', label: '04:00 PM' },
  ];

  const handleConfirm = () => {
    if (!selectedDate || !selectedSlot) return;

    // Update the flow with date and time
    updateServiceRequestFlow({
      preferredDate: selectedDate,
      preferredTime: selectedSlot
    });

    navigate('/confirmation');
  };

  // Redirect if no flow data
  useEffect(() => {
    if (!serviceRequestFlow) {
      navigate('/request');
    }
  }, [serviceRequestFlow, navigate]);

  const formatSelectedDate = () => {
    if (!selectedDate) return '';
    const date = new Date(selectedDate);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Get month/year for display
  const getSelectedMonthYear = () => {
    if (!selectedDate) return '';
    const date = new Date(selectedDate);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pb-32 group/design-root bg-background-light dark:bg-background-dark font-display text-primary dark:text-white transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md p-4 pb-2">
        <button 
          onClick={() => navigate(-1)} 
          className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-[#101619] dark:text-white" style={{fontSize: '24px'}}>arrow_back_ios_new</span>
        </button>
        <h1 className="text-[#101619] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">Schedule Service</h1>
      </header>

      {/* Progress Step */}
      <div className="w-full px-4 pt-2 pb-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[#587e8d] dark:text-gray-400 text-sm font-medium leading-normal">Step 2 of 4</p>
          <span className="text-xs text-primary/60 dark:text-white/60 font-medium">50% Completed</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-primary dark:bg-white rounded-full transition-all duration-500 ease-out"></div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex flex-col gap-8 px-4">
        {/* Service Summary */}
        {serviceRequestFlow && (
          <section className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 dark:bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary dark:text-white">
                  {serviceRequestFlow.category === 'HVAC' ? 'ac_unit' :
                    serviceRequestFlow.category === 'Electrical' ? 'bolt' :
                      serviceRequestFlow.category === 'Plumbing' ? 'water_drop' : 'build'}
                </span>
              </div>
              <div>
                <p className="text-[#101619] dark:text-white font-semibold">{serviceRequestFlow.category} Service</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{serviceRequestFlow.addressLabel}</p>
              </div>
            </div>
          </section>
        )}

        {/* Date Selection */}
        <section>
          <h2 className="text-[#101619] dark:text-white tracking-tight text-[22px] font-bold leading-tight mb-4 text-left">Select Date</h2>
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4 px-1">
              <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <span className="material-symbols-outlined text-[#101619] dark:text-white" style={{fontSize: '20px'}}>chevron_left</span>
              </button>
              <p className="text-[#101619] dark:text-white text-base font-bold">{getSelectedMonthYear()}</p>
              <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <span className="material-symbols-outlined text-[#101619] dark:text-white" style={{fontSize: '20px'}}>chevron_right</span>
              </button>
            </div>
            {/* Date Buttons - Horizontal Scroll */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {availableDates.map(d => (
                <button
                  key={d.date}
                  onClick={() => setSelectedDate(d.date)}
                  className={`flex flex-col items-center min-w-[70px] py-3 px-4 rounded-xl border transition-all shrink-0 ${
                    selectedDate === d.date
                      ? 'bg-primary dark:bg-white border-primary dark:border-white text-white dark:text-primary shadow-lg shadow-primary/30'
                      : 'bg-transparent border-gray-200 dark:border-gray-700 text-[#101619] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-xs font-medium opacity-70">{d.label.split(' ')[0]}</span>
                  <span className="text-xl font-bold">{d.dayNum}</span>
                  <span className="text-xs font-medium opacity-70">{d.label.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Time Selection */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#101619] dark:text-white tracking-tight text-[22px] font-bold leading-tight">Available Time</h2>
            <span className="text-xs font-semibold text-primary/70 dark:text-white/70 bg-primary/5 dark:bg-white/10 border border-primary/10 dark:border-white/10 px-2.5 py-1 rounded-md">EST</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {timeSlots.map(slot => (
              <button
                key={slot.id}
                onClick={() => setSelectedSlot(slot.id)}
                className={`py-3 px-2 rounded-full border text-sm font-semibold transition-all ${
                  selectedSlot === slot.id
                    ? 'bg-primary dark:bg-white text-white dark:text-primary shadow-md shadow-primary/25 dark:shadow-white/10 ring-2 ring-primary dark:ring-white ring-offset-2 ring-offset-background-light dark:ring-offset-background-dark transform scale-[1.02]'
                    : 'border-gray-200 dark:border-gray-700 text-[#101619] dark:text-white hover:border-primary dark:hover:border-white bg-surface-light dark:bg-surface-dark shadow-sm'
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pt-4 pb-8 bg-gradient-to-t from-white via-white/95 to-white/0 dark:from-background-dark dark:via-background-dark/95 dark:to-background-dark/0 z-40">
        <button
          onClick={handleConfirm}
          disabled={!selectedSlot || !selectedDate}
          className="w-full bg-primary dark:bg-white text-white dark:text-primary h-14 rounded-full font-bold text-lg shadow-xl shadow-primary/20 dark:shadow-white/10 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next Step
          <span className="material-symbols-outlined" style={{fontSize: '20px'}}>arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
