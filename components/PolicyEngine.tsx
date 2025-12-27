import React, { useState } from 'react';
import { Gavel, ShieldCheck, AlertCircle, TrendingUp, Info, X, Save, Settings2, Zap } from 'lucide-react';

interface Policy {
  id: string;
  name: string;
  value: string;
  numericValue: number;
  unit: string;
  status: 'Active' | 'Alert Only';
  description: string;
}

const PolicyEngine: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [policies, setPolicies] = useState<Policy[]>([
    { 
      id: '1', 
      name: 'เพดานค่าน้ำมันรายทริป', 
      value: '2,500 ฿', 
      numericValue: 2500, 
      unit: '฿', 
      status: 'Active',
      description: 'จำกัดงบประมาณเชื้อเพลิงสูงสุดต่อ 1 เลขที่ใบงาน'
    },
    { 
      id: '2', 
      name: 'ระยะทางสูงสุดต่อวัน', 
      value: '450 KM', 
      numericValue: 450, 
      unit: 'KM', 
      status: 'Active',
      description: 'กำหนดระยะทางวิ่งสูงสุดที่อนุญาตให้ปฏิบัติราชการใน 1 วัน'
    },
    { 
      id: '3', 
      name: 'ความเร็วสูงสุดที่อนุญาต', 
      value: '110 KM/H', 
      numericValue: 110, 
      unit: 'KM/H', 
      status: 'Alert Only',
      description: 'ระบบจะแจ้งเตือน (Flag) หากมีการขับขี่เกินความเร็วที่กำหนด'
    },
  ]);

  const [editFormData, setEditFormData] = useState<Policy[]>([]);

  const handleOpenEdit = () => {
    setEditFormData([...policies]);
    setIsModalOpen(true);
  };

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPolicies = editFormData.map(p => ({
      ...p,
      value: `${p.numericValue.toLocaleString()} ${p.unit}`
    }));
    setPolicies(updatedPolicies);
    setIsModalOpen(false);
    // ในระบบจริงจะมีการส่ง Log ไปที่ Audit Trail ที่นี่
  };

  const handleInputChange = (id: string, field: keyof Policy, value: any) => {
    setEditFormData(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

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
            <p className="text-white/60 max-w-xl leading-relaxed font-medium">
              กำหนดกฎระเบียบการเดินทางและเบิกจ่าย เพื่อให้ระบบตรวจสอบความถูกต้องโดยอัตโนมัติก่อนส่งเรื่องอนุมัติ
            </p>
          </div>
          <button 
            onClick={handleOpenEdit}
            className="px-8 py-4 bg-amber-500 text-indigo-950 rounded-2xl font-black text-sm shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Settings2 size={18} />
            แก้ไขนโยบายรวม
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {policies.map(p => (
          <div key={p.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 flex flex-col h-full">
             <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${p.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {p.status === 'Active' ? <ShieldCheck size={24} /> : <AlertCircle size={24} />}
                </div>
                <div className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${p.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {p.status}
                </div>
             </div>
             <h4 className="font-black text-slate-800 mb-1">{p.name}</h4>
             <p className="text-xs text-slate-400 mb-6 font-medium leading-relaxed">{p.description}</p>
             <div className="mt-auto">
                <p className="text-3xl font-black text-indigo-600 mb-4 tracking-tight">{p.value}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Threshold</span>
                  <button className="text-[10px] font-black text-indigo-600 hover:text-amber-600 uppercase tracking-widest transition-colors">ประวัติการแก้ไข</button>
                </div>
             </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-100 p-8 rounded-[2rem] flex flex-col md:flex-row gap-6">
        <div className="p-4 bg-white rounded-2xl text-blue-600 shadow-sm shrink-0 h-fit"><Zap size={32} className="text-amber-500 fill-amber-500" /></div>
        <div>
          <h5 className="text-xl font-bold text-blue-900 mb-2">Policy Compliance Insights</h5>
          <p className="text-sm text-blue-800/80 leading-relaxed mb-6 font-medium">
            สถิติในเดือนที่ผ่านมา พบทริปที่ "เกินนโยบาย" เพียง 2.1% ซึ่งส่วนใหญ่เป็นภารกิจเร่งด่วน ระบบได้ทำการบันทึกเหตุผลประกอบและส่งเรื่องให้หัวหน้างานตรวจสอบแล้ว
          </p>
          <div className="flex gap-4">
             <div className="bg-white/50 px-6 py-4 rounded-2xl border border-white/50 text-center shadow-sm">
               <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Compliance Rate</p>
               <p className="text-2xl font-black text-blue-900">98.4%</p>
             </div>
             <div className="bg-white/50 px-6 py-4 rounded-2xl border border-white/50 text-center shadow-sm">
               <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Flags Resolved</p>
               <p className="text-2xl font-black text-emerald-600">12 / 14</p>
             </div>
          </div>
        </div>
      </div>

      {/* Policy Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#002D62]/70 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-[#002D62] rounded-2xl flex items-center justify-center text-amber-400 shadow-xl">
                  <Gavel size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#002D62] tracking-tight">แก้ไขนโยบายส่วนกลาง</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">การแก้ไขค่าเหล่านี้จะมีผลต่อการ Flag รายการที่ผิดปกติทันที</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSavePolicies} className="p-10 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="space-y-6">
                {editFormData.map((policy) => (
                  <div key={policy.id} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-amber-200 hover:bg-white transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-black text-[#002D62] mb-1">{policy.name}</label>
                        <p className="text-xs text-slate-400 font-medium mb-4">{policy.description}</p>
                        <div className="flex items-center gap-4">
                           <div className="flex-1 relative">
                              <input 
                                type="number" 
                                value={policy.numericValue}
                                onChange={(e) => handleInputChange(policy.id, 'numericValue', Number(e.target.value))}
                                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-slate-800 shadow-sm focus:border-amber-400 outline-none pr-16"
                              />
                              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase">{policy.unit}</span>
                           </div>
                           <select 
                              value={policy.status}
                              onChange={(e) => handleInputChange(policy.id, 'status', e.target.value)}
                              className="p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-xs text-slate-600 outline-none focus:border-indigo-400"
                           >
                             <option value="Active">Active (Force)</option>
                             <option value="Alert Only">Alert Only</option>
                           </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex gap-4">
                 <div className="p-2 bg-white rounded-xl text-amber-500 shadow-sm h-fit shrink-0"><AlertCircle size={20} /></div>
                 <p className="text-xs font-bold text-amber-800 leading-relaxed">
                   คำเตือน: การเปลี่ยนค่าเพดานเหล่านี้จะถูกส่งไปยัง Audit Trail และแนบไปกับรายงานวิเคราะห์ความโปร่งใสประจำเดือนเพื่อให้ Auditor ตรวจสอบความสมเหตุสมผล
                 </p>
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-[#002D62] text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-900/30 hover:bg-indigo-900 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Save size={24} className="text-amber-400" />
                บันทึกการเปลี่ยนแปลงนโยบาย
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicyEngine;