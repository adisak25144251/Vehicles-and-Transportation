
import React from 'react';
import { Gavel, ShieldCheck, AlertCircle, TrendingUp, Info } from 'lucide-react';

const PolicyEngine: React.FC = () => {
  const policies = [
    { id: '1', name: 'เพดานค่าน้ำมันรายทริป', value: 'ไม่เกิน 2,500 ฿', status: 'Active', icon: ShieldCheck },
    { id: '2', name: 'ระยะทางสูงสุดต่อวัน', value: '450 KM', status: 'Active', icon: ShieldCheck },
    { id: '3', name: 'ความเร็วสูงสุดที่อนุญาต', value: '110 KM/H', status: 'Alert Only', icon: AlertCircle },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-[#002D62] p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 p-10 opacity-10"><Gavel size={180} /></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-3xl font-black mb-4 flex items-center gap-4">
              <Gavel size={36} className="text-amber-400" />
              Policy Control Engine
            </h3>
            <p className="text-white/60 max-w-xl leading-relaxed">
              กำหนดกฎระเบียบการเดินทางและเบิกจ่าย เพื่อให้ระบบตรวจสอบความถูกต้องโดยอัตโนมัติก่อนส่งเรื่องอนุมัติ
            </p>
          </div>
          <button className="px-8 py-4 bg-amber-500 text-indigo-950 rounded-2xl font-black text-sm shadow-xl shadow-amber-500/20 hover:scale-105 transition-all">
            แก้ไขนโยบายรวม
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {policies.map(p => (
          <div key={p.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 group hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
             <div className={`p-4 rounded-2xl w-fit mb-6 ${p.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                <p.icon size={24} />
             </div>
             <h4 className="font-black text-slate-800 mb-2">{p.name}</h4>
             <p className="text-2xl font-black text-indigo-600 mb-4">{p.value}</p>
             <div className="flex items-center justify-between pt-4 border-t border-slate-50">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{p.status}</span>
               <button className="text-xs font-bold text-indigo-600 hover:underline">รายละเอียด</button>
             </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-100 p-8 rounded-[2rem] flex flex-col md:flex-row gap-6">
        <div className="p-4 bg-white rounded-2xl text-blue-600 shadow-sm shrink-0 h-fit"><Info size={32} /></div>
        <div>
          <h5 className="text-xl font-bold text-blue-900 mb-2">Policy Compliance Insights</h5>
          <p className="text-sm text-blue-800/80 leading-relaxed mb-6">
            สถิติในเดือนที่ผ่านมา พบทริปที่ "เกินนโยบาย" เพียง 2% ซึ่งส่วนใหญ่เกิดจากภารกิจเร่งด่วน ระบบได้ทำการบันทึกเหตุผลประกอบและส่งเรื่องให้ Auditor ตรวจสอบแล้ว
          </p>
          <div className="flex gap-4">
             <div className="bg-white/50 px-6 py-3 rounded-xl border border-white/50 text-center">
               <p className="text-[10px] font-black text-blue-400 uppercase">Compliance Rate</p>
               <p className="text-xl font-black text-blue-900">98.4%</p>
             </div>
             <div className="bg-white/50 px-6 py-3 rounded-xl border border-white/50 text-center">
               <p className="text-[10px] font-black text-blue-400 uppercase">Flags Resolved</p>
               <p className="text-xl font-black text-blue-900">12 / 14</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyEngine;
