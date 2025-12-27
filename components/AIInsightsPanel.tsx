
import React, { useEffect, useState } from 'react';
import { Trip, AIInsight } from '../types';
import { getTripInsights } from '../services/geminiService';
import { 
  BrainCircuit, 
  Sparkles, 
  AlertCircle, 
  Lightbulb, 
  Trophy,
  RefreshCw
} from 'lucide-react';

interface Props {
  trips: Trip[];
}

const AIInsightsPanel: React.FC<Props> = ({ trips }) => {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    const result = await getTripInsights(trips);
    setInsight(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchInsights();
  }, [trips]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100 space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
          <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-600" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-[#002D62]">AI กำลังวิเคราะห์ข้อมูลทริปของคุณ...</h3>
          <p className="text-slate-500 text-sm">การประมวลผลนี้ใช้เวลาประมาณ 5-10 วินาที</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-[#002D62] text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
           <div className="absolute -right-4 -bottom-4 opacity-10">
              <Trophy size={120} />
           </div>
           <div className="relative z-10">
             <h4 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-4">Final Score</h4>
             <div className="text-6xl font-black mb-2">{insight?.scores.efficiency || 0}</div>
             <p className="text-white/60 text-xs">คำนวณจากปัจจัยด้านระยะทาง เวลา และค่าใช้จ่าย</p>
           </div>
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
           {Object.entries(insight?.scores || {}).map(([key, val]) => (
             <div key={key} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
               <p className="text-xs font-bold text-slate-400 uppercase mb-2">{key}</p>
               <div className="flex items-end gap-2">
                 <span className="text-3xl font-bold text-slate-800">{val}</span>
                 <span className="text-sm text-slate-400 mb-1">/ 100</span>
               </div>
               <div className="w-full h-1.5 bg-slate-100 rounded-full mt-4">
                 <div className="h-full bg-amber-500 rounded-full" style={{width: `${val}%`}} />
               </div>
             </div>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Summary & Recommendations */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 h-full">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="text-amber-500" size={24} />
              <h4 className="text-xl font-bold text-[#002D62]">Executive Summary</h4>
            </div>
            <p className="text-slate-700 leading-relaxed text-lg mb-8">
              {insight?.summary}
            </p>
            <div className="space-y-4">
               <h5 className="font-bold text-slate-800 flex items-center gap-2">
                 <Lightbulb size={18} className="text-blue-500" />
                 คำแนะนำเพื่อการพัฒนา
               </h5>
               <ul className="space-y-3">
                 {insight?.recommendations.map((rec, i) => (
                   <li key={i} className="flex gap-3 p-3 bg-blue-50 rounded-xl text-sm text-blue-900 border border-blue-100">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                     {rec}
                   </li>
                 ))}
               </ul>
            </div>
          </div>
        </div>

        {/* Anomalies & Optimization */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="text-red-500" size={24} />
              <h4 className="text-xl font-bold text-[#002D62]">ตรวจสอบความผิดปกติ</h4>
            </div>
            <div className="space-y-4">
               {insight?.anomalies.map((anom, i) => (
                 <div key={i} className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-4">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-900 mb-1">Anomaly Detected</p>
                      <p className="text-xs text-red-700/80">{anom}</p>
                    </div>
                 </div>
               ))}
               {(!insight?.anomalies || insight.anomalies.length === 0) && (
                 <div className="py-8 text-center text-slate-400">
                    <RefreshCw className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">ไม่พบความผิดปกติจากการวิเคราะห์เบื้องต้น</p>
                 </div>
               )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-8 rounded-2xl shadow-xl text-white">
             <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
               <Trophy size={20} />
               Optimization Challenge
             </h4>
             <p className="text-white/80 text-sm mb-6">
               หากดำเนินการตามข้อแนะนำ คุณสามารถลดค่าเชื้อเพลิงได้เฉลี่ย <span className="font-bold text-white text-lg">1,240 ฿ / เดือน</span> และลดการปล่อย CO2 ได้กว่า 15%
             </p>
             <button onClick={fetchInsights} className="w-full py-3 bg-white text-amber-600 rounded-xl font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform">
               Re-Calculate Analysis
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsPanel;
