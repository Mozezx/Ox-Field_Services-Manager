import React, { useState } from 'react';
import { CreditCard, FileText, Activity, Coins } from 'lucide-react';
import { MySubscriptionView, InvoicesView, CreditsView, UsageReportView } from './BillingViews';

type BillingTab = 'subscription' | 'invoices' | 'credits' | 'usage';

export const BillingContainer: React.FC = () => {
    const [activeTab, setActiveTab] = useState<BillingTab>('subscription');

    const tabs = [
        { id: 'subscription' as BillingTab, label: 'Assinatura', icon: CreditCard },
        { id: 'invoices' as BillingTab, label: 'Faturas', icon: FileText },
        { id: 'credits' as BillingTab, label: 'Créditos', icon: Coins },
        { id: 'usage' as BillingTab, label: 'Uso', icon: Activity },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'subscription':
                return <MySubscriptionView />;
            case 'invoices':
                return <InvoicesView />;
            case 'credits':
                return <CreditsView />;
            case 'usage':
                return <UsageReportView />;
            default:
                return <MySubscriptionView />;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header with Tabs */}
            <div className="bg-surface border-b border-white/5 sticky top-0 z-10">
                <div className="px-6 py-4">
                    <h1 className="text-2xl font-bold text-white mb-4">Billing & Assinatura</h1>
                    
                    <div className="flex gap-2">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all
                                        ${isActive 
                                            ? 'bg-primary text-[#0B242A] shadow-lg shadow-primary/20' 
                                            : 'text-text-secondary hover:text-white hover:bg-white/5'
                                        }
                                    `}
                                >
                                    <Icon size={18} />
                                    <span>{tab.label}</span>
                                    {isActive && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#0B242A]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="animate-fade-in">
                {renderContent()}
            </div>
        </div>
    );
};
