import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const Rating = () => {
  const navigate = useNavigate();
  const { setActiveService } = useApp();

  const handleSubmit = () => {
    setActiveService(null); // Clear active service
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-6 animate-fade-in text-center">
      <div className="w-24 h-24 rounded-full border-4 border-surface-dark shadow-xl overflow-hidden mb-4">
        <img src="https://i.pravatar.cc/150?u=mike" alt="Tech" className="w-full h-full object-cover" />
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-1">Mike R.</h2>
      <p className="text-gray-400 text-sm mb-8">Senior Field Tech</p>

      <h3 className="text-xl font-bold text-white mb-6">How was your service?</h3>
      
      <div className="flex gap-2 mb-10">
        {[1,2,3,4,5].map(star => (
          <button key={star} className="text-4xl text-yellow-400 hover:scale-110 transition-transform">★</button>
        ))}
      </div>

      <div className="w-full max-w-sm space-y-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {['Punctual', 'Professional', 'Friendly', 'Expert'].map(tag => (
            <button key={tag} className="px-4 py-2 rounded-full bg-surface-dark border border-white/10 text-gray-300 text-sm hover:bg-primary/20 hover:border-primary hover:text-white transition-all">
              {tag}
            </button>
          ))}
        </div>
        
        <textarea 
          placeholder="Tell us more..." 
          className="w-full bg-surface-dark border border-white/10 rounded-xl p-4 text-white text-sm min-h-[100px] focus:ring-1 focus:ring-accent outline-none mt-6"
        ></textarea>

        <button 
          onClick={handleSubmit}
          className="w-full h-14 bg-accent text-primary font-bold rounded-full shadow-lg shadow-accent/20 hover:brightness-110 transition-all mt-6"
        >
          Submit Feedback
        </button>
      </div>
    </div>
  );
};