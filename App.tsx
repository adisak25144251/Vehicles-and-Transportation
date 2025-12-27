
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Map as MapIcon, FileText, Settings, PlusCircle, BrainCircuit, 
  TrendingUp, FileUp, ShieldCheck, Activity, History, Menu, X, Truck, Gavel, 
  Copy, EyeOff, Eye, Globe, LogOut, User as UserIcon
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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trips' | 'map' | 'ai' | 'cost' | 'import' | 'quality' | 'audit' | 'fleet' | 'policy' | 'templates'>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS as any[]);
  const [vehicles, setVehicles] = useState<VehicleProfile[]>(MOCK_VEHICLES as VehicleProfile[]);
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [lang, setLang] = useState<'TH' | 'EN'>('TH');
  const [piiGuard, setPiiGuard] = useState(false);
  const [costConfig, setCostConfig] = useState<CostConfig>({
    fuelPricePerLiter: 38.5,
    depreciationPerDay: 500,
    driverRatePerHour: 200,
    enableCO2: true,
    piiGuardActive: false
  });

  // Check Session on mount
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
      if (!mobile) {
        setSidebarOpen(width > 1280);
      } else {
        setSidebarOpen(false);
      }
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

  const handleUpdateAllTrips = (updatedTrips: Trip[]) => {
    setTrips(updatedTrips);
  };

  const handleDeleteTrip = (id: string) => {
    setTrips(prev => prev.filter(t => t.id !== id));
  };

  const handleAddVehicle = (v: VehicleProfile) => setVehicles(prev => [...prev, v]);
  const handleEditVehicle = (updatedV: VehicleProfile) => setVehicles(prev => prev.map(v => v.id === updatedV.id ? updatedV : v));
  const handleDeleteVehicle = (id: string) => setVehicles(prev => prev.filter(v => v.id !== id));

  // If NOT Logged in -> Force Login Page
  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard trips={trips} onNavigateToAI={() => setActiveTab('ai')} />;
      case 'trips': return (
        <TripTable 
          trips={trips} 
          vehicles={vehicles} 
          piiGuard={piiGuard} 
          onDelete={handleDeleteTrip} 
          onAddTrip={handleAddTrip}
          onUpdateTrip={handleUpdateTrip}
        />
      );
      case 'map': return <TripMap trips={trips} />;
      case 'ai': return <AIInsightsPanel trips={trips} />;
      case 'cost': return <CostSettings config={costConfig} setConfig={setCostConfig} vehicles={vehicles} setVehicles={setVehicles} />;
      case 'import': return <ImportPanel onImport={handleAddTrip} />;
      case 'quality': return <DataQuality trips={trips} onUpdateTrips={handleUpdateAllTrips} />;
      case 'audit': return <AuditLogs />;
      case 'fleet': return (
        <FleetManager 
          vehicles={vehicles} 
          onAddVehicle={handleAddVehicle} 
          onEditVehicle={handleEditVehicle} 
          onDeleteVehicle={handleDeleteVehicle}
        />
      );
      case 'policy': return <PolicyEngine />;
      case 'templates': return <TripTemplates onUse={(template) => {
        const demoTrip: Trip = {
          id: 'temp-' + Date.now(),
          missionName: template.name,
          purpose: template.purpose,
          department: 'กองยุทธศาสตร์',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          startLocation: { lat: 13.75, lng: 100.5, address: 'กทม.' },
          endLocation: { lat: 13.82, lng: 100.6, address: 'ปลายทาง' },
          stops: [],
          distanceKm: 15.5,
          durationMin: 45,
          participants: ['เจ้าหน้าที่ A'],
          vehicleId: template.defaultVehicleId || (vehicles.length > 0 ? vehicles[0].id : 'v1'),
          fuelCost: 60,
          allowance: 240,
          accommodation: 0,
          otherCosts: 20,
          efficiencyScore: 100,
          status: 'COMPLETED'
        };
        handleAddTrip([demoTrip]);
      }} />;
      default: return <Dashboard trips={trips} onNavigateToAI={() => setActiveTab('ai')} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-['Sarabun']">
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity backdrop-blur-sm" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside 
        className={`
          bg-[#002D62] text-white transition-all duration-300 z-50 flex flex-col shadow-2xl
          ${isMobile ? 'fixed h-full' : 'relative'}
          ${isSidebarOpen ? 'w-64 translate-x-0' : isMobile ? 'w-64 -translate-x-full' : 'w-20 translate-x-0'}
        `}
      >
        <div className="p-6 flex items-center justify-between border-b border-white/10 shrink-0">
          {(isSidebarOpen || !isMobile) && (
            <div className={`flex flex-col animate-in fade-in transition-opacity duration-300 ${!isSidebarOpen && !isMobile ? 'opacity-0' : 'opacity-100'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-[#002D62] font-black text-xs leading-none">BPP</div>
                <div className="flex flex-col">
                  <span className="font-bold text-base leading-tight tracking-tight text-white">งานยานพาหนะ</span>
                  <span className="font-medium text-xs leading-tight text-white/60">และขนส่ง</span>
                </div>
              </div>
            </div>
          )}
          {(!isSidebarOpen && !isMobile) && <div className="mx-auto text-amber-400 font-black text-xs">BPP</div>}
          
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg">
              <X size={20} />
            </button>
          )}
        </div>
        
        <nav className="flex-1 mt-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                if (isMobile) setSidebarOpen(false);
              }}
              className={`w-full flex items-center p-3 rounded-xl transition-all duration-300 group relative ${
                activeTab === item.id ? 'bg-amber-600 text-white shadow-lg' : 'hover:bg-white/5 text-slate-300 hover:text-white'
              }`}
            >
              <item.icon size={20} className={`shrink-0 ${activeTab === item.id ? 'text-white' : 'text-amber-400/80 group-hover:text-amber-400'}`} />
              {(isSidebarOpen || isMobile) && <span className="ml-4 font-bold text-sm tracking-normal whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/10 shrink-0">
            <button 
              onClick={handleLogout}
              className={`w-full flex items-center p-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all ${!isSidebarOpen && !isMobile ? 'justify-center' : ''}`}
            >
              <LogOut size={20} />
              {(isSidebarOpen || isMobile) && <span className="ml-4 font-bold text-sm tracking-normal">ออกจากระบบ</span>}
            </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-8 shadow-sm z-20 shrink-0">
          <div className="flex items-center gap-2 md:gap-6">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)} 
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 lg:hidden"
            >
              <Menu size={22} />
            </button>
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)} 
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hidden lg:block"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="text-sm md:text-xl font-bold text-[#002D62] tracking-tight line-clamp-1">{menuItems.find(i => i.id === activeTab)?.label}</h2>
          </div>
          
          <div className="flex items-center gap-2 md:gap-5">
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex flex-col items-end mr-2">
                 <span className="text-sm font-bold text-[#002D62]">{currentUser?.fullName}</span>
                 <span className="text-[10px] font-medium text-slate-400 tracking-normal">{currentUser?.position}</span>
              </div>
              <button 
                onClick={() => setPiiGuard(!piiGuard)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${piiGuard ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {piiGuard ? <EyeOff size={12} /> : <Eye size={12} />}
                PII GUARD
              </button>
              <button onClick={() => setLang(lang === 'TH' ? 'EN' : 'TH')} className="px-2 py-1.5 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 text-[10px] font-bold text-slate-600 border border-transparent hover:border-slate-200 transition-all">
                <Globe size={14} className="text-amber-500" />
                {lang}
              </button>
            </div>
            <div className="h-8 w-[1px] bg-slate-200" />
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#002D62] shadow-sm">
               <ShieldCheck size={20} />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F8FAFC] custom-scrollbar">
          <div className="max-w-full lg:max-w-7xl mx-auto pb-20">
            {renderContent()}
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        @media (max-width: 640px) {
          .recharts-wrapper { width: 100% !important; height: auto !important; }
        }
      `}</style>
    </div>
  );
};

export default App;
