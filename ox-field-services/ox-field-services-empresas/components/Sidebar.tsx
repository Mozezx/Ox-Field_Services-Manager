import React from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Truck, 
  Package, 
  CheckSquare, 
  CreditCard, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Users,
  UserPlus,
  Layers,
  Tag
} from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isCollapsed, toggleCollapse }) => {
  
  const navItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.DISPATCH, label: 'Dispatch', icon: Truck },
    { id: AppView.MAP, label: 'Map', icon: MapIcon },
    { id: AppView.TECNICOS, label: 'Technicians', icon: Users },
    { id: AppView.CLIENTS, label: 'Clients', icon: UserPlus },
    { id: AppView.CATEGORIES, label: 'Categories', icon: Layers },
    { id: AppView.LISTINGS, label: 'Listings', icon: Tag },
    { id: AppView.INVENTORY, label: 'Inventory', icon: Package },
    { id: AppView.APPROVALS, label: 'Approvals', icon: CheckSquare, activeMatch: [AppView.APPROVALS, AppView.APPROVALS_VERIFICATION] },
    { id: AppView.BILLING, label: 'Billing', icon: CreditCard },
  ];

  return (
    <aside 
      className={`
        fixed left-0 top-0 h-full bg-surface border-r border-white/5 transition-all duration-300 z-50
        ${isCollapsed ? 'w-20' : 'w-64'}
        flex flex-col justify-between
      `}
    >
      <div>
        {/* Header: logo + espaço do tamanho do botão (botão não fica ao lado da logo) */}
        <div className="h-16 flex items-center justify-center border-b border-white/5 px-4 relative">
          {!isCollapsed && (
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white w-full">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-[#0B242A]">
                Ox
              </div>
              <span className="truncate">Ox Field</span>
              {/* Espaço reservado (tamanho do botão de recolher), sem botão ao lado da logo */}
              <span className="w-7 h-7 shrink-0" aria-hidden />
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-[#0B242A] font-bold text-lg">
              Ox
            </div>
          )}
        </div>

        {/* Botão recolher: na borda do sidebar (linha vertical), não ao lado da logo */}
        <button
          type="button"
          onClick={toggleCollapse}
          title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          className="absolute -right-3 top-6 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-white text-[#0B242A] shadow-md border border-white/20 hover:bg-white hover:scale-110 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Nav Items */}
        <nav className="mt-6 flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const isActive = item.id === currentView || (item.activeMatch && item.activeMatch.includes(currentView));
            
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-[#0B242A] text-white shadow-inner border border-white/5' 
                    : 'text-secondary hover:text-white hover:bg-white/5'}
                `}
                title={isCollapsed ? item.label : ''}
              >
                <item.icon 
                  size={20} 
                  className={isActive ? 'text-primary' : 'text-current group-hover:text-primary transition-colors'} 
                />
                
                {!isCollapsed && (
                  <span className={`font-medium ${isActive ? 'text-white' : ''}`}>
                    {item.label}
                  </span>
                )}
                
                {isActive && !isCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
         <button 
           onClick={() => setView(AppView.LOGIN)}
           className={`
             flex items-center gap-3 px-3 py-3 rounded-xl w-full text-secondary hover:text-danger hover:bg-danger/10 transition-all duration-200
             ${isCollapsed ? 'justify-center' : ''}
           `}
         >
           <LogOut size={20} />
           {!isCollapsed && <span className="font-medium">Sign Out</span>}
         </button>
      </div>
    </aside>
  );
};