
import React, { useState, useEffect } from 'react';
import { Trip, VehicleProfile, RequestStatus } from '../types';
import { requestService } from '../services/apiService';
import { scoringService } from '../services/scoringService';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  Cell, PieChart, Pie
} from 'recharts';
import { 
  Fuel, Route, Timer, CheckCircle2, BrainCircuit, TrendingUp, 
  Share2, Download, Link as LinkIcon, Mail, FileText, X, Loader2, ShieldCheck,
  FileCheck, Truck, Activity, CalendarDays
} from 'lucide-react';

interface Props {
  trips: Trip[];
  vehicles: VehicleProfile[];
  onNavigateToAI: () => void;
}

const Dashboard: React.FC<Props> = ({ trips, vehicles, onNavigateToAI }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareStep, setShareStep] = useState<'options' | 'success'>('options');
  const [chartView, setChartView] = useState<'dist' | 'trips'>('dist');
  
  // Dashboard Metrics
  const [approvalStats, setApprovalStats] = useState({ pending: 0, active: 0 });
  const [avgDriverScore, setAvgDriverScore] = useState(0);

  useEffect(() => {
    // Fetch Requests Stats
    requestService.getAll().then(reqs => {
       const pending = reqs.filter(r => r.status === RequestStatus.SUBMITTED).length;
       const active = reqs.filter(r => r.status === RequestStatus.APPROVED || r.status === RequestStatus.ISSUED || r.status === RequestStatus.STARTED).length;
       setApprovalStats({ pending, active });
    });

    // Fetch Driver Score Average
    const profiles = scoringService.getAllDriverScores();
    if (profiles.length > 0) {
       const avg = profiles.reduce((sum, p) => sum + p.score, 0) / profiles.length;
       setAvgDriverScore(avg);
    }
  }, []);

  const totalKm = trips.reduce((acc, t) => acc + t.distanceKm, 0);
  const totalFuel = trips.reduce((acc, t) => acc + t.fuelCost, 0);
  const avgEfficiency = trips.length > 0 ? trips.reduce((acc, t) => acc + (t.efficiencyScore || 0), 0) / trips.length : 0;

  // Fleet Stats
  const usableVehicles = vehicles.filter(v => v.status === 'USABLE').length;
  const maintenanceVehicles = vehicles.filter(v => v.status !== 'USABLE').length;
  const fleetUtilization = vehicles.length > 0 ? Math.round((usableVehicles / vehicles.length) * 100) : 0;

  const summaryData = [
    { label: 'ระยะทางรวม', value: `${totalKm.toLocaleString()} กม.`, icon: Route, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%' },
    { label: 'ค่าเชื้อเพลิงรวม', value: `${totalFuel.toLocaleString()} ฿`, icon: Fuel, color: 'text-amber-600', bg: 'bg-amber-50', trend: '-4%' },
    { label: 'เวลาเดินทาง', value: '165 ชม.', icon: Timer, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+2%' },
    { label: 'ประสิทธิภาพ', value: `${avgEfficiency.toFixed(1)}%`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Optimal' },
  ];

  const chartData = [
    { name: 'จ.', trips: 4, dist: 120 },
    { name: 'อ.', trips: 2, dist: 45 },
    { name: 'พ.', trips: 5, dist: 210 },
    { name: 'พฤ.', trips: 3, dist: 90 },
    { name: 'ศ.', trips: 6, dist: 180 },
    { name: 'ส.', trips: 1, dist: 30 },
    { name: 'อา.', trips: 0, dist: 0 },
  ];

  const categoryData = [
    { name: 'ตรวจการ', value: 45, fill: '#002D62' },
    { name: 'สัมมนา', value: 25, fill: '#B8860B' },
    { name: 'ประสานงาน', value: 20, fill: '#10B981' },
    { name: 'อื่นๆ', value: 10, fill: '#64748B' },
  ];

  const handleShareReport = () => {
    setIsShareModalOpen(true);
    setShareStep('options');
  };

  const handleExportAction = async (type: string) => {
    setIsGenerating(true);
    // จำลองการสร้างรายงานเชิงลึกและการตรวจสอบสิทธิ์
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    setShareStep('success');
  };

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-700 font-['Sarabun']">
      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {summaryData.map((item, idx) => (
          <div key={idx} className="bg-white p-5 md:p-7 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`${item.bg} p-3 md:p-4 rounded-xl group-hover:scale-110 transition-transform duration-500`}>
                <item.icon className={item.color} size={20} />
              </div>
              <div className={`flex items-center text-[9px] md:text-[10px] font-black px-2 py-1 rounded-full ${item.trend.includes('-') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {item.trend}
              </div>
            </div>
            <div>
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
              <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">{item.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Chart Card */}
        <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-10 gap-4">
            <div>
              <h4 className="text-xl md:text-2xl font-black text-[#002D62] tracking-tight">สถิติการเดินทาง</h4>
              <p className="text-xs md:text-sm text-slate-400 font-medium">ปริมาณการเดินทางรายสัปดาห์</p>
            </div>
            <div className="flex bg-slate-50 p-1 rounded-xl w-fit">
              <button 
                onClick={() => setChartView('dist')}
                className={`px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${chartView === 'dist' ? 'bg-white shadow-sm text-[#002D62]' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Distance
              </button>
              <button 
                onClick={() => setChartView('trips')}
                className={`px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${chartView === 'trips' ? 'bg-white shadow-sm text-[#002D62]' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Trips
              </button>
            </div>
          </div>
          <div className="h-[250px] md:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartView === 'dist' ? '#B8860B' : '#002D62'} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={chartView === 'dist' ? '#B8860B' : '#002D62'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}} />
                <Tooltip 
                  contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontFamily: 'Sarabun'}}
                  formatter={(value: any) => [value, chartView === 'dist' ? 'ระยะทาง (กม.)' : 'จำนวนทริป']}
                />
                <Area 
                  type="monotone" 
                  dataKey={chartView} 
                  stroke={chartView === 'dist' ? '#B8860B' : '#002D62'} 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorPrimary)"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
          <h4 className="text-lg md:text-xl font-black text-[#002D62] mb-6 md:mb-8 tracking-tight">Mission Classification</h4>
          <div className="flex-1 min-h-[220px] md:min-h-[280px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="85%"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="block text-xl md:text-3xl font-black text-slate-800">84</span>
              <span className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total</span>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {categoryData.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px] md:text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: cat.fill}} />
                  <span className="text-slate-600 font-bold">{cat.name}</span>
                </div>
                <span className="text-slate-800 font-black">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- NEW SECTION: OPERATIONAL SUMMARY (4-GRID) --- */}
      <div>
         <h4 className="text-xl font-black text-[#002D62] mb-6 tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-amber-500"/> Operational Overview
         </h4>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 1. Approval Summary */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><FileCheck size={24}/></div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Pending</span>
               </div>
               <h5 className="font-bold text-slate-700">สรุปการอนุมัติ</h5>
               <div className="mt-4 flex gap-4">
                  <div className="flex-1 p-3 bg-slate-50 rounded-xl text-center">
                     <p className="text-2xl font-black text-amber-500">{approvalStats.pending}</p>
                     <p className="text-[9px] text-slate-400 font-bold">รออนุมัติ</p>
                  </div>
                  <div className="flex-1 p-3 bg-slate-50 rounded-xl text-center">
                     <p className="text-2xl font-black text-emerald-500">{approvalStats.active}</p>
                     <p className="text-[9px] text-slate-400 font-bold">ดำเนินการ</p>
                  </div>
               </div>
            </div>

            {/* 2. Recent Trips Summary */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><CalendarDays size={24}/></div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Recent</span>
               </div>
               <h5 className="font-bold text-slate-700 mb-3">รายการเดินทาง</h5>
               <div className="space-y-2 flex-1">
                  {trips.slice(0, 3).map(trip => (
                     <div key={trip.id} className="flex justify-between items-center text-xs">
                        <span className="truncate max-w-[100px] text-slate-600 font-medium">{trip.missionName}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black ${trip.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{trip.status}</span>
                     </div>
                  ))}
               </div>
            </div>

            {/* 3. Fleet Management Summary */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Truck size={24}/></div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Status</span>
               </div>
               <h5 className="font-bold text-slate-700">จัดการยานพาหนะ</h5>
               <div className="mt-3">
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                     <span>Usable ({usableVehicles})</span>
                     <span>{fleetUtilization}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                     <div className="bg-emerald-500 h-full" style={{width: `${fleetUtilization}%`}} />
                     <div className="bg-amber-500 h-full" style={{width: `${100-fleetUtilization}%`}} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 text-right">Maint: {maintenanceVehicles} Units</p>
               </div>
            </div>

            {/* 4. Driver Behavior Summary */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl"><Activity size={24}/></div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Score</span>
               </div>
               <h5 className="font-bold text-slate-700">คะแนนพฤติกรรม</h5>
               <div className="mt-2 flex items-end gap-3">
                  <span className="text-4xl font-black text-[#002D62]">{Math.round(avgDriverScore)}</span>
                  <div className="mb-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded">
                     GRADE {avgDriverScore >= 80 ? 'A' : avgDriverScore >= 70 ? 'B' : 'C'}
                  </div>
               </div>
               <p className="text-[10px] text-slate-400 mt-1">Fleet Average Score</p>
            </div>

         </div>
      </div>

      {/* AI CTA Section */}
      <div className="bg-gradient-to-br from-[#002D62] via-[#001D42] to-black p-6 md:p-10 rounded-2xl md:rounded-[3rem] shadow-xl text-white overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 hidden sm:block">
          <BrainCircuit size={140} />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-10">
          <div className="max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-[8px] md:text-[10px] font-black tracking-widest uppercase mb-4 border border-amber-500/30">
              <TrendingUp size={10} />
              Smart Analysis
            </div>
            <h4 className="text-2xl md:text-3xl lg:text-4xl font-black mb-3 tracking-tight leading-tight">
              ตรวจพบโอกาสใน <span className="text-amber-400">การประหยัดงบฯ</span>
            </h4>
            <p className="text-sm md:text-base lg:text-lg text-white/60 font-medium">
              AI ประมวลผลพบภารกิจซ้ำซ้อนในพื้นที่ สามารถลดค่าใช้จ่ายได้สูงสุด 12,450 บาท
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
             <button 
                onClick={onNavigateToAI}
                className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-amber-500 text-indigo-950 rounded-xl md:rounded-2xl font-black text-xs md:text-sm shadow-lg hover:scale-105 transition-all"
             >
               ดูข้อเสนอแนะ
             </button>
             <button 
                onClick={handleShareReport}
                className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl md:rounded-2xl font-black text-xs md:text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-2"
             >
               <Share2 size={18} />
               แชร์รีพอร์ต
             </button>
          </div>
        </div>
      </div>

      {/* Share Report Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#002D62]/70 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-indigo-950 shadow-lg">
                  <Share2 size={20} />
                </div>
                <h3 className="text-xl font-black text-[#002D62] tracking-tight">แชร์รายงานสรุปผล</h3>
              </div>
              <button onClick={() => setIsShareModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-8">
              {shareStep === 'options' ? (
                <div className="space-y-4">
                   <p className="text-sm text-slate-500 font-medium mb-6">เลือกรูปแบบการส่งออกข้อมูลที่ต้องการ ระบบจะทำการประมวลผลและตรวจสอบสิทธิ์ก่อนดำเนินการ</p>
                   
                   <button 
                    onClick={() => handleExportAction('pdf')}
                    disabled={isGenerating}
                    className="w-full p-6 bg-slate-50 hover:bg-white hover:shadow-xl hover:-translate-y-1 border border-transparent hover:border-amber-200 rounded-3xl transition-all flex items-center justify-between group"
                   >
                     <div className="flex items-center gap-5">
                       <div className="p-4 bg-white rounded-2xl shadow-sm text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                         <FileText size={24} />
                       </div>
                       <div className="text-left">
                         <p className="font-black text-slate-800">Official PDF Report</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Export for e-Saraban</p>
                       </div>
                     </div>
                     {isGenerating ? <Loader2 className="animate-spin text-amber-500" /> : <Download size={20} className="text-slate-300 group-hover:text-amber-500" />}
                   </button>

                   <button 
                    onClick={() => handleExportAction('link')}
                    disabled={isGenerating}
                    className="w-full p-6 bg-slate-50 hover:bg-white hover:shadow-xl hover:-translate-y-1 border border-transparent hover:border-blue-200 rounded-3xl transition-all flex items-center justify-between group"
                   >
                     <div className="flex items-center gap-5">
                       <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                         <LinkIcon size={24} />
                       </div>
                       <div className="text-left">
                         <p className="font-black text-slate-800">Secure Share Link</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Valid for 24 hours</p>
                       </div>
                     </div>
                     {isGenerating ? <Loader2 className="animate-spin text-amber-500" /> : <Share2 size={20} className="text-slate-300 group-hover:text-blue-500" />}
                   </button>

                   <button 
                    onClick={() => handleExportAction('email')}
                    disabled={isGenerating}
                    className="w-full p-6 bg-slate-50 hover:bg-white hover:shadow-xl hover:-translate-y-1 border border-transparent hover:border-emerald-200 rounded-3xl transition-all flex items-center justify-between group"
                   >
                     <div className="flex items-center gap-5">
                       <div className="p-4 bg-white rounded-2xl shadow-sm text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                         <Mail size={24} />
                       </div>
                       <div className="text-left">
                         <p className="font-black text-slate-800">Email to Executive</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Send as attachment</p>
                       </div>
                     </div>
                     {isGenerating ? <Loader2 className="animate-spin text-amber-500" /> : <Mail size={20} className="text-slate-300 group-hover:text-emerald-500" />}
                   </button>
                </div>
              ) : (
                <div className="py-10 text-center space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                    <ShieldCheck size={48} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-[#002D62] mb-2">ดำเนินการสำเร็จ</h4>
                    <p className="text-sm text-slate-400 font-medium">ระบบทำการประมวลผลและส่งต่อข้อมูลตามช่องทางที่เลือกเรียบร้อยแล้ว ข้อมูลการส่งออกถูกบันทึกใน Audit Trail</p>
                  </div>
                  <button 
                    onClick={() => setIsShareModalOpen(false)}
                    className="px-10 py-4 bg-[#002D62] text-white rounded-2xl font-black text-sm hover:bg-indigo-900 transition-all shadow-xl"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
