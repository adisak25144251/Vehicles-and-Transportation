
import React, { useState, useEffect } from 'react';
import { Incident, IncidentStatus } from '../types';
import { safetyService } from '../services/safetyService';
import { 
  Siren, CheckCircle2, Clock, MapPin, 
  Phone, AlertOctagon, Shield, Filter,
  ExternalLink, User, MessageSquare
} from 'lucide-react';

const SafetyConsole: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [resolveNote, setResolveNote] = useState('');

  useEffect(() => {
    const unsub = safetyService.subscribe((data) => {
      setIncidents(data);
    });
    return () => unsub();
  }, []);

  const handleResolve = (id: string) => {
    if (!resolveNote) return alert('กรุณาระบุบันทึกการแก้ไข');
    safetyService.updateIncidentStatus(id, 'RESOLVED', {
      name: 'Dispatcher (You)',
      note: resolveNote
    });
    setResolveNote('');
    setSelectedIncident(null);
  };

  const handleAcknowledge = (id: string) => {
    safetyService.updateIncidentStatus(id, 'ACKNOWLEDGED');
  };

  const activeCount = incidents.filter(i => i.status !== 'RESOLVED').length;

  const filteredIncidents = incidents.filter(i => {
    if (filter === 'ACTIVE') return i.status !== 'RESOLVED';
    if (filter === 'RESOLVED') return i.status === 'RESOLVED';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 font-['Sarabun']">
      
      {/* Header */}
      <div className="bg-red-600 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 p-6 opacity-20">
            <Siren size={120} />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
               <h3 className="text-3xl font-black mb-2 flex items-center gap-3">
                  <Shield size={32} className="text-white" />
                  Safety Command Center
               </h3>
               <p className="text-white/80 text-sm">ศูนย์รับแจ้งเหตุฉุกเฉินและตรวจสอบความปลอดภัย</p>
            </div>
            <div className="flex items-center gap-4">
               {activeCount > 0 ? (
                 <div className="px-6 py-3 bg-white text-red-600 rounded-2xl font-black text-xl shadow-lg flex items-center gap-3 animate-pulse">
                    <Siren className="animate-spin-slow" />
                    {activeCount} Active Incidents
                 </div>
               ) : (
                 <div className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-lg shadow-lg flex items-center gap-2">
                    <CheckCircle2 /> All Clear
                 </div>
               )}
            </div>
         </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Incident List */}
         <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-2 mb-4">
               {['ACTIVE', 'RESOLVED', 'ALL'].map(f => (
                 <button 
                   key={f}
                   onClick={() => setFilter(f as any)}
                   className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === f ? 'bg-[#002D62] text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                 >
                   {f}
                 </button>
               ))}
            </div>

            {filteredIncidents.length === 0 && (
               <div className="bg-white p-20 rounded-[2.5rem] border border-slate-100 text-center text-slate-400">
                  <Shield size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="font-bold">ไม่พบรายการแจ้งเตือน</p>
               </div>
            )}

            {filteredIncidents.map(inc => (
               <div 
                 key={inc.id}
                 onClick={() => setSelectedIncident(inc)}
                 className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all hover:shadow-lg ${selectedIncident?.id === inc.id ? 'border-[#002D62] bg-blue-50/50' : 'border-slate-100 bg-white'}`}
               >
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${inc.type === 'SOS' || inc.type === 'CRASH' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                           {inc.type === 'SOS' && <Siren size={24} />}
                           {inc.type === 'CRASH' && <AlertOctagon size={24} />}
                        </div>
                        <div>
                           <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${inc.status === 'RESOLVED' ? 'bg-slate-200 text-slate-500' : 'bg-red-500 text-white animate-pulse'}`}>
                                 {inc.status}
                              </span>
                              <span className="text-xs text-slate-400 font-bold">{new Date(inc.timestamp).toLocaleTimeString()}</span>
                           </div>
                           <h4 className="text-lg font-black text-slate-800 mt-1">{inc.type} ALERT</h4>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-xs font-bold text-slate-500">Vehicle</p>
                        <p className="text-lg font-black text-[#002D62]">{inc.vehicleId}</p>
                     </div>
                  </div>
                  
                  <div className="pl-14">
                     <p className="text-sm text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                        "{inc.description}"
                     </p>
                     <div className="flex items-center gap-6 text-xs text-slate-500 font-bold">
                        <span className="flex items-center gap-1"><User size={14}/> {inc.driverName}</span>
                        <span className="flex items-center gap-1"><MapPin size={14}/> {inc.location.lat.toFixed(5)}, {inc.location.lng.toFixed(5)}</span>
                     </div>
                  </div>
               </div>
            ))}
         </div>

         {/* Action Panel */}
         <div className="lg:col-span-1">
            {selectedIncident ? (
               <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 sticky top-4">
                  <div className="mb-6 pb-6 border-b border-slate-100">
                     <h4 className="text-xl font-black text-[#002D62] mb-1">Incident Management</h4>
                     <p className="text-xs text-slate-400">ID: {selectedIncident.id}</p>
                  </div>

                  <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <button className="py-4 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs flex flex-col items-center gap-2 hover:bg-blue-100 transition-all">
                           <Phone size={20} /> Call Driver
                        </button>
                        <button className="py-4 bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex flex-col items-center gap-2 hover:bg-slate-100 transition-all">
                           <MapPin size={20} /> Locate
                        </button>
                     </div>

                     {selectedIncident.status !== 'RESOLVED' && (
                        <div className="space-y-3">
                           {selectedIncident.status === 'REPORTED' && (
                              <button 
                                onClick={() => handleAcknowledge(selectedIncident.id)}
                                className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold shadow-lg hover:bg-amber-600 transition-all"
                              >
                                 Acknowledge (รับทราบเหตุ)
                              </button>
                           )}
                           
                           <div className="pt-4 border-t border-slate-100">
                              <label className="text-xs font-bold text-slate-400 mb-2 block">Resolution Note</label>
                              <textarea 
                                value={resolveNote}
                                onChange={e => setResolveNote(e.target.value)}
                                className="w-full p-3 bg-slate-50 rounded-xl text-sm font-medium border-none outline-none focus:ring-2 focus:ring-[#002D62] mb-3"
                                rows={3}
                                placeholder="บันทึกการแก้ไขปัญหา..."
                              />
                              <button 
                                onClick={() => handleResolve(selectedIncident.id)}
                                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-600 transition-all"
                              >
                                 Mark as Resolved (ปิดเคส)
                              </button>
                           </div>
                        </div>
                     )}

                     {selectedIncident.status === 'RESOLVED' && (
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                           <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Resolved By</p>
                           <p className="text-sm font-bold text-emerald-900">{selectedIncident.resolverName}</p>
                           <p className="text-xs text-emerald-700 mt-1">"{selectedIncident.resolutionNote}"</p>
                           <p className="text-[10px] text-emerald-500 mt-2 text-right">{new Date(selectedIncident.resolutionTime!).toLocaleString()}</p>
                        </div>
                     )}
                  </div>
               </div>
            ) : (
               <div className="h-64 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 text-center p-8">
                  <MessageSquare size={32} className="mb-2" />
                  <p className="font-bold text-sm">เลือกรายการเพื่อดำเนินการ</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default SafetyConsole;
