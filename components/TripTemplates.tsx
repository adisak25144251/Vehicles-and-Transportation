
import React from 'react';
import { Copy, MapPin, Navigation, Clock, Star, Plus, CheckCircle } from 'lucide-react';
import { TripTemplate } from '../types';

interface Props {
  onUse: (template: any) => void;
}

const TripTemplates: React.FC<Props> = ({ onUse }) => {
  const templates = [
    { id: '1', name: 'ตรวจเยี่ยมเขตกรุงเทพฯ', purpose: 'ติดตามผลโครงการ', route: 'สป. -> เขตพญาไท -> เขตดุสิต', duration: '4 ชม.', freq: 'รายสัปดาห์' },
    { id: '2', name: 'ประสานงานกรมบัญชีกลาง', purpose: 'ประสานงบประมาณ', route: 'สป. -> กรมบัญชีกลาง', duration: '2 ชม.', freq: 'ตามภารกิจ' },
    { id: '3', name: 'รับ-ส่ง เอกสารเร่งด่วน', purpose: 'งานธุรการ', route: 'สป. -> สำนักนายกฯ', duration: '1.5 ชม.', freq: 'รายวัน' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-3xl font-black text-[#002D62] tracking-tight">เทมเพลตภารกิจซ้ำซ้อน</h3>
          <p className="text-sm text-slate-400 font-medium">จัดการเส้นทางและภารกิจที่ใช้ประจำ เพื่อความรวดเร็วในการบันทึก</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-[#002D62] text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-900/20 hover:bg-indigo-900 active:scale-95 transition-all">
          <Plus size={20} className="text-amber-400" />
          สร้างเทมเพลตใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {templates.map(t => (
          <div key={t.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col">
            <div className="p-10 flex-1">
              <div className="flex justify-between items-start mb-8">
                <div className="p-5 bg-amber-50 text-amber-600 rounded-3xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
                  <Star size={28} />
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Ready
                </div>
              </div>
              <h4 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">{t.name}</h4>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">
                <Clock size={14} className="text-indigo-600" /> {t.freq} | ESTIMATED {t.duration}
              </div>
              <div className="space-y-4 mb-10 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <MapPin size={14} className="text-blue-600" />
                  </div>
                  <p className="text-sm text-slate-700 font-bold leading-relaxed">{t.route}</p>
                </div>
              </div>
              <button 
                onClick={() => onUse(t)}
                className="w-full py-4 bg-slate-50 text-slate-700 rounded-2xl font-black text-sm hover:bg-amber-500 hover:text-white transition-all shadow-inner flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                สร้างทริปจากเทมเพลตนี้
              </button>
            </div>
            <div className="px-10 py-4 bg-slate-50/50 border-t border-slate-50 text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">
              Last used: 2 days ago
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TripTemplates;
