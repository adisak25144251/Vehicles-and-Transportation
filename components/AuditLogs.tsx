
import React, { useState, useEffect } from 'react';
import { auditService } from '../services/auditService';
import { AuditLogEntry, AuditAction } from '../types';
import { 
  History, 
  Search, 
  Download, 
  Filter,
  CheckCircle2,
  XCircle,
  User,
  Shield,
  Eye,
  FileCode,
  Link as LinkIcon
} from 'lucide-react';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    // Load logs
    const data = auditService.getAll();
    setLogs(data);
  }, []);

  const handleExport = () => {
    auditService.exportLogsToCSV();
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.actor.name.toLowerCase().includes(search.toLowerCase()) ||
      log.targetId.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filterAction === 'ALL' || log.action === filterAction;

    return matchesSearch && matchesFilter;
  });

  const getActionColor = (action: AuditAction) => {
    if (action.includes('REJECT') || action.includes('INCIDENT')) return 'bg-red-50 text-red-600 border-red-100';
    if (action.includes('APPROVE') || action.includes('START')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (action.includes('EXPORT')) return 'bg-blue-50 text-blue-600 border-blue-100';
    return 'bg-slate-50 text-slate-600 border-slate-100';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 font-['Sarabun'] pb-20">
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
            ระบบจัดเก็บประวัติการทำงานแบบ Hash Chaining เพื่อความโปร่งใสและตรวจสอบได้ตามมาตรฐานสากล (ISO/IEC 27001) ข้อมูลไม่สามารถแก้ไขย้อนหลังได้
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="ค้นหาตาม User, ID หรือ กิจกรรม..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm font-medium"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 outline-none text-xs font-bold"
            >
              <option value="ALL">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="TRIP_START">Trip Start</option>
              <option value="REQ_APPROVE">Approve</option>
              <option value="REQ_REJECT">Reject</option>
              <option value="EXPORT_DATA">Export</option>
            </select>
            <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actor</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Details</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.length === 0 ? (
                 <tr><td colSpan={5} className="text-center py-10 text-slate-400">ไม่พบข้อมูล Audit Log</td></tr>
              ) : filteredLogs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr 
                    onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-5">
                      <div className="text-xs font-bold text-slate-800">
                        {new Date(log.timestamp).toLocaleDateString('th-TH')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString('th-TH')}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                          <User size={14} />
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-700">{log.actor.name}</p>
                           <p className="text-[9px] text-slate-400 uppercase font-bold">{log.actor.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-lg border uppercase tracking-wide ${getActionColor(log.action)}`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-medium text-slate-600 truncate max-w-xs">{log.details}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">ID: {log.targetId}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-300">
                          <LinkIcon size={14} />
                       </div>
                    </td>
                  </tr>
                  {/* Expanded Detail Row */}
                  {expandedLogId === log.id && (
                    <tr className="bg-slate-50/50 border-b border-slate-100 animate-in fade-in">
                       <td colSpan={5} className="px-6 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <h5 className="text-xs font-black text-[#002D62] uppercase tracking-widest mb-2">Technical Metadata</h5>
                                <div className="space-y-1 text-[10px] font-mono text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
                                   <p>Log ID: {log.id}</p>
                                   <p>Client IP: {log.actor.ip}</p>
                                   <p>Device: {log.actor.device}</p>
                                   <p className="truncate" title={log.prevHash}>Prev Hash: {log.prevHash}</p>
                                   <p className="truncate text-amber-600 font-bold" title={log.hash}>Current Hash: {log.hash}</p>
                                </div>
                             </div>
                             {log.diff && (
                                <div>
                                   <h5 className="text-xs font-black text-[#002D62] uppercase tracking-widest mb-2 flex items-center gap-2">
                                      <FileCode size={14} /> Data Diff
                                   </h5>
                                   <div className="grid grid-cols-2 gap-2 text-[10px]">
                                      <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                                         <p className="font-bold text-red-700 mb-1">Before</p>
                                         <pre className="whitespace-pre-wrap text-red-600/80">{JSON.stringify(log.diff.before, null, 2)}</pre>
                                      </div>
                                      <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                         <p className="font-bold text-emerald-700 mb-1">After</p>
                                         <pre className="whitespace-pre-wrap text-emerald-600/80">{JSON.stringify(log.diff.after, null, 2)}</pre>
                                      </div>
                                   </div>
                                </div>
                             )}
                          </div>
                       </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
