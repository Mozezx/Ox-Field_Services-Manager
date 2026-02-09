import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface FeedbackChip {
  icon: string;
  label: string;
}

export const Rating = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [rating, setRating] = useState(4);
  const [selectedChips, setSelectedChips] = useState<string[]>(['Punctual', 'Great communication']);
  const [comment, setComment] = useState('');

  // Get service info from location state or use defaults
  const technician = location.state?.technician || {
    name: 'John Doe',
    specialty: 'HVAC Maintenance Specialist',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUJBQZvlK1yT4t7-Ezj1HKpGAw1VOZo44uM9OBaGnI9ZYPZyHfJGJiq5vqi--w47ifHYnwRi5wm4RnQjYAP7J4SI05JzwqyVnUqPJrsCBfPCaJuiYRg7ug32qu3P5fwm4OSAon7ZTcFIz5qtDdl8ov7MO6JS382xfu58lJhWYap0bWXIAV95CSCLqgNzd4Zb1g1R-6DUs82URL1QVQpG-qSmgtDHKAzGsEuUMoxMfy7iYs16JRrdukinEXZqH29lvXe5ogslRAmEw'
  };

  const feedbackChips: FeedbackChip[] = [
    { icon: 'schedule', label: 'Punctual' },
    { icon: 'engineering', label: 'Professional' },
    { icon: 'cleaning_services', label: 'Clean work' },
    { icon: 'chat', label: 'Great communication' },
  ];

  const getRatingLabel = (r: number) => {
    if (r === 5) return 'Excellent';
    if (r === 4) return 'Good';
    if (r === 3) return 'Average';
    if (r === 2) return 'Below Average';
    return 'Poor';
  };

  const toggleChip = (label: string) => {
    setSelectedChips(prev =>
      prev.includes(label)
        ? prev.filter(c => c !== label)
        : [...prev, label]
    );
  };

  const handleSubmit = () => {
    // Submit review logic would go here
    console.log({ rating, selectedChips, comment });
    navigate('/home');
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-xl">
      {/* TopAppBar */}
      <header className="sticky top-0 z-10 flex items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm p-4 pb-2 justify-between">
        <div
          onClick={() => navigate(-1)}
          className="text-primary dark:text-white flex size-12 shrink-0 items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back</span>
        </div>
        <h2 className="text-primary dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
          Rate Service
        </h2>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-6 pb-24">
        {/* ProfileHeader */}
        <div className="flex flex-col items-center mt-6 mb-8">
          <div className="relative group cursor-pointer">
            <div
              className="bg-center bg-no-repeat bg-cover rounded-full h-24 w-24 shadow-sm border-2 border-white dark:border-[#1a2629] ring-1 ring-black/5"
              style={{ backgroundImage: `url("${technician.avatar}")` }}
            />
            <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 border-2 border-white dark:border-background-dark flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">verified</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <h3 className="text-primary dark:text-white text-2xl font-bold leading-tight tracking-tight">{technician.name}</h3>
            <p className="text-[#57838e] dark:text-gray-400 text-sm font-medium mt-1">{technician.specialty}</p>
          </div>
        </div>

        {/* ReactionBar (Stars) */}
        <div className="flex flex-col items-center mb-8">
          <h3 className="text-primary dark:text-gray-200 text-lg font-bold leading-tight text-center mb-4">How was the service?</h3>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`hover:scale-110 transition-transform duration-200 ${star <= rating ? 'text-primary' : 'text-gray-300 dark:text-gray-600 hover:text-primary'}`}
              >
                <span
                  className="material-symbols-outlined fill-current"
                  style={{ fontVariationSettings: star <= rating ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 400", fontSize: '40px' }}
                >
                  star
                </span>
              </button>
            ))}
          </div>
          <p className="text-sm font-medium text-[#57838e] dark:text-gray-400 mt-2">{getRatingLabel(rating)}</p>
        </div>

        {/* Quick Feedback Chips */}
        <div className="mb-8">
          <p className="text-primary dark:text-gray-200 text-base font-bold leading-normal mb-3">What went well?</p>
          <div className="flex flex-wrap gap-3">
            {feedbackChips.map(chip => (
              <button
                key={chip.label}
                onClick={() => toggleChip(chip.label)}
                className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all active:scale-95 flex items-center gap-2 ${selectedChips.includes(chip.label)
                    ? 'bg-primary text-white border border-transparent'
                    : 'bg-white dark:bg-[#1a2629] border border-gray-200 dark:border-[#2d3b3e] text-primary dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
              >
                <span className="material-symbols-outlined text-[18px]">{chip.icon}</span>
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Comment Box */}
        <div className="flex-1 flex flex-col gap-3">
          <label className="text-primary dark:text-gray-200 text-base font-bold leading-normal" htmlFor="comment">
            Additional Comments
          </label>
          <div className="relative">
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 300))}
              className="w-full min-h-[140px] p-4 rounded-xl bg-white dark:bg-[#1a2629] border border-gray-200 dark:border-[#2d3b3e] text-primary dark:text-gray-100 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-shadow"
              placeholder="Share details about your experience..."
            />
            <div className="absolute bottom-3 right-3">
              <span className="text-xs text-gray-400">{comment.length}/300</span>
            </div>
          </div>

          {/* Add Photo Button */}
          <button className="flex items-center gap-3 w-full p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
            <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 group-hover:text-primary dark:group-hover:text-white transition-colors">
              <span className="material-symbols-outlined">add_a_photo</span>
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-primary dark:group-hover:text-white transition-colors">
              Add photos of the work
            </span>
          </button>
        </div>
      </main>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pt-2 border-t border-transparent z-20 max-w-md mx-auto">
        <button
          onClick={handleSubmit}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>Submit Review</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default Rating;
