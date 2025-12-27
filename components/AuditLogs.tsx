
import React from 'react';
import { MOCK_AUDITS } from '../constants';
import { 
  History, 
  Search, 
  Download, 
  Filter,
  CheckCircle2,
  XCircle,
  User,
  Shield
} from 'lucide-react';

const AuditLogs: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="bg-[#002D62] p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden mb-10 text-white">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <Shield size={180} />
        </div>
        <div className="relative z-10">
          <h3 className="text-3xl font-black mb-4 flex items-center gap-4">
            <History size={36} className="text-amber-400" />
            Immutable Audit Trail
          </h3>
          <p className="text-white/60 max-w-2xl leading-relaxed">
            ระบบจัดเก็บประวัติการทำงานทุกขั้นตอนในรูปแบบที่ไม่สามารถแก้ไขได้ เพื่อความโปร่งใสและตรวจสอบได้ตามมาตรฐานสากล (ISO/IEC 27001)
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="ค้นหาตาม User, Action หรือ Target..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm font-medium"
            />
          </div>
          <div className="flex gap-2">
            <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
              <Filter size={20} />
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">
              <Download size={18} />
              Export Log
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">User ID</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Target</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_AUDITS.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="text-sm font-medium text-slate-800">
                      {new Date(log.timestamp).toLocaleDateString('th-TH')}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold">
                      {new Date(log.timestamp).toLocaleTimeString('th-TH')}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <User size={14} />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{log.userId}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs font-black px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-mono text-slate-500">{log.target}</span>
                  </td>
                  <td className="px-8 py-5">
                    {log.status === 'SUCCESS' ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase tracking-widest">
                        <CheckCircle2 size={14} />
                        Success
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-red-600 font-bold text-xs uppercase tracking-widest">
                        <XCircle size={14} />
                        Failure
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-center">
           <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
             View Older Records
           </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
