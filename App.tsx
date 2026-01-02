
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Map as MapIcon, FileText, Settings, PlusCircle, BrainCircuit, 
  TrendingUp, FileUp, ShieldCheck, Activity, History, Menu, X, Truck, Gavel, 
  Copy, EyeOff, Eye, Globe, LogOut, Cloud, RefreshCw, CheckCircle2, CloudOff
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import TripTable from './components/TripTable';
import TripMap from './components/TripMap';
import AIInsightsPanel from './components/AIInsightsPanel';
import CostSettings from './components/CostSettings';
import ImportPanel from './components/ImportPanel';
import DataQuality from './components/DataQuality';
import AuditLogs from './components/AuditLogs';
import FleetManager from './components/FleetManager';
import PolicyEngine from './components/PolicyEngine';
import TripTemplates from './components/TripTemplates';
import AuthPage from './components/AuthPage';
import { Trip, CostConfig, VehicleProfile, User } from './types';
import { MOCK_TRIPS, MOCK_VEHICLES } from './constants';
import { tripService, vehicleService, configService } from './services/apiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trips' | 'map' | 'ai' | 'cost' | 'import' | 'quality' | 'audit' | 'fleet' | 'policy' | 'templates'>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sync Status States
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<VehicleProfile[]>([]);
  const [costConfig, setCostConfig] = useState<CostConfig>({
    fuelPricePerLiter: 38.5,
    depreciationPerDay: 500,
    driverRatePerHour: 200,
    enableCO2: true,
    piiGuardActive: false
  });

  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [lang, setLang] = useState<'TH' | 'EN'>('TH');
  const [piiGuard, setPiiGuard] = useState(false);

  // Load Initial Data with graceful degradation
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Parallel fetching for speed
        const [savedTrips, savedVehicles, savedConfig] = await Promise.all([
          tripService.getAll(),
          vehicleService.getAll(),
          configService.get()
        ]);
        
        setTrips(savedTrips.length > 0 ? savedTrips : MOCK_TRIPS);
        setVehicles(savedVehicles.length > 0 ? savedVehicles : MOCK_VEHICLES);
        if (savedConfig) setCostConfig(savedConfig);
      } catch (err) {
        console.error("Initialization Error:", err);
        // Fallback to mocks if critical error
        setTrips(MOCK_TRIPS);
        setVehicles(MOCK_VEHICLES);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Intelligent Auto-Save with Debounce
  useEffect(() => {
    if (!isLoading && trips.length > 0) {
      setSyncStatus('syncing');
      const timeout = setTimeout(async () => {
        try {
          await tripService.save(trips);
          setSyncStatus('saved');
          setTimeout(() => setSyncStatus('idle'), 2000);
        } catch (e) {
          setSyncStatus('error');
        }
      }, 2000); // 2 seconds debounce
      return () => clearTimeout(timeout);
    }
  }, [trips, isLoading]);

  useEffect(() => {
    if (!isLoading && vehicles.length > 0) {
      vehicleService.save(vehicles);
    }
  }, [vehicles, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      configService.save(costConfig);
    }
  }, [costConfig, isLoading]);

  useEffect(() => {
    const session = localStorage.getItem('gov_session_active');
    if (session) {
      try {
        setCurrentUser(JSON.parse(session));
      } catch {
        localStorage.removeItem('gov_session_active');
      }
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('gov_session_active', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('gov_session_active');
  };

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 1024;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(width > 1280);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
    { id: 'trips', label: 'รายการเดินทาง', icon: FileText },
    { id: 'templates', label: 'เทมเพลตภารกิจ', icon: Copy },
    { id: 'map', label: 'Map Replay', icon: MapIcon },
    { id: 'ai', label: 'AI Analytics', icon: BrainCircuit },
    { id: 'fleet', label: 'จัดการยานพาหนะ', icon: Truck },
    { id: 'policy', label: 'นโยบายการเบิกจ่าย', icon: Gavel },
    { id: 'cost', label: 'ตั้งค่าต้นทุน', icon: Settings },
    { id: 'import', label: 'Import Data', icon: FileUp },
    { id: 'quality', label: 'คุณภาพข้อมูล', icon: Activity },
    { id: 'audit', label: 'Audit Trail', icon: History },
  ];

  const handleAddTrip = (newTrips: Trip[]) => {
    setTrips(prev => [...newTrips, ...prev]);
    setActiveTab('trips');
    if (isMobile) setSidebarOpen(false);
  };

  const handleUpdateTrip = (updatedTrip: Trip) => {
    setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
  };

  const handleDeleteTrip = (id: string) => {
    setTrips(prev => prev.filter(t => t.id !== id));
  };

  if (!currentUser) return <AuthPage onLogin={handleLogin} />;
  
  if (isLoading) return (
    <div className="h-screen flex items-center justify-center bg-[#002D62] text-white font-['Sarabun']">
      <div className="text-center space-y-6 animate-pulse">
        <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center text-[#002D62] font-black text-xl mx-auto shadow-2xl">BPP</div>
        <div className="space-y-2">
          <p className="font-bold tracking-widest uppercase text-xs">Connecting Secure Cloud...</p>
          <div className="flex justify-center gap-1">
             <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-75"/>
             <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-150"/>
             <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-300"/>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-['Sarabun']">
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`bg-[#002D62] text-white transition-all duration-300 z-50 flex flex-col shadow-2xl ${isMobile ? 'fixed h-full' : 'relative'} ${isSidebarOpen ? 'w-64 translate-x-0' : isMobile ? 'w-64 -translate-x-full' : 'w-20 translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between border-b border-white/10 shrink-0">
          {(isSidebarOpen || !isMobile) && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-[#002D62] font-black text-xs leading-none">BPP</div>
              <div className="flex flex-col">
                <span className="font-bold text-base leading-tight tracking-tight text-white">งานยานพาหนะ</span>
                <span className="font-medium text-xs leading-tight text-white/60">และขนส่ง</span>
              </div>
            </div>
          )}
          {isMobile && <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg"><X size={20} /></button>}
        </div>
        
        <nav className="flex-1 mt-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id as any); if (isMobile) setSidebarOpen(false); }} className={`w-full flex items-center p-3 rounded-xl transition-all duration-300 group relative ${activeTab === item.id ? 'bg-amber-600 text-white shadow-lg' : 'hover:bg-white/5 text-slate-300 hover:text-white'}`}>
              <item.icon size={20} className={`shrink-0 ${activeTab === item.id ? 'text-white' : 'text-amber-400/80 group-hover:text-amber-400'}`} />
              {(isSidebarOpen || isMobile) && <span className="ml-4 font-bold text-sm whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/10 shrink-0">
            <button onClick={handleLogout} className={`w-full flex items-center p-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all ${!isSidebarOpen && !isMobile ? 'justify-center' : ''}`}>
              <LogOut size={20} />
              {(isSidebarOpen || isMobile) && <span className="ml-4 font-bold text-sm">ออกจากระบบ</span>}
            </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-8 shadow-sm z-20 shrink-0">
          <div className="flex items-center gap-2 md:gap-6">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><Menu size={22} /></button>
            <h2 className="text-sm md:text-xl font-bold text-[#002D62] tracking-tight line-clamp-1">{menuItems.find(i => i.id === activeTab)?.label}</h2>
          </div>
          <div className="flex items-center gap-2 md:gap-5">
            {/* Sync Status Indicator */}
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-full border bg-slate-50 border-slate-100 transition-all duration-500">
               {syncStatus === 'syncing' && (
                 <>
                   <RefreshCw size={14} className="text-blue-500 animate-spin" />
                   <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Syncing</span>
                 </>
               )}
               {syncStatus === 'saved' && (
                 <>
                   <CheckCircle2 size={14} className="text-emerald-500" />
                   <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Saved</span>
                 </>
               )}
               {syncStatus === 'error' && (
                 <>
                   <CloudOff size={14} className="text-amber-500" />
                   <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Offline</span>
                 </>
               )}
               {syncStatus === 'idle' && (
                 <>
                   <Cloud size={14} className="text-slate-400" />
                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cloud Ready</span>
                 </>
               )}
            </div>

            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-100">
              <div className="flex flex-col items-end mr-2">
                 <span className="text-sm font-bold text-[#002D62]">{currentUser?.fullName}</span>
                 <span className="text-[10px] font-medium text-slate-400">{currentUser?.position}</span>
              </div>
              <button onClick={() => setPiiGuard(!piiGuard)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${piiGuard ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {piiGuard ? <EyeOff size={12} /> : <Eye size={12} />} PII GUARD
              </button>
              <button onClick={() => setLang(lang === 'TH' ? 'EN' : 'TH')} className="px-2 py-1.5 hover:bg-slate-50 rounded-lg text-[10px] font-bold text-slate-600 border border-transparent hover:border-slate-200 transition-all">
                <Globe size={14} className="text-amber-500" /> {lang}
              </button>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#002D62] shadow-sm"><ShieldCheck size={20} /></div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F8FAFC] custom-scrollbar">
          <div className="max-w-full lg:max-w-7xl mx-auto pb-20">
            {activeTab === 'dashboard' && <Dashboard trips={trips} onNavigateToAI={() => setActiveTab('ai')} />}
            {activeTab === 'trips' && <TripTable trips={trips} vehicles={vehicles} piiGuard={piiGuard} onDelete={handleDeleteTrip} onAddTrip={handleAddTrip} onUpdateTrip={handleUpdateTrip} />}
            {activeTab === 'map' && <TripMap trips={trips} />}
            {activeTab === 'ai' && <AIInsightsPanel trips={trips} />}
            {activeTab === 'cost' && <CostSettings config={costConfig} setConfig={setCostConfig} vehicles={vehicles} setVehicles={setVehicles} />}
            {activeTab === 'import' && <ImportPanel onImport={handleAddTrip} />}
            {activeTab === 'quality' && <DataQuality trips={trips} onUpdateTrips={setTrips} />}
            {activeTab === 'audit' && <AuditLogs />}
            {activeTab === 'fleet' && <FleetManager vehicles={vehicles} onAddVehicle={(v) => setVehicles([...vehicles, v])} onEditVehicle={(v) => setVehicles(vehicles.map(ov => ov.id === v.id ? v : ov))} onDeleteVehicle={(id) => setVehicles(vehicles.filter(v => v.id !== id))} />}
            {activeTab === 'policy' && <PolicyEngine />}
            {activeTab === 'templates' && <TripTemplates onUse={(t) => handleAddTrip([{ ...MOCK_TRIPS[0], id: 'T-'+Date.now(), missionName: t.name } as Trip])} />}
          </div>
        </div>
      </main>

      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }`}</style>
    </div>
  );
};

export default App;
