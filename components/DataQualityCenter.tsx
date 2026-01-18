
import React, { useState, useEffect } from 'react';
import { 
  Activity, Signal, Battery, Wifi, 
  AlertTriangle, Crosshair, Map as MapIcon, 
  BarChart3, Eye, Zap, Layers
} from 'lucide-react';
import { TrackingSession } from '../types';
import { trackingService } from '../services/trackingService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import L from 'leaflet';

const DataQualityCenter: React.FC = () => {
  const [sessions, setSessions] = useState<TrackingSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  useEffect(() => {
    const unsub = trackingService.subscribeToFleet(data => {
      setSessions(data);
      if (!selectedSessionId && data.length > 0) setSelectedSessionId(data[0].sessionId);
    });
    return () => unsub();
  }, [selectedSessionId]);

  const selectedSession = sessions.find(s => s.sessionId === selectedSessionId);
  const quality = selectedSession?.qualityProfile;

  // Mock Histogram Data for Chart
  const accData = quality ? [
    { name: 'Excellent (<10m)', count: quality.accuracyDistribution.excellent, fill: '#10B981' },
    { name: 'Good (<20m)', count: quality.accuracyDistribution.good, fill: '#3B82F6' },
    { name: 'Fair (<50m)', count: quality.accuracyDistribution.fair, fill: '#F59E0B' },
    { name: 'Poor (>50m)', count: quality.accuracyDistribution.poor, fill: '#EF4444' }
  ] : [];

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-blue-500 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-amber-500 bg-amber-50 border-amber-200';
    return 'text-red-500 bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-['Sarabun'] pb-20">
      
      {/* Header */}
      <div className="bg-[#002D62] p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 p-6 opacity-10">
            <Signal size={140} />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
               <h3 className="text-3xl font-black mb-2 flex items-center gap-3">
                  <Activity size={32} className="text-emerald-400" />
                  Data Quality Center
               </h3>
               <p className="text-white/80 text-sm">ตรวจสอบความเสถียรของสัญญาณและคุณภาพข้อมูล Telemetry เชิงลึก</p>
            </div>
            <div className="flex gap-4">
               {/* Overall Health Widget */}
               <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-right">
                  <p className="text-[10px] uppercase tracking-widest text-white/60 font-bold">System Health</p>
                  <p className="text-2xl font-black text-emerald-400">98.2%</p>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* Session List */}
         <div className="lg:col-span-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[700px]">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
               <h4 className="font-black text-lg text-[#002D62] flex items-center gap-2">
                  <Signal className="text-blue-500" /> Active Sessions
               </h4>
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1 p-4 space-y-3">
               {sessions.map(s => (
                 <div 
                   key={s.sessionId}
                   onClick={() => setSelectedSessionId(s.sessionId)}
                   className={`p-4 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-md flex items-center gap-4 ${selectedSessionId === s.sessionId ? 'border-[#002D62] bg-blue-50' : 'border-slate-100 bg-white'}`}
                 >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm border-2 ${getScoreColor(s.qualityProfile?.score || 0)}`}>
                       {s.qualityProfile?.score || 0}
                    </div>
                    <div className="flex-1 overflow-hidden">
                       <p className="font-bold text-slate-800 text-sm truncate">{s.vehicleId}</p>
                       <p className="text-[10px] text-slate-400 font-bold truncate">{s.driverName}</p>
                       {s.qualityProfile && s.qualityProfile.flags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                             {s.qualityProfile.flags.map(f => (
                                <span key={f} className="text-[8px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-bold">{f}</span>
                             ))}
                          </div>
                       )}
                    </div>
                    <div className="text-right">
                       <Signal size={16} className={s.signalStrength === 'EXCELLENT' ? 'text-emerald-500' : 'text-amber-500'} />
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Detailed Metrics */}
         <div className="lg:col-span-2 space-y-6">
            {selectedSession && quality ? (
               <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">GPS Accuracy</p>
                        <p className="text-2xl font-black text-[#002D62]">{quality.accuracyAvg} <span className="text-xs text-slate-400">m</span></p>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                           <div className={`h-full ${quality.accuracyAvg < 10 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{width: `${Math.max(0, 100 - quality.accuracyAvg)}%`}} />
                        </div>
                     </div>
                     <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Signal Dropouts</p>
                        <p className={`text-2xl font-black ${quality.dropoutCount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{quality.dropoutCount}</p>
                        <p className="text-[10px] text-slate-400 font-bold">Max: {quality.maxDropoutDuration}s</p>
                     </div>
                     <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Network Jitter</p>
                        <p className="text-2xl font-black text-[#002D62]">{quality.jitter} <span className="text-xs text-slate-400">ms</span></p>
                        <p className="text-[10px] text-slate-400 font-bold">Consistency</p>
                     </div>
                     <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Connectivity</p>
                        <div className="flex items-center gap-2 mt-1">
                           {quality.lastNetworkType === 'wifi' ? <Wifi size={24} className="text-blue-500"/> : <Signal size={24} className="text-emerald-500"/>}
                           <span className="text-xl font-black uppercase text-slate-700">{quality.lastNetworkType}</span>
                        </div>
                     </div>
                  </div>

                  {/* Accuracy Distribution Chart */}
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                     <h5 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Crosshair size={20} className="text-indigo-500" />
                        GPS Accuracy Distribution
                     </h5>
                     <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={accData} layout="vertical" margin={{top: 0, right: 30, left: 40, bottom: 0}}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} width={100} />
                              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                                 {accData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                 ))}
                              </Bar>
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  {/* Debug Map (Mock) */}
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                     <div className="flex justify-between items-center mb-6">
                        <h5 className="font-bold text-slate-800 flex items-center gap-2">
                           <MapIcon size={20} className="text-amber-500" />
                           Signal Drift Hotspots (Debug Mode)
                        </h5>
                        <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">
                           Export Logs
                        </button>
                     </div>
                     <div className="h-64 bg-slate-100 rounded-2xl relative overflow-hidden flex items-center justify-center border border-slate-200">
                        {/* Placeholder for Map visualization */}
                        <div className="text-center text-slate-400">
                           <Layers size={48} className="mx-auto mb-2 opacity-50" />
                           <p className="text-sm font-bold">Interactive Signal Heatmap</p>
                           <p className="text-xs opacity-70">Showing areas with avg accuracy {'>'} 20m</p>
                        </div>
                        
                        {/* Overlay Stat */}
                        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-slate-100">
                           <p className="text-[10px] font-black text-red-500 uppercase">Detected Dead Zones</p>
                           <p className="text-lg font-black text-slate-800">2 Locations</p>
                        </div>
                     </div>
                  </div>
               </>
            ) : (
               <div className="h-full bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                  <Activity size={48} className="mb-4" />
                  <p className="font-bold">Select a session to analyze</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default DataQualityCenter;
