import React, { useState, useEffect, useRef, DragEvent } from 'react';
import {
  Search, ChevronLeft, ChevronRight, Calendar, Plus, Filter,
  Loader2, X, Clock, MapPin, User, Edit2, CheckCircle, AlertCircle, Undo2
} from 'lucide-react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { Button } from '../components/Button';
import { empresaService, Technician, ServiceOrder, ServiceCategory } from '../services/empresa';

const GOOGLE_MAPS_LIBS: ('places')[] = ['places'];

// ==================== TYPES ====================

interface TechnicianWithSchedule extends Technician {
  orders: ScheduledOrder[];
}

interface ScheduledOrder extends ServiceOrder {
  startHour: number; // 8-19
  durationHours: number;
}

interface DispatchState {
  selectedDate: Date;
  viewMode: 'day' | 'week' | 'month';
  technicians: TechnicianWithSchedule[];
  unassignedOrders: ServiceOrder[];
  filters: { zone?: string; skill?: string };
  loading: boolean;
  error: string | null;
}

// ==================== CONSTANTS ====================

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 to 19:00
const ROW_HEIGHT = 96; // h-24 = 96px
const HOUR_WIDTH = 100; // percentage divided by 12 hours

// ==================== HELPER FUNCTIONS ====================

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatHour = (hour: number): string => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${String(displayHour).padStart(2, '0')}:00 ${period}`;
};

/** Normalized status check: API returns lowercase e.g. "scheduled", "in_progress", "completed". */
const isScheduled = (status: string | undefined) => status?.toLowerCase() === 'scheduled';
const isInProgress = (status: string | undefined) => status?.toLowerCase() === 'in_progress';
const isCompleted = (status: string | undefined) => status?.toLowerCase() === 'completed';

const getStatusColor = (status: string) => {
  const s = status?.toLowerCase();
  switch (s) {
    case 'in_progress':
      return { bg: 'bg-sky-600/20', border: 'border-sky-500', text: 'text-sky-100', icon: 'text-sky-300' };
    case 'completed':
      return { bg: 'bg-emerald-600/20', border: 'border-emerald-500', text: 'text-emerald-100', icon: 'text-emerald-300' };
    case 'scheduled':
    default:
      return { bg: 'bg-amber-600/20', border: 'border-amber-500', text: 'text-amber-100', icon: 'text-amber-300' };
  }
};

const parseTimeToHour = (timeStr?: string): number => {
  if (!timeStr) return 9;
  const [hours] = timeStr.split(':');
  return parseInt(hours) || 9;
};

// ==================== MAIN COMPONENT ====================

export const DispatchConsole: React.FC = () => {
  const [state, setState] = useState<DispatchState>({
    selectedDate: new Date(),
    viewMode: 'day',
    technicians: [],
    unassignedOrders: [],
    filters: {},
    loading: true,
    error: null
  });

  const [draggedOrder, setDraggedOrder] = useState<ServiceOrder | null>(null);
  const [dropTarget, setDropTarget] = useState<{ techId: string; hour: number } | null>(null);
  const [dropTargetUnassigned, setDropTargetUnassigned] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ScheduledOrder | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [leftPanelWidth, setLeftPanelWidth] = useState(320);
  const [resizingPanel, setResizingPanel] = useState(false);
  const panelResizeStartRef = useRef({ x: 0, w: 320 });

  const [unassignedTowerWidth, setUnassignedTowerWidth] = useState(280);
  const [resizingUnassignedTower, setResizingUnassignedTower] = useState(false);
  const unassignedTowerResizeRef = useRef({ x: 0, w: 280 });

  const [technicianRowHeights, setTechnicianRowHeights] = useState<Record<string, number>>({});
  const [resizingRow, setResizingRow] = useState<{ type: 'tech'; techId: string } | null>(null);
  const rowResizeStartRef = useRef({ y: 0, height: 0 });

  const [resizingOrder, setResizingOrder] = useState<{
    techId: string; orderId: string; edge: 'left' | 'right';
    startStartHour: number; startDurationHours: number;
  } | null>(null);
  const lastOrderResizeRef = useRef<{ startHour: number; durationHours: number } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const gridInnerRef = useRef<HTMLDivElement>(null);

  // ==================== PANEL RESIZE ====================

  useEffect(() => {
    if (!resizingPanel) return;
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - panelResizeStartRef.current.x;
      const nextW = panelResizeStartRef.current.w + delta;
      setLeftPanelWidth(Math.min(500, Math.max(240, nextW)));
    };
    const onUp = () => setResizingPanel(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [resizingPanel]);

  // ==================== UNASSIGNED TOWER RESIZE ====================

  useEffect(() => {
    if (!resizingUnassignedTower) return;
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - unassignedTowerResizeRef.current.x;
      const nextW = unassignedTowerResizeRef.current.w + delta;
      setUnassignedTowerWidth(Math.min(450, Math.max(180, nextW)));
      unassignedTowerResizeRef.current.x = e.clientX;
      unassignedTowerResizeRef.current.w = Math.min(450, Math.max(180, nextW));
    };
    const onUp = () => setResizingUnassignedTower(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [resizingUnassignedTower]);

  // ==================== ROW HEIGHT RESIZE (horizontal dividers) ====================

  useEffect(() => {
    if (!resizingRow) return;
    const onMove = (e: MouseEvent) => {
      if (resizingRow.type !== 'tech') return;
      const delta = e.clientY - rowResizeStartRef.current.y;
      const nextH = Math.min(240, Math.max(48, rowResizeStartRef.current.height + delta));
      setTechnicianRowHeights(prev => ({ ...prev, [resizingRow.techId]: nextH }));
      rowResizeStartRef.current.y = e.clientY;
      rowResizeStartRef.current.height = nextH;
    };
    const onUp = () => setResizingRow(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [resizingRow]);

  // ==================== ORDER BLOCK RESIZE ====================

  useEffect(() => {
    if (!resizingOrder || !gridInnerRef.current) return;
    const gridEl = gridInnerRef.current;
    const dateStr = state.selectedDate.toISOString().split('T')[0];
    const { techId, orderId, edge, startStartHour, startDurationHours } = resizingOrder;
    const endHour = startStartHour + startDurationHours;

    const onMove = (e: MouseEvent) => {
      const rect = gridEl.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const hour = 8 + percent * 12;

      if (edge === 'left') {
        const newStartHour = Math.max(8, Math.min(endHour - 0.5, hour));
        const newDurationHours = endHour - newStartHour;
        lastOrderResizeRef.current = { startHour: newStartHour, durationHours: newDurationHours };
        setState(prev => ({
          ...prev,
          technicians: prev.technicians.map(t =>
            t.id === techId
              ? { ...t, orders: t.orders.map(o => o.id === orderId ? { ...o, startHour: newStartHour, durationHours: newDurationHours } : o) }
              : t
          )
        }));
      } else {
        const newEndHour = Math.max(startStartHour + 0.5, Math.min(20, hour));
        const newDurationHours = newEndHour - startStartHour;
        lastOrderResizeRef.current = { startHour: startStartHour, durationHours: newDurationHours };
        setState(prev => ({
          ...prev,
          technicians: prev.technicians.map(t =>
            t.id === techId
              ? { ...t, orders: t.orders.map(o => o.id === orderId ? { ...o, durationHours: newDurationHours } : o) }
              : t
          )
        }));
      }
    };

    const onUp = async () => {
      if (edge === 'left' && lastOrderResizeRef.current) {
        try {
          const startTime = `${String(Math.floor(lastOrderResizeRef.current.startHour)).padStart(2, '0')}:00`;
          await empresaService.rescheduleOrder(orderId, dateStr, startTime);
        } catch (err) {
          console.error('Failed to reschedule:', err);
        }
      }
      lastOrderResizeRef.current = null;
      setResizingOrder(null);
      await fetchDispatchData();
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [resizingOrder, state.selectedDate]);

  // ==================== DATA FETCHING ====================

  useEffect(() => {
    fetchDispatchData();
  }, [state.selectedDate]);

  const fetchDispatchData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const dateStr = state.selectedDate.toISOString().split('T')[0];

      // Fetch calendar and unassigned orders in parallel
      const [calendarData, unassignedData] = await Promise.all([
        empresaService.getCalendar(dateStr).catch(() => []),
        empresaService.getUnassignedOrders().catch(() => [])
      ]);

      // Transform calendar data to TechnicianWithSchedule format
      const techniciansWithSchedule: TechnicianWithSchedule[] = calendarData.map(entry => ({
        id: entry.technicianId,
        userId: entry.technicianId,
        name: entry.technicianName,
        email: '',
        phone: '',
        role: 'TECNICO',
        status: 'APPROVED' as const,
        skills: entry.skills || [],
        rating: 0,
        isOnline: entry.isOnline || false,
        avatarUrl: entry.technicianAvatar,
        createdAt: '',
        orders: (entry.orders || []).map(order => ({
          ...order,
          startHour: parseTimeToHour(order.scheduledStartTime),
          durationHours: Math.ceil((order.estimatedDuration || 60) / 60)
        }))
      }));

      setState(prev => ({
        ...prev,
        technicians: techniciansWithSchedule,
        unassignedOrders: unassignedData,
        loading: false
      }));
    } catch (err) {
      console.error('Failed to fetch dispatch data:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load dispatch data'
      }));
    }
  };

  // ==================== DATE NAVIGATION ====================

  const goToToday = () => {
    setState(prev => ({ ...prev, selectedDate: new Date() }));
  };

  const goToPreviousDay = () => {
    const newDate = new Date(state.selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setState(prev => ({ ...prev, selectedDate: newDate }));
  };

  const goToNextDay = () => {
    const newDate = new Date(state.selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setState(prev => ({ ...prev, selectedDate: newDate }));
  };

  // ==================== DRAG AND DROP ====================

  const handleDragStart = (e: DragEvent, order: ServiceOrder) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', order.id);
  };

  const handleDragEnd = () => {
    setDraggedOrder(null);
    setDropTarget(null);
    setDropTargetUnassigned(false);
  };

  const isOrderFromGrid = (order: ServiceOrder | null) =>
    order && state.technicians.some(t => t.orders.some(o => o.id === order.id));

  const canUnassign = (order: ServiceOrder) => isScheduled(order.status);

  const handleUnassign = async (orderId: string) => {
    try {
      await empresaService.unassignOrder(orderId);
      setSelectedOrder(null);
      await fetchDispatchData();
    } catch (err) {
      console.error('Failed to unassign order:', err);
      alert('Failed to unassign order. Please try again.');
    }
  };

  const handleUnassignedTowerDragOver = (e: DragEvent) => {
    if (!draggedOrder || !canUnassign(draggedOrder)) return;
    if (!isOrderFromGrid(draggedOrder)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetUnassigned(true);
  };

  const handleUnassignedTowerDragLeave = () => {
    setDropTargetUnassigned(false);
  };

  const handleUnassignedTowerDrop = async (e: DragEvent) => {
    e.preventDefault();
    setDropTargetUnassigned(false);
    if (!draggedOrder || !canUnassign(draggedOrder) || !isOrderFromGrid(draggedOrder)) return;
    try {
      await handleUnassign(draggedOrder.id);
    } catch (err) {
      // handleUnassign already shows alert
    } finally {
      setDraggedOrder(null);
    }
  };

  const handleDragOver = (e: DragEvent, techId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Calculate hour from position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const hour = Math.floor(percentage * 12) + 8;

    setDropTarget({ techId, hour: Math.max(8, Math.min(hour, 19)) });
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e: DragEvent, techId: string) => {
    e.preventDefault();

    if (!draggedOrder || !dropTarget) return;

    try {
      // Call API to assign order and schedule in one step
      const startTime = `${String(dropTarget.hour).padStart(2, '0')}:00`;
      await empresaService.assignAndSchedule(
        draggedOrder.id,
        techId,
        state.selectedDate.toISOString().split('T')[0],
        startTime
      );

      // Refresh data
      await fetchDispatchData();
    } catch (err) {
      console.error('Failed to assign order:', err);
      alert('Failed to assign order. Please try again.');
    }

    setDraggedOrder(null);
    setDropTarget(null);
  };

  // ==================== CURRENT TIME INDICATOR ====================

  const getCurrentTimePosition = (): number => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    if (hours < 8 || hours >= 20) return -1;

    const totalMinutes = (hours - 8) * 60 + minutes;
    const totalDayMinutes = 12 * 60; // 8:00 to 20:00

    return (totalMinutes / totalDayMinutes) * 100;
  };

  const currentTimePosition = getCurrentTimePosition();
  const isToday = state.selectedDate.toDateString() === new Date().toDateString();

  // ==================== FILTERED DATA ====================

  const filteredTechnicians = state.technicians.filter(tech => {
    if (searchTerm && !tech.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (state.filters.skill && !tech.skills.includes(state.filters.skill)) {
      return false;
    }
    return true;
  });

  // ==================== RENDER ====================

  return (
    <div className={`h-full flex flex-col bg-background-dark overflow-hidden ${resizingOrder ? 'cursor-ew-resize select-none' : ''} ${resizingRow ? 'cursor-row-resize select-none' : ''}`}>
      {/* Control Toolbar */}
      <div className="flex shrink-0 flex-col md:flex-row justify-between items-start md:items-center gap-4 px-6 py-3 border-b border-border-dark bg-surface-dark z-10">
        {/* Left: Date Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={goToToday}
            className="flex items-center justify-center h-9 px-3 bg-primary-light border border-border-dark rounded-lg text-white text-sm font-bold hover:bg-surface-dark transition-colors"
          >
            <Calendar size={16} className="mr-1" />
            Today
          </button>

          <div className="flex items-center bg-background-dark rounded-lg border border-border-dark p-0.5">
            <button
              onClick={goToPreviousDay}
              className="size-8 flex items-center justify-center text-text-secondary hover:text-white hover:bg-surface-dark rounded transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2 px-3 min-w-[140px] justify-center">
              <Calendar size={16} className="text-text-secondary" />
              <span className="text-sm font-medium text-white">{formatDate(state.selectedDate)}</span>
            </div>
            <button
              onClick={goToNextDay}
              className="size-8 flex items-center justify-center text-text-secondary hover:text-white hover:bg-surface-dark rounded transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="h-6 w-[1px] bg-border-dark mx-2 hidden md:block" />

          <div className="flex items-center bg-background-dark rounded-lg border border-border-dark p-0.5 text-xs font-medium">
            <button
              onClick={() => setState(prev => ({ ...prev, viewMode: 'day' }))}
              className={`px-3 py-1.5 rounded transition-colors ${state.viewMode === 'day' ? 'bg-surface-dark text-white shadow-sm' : 'text-text-secondary hover:text-white hover:bg-surface-dark'}`}
            >
              Day
            </button>
            <button
              onClick={() => setState(prev => ({ ...prev, viewMode: 'week' }))}
              className={`px-3 py-1.5 rounded transition-colors ${state.viewMode === 'week' ? 'bg-surface-dark text-white shadow-sm' : 'text-text-secondary hover:text-white hover:bg-surface-dark'}`}
            >
              Week
            </button>
            <button
              onClick={() => setState(prev => ({ ...prev, viewMode: 'month' }))}
              className={`px-3 py-1.5 rounded transition-colors ${state.viewMode === 'month' ? 'bg-surface-dark text-white shadow-sm' : 'text-text-secondary hover:text-white hover:bg-surface-dark'}`}
            >
              Month
            </button>
          </div>
        </div>

        {/* Right: Legend & Filters */}
        <div className="flex items-center gap-3 overflow-x-auto max-w-full">
          <div className="flex items-center gap-4 px-2">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-amber-500" />
              <span className="text-xs text-text-secondary">Scheduled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-sky-500" />
              <span className="text-xs text-text-secondary">In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-text-secondary">Completed</span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-border-dark mx-1" />

          <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-background-dark border border-border-dark px-3 hover:border-text-secondary transition-colors">
            <span className="text-white text-sm font-medium">All Zones</span>
            <ChevronRight size={16} className="text-text-secondary rotate-90" />
          </button>

          <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-background-dark border border-border-dark px-3 hover:border-text-secondary transition-colors">
            <span className="text-white text-sm font-medium">All Skills</span>
            <ChevronRight size={16} className="text-text-secondary rotate-90" />
          </button>

          <Button variant="primary" onClick={() => setShowNewOrderModal(true)}>
            <Plus size={16} />
            New Order
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* TORRE: Unassigned Orders (ao lado do sidebar da app) - toda a secção é zona de drop */}
        <section
          className={`flex flex-col border-r border-border-dark bg-surface-dark shrink-0 overflow-hidden z-10 shadow-[4px_0_24px_rgba(0,0,0,0.15)] transition-colors ${dropTargetUnassigned ? 'bg-amber-500/10 border-2 border-dashed border-amber-500/50 rounded' : ''}`}
          style={{ width: unassignedTowerWidth }}
          onDragOver={handleUnassignedTowerDragOver}
          onDragLeave={handleUnassignedTowerDragLeave}
          onDrop={handleUnassignedTowerDrop}
        >
          <div className="shrink-0 px-4 py-3 border-b border-border-dark bg-primary-light/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Unassigned Orders ({state.unassignedOrders.length})
              </h3>
              <button type="button" className="text-accent hover:text-white transition-colors" title="Filtrar">
                <Filter size={14} />
              </button>
            </div>
            <p className="text-[10px] text-text-secondary mt-1">Arraste ordens agendadas da grelha para aqui para desatribuir.</p>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-3 space-y-2">
            {state.unassignedOrders.map(order => (
              <div
                key={order.id}
                draggable
                onDragStart={(e) => handleDragStart(e, order)}
                onDragEnd={handleDragEnd}
                className="bg-background-dark p-3 rounded border border-border-dark hover:border-amber-500/50 cursor-move group relative shadow-sm transition-colors"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-amber-500">#{order.orderNumber || order.id.slice(0, 8)}</span>
                  <span className="text-[10px] text-text-secondary bg-surface-dark px-1 rounded">
                    {Math.ceil((order.estimatedDuration || 60) / 60)}h
                  </span>
                </div>
                <p className="text-xs text-white truncate font-medium">{order.title}</p>
                <p className="text-[10px] text-text-secondary truncate mt-0.5">
                  {order.customer?.name || 'Unknown Customer'}
                </p>
                <span className="absolute top-1/2 -translate-y-1/2 right-2 text-text-secondary text-sm opacity-0 group-hover:opacity-100">
                  ⋮⋮
                </span>
              </div>
            ))}
            {state.unassignedOrders.length === 0 && !state.loading && (
              <div className="text-center text-text-secondary text-xs py-8">
                No unassigned orders
              </div>
            )}
          </div>
        </section>

        <div
          role="separator"
          aria-orientation="vertical"
          className={`shrink-0 w-1.5 flex flex-col items-center justify-center bg-border-dark hover:bg-accent/50 cursor-col-resize select-none z-20 transition-colors ${resizingUnassignedTower ? 'bg-accent' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault();
            unassignedTowerResizeRef.current = { x: e.clientX, w: unassignedTowerWidth };
            setResizingUnassignedTower(true);
          }}
        >
          <div className="w-0.5 h-12 rounded-full bg-white/30" />
        </div>

        {/* Lista de Técnicos */}
        <aside
          className="flex flex-col border-r border-border-dark bg-background-dark shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.2)] overflow-hidden"
          style={{ width: leftPanelWidth }}
        >
          {/* Search Techs - labels somem quando painel fecha (overflow hidden) */}
          <div className="h-28 shrink-0 p-4 border-b border-border-dark flex flex-col justify-center overflow-hidden">
            <div className="relative min-w-0">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full min-w-0 bg-surface-dark border border-border-dark rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-text-secondary focus:ring-1 focus:ring-accent focus:border-accent outline-none"
                placeholder="Search Technicians..."
              />
            </div>
            <div className="mt-3 flex justify-between text-xs text-text-secondary font-medium uppercase tracking-wider overflow-hidden">
              <span className="truncate">Technician</span>
              <span className="truncate">Status</span>
            </div>
          </div>

          {/* Technician List + resize horizontal nas linhas */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
            {state.loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="animate-spin text-accent" size={24} />
              </div>
            ) : filteredTechnicians.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-text-secondary text-sm">
                No technicians found
              </div>
            ) : (
              <>
                {filteredTechnicians.map((tech) => {
                  const rowH = technicianRowHeights[tech.id] ?? ROW_HEIGHT;
                  return (
                    <React.Fragment key={tech.id}>
                      <div
                        role="separator"
                        aria-orientation="horizontal"
                        className={`shrink-0 h-1.5 flex items-center justify-center bg-border-dark hover:bg-accent/50 cursor-row-resize select-none transition-colors ${resizingRow?.type === 'tech' && resizingRow.techId === tech.id ? 'bg-accent' : ''}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          rowResizeStartRef.current = { y: e.clientY, height: rowH };
                          setResizingRow({ type: 'tech', techId: tech.id });
                        }}
                        title="Ajustar altura da linha"
                      >
                        <div className="w-12 h-0.5 rounded-full bg-white/30" />
                      </div>
                      <div
                        className={`shrink-0 px-4 border-b border-border-dark flex items-center justify-between group hover:bg-surface-dark cursor-pointer transition-colors overflow-hidden ${tech.orders.length > 0 ? 'bg-surface-dark/30' : ''}`}
                        style={{ height: rowH - 2, minHeight: 46 }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            {tech.avatarUrl ? (
                              <img src={tech.avatarUrl} alt={tech.name} className="size-10 rounded-full bg-cover bg-center object-cover" />
                            ) : (
                              <div className="size-10 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold text-white">
                                {tech.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                            )}
                            <div className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-background-dark ${tech.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{tech.name}</p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {tech.skills.slice(0, 2).map(skill => (
                                <span key={skill} className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 font-medium">{skill}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-text-secondary">{tech.orders.length} jobs</span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </>
            )}
          </div>
        </aside>

        {/* Vertical resizer: drag to adjust Technician List width */}
        <div
          role="separator"
          aria-orientation="vertical"
          className={`shrink-0 w-1.5 flex flex-col items-center justify-center bg-border-dark hover:bg-accent/50 cursor-col-resize select-none z-20 transition-colors ${resizingPanel ? 'bg-accent' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault();
            panelResizeStartRef.current = { x: e.clientX, w: leftPanelWidth };
            setResizingPanel(true);
          }}
        >
          <div className="w-0.5 h-12 rounded-full bg-white/30" />
        </div>

        {/* Timeline Grid (painel de atribuição) */}
        <main className="flex-1 overflow-x-auto overflow-y-auto bg-background-dark relative min-w-0" ref={timelineRef}>
          <div className="min-w-[1200px] h-full flex flex-col relative">
            {/* Time Header */}
            <div className="flex h-28 border-b border-border-dark bg-surface-dark sticky top-0 z-10 items-end pb-2">
              {HOURS.map(hour => (
                <div key={hour} className="flex-1 border-r border-border-dark/50 flex items-center pl-2 text-xs font-medium text-text-secondary">
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {/* Grid Body */}
            <div ref={gridInnerRef} className="flex-1 relative bg-[linear-gradient(to_right,#2b3436_1px,transparent_1px)] bg-[size:8.33%_100%]">
              {/* Current Time Indicator */}
              {isToday && currentTimePosition >= 0 && (
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-accent z-20 pointer-events-none"
                  style={{ left: `${currentTimePosition}%` }}
                >
                  <div className="absolute -top-1.5 -left-[5px] size-3 bg-accent rounded-full" />
                  <div className="absolute top-2 left-1 bg-accent text-background-dark text-[10px] font-bold px-1 rounded whitespace-nowrap">
                    {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}

              {/* Technician Rows (altura sincronizada com o painel esquerdo) */}
              {filteredTechnicians.map((tech) => {
                const rowH = technicianRowHeights[tech.id] ?? ROW_HEIGHT;
                return (
                <div
                  key={tech.id}
                  className={`border-b border-border-dark/30 relative hover:bg-white/5 transition-colors shrink-0 ${dropTarget?.techId === tech.id ? 'bg-accent/10' : ''}`}
                  style={{ height: rowH }}
                  onDragOver={(e) => handleDragOver(e, tech.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, tech.id)}
                >
                  {/* Drop indicator */}
                  {dropTarget?.techId === tech.id && (
                    <div
                      className="absolute top-3 bottom-3 w-20 bg-accent/20 border-2 border-dashed border-accent rounded pointer-events-none z-10"
                      style={{ left: `${((dropTarget.hour - 8) / 12) * 100}%` }}
                    />
                  )}

                  {/* Order Cards */}
                  {tech.orders.map(order => {
                    const colors = getStatusColor(order.status);
                    const leftPercent = ((order.startHour - 8) / 12) * 100;
                    const widthPercent = (order.durationHours / 12) * 100;
                    const isResizing = resizingOrder?.orderId === order.id;

                    const handleResizeStart = (e: React.MouseEvent, edge: 'left' | 'right') => {
                      e.preventDefault();
                      e.stopPropagation();
                      setResizingOrder({
                        techId: tech.id,
                        orderId: order.id,
                        edge,
                        startStartHour: order.startHour,
                        startDurationHours: order.durationHours
                      });
                    };

                    return (
                      <div
                        key={order.id}
                        className={`absolute top-3 bottom-3 rounded overflow-visible ${isResizing ? 'z-30' : ''}`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${Math.max(widthPercent - 0.5, 5)}%`
                        }}
                      >
                        {/* Left resize handle */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-2 -ml-0.5 cursor-ew-resize resize-handle z-10 flex items-center justify-center group/handle"
                          onMouseDown={(e) => handleResizeStart(e, 'left')}
                          title="Ajustar início"
                        >
                          <div className="w-0.5 h-8 rounded-full bg-white/0 group-hover/handle:bg-white/50 transition-colors" />
                        </div>
                        {/* Right resize handle */}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 -mr-0.5 cursor-ew-resize resize-handle z-10 flex items-center justify-center group/handle"
                          onMouseDown={(e) => handleResizeStart(e, 'right')}
                          title="Ajustar duração"
                        >
                          <div className="w-0.5 h-8 rounded-full bg-white/0 group-hover/handle:bg-white/50 transition-colors" />
                        </div>
                        <div
                          role="button"
                          tabIndex={0}
                          draggable={isScheduled(order.status)}
                          onDragStart={(e) => handleDragStart(e, order)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setSelectedOrder(order)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedOrder(order); } }}
                          className={`w-full h-full rounded ${colors.bg} border-l-4 ${colors.border} hover:brightness-110 p-2 overflow-hidden shadow-sm group text-left transition-all ${isScheduled(order.status) ? 'cursor-move' : 'cursor-pointer'} ${draggedOrder?.id === order.id ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-bold ${colors.text}`}>
                              #{order.orderNumber || order.id.slice(0, 8)}
                            </span>
                            {isInProgress(order.status) && (
                              <Loader2 size={12} className={`${colors.icon} animate-spin`} />
                            )}
                            {isCompleted(order.status) && (
                              <CheckCircle size={12} className={colors.icon} />
                            )}
                            {isScheduled(order.status) && (
                              <Clock size={12} className={colors.icon} />
                            )}
                          </div>
                          <p className={`text-xs ${colors.text} font-medium truncate`}>{order.title}</p>
                          <p className={`text-[10px] ${colors.icon} truncate`}>{order.customer?.name}</p>
                          <div className="hidden group-hover:flex absolute top-1 right-1 gap-1">
                            {canUnassign(order) && (
                              <button
                                type="button"
                                className="p-0.5 rounded bg-black/40 hover:bg-black/60 text-white"
                                onClick={(ev) => { ev.stopPropagation(); handleUnassign(order.id); }}
                                title="Mover para não atribuídos"
                              >
                                <Undo2 size={10} />
                              </button>
                            )}
                            <button type="button" className="p-0.5 rounded bg-black/40 hover:bg-black/60 text-white" onClick={(ev) => ev.stopPropagation()}>
                              <Edit2 size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                );
              })}

              {/* Empty state */}
              {filteredTechnicians.length === 0 && !state.loading && (
                <div className="absolute inset-0 flex items-center justify-center text-text-secondary">
                  No technicians available
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onRefresh={fetchDispatchData}
          onUnassign={() => handleUnassign(selectedOrder.id)}
        />
      )}

      {/* New Order Modal */}
      {showNewOrderModal && (
        <NewOrderModal
          technicians={state.technicians}
          selectedDate={state.selectedDate}
          onClose={() => setShowNewOrderModal(false)}
          onCreated={fetchDispatchData}
        />
      )}
    </div>
  );
};

// ==================== ORDER DETAIL MODAL ====================

interface OrderDetailModalProps {
  order: ScheduledOrder;
  onClose: () => void;
  onRefresh: () => void;
  onUnassign: () => void | Promise<void>;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose, onRefresh, onUnassign }) => {
  const colors = getStatusColor(order.status);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-surface">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              {order.title}
              <span className="text-secondary font-normal text-base">#{order.orderNumber || order.id.slice(0, 8)}</span>
            </h2>
            <div className="flex items-center gap-2 text-xs mt-1">
              <span className={`w-2 h-2 rounded-full ${isInProgress(order.status) ? 'bg-sky-500 animate-pulse' :
                  isCompleted(order.status) ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
              <span className="text-secondary">{order.status}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-white bg-white/5 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex gap-3">
              <User className="text-primary mt-0.5" size={18} />
              <div>
                <label className="block text-xs text-secondary">Customer</label>
                <div className="text-white font-medium">{order.customer?.name || 'Unknown'}</div>
                <div className="text-xs text-secondary">{order.customer?.address || 'No address'}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <Clock className="text-primary mt-0.5" size={18} />
              <div>
                <label className="block text-xs text-secondary">Schedule</label>
                <div className="text-white font-medium">{order.scheduledDate}</div>
                <div className="text-xs text-secondary">
                  {formatHour(order.startHour)} - {formatHour(order.startHour + order.durationHours)}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <MapPin className="text-primary mt-0.5" size={18} />
              <div>
                <label className="block text-xs text-secondary">Category</label>
                <div className="text-white font-medium">
                  {typeof order.category === 'object' && order.category?.name ? order.category.name : (order.category || 'General')}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <AlertCircle className="text-primary mt-0.5" size={18} />
              <div>
                <label className="block text-xs text-secondary">Priority</label>
                <div className="text-white font-medium">{order.priority || 'MEDIUM'}</div>
              </div>
            </div>
          </div>

          {order.description && (
            <div className="p-4 bg-black/20 rounded-lg border border-white/5">
              <h4 className="text-xs font-bold text-white mb-2">Description</h4>
              <p className="text-sm text-secondary">{order.description}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white/10 flex justify-between sm:justify-end gap-3">
          {isScheduled(order.status) && order.technician && (
            <Button variant="secondary" onClick={onUnassign} className="flex items-center gap-2">
              <Undo2 size={16} />
              Mover para não atribuídos
            </Button>
          )}
          <div className="flex gap-3 ml-auto">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button variant="primary">Edit Order</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== NEW ORDER MODAL ====================

interface NewOrderModalProps {
  technicians: TechnicianWithSchedule[];
  selectedDate: Date;
  onClose: () => void;
  onCreated: () => void;
}

const NewOrderModal: React.FC<NewOrderModalProps> = ({ technicians, selectedDate, onClose, onCreated }) => {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const { isLoaded: isMapsLoaded } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey || '',
    libraries: GOOGLE_MAPS_LIBS,
  });
  const addressAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const toDateStr = (d: Date) => d.toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    customerId: '',
    customerName: '',
    customerAddress: '',
    categoryId: '',
    priority: 'MEDIUM',
    technicianId: '',
    startTime: '09:00',
    duration: 60,
    scheduledDate: toDateStr(selectedDate)
  });
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ shareToken: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    setFormData(prev => ({ ...prev, scheduledDate: toDateStr(selectedDate) }));
  }, [selectedDate]);

  useEffect(() => {
    empresaService.getCategories()
      .then(list => {
        setCategories(list);
        if (list.length > 0) {
          setFormData(prev => ({ ...prev, categoryId: prev.categoryId || list[0].id }));
        }
      })
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false));
  }, []);

  useEffect(() => {
    empresaService.getClients()
      .then(list => setClients(list))
      .catch(() => setClients([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.customerName) {
      alert('Please fill in required fields');
      return;
    }
    if (!formData.categoryId) {
      alert('Please select a category');
      return;
    }
    const customerIdTrimmed = formData.customerId?.trim();
    if (clients.length > 0 && !customerIdTrimmed) {
      alert('Please select a client.');
      return;
    }
    if (!localStorage.getItem('token')?.trim()) {
      alert('Session expired or not logged in. Please log in again.');
      return;
    }

    try {
      setSubmitting(true);

      const created = await empresaService.createOrder({
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId,
        customerId: customerIdTrimmed || undefined,
        customerName: formData.customerName,
        customerAddress: formData.customerAddress,
        priority: formData.priority,
        scheduledDate: selectedDate.toISOString().split('T')[0],
        scheduledStartTime: formData.startTime,
        estimatedDuration: formData.duration,
        technicianId: formData.technicianId || undefined
      });

      const token = created?.shareToken ?? null;
      if (token) {
        setOrderSuccess({ shareToken: String(token) });
      } else {
        onCreated();
        onClose();
      }
    } catch (err: unknown) {
      console.error('Failed to create order:', err);
      const ax = err as { response?: { status?: number; data?: { details?: { exceptionMessage?: string; exceptionType?: string; rootCauseMessage?: string; rootCauseClass?: string }; message?: string } }; code?: string; message?: string };
      const status = ax?.response?.status;
      const details = ax?.response?.data?.details;
      if (status === 500 && details) {
        console.log('API 500 details', details);
      }
      if (status === 401) {
        alert('Session expired or not logged in. You will be redirected to login.');
      } else if (ax?.code === 'ECONNABORTED' || ax?.message?.includes('timeout')) {
        alert('Request timed out. The server is taking too long. Please try again.');
      } else if (status === 500) {
        const msg = details?.rootCauseMessage ?? details?.exceptionMessage ?? ax?.response?.data?.message;
        const type = details?.exceptionType ?? details?.rootCauseClass;
        const alertMsg = msg
          ? (type ? `Server error (${type}): ${msg}` : `Server error: ${msg}`)
          : 'Failed to create order. Please try again.';
        alert(alertMsg);
      } else if (status === 422) {
        const msg = ax?.response?.data?.message;
        alert(msg || 'Failed to create order. Please try again.');
      } else {
        alert('Failed to create order. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const clientAppBaseUrl = (import.meta.env.VITE_CLIENT_APP_URL as string) || '';
  const shareLink = orderSuccess
    ? `${clientAppBaseUrl.replace(/\/$/, '')}/#/order/${orderSuccess.shareToken}`
    : '';

  const handleCopyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      alert('Could not copy to clipboard');
    }
  };

  const handleCloseAfterSuccess = () => {
    setOrderSuccess(null);
    onCreated();
    onClose();
  };

  if (orderSuccess) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-surface w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
          <div className="h-14 shrink-0 border-b border-white/10 flex items-center justify-between px-6 bg-surface">
            <h2 className="text-lg font-bold text-white">Ordem criada</h2>
            <button type="button" onClick={handleCloseAfterSuccess} className="text-secondary hover:text-white p-1">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-secondary">Ordem criada. Envie o link ao cliente.</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" onClick={handleCopyLink} disabled={!shareLink}>
                {linkCopied ? 'Copiado!' : 'Copiar link'}
              </Button>
              <Button variant="secondary" onClick={handleCloseAfterSuccess}>Fechar</Button>
            </div>
            {shareLink && (
              <p className="text-xs text-secondary break-all">{shareLink}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="h-14 shrink-0 border-b border-white/10 flex items-center justify-between px-6 bg-surface">
          <h2 className="text-lg font-bold text-white">New Service Order</h2>
          <button type="button" onClick={onClose} className="text-secondary hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        {/* Form: conteúdo rolável para não cortar em telas pequenas */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="block text-xs text-secondary mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
                placeholder="e.g. HVAC Repair"
              />
            </div>

            <div>
              <label className="block text-xs text-secondary mb-1">Cliente</label>
              <select
                value={formData.customerId}
                onChange={(e) => {
                  const value = e.target.value;
                  const client = value ? clients.find(c => c.id === value) : null;
                  setFormData(prev => ({
                    ...prev,
                    customerId: value,
                    customerName: client ? (client.companyName || client.name) : prev.customerName,
                    customerAddress: client ? (client.primaryAddress || '') : prev.customerAddress
                  }));
                }}
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="">{clients.length === 0 ? 'Nenhum cliente' : 'Selecionar cliente...'}</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.companyName || c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-secondary mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="block text-xs text-secondary mb-1">Address</label>
                {isMapsLoaded && googleMapsApiKey ? (
                  <Autocomplete
                    onLoad={(autocomplete) => {
                      addressAutocompleteRef.current = autocomplete;
                    }}
                    onPlaceChanged={() => {
                      const place = addressAutocompleteRef.current?.getPlace();
                      const address = place?.formatted_address ?? place?.name ?? '';
                      if (address) setFormData(prev => ({ ...prev, customerAddress: address }));
                    }}
                    options={{ types: ['address'], fields: ['formatted_address', 'name', 'geometry'] }}
                  >
                    <input
                      type="text"
                      value={formData.customerAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                      className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none placeholder:text-gray-500"
                      placeholder="Search address with Google Maps..."
                    />
                  </Autocomplete>
                ) : (
                  <input
                    type="text"
                    value={formData.customerAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                    className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Address"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-secondary mb-1">Category</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
                  disabled={categoriesLoading}
                >
                  {categories.length === 0 && !categoriesLoading && <option value="">No categories</option>}
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-secondary mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-secondary mb-1">Scheduled Date *</label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-secondary mb-1">Start Time</label>
                <select
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
                >
                  {HOURS.map(h => (
                    <option key={h} value={`${String(h).padStart(2, '0')}:00`}>
                      {formatHour(h)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-secondary mb-1">Duration</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                  <option value={240}>4 hours</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-secondary mb-1">Assign to Technician (optional)</label>
              <select
                value={formData.technicianId}
                onChange={(e) => setFormData(prev => ({ ...prev, technicianId: e.target.value }))}
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="">Leave unassigned</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>{tech.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-secondary mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none h-20 resize-none"
                placeholder="Additional details..."
              />
            </div>
          </div>

          {/* Actions fixos no rodapé */}
          <div className="shrink-0 p-4 border-t border-white/10 flex justify-end gap-3 bg-surface">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Create Order'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
