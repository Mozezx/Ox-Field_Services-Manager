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

  return (
    <div className="flex flex-col min-h-screen bg-background-dark pb-8">
      <header className="px-4 pt-6 pb-2 border-b border-white/5 z-20 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-full hover:bg-surface-dark transition-colors">
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-white">Schedule Service</h1>
        <div className="size-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar animate-fade-in">
        {/* Service Summary */}
        {serviceRequestFlow && (
          <div className="bg-surface-dark rounded-xl p-4 border border-white/5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">
                  {serviceRequestFlow.category === 'HVAC' ? 'mode_fan' :
                    serviceRequestFlow.category === 'Electrical' ? 'bolt' :
                      serviceRequestFlow.category === 'Plumbing' ? 'water_drop' : 'build'}
                </span>
              </div>
              <div>
                <p className="text-white font-semibold">{serviceRequestFlow.category} Service</p>
                <p className="text-gray-400 text-sm">{serviceRequestFlow.addressLabel}</p>
              </div>
            </div>
          </div>
        )}

        {/* Date Selection */}
        <div className="mb-6">
          <h3 className="text-white text-lg font-bold mb-4">Select a Date</h3>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {availableDates.map(d => (
              <button
                key={d.date}
                onClick={() => setSelectedDate(d.date)}
                className={`flex flex-col items-center min-w-[70px] py-3 px-4 rounded-xl border transition-all ${selectedDate === d.date
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-surface-dark border-white/10 text-gray-300 hover:border-white/30'
                  }`}
              >
                <span className="text-xs font-medium opacity-70">{d.label.split(' ')[0]}</span>
                <span className="text-xl font-bold">{d.dayNum}</span>
                <span className="text-xs font-medium opacity-70">{d.label.split(' ')[1]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        <div className="space-y-4">
          <h3 className="text-white text-lg font-bold">
            Available slots for {formatSelectedDate()}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {timeSlots.map(slot => (
              <button
                key={slot.id}
                onClick={() => setSelectedSlot(slot.id)}
                className={`h-12 rounded-xl border font-medium transition-all ${selectedSlot === slot.id
                    ? 'bg-accent border-accent text-background-dark font-bold'
                    : 'bg-surface-dark border-white/10 text-white hover:border-white/30'
                  }`}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>
      </main>

      <div className="px-4 py-4 bg-background-dark border-t border-white/5">
        <button
          onClick={handleConfirm}
          disabled={!selectedSlot || !selectedDate}
          className="w-full bg-primary disabled:opacity-50 hover:bg-primary-light text-white font-bold h-14 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span>Confirm Schedule</span>
          <span className="material-symbols-outlined">check_circle</span>
        </button>
      </div>
    </div>
  );
};