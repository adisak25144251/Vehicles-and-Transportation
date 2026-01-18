
import React, { useState } from 'react';
import { VehicleProfile, VehicleStatus, FuelLog, MaintenanceTicket } from '../types';
import { lifecycleService } from '../services/lifecycleService';
import { 
  Car, Wrench, ShieldCheck, Calendar, AlertTriangle, 
  FileText, Plus, Edit3, Trash2, X, Save, Clock,
  Fuel, Droplets, Banknote, History, ChevronRight,
  TrendingUp, Activity, PenTool, CheckCircle
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

interface Props {
  vehicles: VehicleProfile[];
  onAddVehicle: (v: VehicleProfile) => void;
  onEditVehicle: (v: VehicleProfile) => void;
  onDeleteVehicle: (id: string) => void;
}

const FleetManager: React.FC<Props> = ({ vehicles, onAddVehicle, onEditVehicle, onDeleteVehicle }) => {
  // View State: 'LIST' or 'DETAIL'
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'FUEL' | 'MAINTENANCE'>('OVERVIEW');
  
  // Modals
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isAddFuelOpen, setIsAddFuelOpen] = useState(false);
  const [isAddTicketOpen, setIsAddTicketOpen] = useState(false);

  // Forms
  const [fuelForm, setFuelForm] = useState({
    odometer: 0, liters: 0, price: 0, station: ''
  });
  const [ticketForm, setTicketForm] = useState({
    title: '', description: '', type: 'PM', partsCost: 0, laborCost: 0
  });
  
  const [newVehicle, setNewVehicle] = useState({
    name: '',
    plateNumber: '',
    type: 'SEDAN',
    fuelType: 'Gasoline 95',
    consumptionRate: 15.0,
    wearAndTearRate: 1.5,
    status: 'USABLE' as VehicleStatus
  });

  const getStatusConfig = (status: VehicleStatus) => {
    switch (status) {
      case 'USABLE': return { label: 'พร้อมใช้งาน', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: ShieldCheck };
      case 'DAMAGED': return { label: 'รอซ่อม', color: 'bg-red-50 text-red-600 border-red-100', icon: AlertTriangle };
      case 'MAINTENANCE': return { label: 'กำลังซ่อมบำรุง', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Wrench };
      case 'DISPOSAL': return { label: 'รอจำหน่าย', color: 'bg-slate-50 text-slate-600 border-slate-100', icon: FileText };
      default: return { label: 'ไม่ระบุ', color: 'bg-slate-50 text-slate-600 border-slate-100', icon: Car };
    }
  };

  const handleAddVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle: VehicleProfile = {
      id: 'v-' + Date.now(),
      ...newVehicle,
      acquisitionDate: new Date().toISOString().split('T')[0],
      currentOdometer: 0,
      totalFuelCost: 0,
      totalMaintenanceCost: 0
    };
    onAddVehicle(vehicle);
    setIsAddVehicleOpen(false);
    setNewVehicle({
      name: '',
      plateNumber: '',
      type: 'SEDAN',
      fuelType: 'Gasoline 95',
      consumptionRate: 15.0,
      wearAndTearRate: 1.5,
      status: 'USABLE'
    });
  };

  const handleFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    
    lifecycleService.addFuelLog({
      vehicleId: selectedVehicle.id,
      timestamp: new Date().toISOString(),
      odometer: Number(fuelForm.odometer),
      liters: Number(fuelForm.liters),
      pricePerLiter: Number(fuelForm.price) / Number(fuelForm.liters),
      totalPrice: Number(fuelForm.price),
      stationName: fuelForm.station
    });
    
    setIsAddFuelOpen(false);
    // Force re-render would happen via parent props in real app, here we rely on local mutation updates
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    lifecycleService.createTicket({
      vehicleId: selectedVehicle.id,
      type: ticketForm.type as any,
      title: ticketForm.title,
      description: ticketForm.description,
      reportedBy: 'Admin',
      partsCost: Number(ticketForm.partsCost),
      laborCost: Number(ticketForm.laborCost),
    });

    setIsAddTicketOpen(false);
  };

  // --- SUB-COMPONENT: VEHICLE LIST ---
  if (!selectedVehicle) {
    return (
      <div className="space-y-8 animate-in fade-in duration-700 pb-20">
        {/* Summary Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6">
            <div className="p-5 bg-indigo-50 text-indigo-600 rounded-2xl"><Car size={32} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Fleet</p>
              <h3 className="text-3xl font-black text-slate-800">{vehicles.length} Units</h3>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6">
            <div className="p-5 bg-amber-50 text-amber-600 rounded-2xl"><Wrench size={32} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">In Maintenance</p>
              <h3 className="text-3xl font-black text-slate-800">{vehicles.filter(v => v.status === 'MAINTENANCE' || v.status === 'DAMAGED').length} Units</h3>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6">
            <div className="p-5 bg-emerald-50 text-emerald-600 rounded-2xl"><ShieldCheck size={32} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Usable Ratio</p>
              <h3 className="text-3xl font-black text-slate-800">{Math.round((vehicles.filter(v => v.status === 'USABLE').length / vehicles.length) * 100)}%</h3>
            </div>
          </div>
        </div>

        {/* List Table */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-black text-2xl text-[#002D62]">Fleet Overview</h4>
            <button onClick={() => setIsAddVehicleOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-[#002D62] text-white rounded-2xl text-sm font-black shadow-lg hover:bg-indigo-900 transition-all">
              <Plus size={18} className="text-amber-400" /> เพิ่มยานพาหนะ
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Vehicle</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Odometer</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Next Service</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {vehicles.map((v) => {
                  const status = getStatusConfig(v.status);
                  return (
                    <tr key={v.id} onClick={() => setSelectedVehicle(v)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                      <td className="px-8 py-6">
                        <div className="font-black text-slate-800">{v.name}</div>
                        <div className="text-xs text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded inline-block mt-1">{v.plateNumber}</div>
                      </td>
                      <td className="px-8 py-6 font-mono text-sm font-bold text-slate-600">{v.currentOdometer.toLocaleString()} km</td>
                      <td className="px-8 py-6">
                        {v.nextMaintenanceOdometer ? (
                          <div className={`text-xs font-bold ${v.currentOdometer >= v.nextMaintenanceOdometer ? 'text-red-500' : 'text-emerald-600'}`}>
                            {v.nextMaintenanceOdometer.toLocaleString()} km
                            {v.currentOdometer >= v.nextMaintenanceOdometer && <span className="block text-[9px] uppercase font-black">Overdue!</span>}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${status.color}`}>
                          <status.icon size={12} /> {status.label}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <ChevronRight className="inline-block text-slate-300 group-hover:text-[#002D62] transition-colors" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD VEHICLE MODAL */}
        {isAddVehicleOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#002D62]/70 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-indigo-950 shadow-xl">
                    <Plus size={24} />
                    </div>
                    <div>
                    <h3 className="text-2xl font-black text-[#002D62] tracking-tight">เพิ่มรถยนต์ในคลัง</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ระบุข้อมูลเพื่อใช้ในการคำนวณต้นทุน</p>
                    </div>
                </div>
                <button onClick={() => setIsAddVehicleOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all">
                    <X size={24} />
                </button>
                </div>

                <form onSubmit={handleAddVehicleSubmit} className="p-10 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                <div className="space-y-4">
                    <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">ชื่อเรียก / รุ่นรถ</label>
                    <input 
                        required
                        type="text" 
                        value={newVehicle.name}
                        onChange={(e) => setNewVehicle({...newVehicle, name: e.target.value})}
                        placeholder="เช่น Toyota Camry (ส่วนกลาง)"
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 shadow-inner"
                    />
                    </div>
                    <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">หมายเลขทะเบียน</label>
                    <input 
                        required
                        type="text" 
                        value={newVehicle.plateNumber}
                        onChange={(e) => setNewVehicle({...newVehicle, plateNumber: e.target.value})}
                        placeholder="เช่น 1กข 1234"
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 shadow-inner"
                    />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">อัตราสิ้นเปลือง (กม./ลิตร)</label>
                        <input 
                        required
                        type="number" 
                        step="0.1"
                        value={newVehicle.consumptionRate}
                        onChange={(e) => setNewVehicle({...newVehicle, consumptionRate: Number(e.target.value)})}
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 shadow-inner"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">ค่าเสื่อม/กม. (฿)</label>
                        <input 
                        required
                        type="number" 
                        step="0.1"
                        value={newVehicle.wearAndTearRate}
                        onChange={(e) => setNewVehicle({...newVehicle, wearAndTearRate: Number(e.target.value)})}
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 shadow-inner"
                        />
                    </div>
                    </div>
                    <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">ประเภทเชื้อเพลิง</label>
                    <select 
                        value={newVehicle.fuelType}
                        onChange={(e) => setNewVehicle({...newVehicle, fuelType: e.target.value})}
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 shadow-inner"
                    >
                        <option>Gasoline 95</option>
                        <option>Gasoline 91</option>
                        <option>Diesel</option>
                        <option>E20</option>
                    </select>
                    </div>
                </div>

                <button 
                    type="submit"
                    className="w-full py-5 bg-[#002D62] text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-900/30 hover:bg-indigo-900 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <CheckCircle size={24} className="text-amber-400" />
                    ยืนยันการเพิ่มรถยนต์
                </button>
                </form>
            </div>
            </div>
        )}
      </div>
    );
  }

  // --- SUB-COMPONENT: VEHICLE DETAIL (LIFECYCLE HUB) ---
  const fuelLogs = lifecycleService.getFuelLogs(selectedVehicle.id);
  const tickets = lifecycleService.getTickets(selectedVehicle.id);
  
  // Charts Data
  const fuelChartData = fuelLogs.map(f => ({
    date: new Date(f.timestamp).toLocaleDateString('th-TH', {day: 'numeric', month:'short'}),
    efficiency: f.efficiency || 0,
    price: f.pricePerLiter
  })).reverse();

  const costDistribution = [
    { name: 'Fuel', value: selectedVehicle.totalFuelCost, color: '#F59E0B' },
    { name: 'Maintenance', value: selectedVehicle.totalMaintenanceCost, color: '#EF4444' },
    { name: 'Depreciation', value: (selectedVehicle.purchasePrice || 0) * 0.1, color: '#64748B' } // Mock 10% dep
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-500 pb-20">
      {/* Detail Header */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => setSelectedVehicle(null)} className="p-2 bg-white rounded-xl shadow-sm hover:bg-slate-50 transition-all text-slate-400">
          <ChevronRight className="rotate-180" />
        </button>
        <div>
          <h2 className="text-3xl font-black text-[#002D62]">{selectedVehicle.name}</h2>
          <p className="text-sm text-slate-400 font-bold">{selectedVehicle.plateNumber} • {selectedVehicle.type}</p>
        </div>
        <div className="ml-auto flex gap-2">
           <button onClick={() => setIsAddFuelOpen(true)} className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl font-bold text-xs flex items-center gap-2 border border-amber-100 hover:bg-amber-100">
              <Fuel size={16} /> Add Fuel
           </button>
           <button onClick={() => setIsAddTicketOpen(true)} className="px-4 py-2 bg-red-50 text-red-700 rounded-xl font-bold text-xs flex items-center gap-2 border border-red-100 hover:bg-red-100">
              <Wrench size={16} /> Report Issue
           </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Odometer</p>
            <p className="text-2xl font-black text-slate-800">{selectedVehicle.currentOdometer.toLocaleString()}</p>
         </div>
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Fuel</p>
            <p className="text-2xl font-black text-amber-500">฿{selectedVehicle.totalFuelCost.toLocaleString()}</p>
         </div>
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Maint.</p>
            <p className="text-2xl font-black text-red-500">฿{selectedVehicle.totalMaintenanceCost.toLocaleString()}</p>
         </div>
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Cost / KM</p>
            <p className="text-2xl font-black text-indigo-600">
               ฿{((selectedVehicle.totalFuelCost + selectedVehicle.totalMaintenanceCost) / (selectedVehicle.currentOdometer || 1)).toFixed(2)}
            </p>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
         {['OVERVIEW', 'FUEL', 'MAINTENANCE'].map(tab => (
           <button 
             key={tab}
             onClick={() => setActiveTab(tab as any)}
             className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab ? 'bg-white text-[#002D62] shadow' : 'text-slate-400 hover:text-slate-600'}`}
           >
             {tab}
           </button>
         ))}
      </div>

      {/* TAB CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {activeTab === 'OVERVIEW' && (
           <>
             <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h4 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2"><Activity size={20} className="text-blue-500"/> Lifecycle Cost Distribution</h4>
                <div className="h-64 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie data={costDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {costDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                         </Pie>
                         <Tooltip />
                         <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-sm font-bold fill-slate-400">Total TCO</text>
                      </PieChart>
                   </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-4">
                   {costDistribution.map((entry, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                         <div className="w-3 h-3 rounded-full" style={{backgroundColor: entry.color}} />
                         {entry.name}
                      </div>
                   ))}
                </div>
             </div>
             <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h4 className="font-bold text-lg text-slate-800 mb-4">Upcoming Service</h4>
                <div className="text-center py-8">
                   <div className="w-24 h-24 rounded-full border-8 border-slate-100 mx-auto flex items-center justify-center mb-4 relative">
                      <Wrench className="text-slate-300" size={32} />
                      <div className="absolute inset-0 border-8 border-t-emerald-500 rounded-full rotate-45" />
                   </div>
                   <p className="text-3xl font-black text-slate-800">{Math.max(0, (selectedVehicle.nextMaintenanceOdometer || 0) - selectedVehicle.currentOdometer).toLocaleString()}</p>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">KM Remaining</p>
                </div>
             </div>
           </>
         )}

         {activeTab === 'FUEL' && (
           <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h4 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2"><Fuel size={20} className="text-amber-500"/> Fuel Efficiency Trend</h4>
              <div className="h-64 w-full mb-8">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={fuelChartData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="date" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                       <YAxis yAxisId="left" orientation="left" stroke="#F59E0B" />
                       <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                       <Tooltip />
                       <Line yAxisId="left" type="monotone" dataKey="efficiency" stroke="#F59E0B" strokeWidth={3} dot={true} name="Km/L" />
                       <Line yAxisId="right" type="monotone" dataKey="price" stroke="#cbd5e1" strokeWidth={2} dot={false} name="Price/L" />
                    </LineChart>
                 </ResponsiveContainer>
              </div>
              
              <h5 className="font-bold text-sm text-slate-500 mb-4">Recent Logs</h5>
              <div className="space-y-2">
                 {fuelLogs.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <div className="flex items-center gap-4">
                          <div className="p-2 bg-white rounded-xl text-amber-500"><Droplets size={18}/></div>
                          <div>
                             <p className="font-bold text-slate-800">{log.stationName}</p>
                             <p className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="font-bold text-slate-800">{log.liters} L / {log.totalPrice} ฿</p>
                          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{log.efficiency ? `${log.efficiency} Km/L` : '-'}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
         )}

         {activeTab === 'MAINTENANCE' && (
           <div className="lg:col-span-3 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                 <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Wrench size={20} className="text-red-500"/> Service History</h4>
                 </div>
                 <div className="space-y-4">
                    {tickets.map(ticket => (
                       <div key={ticket.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative overflow-hidden group">
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${ticket.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <div className="flex justify-between items-start mb-2 pl-4">
                             <div>
                                <h5 className="font-black text-slate-800">{ticket.title}</h5>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ticket.type} • {ticket.id}</span>
                             </div>
                             <span className={`text-[10px] px-2 py-1 rounded-lg font-black uppercase tracking-widest ${ticket.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {ticket.status.replace('_', ' ')}
                             </span>
                          </div>
                          <p className="text-sm text-slate-600 pl-4 mb-4">{ticket.description}</p>
                          <div className="pl-4 flex justify-between items-center border-t border-slate-200 pt-3">
                             <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Calendar size={12}/> {new Date(ticket.openedDate).toLocaleDateString()}</span>
                             <span className="font-black text-slate-800">฿{ticket.totalCost.toLocaleString()}</span>
                          </div>
                          
                          {ticket.status !== 'COMPLETED' && (
                             <div className="mt-4 pl-4">
                                <button onClick={() => lifecycleService.updateTicketStatus(ticket.id, 'COMPLETED')} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-emerald-600 transition-all">
                                   Mark as Completed
                                </button>
                             </div>
                          )}
                       </div>
                    ))}
                 </div>
              </div>
           </div>
         )}
      </div>

      {/* ADD FUEL MODAL */}
      {isAddFuelOpen && (
         <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#002D62]/50 backdrop-blur-md animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95">
               <h3 className="font-black text-xl text-[#002D62] mb-6 flex items-center gap-2"><Fuel className="text-amber-500"/> Record Fuel</h3>
               <form onSubmit={handleFuelSubmit} className="space-y-4">
                  <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Odometer (km)</label>
                     <input type="number" required className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" value={fuelForm.odometer || ''} onChange={e => setFuelForm({...fuelForm, odometer: Number(e.target.value)})} placeholder={selectedVehicle.currentOdometer.toString()} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Liters</label>
                        <input type="number" step="0.1" required className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" value={fuelForm.liters || ''} onChange={e => setFuelForm({...fuelForm, liters: Number(e.target.value)})} />
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Price (฿)</label>
                        <input type="number" required className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" value={fuelForm.price || ''} onChange={e => setFuelForm({...fuelForm, price: Number(e.target.value)})} />
                     </div>
                  </div>
                  <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Station Name</label>
                     <input type="text" required className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" value={fuelForm.station} onChange={e => setFuelForm({...fuelForm, station: e.target.value})} placeholder="e.g. PTT Viphavadi" />
                  </div>
                  <div className="pt-4 flex gap-2">
                     <button type="button" onClick={() => setIsAddFuelOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl">Cancel</button>
                     <button type="submit" className="flex-1 py-3 bg-[#002D62] text-white font-bold rounded-xl shadow-lg">Save Log</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* ADD TICKET MODAL */}
      {isAddTicketOpen && (
         <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#002D62]/50 backdrop-blur-md animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95">
               <h3 className="font-black text-xl text-[#002D62] mb-6 flex items-center gap-2"><Wrench className="text-red-500"/> Open Ticket</h3>
               <form onSubmit={handleTicketSubmit} className="space-y-4">
                  <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issue Title</label>
                     <input type="text" required className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" value={ticketForm.title} onChange={e => setTicketForm({...ticketForm, title: e.target.value})} placeholder="e.g. Brake noise" />
                  </div>
                  <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</label>
                     <select className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" value={ticketForm.type} onChange={e => setTicketForm({...ticketForm, type: e.target.value})}>
                        <option value="PM">Preventive Maintenance</option>
                        <option value="CM">Corrective Maintenance (Repair)</option>
                        <option value="ACCIDENT">Accident</option>
                     </select>
                  </div>
                  <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                     <textarea className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none h-24" value={ticketForm.description} onChange={e => setTicketForm({...ticketForm, description: e.target.value})} placeholder="Details of the issue..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Parts Cost</label>
                        <input type="number" className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" value={ticketForm.partsCost || ''} onChange={e => setTicketForm({...ticketForm, partsCost: Number(e.target.value)})} />
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Labor Cost</label>
                        <input type="number" className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" value={ticketForm.laborCost || ''} onChange={e => setTicketForm({...ticketForm, laborCost: Number(e.target.value)})} />
                     </div>
                  </div>
                  <div className="pt-4 flex gap-2">
                     <button type="button" onClick={() => setIsAddTicketOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl">Cancel</button>
                     <button type="submit" className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg">Create Ticket</button>
                  </div>
               </form>
            </div>
         </div>
      )}

    </div>
  );
};

export default FleetManager;
