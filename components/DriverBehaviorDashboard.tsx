
import React, { useState } from 'react';
import { scoringService } from '../services/scoringService';
import { 
  Trophy, TrendingUp, AlertTriangle, Gauge, 
  Activity, Award, BarChart3, ChevronRight, Zap,
  TrendingDown
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

const DriverBehaviorDashboard: React.FC = () => {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const profiles = scoringService.getAllDriverScores();
  
  // Sort by score
  const sortedProfiles = [...profiles].sort((a, b) => b.score - a.score);
  const selectedProfile = selectedDriverId ? profiles.find(p => p.driverId === selectedDriverId) : sortedProfiles[0];

  const getGradeColor = (grade: string) => {
    switch(grade) {
      case 'A': return 'text-emerald-500 bg-emerald-50 border-emerald-200';
      case 'B': return 'text-blue-500 bg-blue-50 border-blue-200';
      case 'C': return 'text-amber-500 bg-amber-50 border-amber-200';
      default: return 'text-red-500 bg-red-50 border-red-200';
    }
  };

  const trendData = selectedProfile?.trend.map((score, i) => ({ day: `Day ${i+1}`, score })) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-['Sarabun'] pb-20">
      
      {/* Header */}
      <div className="bg-[#002D62] p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 p-6 opacity-10">
            <Trophy size={140} />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
               <h3 className="text-3xl font-black mb-2 flex items-center gap-3">
                  <Activity size={32} className="text-amber-400" />
                  Driver Behavior Scoring
               </h3>
               <p className="text-white/80 text-sm">ระบบประเมินพฤติกรรมการขับขี่อัจฉริยะด้วย AI & Sensor Fusion</p>
            </div>
            <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-4">
               <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Fleet Average</p>
                  <p className="text-2xl font-black">84.5 / 100</p>
               </div>
               <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center font-black shadow-lg">
                  B+
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* Left: Leaderboard */}
         <div className="lg:col-span-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[600px]">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
               <h4 className="font-black text-lg text-[#002D62] flex items-center gap-2">
                  <Award className="text-amber-500" /> Leaderboard
               </h4>
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1 p-4 space-y-3">
               {sortedProfiles.map((p, idx) => (
                 <div 
                   key={p.driverId}
                   onClick={() => setSelectedDriverId(p.driverId)}
                   className={`p-4 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-md flex items-center gap-4 ${selectedProfile?.driverId === p.driverId ? 'border-[#002D62] bg-blue-50' : 'border-slate-100 bg-white'}`}
                 >
                    <div className="w-8 h-8 flex items-center justify-center font-black text-slate-400 text-sm">
                       {idx + 1}
                    </div>
                    <div className="flex-1">
                       <p className="font-bold text-slate-800 text-sm">{p.driverName}</p>
                       <p className="text-[10px] text-slate-400 font-bold">{p.totalDistanceKm} km driven</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border ${getGradeColor(p.grade)}`}>
                       {p.score}
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Right: Driver Detail */}
         <div className="lg:col-span-2 space-y-6">
            
            {/* Score Card */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
               <div className="flex justify-between items-start mb-8">
                  <div>
                     <h4 className="text-2xl font-black text-slate-800">{selectedProfile?.driverName}</h4>
                     <p className="text-slate-400 text-sm font-bold mt-1">ID: {selectedProfile?.driverId}</p>
                  </div>
                  <div className={`px-6 py-2 rounded-xl text-xl font-black border ${getGradeColor(selectedProfile?.grade || 'C')}`}>
                     Grade {selectedProfile?.grade}
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-center">
                     <Gauge className="mx-auto text-red-500 mb-2" size={24} />
                     <p className="text-2xl font-black text-slate-800">{selectedProfile?.events.speeding}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Speeding</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                     <AlertTriangle className="mx-auto text-amber-500 mb-2" size={24} />
                     <p className="text-2xl font-black text-slate-800">{selectedProfile?.events.harshBrake}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Harsh Brake</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                     <Zap className="mx-auto text-amber-500 mb-2" size={24} />
                     <p className="text-2xl font-black text-slate-800">{selectedProfile?.events.harshAccel}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Harsh Accel</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                     <TrendingUp className="mx-auto text-blue-500 mb-2" size={24} />
                     <p className="text-2xl font-black text-slate-800">{selectedProfile?.events.harshTurn}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Harsh Turn</p>
                  </div>
               </div>

               {/* Chart */}
               <div className="h-64 w-full">
                  <h5 className="text-sm font-bold text-slate-500 mb-4 flex items-center gap-2">
                     <BarChart3 size={16} /> 7-Day Performance Trend
                  </h5>
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={trendData}>
                        <defs>
                           <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip 
                           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Area type="monotone" dataKey="score" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Recommendations */}
            <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6">
               <h5 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Activity size={18} className="text-indigo-500" /> AI Recommendations
               </h5>
               <ul className="space-y-2">
                  {selectedProfile?.grade === 'C' || selectedProfile?.grade === 'D' || selectedProfile?.grade === 'F' ? (
                     <>
                        <li className="flex gap-3 text-xs text-slate-600 font-medium bg-white p-3 rounded-xl border border-slate-100">
                           <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                           พบการออกตัวกระชากบ่อยครั้ง แนะนำให้อบรมเรื่องการประหยัดน้ำมัน (Eco-driving)
                        </li>
                        <li className="flex gap-3 text-xs text-slate-600 font-medium bg-white p-3 rounded-xl border border-slate-100">
                           <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                           มีการใช้เบรกกะทันหันสูงกว่าค่าเฉลี่ย 15% ควรตรวจสอบระยะห่างการขับขี่
                        </li>
                     </>
                  ) : (
                     <li className="flex gap-3 text-xs text-slate-600 font-medium bg-white p-3 rounded-xl border border-slate-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        พฤติกรรมการขับขี่อยู่ในเกณฑ์ดีเยี่ยม ควรรักษามาตรฐานต่อไป
                     </li>
                  )}
               </ul>
            </div>

         </div>
      </div>
    </div>
  );
};

export default DriverBehaviorDashboard;
