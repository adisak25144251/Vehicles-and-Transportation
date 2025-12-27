import React from 'react';
import { Trip } from '../types';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  Cell, PieChart, Pie
} from 'recharts';
import { Fuel, Route, Timer, CheckCircle2, BrainCircuit, TrendingUp, ArrowUpRight } from 'lucide-react';

interface Props {
  trips: Trip[];
}

const Dashboard: React.FC<Props> = ({ trips }) => {
  const totalKm = trips.reduce((acc, t) => acc + t.distanceKm, 0);
  const totalFuel = trips.reduce((acc, t) => acc + t.fuelCost, 0);
  const avgEfficiency = trips.length > 0 ? trips.reduce((acc, t) => acc + (t.efficiencyScore || 0), 0) / trips.length : 0;

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

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-700">
      {/* Top Cards Responsive Grid */}
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
              <button className="px-3 md:px-4 py-1.5 bg-white shadow-sm rounded-lg text-[10px] md:text-xs font-bold text-slate-800">Distance</button>
              <button className="px-3 md:px-4 py-1.5 text-[10px] md:text-xs font-bold text-slate-400 hover:text-slate-600">Trips</button>
            </div>
          </div>
          <div className="h-[250px] md:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorDist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B8860B" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#B8860B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}} />
                <Tooltip 
                  contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px'}}
                />
                <Area type="monotone" dataKey="dist" stroke="#B8860B" strokeWidth={3} fillOpacity={1} fill="url(#colorDist)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown (Hidden on small mobile if space is tight, or just stacked) */}
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

      {/* Responsive AI CTA */}
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
             <button className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-amber-500 text-indigo-950 rounded-xl md:rounded-2xl font-black text-xs md:text-sm shadow-lg hover:scale-105 transition-all">
               ดูข้อเสนอแนะ
             </button>
             <button className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl md:rounded-2xl font-black text-xs md:text-sm hover:bg-white/20 transition-all">
               แชร์รีพอร์ต
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;