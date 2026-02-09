import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface ServiceInfo {
    name: string;
    description: string;
    price: string;
    rating: number;
    reviews: number;
    image: string;
    features: string[];
    category: string;
}

export const ServiceDetails = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Get service info from location state or use defaults
    const service: ServiceInfo = location.state?.service || {
        name: 'Standard AC Service',
        description: 'Our comprehensive AC service includes complete filter cleaning, gas level check, coil cleaning, and system performance assessment. Our certified technicians ensure your air conditioning runs at peak efficiency.',
        price: '$50',
        rating: 4.8,
        reviews: 234,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCVeqjpTwNtA-efwT979wb-DuDoDBPPpOYamzB52UDWFVbtAQOCNDfX1YaNnVl__2_DT4tCWxQS_AIhDz7WDR87PpKMefomo9hM6QvW98Vmkha8z5NdHWHODh1gH90O3qcn_ysfZ5R5xtC_67dXYff4n8hTjnn_MPOySXZ3JL61jPPXGjmo6TKi473_ZbMTelPfB9v1_iud2wz6ZdTjHwpw-hEegFcjYvvPucf0MsIAgAzK5J20bG8f2Cj9WfR8_ElcOw4YjZVfQ8',
        features: ['Filter cleaning & replacement', 'Gas level inspection', 'Performance optimization', '90-day service warranty'],
        category: 'AC Repair'
    };

    const handleBookNow = () => {
        navigate('/request', { state: { preselectedService: service } });
    };

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl overflow-hidden pb-28">
            {/* Hero Image */}
            <div className="relative w-full h-56 bg-gray-200">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${service.image}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-12 left-4 flex items-center justify-center size-10 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-sm text-primary dark:text-white shadow-lg hover:bg-white transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>

                {/* Favorite Button */}
                <button className="absolute top-12 right-4 flex items-center justify-center size-10 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-sm text-primary dark:text-white shadow-lg hover:bg-white transition-colors">
                    <span className="material-symbols-outlined">favorite_border</span>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 px-5 pt-5 -mt-6 bg-background-light dark:bg-background-dark rounded-t-[2rem] relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 dark:bg-white/10 text-primary dark:text-white rounded-full">
                                Popular
                            </span>
                            <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-yellow-500 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                <span className="text-sm font-bold text-primary dark:text-white">{service.rating}</span>
                                <span className="text-xs text-gray-500">({service.reviews} reviews)</span>
                            </div>
                        </div>
                        <h1 className="text-2xl font-extrabold text-primary dark:text-white tracking-tight">{service.name}</h1>
                    </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-3xl font-extrabold text-primary dark:text-white">{service.price}</span>
                    <span className="text-sm text-gray-500">starting price</span>
                </div>

                {/* Description */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-primary dark:text-white mb-2">About this service</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        {service.description}
                    </p>
                </div>

                {/* What's Included */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-primary dark:text-white mb-3">What's Included</h2>
                    <div className="space-y-3">
                        {service.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="flex items-center justify-center size-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                </div>
                                <span className="text-sm font-medium text-primary dark:text-white">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Provider Info */}
                <div className="bg-white dark:bg-[#1a2629] rounded-xl p-4 border border-gray-100 dark:border-gray-800 mb-6">
                    <div className="flex items-center gap-4">
                        <div
                            className="size-14 rounded-full bg-gray-200 dark:bg-gray-700 bg-cover bg-center"
                            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBA_5JqIbOdQhgiHdtNB8f3Ge8Zo9tXlmtb43Dk6zukRpL9G4s4ipG1AKr5RNWOKmcSIub0C1pDKn1LHzTxUXR9vm-VAKgIOEkf6dEpOmyLG28gOLaFj3hDsu4Pk8Gn32OAxt2T1gqnSJIqCVatN8dW7GaJKTUiqQ7W3u8aguTkVKS4NFvMSFLz7gBl_4jJ4jDH-FSn_ppk24HqFzR1HFTYsCmuZBsOn7kXFd2UWyoMl25r8hyhBbZj_TVZH-yEWVXK9wGZQzKGZlw')" }}
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-primary dark:text-white">Ox Certified Pro</h3>
                                <span className="material-symbols-outlined text-primary dark:text-white text-[16px]">verified</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Licensed & Insured</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 p-4 pb-8 z-50">
                <button
                    onClick={handleBookNow}
                    className="w-full bg-primary dark:bg-white text-white dark:text-primary font-bold h-14 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 dark:hover:bg-gray-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    Book Now
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
            </div>
        </div>
    );
};

export default ServiceDetails;
