
import React, { useState, useEffect } from 'react';
import { privacyService } from '../services/privacyService';
import { auditService } from '../services/auditService';
import { DataRetentionPolicy, UserRole } from '../types';
import { 
  Shield, Eye, EyeOff, Database, Clock, 
  Trash2, Save, AlertTriangle, CheckCircle2,
  Lock, Unlock, FileText
} from 'lucide-react';

const PrivacyConsole: React.FC = () => {
  const [policy, setPolicy] = useState<DataRetentionPolicy>(privacyService.getRetentionPolicy());
  const [activeTab, setActiveTab] = useState<'RETENTION' | 'MATRIX'>('RETENTION');
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePolicy = async () => {
    setIsSaving(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1000));
    
    privacyService.updateRetentionPolicy(policy);
    
    // Log Audit
    auditService.log(
      'PRIVACY_UPDATE',
      { fullName: 'Admin User', role: UserRole.ADMIN },
      'RETENTION_POLICY',
      'POLICY',
      `Updated retention: Raw=${policy.rawTelemetryDays}d, Stats=${policy.aggregatedStatsDays}d`
    );

    setIsSaving(false);
    alert('บันทึกนโยบายเรียบร้อยแล้ว');
  };

  const visibilityMatrix = [
    { role: 'ADMIN', standard: true, sensitive: true, secret: true },
    { role: 'MANAGER', standard: true, sensitive: true, secret: false },
    { role: 'DISPATCHER', standard: true, sensitive: true, secret: false },
    { role: 'OFFICER', standard: true, sensitive: false, secret: false },
    { role: 'PUBLIC', standard: false, sensitive: false, secret: false },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-['Sarabun'] pb-20">
      
      {/* Header */}
      <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden border border-slate-800">
         <div className="absolute top-0 right-0 p-6 opacity-10">
            <Shield size={140} />
         </div>
         <div className="relative z-10">
            <h3 className="text-3xl font-black mb-2 flex items-center gap-3 text-emerald-400">
               <Lock size={32} />
               Privacy & Governance
            </h3>
            <p className="text-slate-400 text-sm">ศูนย์ควบคุมนโยบายความเป็นส่วนตัวและการจัดเก็บข้อมูล (PDPA Compliance)</p>
         </div>
         <div className="flex gap-2 mt-6">
            <button 
              onClick={() => setActiveTab('RETENTION')}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'RETENTION' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
            >
              Data Retention
            </button>
            <button 
              onClick={() => setActiveTab('MATRIX')}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'MATRIX' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
            >
              Access Matrix
            </button>
         </div>
      </div>

      {activeTab === 'RETENTION' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Policy Form */}
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h4 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
                 <Database className="text-indigo-500" /> Lifecycle Management
              </h4>
              
              <div className="space-y-6">
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Raw Telemetry (พิกัดละเอียด)</label>
                    <div className="flex items-center gap-4">
                       <input 
                         type="range" min="7" max="90" step="1"
                         value={policy.rawTelemetryDays}
                         onChange={(e) => setPolicy({...policy, rawTelemetryDays: parseInt(e.target.value)})}
                         className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                       />
                       <span className="w-16 text-center font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{policy.rawTelemetryDays} Days</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">หลังจากครบกำหนด ข้อมูลพิกัดรายวินาทีจะถูกลบถาวร เหลือเพียงข้อมูลสรุป</p>
                 </div>

                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Aggregated Stats (สถิติสรุป)</label>
                    <div className="flex items-center gap-4">
                       <input 
                         type="range" min="90" max="1095" step="30"
                         value={policy.aggregatedStatsDays}
                         onChange={(e) => setPolicy({...policy, aggregatedStatsDays: parseInt(e.target.value)})}
                         className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                       />
                       <span className="w-16 text-center font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{policy.aggregatedStatsDays} Days</span>
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Incident Logs (ประวัติอุบัติเหตุ)</label>
                    <div className="flex items-center gap-4">
                       <input 
                         type="range" min="30" max="365" step="30"
                         value={policy.incidentLogsDays}
                         onChange={(e) => setPolicy({...policy, incidentLogsDays: parseInt(e.target.value)})}
                         className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                       />
                       <span className="w-16 text-center font-black text-red-500 bg-red-50 px-2 py-1 rounded-lg">{policy.incidentLogsDays} Days</span>
                    </div>
                 </div>

                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Trash2 size={20} className="text-slate-400" />
                       <span className="text-sm font-bold text-slate-700">Auto-Delete Archived Data</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={policy.autoDelete}
                      onChange={(e) => setPolicy({...policy, autoDelete: e.target.checked})}
                      className="w-5 h-5 accent-emerald-500 rounded"
                    />
                 </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                 <button 
                   onClick={handleSavePolicy}
                   disabled={isSaving}
                   className="w-full py-4 bg-[#002D62] text-white rounded-2xl font-black text-sm hover:bg-indigo-900 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300"
                 >
                   {isSaving ? 'Saving...' : <><Save size={18} /> Apply Policy</>}
                 </button>
              </div>
           </div>

           {/* Explainer */}
           <div className="space-y-6">
              <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100">
                 <h5 className="font-black text-amber-800 mb-2 flex items-center gap-2"><AlertTriangle size={20}/> Policy Impact</h5>
                 <p className="text-sm text-amber-900/70 leading-relaxed">
                    การเปลี่ยนแปลงนโยบายจะมีผลในรอบการรัน Batch Job ถัดไป (เวลา 02:00 น.) ข้อมูลที่อายุเกินกำหนดจะถูกลบออกจากระบบอย่างถาวรและไม่สามารถกู้คืนได้ตามมาตรฐาน NIST 800-88
                 </p>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                 <h5 className="font-bold text-slate-800 mb-4">Data Lifecycle Visualization</h5>
                 <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    <div className="relative">
                       <div className="absolute -left-[29px] top-0 w-6 h-6 bg-indigo-500 rounded-full border-4 border-white shadow-sm"></div>
                       <h6 className="font-bold text-indigo-600 text-sm">Hot Storage (Live)</h6>
                       <p className="text-xs text-slate-400">Real-time GPS, High Precision</p>
                    </div>
                    <div className="relative">
                       <div className="absolute -left-[29px] top-0 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-sm"></div>
                       <h6 className="font-bold text-emerald-600 text-sm">Warm Storage (Aggregated)</h6>
                       <p className="text-xs text-slate-400">Daily summaries, Privacy masked</p>
                    </div>
                    <div className="relative">
                       <div className="absolute -left-[29px] top-0 w-6 h-6 bg-slate-400 rounded-full border-4 border-white shadow-sm"></div>
                       <h6 className="font-bold text-slate-600 text-sm">Cold / Deleted</h6>
                       <p className="text-xs text-slate-400">Archived for audit or purged</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'MATRIX' && (
         <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <h4 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
               <Eye className="text-blue-500" /> Visibility Matrix
            </h4>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Role</th>
                        <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Standard</th>
                        <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Sensitive</th>
                        <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Secret</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {visibilityMatrix.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                           <td className="p-4 font-bold text-slate-700 text-sm">{row.role}</td>
                           <td className="p-4 text-center">
                              {row.standard ? <CheckCircle2 size={18} className="mx-auto text-emerald-500" /> : <EyeOff size={18} className="mx-auto text-slate-300" />}
                           </td>
                           <td className="p-4 text-center">
                              {row.sensitive ? <CheckCircle2 size={18} className="mx-auto text-emerald-500" /> : <EyeOff size={18} className="mx-auto text-slate-300" />}
                           </td>
                           <td className="p-4 text-center">
                              {row.secret ? <CheckCircle2 size={18} className="mx-auto text-emerald-500" /> : <EyeOff size={18} className="mx-auto text-slate-300" />}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 text-xs text-blue-800">
               <strong>Note:</strong> Sensitive mode applies fuzzing to coordinates (~1km) and masks personal names. Secret mode completely hides location data.
            </div>
         </div>
      )}

    </div>
  );
};

export default PrivacyConsole;
