import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface BookingInfo {
    orderId: string;
    serviceType: string;
    serviceIcon: string;
    date: string;
    time: string;
    address: string;
}

export const BookingSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Get booking info from location state or use defaults
    const booking: BookingInfo = location.state?.booking || {
        orderId: '#OX-2491',
        serviceType: 'HVAC Maintenance',
        serviceIcon: 'hvac',
        date: 'Oct 24',
        time: '10:00 AM',
        address: '123 Maple Ave, Springfield, IL 62704'
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#101719] dark:text-gray-100 antialiased overflow-x-hidden">
            <div className="relative flex min-h-screen w-full flex-col items-center justify-between p-6">
                {/* Main Content Area */}
                <div className="flex w-full max-w-md flex-1 flex-col items-center pt-12 md:justify-center md:pt-0">
                    {/* Hero Icon */}
                    <div className="mb-8 flex flex-col items-center">
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/40 animate-pulse">
                            <span
                                className="material-symbols-outlined text-[64px] text-primary dark:text-white"
                                style={{ fontVariationSettings: "'wght' 700" }}
                            >
                                check
                            </span>
                        </div>
                    </div>

                    {/* Headline Section */}
                    <div className="mb-10 text-center">
                        <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-primary dark:text-white md:text-4xl">
                            Booking Confirmed!
                        </h1>
                        <p className="text-base font-normal leading-relaxed text-[#57838e] dark:text-gray-400 max-w-[280px] mx-auto">
                            We've received your request and are processing it now.
                        </p>
                    </div>

                    {/* Summary Card */}
                    <div className="w-full overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:bg-[#1c2a2e] dark:shadow-none border border-gray-100 dark:border-[#2a383c]">
                        {/* Card Header */}
                        <div className="border-b border-gray-100 dark:border-[#2a383c] bg-primary/5 p-4 text-center">
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#57838e] dark:text-gray-400">
                                Order Summary
                            </p>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 divide-y divide-gray-100 dark:divide-[#2a383c] p-4">
                            {/* Row 1: Order ID & Date */}
                            <div className="flex justify-between py-3">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-[#57838e] dark:text-gray-400">Order ID</span>
                                    <span className="text-sm font-bold text-primary dark:text-white">{booking.orderId}</span>
                                </div>
                                <div className="flex flex-col gap-1 text-right">
                                    <span className="text-xs font-medium text-[#57838e] dark:text-gray-400">Date & Time</span>
                                    <span className="text-sm font-bold text-primary dark:text-white">{booking.date} • {booking.time}</span>
                                </div>
                            </div>

                            {/* Row 2: Service Type */}
                            <div className="flex flex-col gap-1 py-3">
                                <span className="text-xs font-medium text-[#57838e] dark:text-gray-400">Service Type</span>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg text-primary dark:text-white">{booking.serviceIcon}</span>
                                    <span className="text-sm font-bold text-primary dark:text-white">{booking.serviceType}</span>
                                </div>
                            </div>

                            {/* Row 3: Location */}
                            <div className="flex flex-col gap-1 py-3 pt-3">
                                <span className="text-xs font-medium text-[#57838e] dark:text-gray-400">Location</span>
                                <div className="flex items-start gap-2">
                                    <span className="material-symbols-outlined mt-0.5 text-lg text-primary dark:text-white">location_on</span>
                                    <span className="text-sm font-medium text-primary dark:text-white leading-snug">
                                        {booking.address}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Technician Note */}
                    <div className="mt-8 px-4 text-center">
                        <p className="text-sm font-medium leading-relaxed text-[#57838e] dark:text-gray-400">
                            We are currently assigning the best technician for your job. You will receive a notification once they are on the way.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex w-full max-w-md flex-col gap-3 pb-4">
                    {/* Primary Button */}
                    <button
                        onClick={() => navigate('/tracking')}
                        className="group relative flex h-14 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-primary text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 active:scale-[0.98]"
                    >
                        <span className="flex items-center gap-2 text-base font-bold tracking-wide">
                            <span className="material-symbols-outlined text-[20px]">location_searching</span>
                            Track My Service
                        </span>
                    </button>

                    {/* Secondary Button */}
                    <button
                        onClick={() => navigate('/home')}
                        className="group flex h-14 w-full cursor-pointer items-center justify-center rounded-xl border-2 border-primary/10 bg-transparent text-primary transition-all hover:bg-primary/5 active:scale-[0.98] dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                    >
                        <span className="text-base font-bold tracking-wide">Back to Home</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingSuccess;
