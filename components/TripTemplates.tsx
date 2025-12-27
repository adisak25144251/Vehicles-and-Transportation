import React, { useState } from 'react';
import { Copy, MapPin, Navigation, Clock, Star, Plus, CheckCircle, X, Save, Zap } from 'lucide-react';
import { TripTemplate } from '../types';

interface Props {
  onUse: (template: any) => void;
}

const TripTemplates: React.FC<Props> = ({ onUse }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templates, setTemplates] = useState([
    { id: '1', name: 'ตรวจเยี่ยมเขตกรุงเทพฯ', purpose: 'ติดตามผลโครงการ', route: 'สป. -> เขตพญาไท -> เขตดุสิต', duration: '4 ชม.', freq: 'รายสัปดาห์' },
    { id: '2', name: 'ประสานงานกรมบัญชีกลาง', purpose: 'ประสานงบประมาณ', route: 'สป. -> กรมบัญชีกลาง', duration: '2 ชม.', freq: 'ตามภารกิจ' },
    { id: '3', name: 'รับ-ส่ง เอกสารเร่งด่วน', purpose: 'งานธุรการ', route: 'สป. -> สำนักนายกฯ', duration: '1.5 ชม.', freq: 'รายวัน' },
  ]);

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    purpose: '',
    route: '',
    duration: '',
    freq: 'ตามภารกิจ'
  });

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const template = {
      id: Date.now().toString(),
      ...newTemplate
    };
    setTemplates([template, ...templates]);
    setIsModalOpen(false);
    setNewTemplate({
      name: '',
      purpose: '',
      route: '',
      duration: '',
      freq: 'ตามภารกิจ'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-3xl font-black text-[#002D62] tracking-tight">เทมเพลตภารกิจซ้ำซ้อน</h3>
          <p className="text-sm text-slate-400 font-medium">จัดการเส้นทางและภารกิจที่ใช้ประจำ เพื่อความรวดเร็วในการบันทึก</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-4 bg-[#002D62] text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-900/20 hover:bg-indigo-900 active:scale-95 transition-all"
        >
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
              <h4 className="text-2xl font-black text-slate-800 mb-2 tracking-tight line-clamp-1">{t.name}</h4>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">
                <Clock size={14} className="text-indigo-600" /> {t.freq} | EST. {t.duration}
              </div>
              <div className="space-y-4 mb-10 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <MapPin size={14} className="text-blue-600" />
                  </div>
                  <p className="text-sm text-slate-700 font-bold leading-relaxed line-clamp-2">{t.route}</p>
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
              Strategic Mission Template
            </div>
          </div>
        ))}
      </div>

      {/* New Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#002D62]/70 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-indigo-950 shadow-xl">
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#002D62] tracking-tight">สร้างเทมเพลตภารกิจ</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">กำหนดค่ามาตรฐานสำหรับการเดินทางที่เกิดขึ้นบ่อย</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="p-10 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">ชื่อภารกิจหลัก</label>
                  <input 
                    required
                    type="text" 
                    placeholder="เช่น ประสานงานกรมทางหลวง"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 shadow-inner focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">วัตถุประสงค์โดยย่อ</label>
                  <input 
                    required
                    type="text" 
                    placeholder="ระบุวัตถุประสงค์มาตรฐาน"
                    value={newTemplate.purpose}
                    onChange={(e) => setNewTemplate({...newTemplate, purpose: e.target.value})}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 shadow-inner focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">เส้นทางมาตรฐาน</label>
                  <input 
                    required
                    type="text" 
                    placeholder="เช่น สป. -> ปลายทาง A -> ปลายทาง B"
                    value={newTemplate.route}
                    onChange={(e) => setNewTemplate({...newTemplate, route: e.target.value})}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 shadow-inner focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">เวลาที่ใช้โดยประมาณ</label>
                    <input 
                      required
                      type="text" 
                      placeholder="เช่น 3 ชม."
                      value={newTemplate.duration}
                      onChange={(e) => setNewTemplate({...newTemplate, duration: e.target.value})}
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 shadow-inner focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">ความถี่</label>
                    <select 
                      value={newTemplate.freq}
                      onChange={(e) => setNewTemplate({...newTemplate, freq: e.target.value})}
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 shadow-inner outline-none"
                    >
                      <option>รายวัน</option>
                      <option>รายสัปดาห์</option>
                      <option>ตามภารกิจ</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex gap-4">
                 <div className="p-2 bg-white rounded-xl text-indigo-500 shadow-sm h-fit shrink-0"><Zap size={20} className="fill-amber-500 text-amber-500" /></div>
                 <p className="text-[10px] font-bold text-indigo-800 leading-relaxed">
                   AI Insight: เทมเพลตที่ชัดเจนจะช่วยลดเวลาในการกรอกข้อมูลลงได้กว่า 80% และช่วยให้ระบบวิเคราะห์ความซ้ำซ้อนของภารกิจได้แม่นยำยิ่งขึ้น
                 </p>
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-[#002D62] text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-900/30 hover:bg-indigo-900 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Save size={24} className="text-amber-400" />
                บันทึกเทมเพลตภารกิจ
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripTemplates;