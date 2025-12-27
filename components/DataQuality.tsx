import React, { useState } from 'react';
import { Trip, DataQualityReport } from '../types';
import { 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Database,
  Search,
  Zap,
  Loader2
} from 'lucide-react';

interface Props {
  trips: Trip[];
  onUpdateTrips: (trips: Trip[]) => void;
}

const DataQuality: React.FC<Props> = ({ trips, onUpdateTrips }) => {
  const [isFixing, setIsFixing] = useState(false);

  // Dynamic analysis based on real trips + some mocked issues for demonstration
  const flaggedTrips = trips.filter(t => t.status === 'FLAGGED');
  const incompleteTrips = trips.filter(t => !t.startLocation.address || !t.endLocation.address);
  
  const report: DataQualityReport = {
    overallScore: 100 - (flaggedTrips.length * 5) - (incompleteTrips.length * 2),
    completeness: 100 - (incompleteTrips.length * 10),
    consistency: 100 - (flaggedTrips.length * 8),
    anomaliesFound: flaggedTrips.length + incompleteTrips.length,
    issues: [
      ...flaggedTrips.map(t => ({
        id: `f-${t.id}`,
        field: 'สถานะทริป',
        message: `ทริปภารกิจ "${t.missionName}" ถูกทำเครื่องหมายว่าผิดปกติ`,
        severity: 'MEDIUM' as const
      })),
      ...incompleteTrips.map(t => ({
        id: `i-${t.id}`,
        field: 'ข้อมูลสถานที่',
        message: `ทริปภารกิจ "${t.missionName}" ข้อมูลที่อยู่ไม่ครบถ้วน`,
        severity: 'HIGH' as const
      })),
      // Static mock issues if no real issues found to show the UI
      ...(flaggedTrips.length === 0 && incompleteTrips.length === 0 ? [
        { id: 'm1', field: 'ข้อมูลพิกัด/สถานที่', message: 'พบจุดแวะพักที่ขาดพิกัดละติจูด/ลองจิจูดในฐานข้อมูลประวัติ', severity: 'LOW' as const },
        { id: 'm2', field: 'ค่าเชื้อเพลิง', message: 'พบความผิดปกติของค่าเชื้อเพลิง (Outlier) ในประวัติปีก่อนหน้า', severity: 'MEDIUM' as const }
      ] : [])
    ]
  };

  const handleAutoFix = () => {
    setIsFixing(true);
    
    // Simulate complex AI/Data processing
    setTimeout(() => {
      const fixedTrips = trips.map(t => {
        let updated = { ...t };
        // "Fix" logic: Resolve flagged status and fill missing generic addresses
        if (updated.status === 'FLAGGED') updated.status = 'COMPLETED';
        if (!updated.startLocation.address) updated.startLocation.address = 'ระบุโดยระบบอัตโนมัติ';
        if (!updated.endLocation.address) updated.endLocation.address = 'ระบุโดยระบบอัตโนมัติ';
        return updated;
      });

      onUpdateTrips(fixedTrips);
      setIsFixing(false);
      alert('แก้ไขข้อมูลที่ผิดปกติเบื้องต้นสำเร็จแล้ว');
    }, 1500);
  };

  const getSeverityColor = (sev: string) => {
    switch(sev) {
      case 'HIGH': return 'bg-red-50 text-red-700 border-red-100';
      case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  const getSeverityLabel = (sev: string) => {
    switch(sev) {
      case 'HIGH': return 'เร่งด่วนที่สุด';
      case 'MEDIUM': return 'ปานกลาง';
      default: return 'ต่ำ';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-full border-8 border-slate-50 flex items-center justify-center mb-4 relative overflow-hidden">
            <svg className="w-full h-full -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-emerald-500" strokeDasharray={`${Math.max(0, report.overallScore) * 1.76} 176`} style={{transform: 'translate(4px, 4px)'}} />
            </svg>
            <span className="absolute text-2xl font-black text-slate-800">{Math.max(0, report.overallScore)}%</span>
          </div>
          <h5 className="font-bold text-slate-800">คุณภาพข้อมูลรวม</h5>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">ดัชนีความน่าเชื่อถือ</p>
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
             <div className="flex justify-between items-center mb-4">
               <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Database size={24} /></div>
               <span className="text-2xl font-black text-slate-800">{Math.max(0, report.completeness)}%</span>
             </div>
             <h6 className="font-bold text-slate-700">ความครบถ้วน</h6>
             <p className="text-xs text-slate-400 mt-1">ร้อยละของข้อมูลที่จำเป็นต่อการวิเคราะห์</p>
           </div>
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
             <div className="flex justify-between items-center mb-4">
               <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle2 size={24} /></div>
               <span className="text-2xl font-black text-slate-800">{Math.max(0, report.consistency)}%</span>
             </div>
             <h6 className="font-bold text-slate-700">ความสม่ำเสมอ</h6>
             <p className="text-xs text-slate-400 mt-1">ความเชื่อมโยงและความถูกต้องของข้อมูลทริป</p>
           </div>
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
             <div className="flex justify-between items-center mb-4">
               <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><ShieldAlert size={24} /></div>
               <span className="text-2xl font-black text-slate-800">{report.anomaliesFound}</span>
             </div>
             <h6 className="font-bold text-slate-700">จุดที่ผิดปกติ</h6>
             <p className="text-xs text-slate-400 mt-1">รายการที่รอการตรวจสอบโดยเจ้าหน้าที่</p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h4 className="text-xl font-bold text-[#002D62] flex items-center gap-2">
              <Search size={20} className="text-amber-500" />
              บันทึกปัญหาคุณภาพข้อมูล
            </h4>
            <p className="text-sm text-slate-500">ตรวจสอบและแก้ไขจุดบกพร่องของข้อมูลที่ระบบตรวจพบ</p>
          </div>
          <button 
            onClick={handleAutoFix}
            disabled={isFixing || report.issues.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#002D62] text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-indigo-500/20 transition-all disabled:bg-slate-300 disabled:shadow-none"
          >
            {isFixing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                กำลังดำเนินการ...
              </>
            ) : (
              <>
                <Zap size={16} className="text-amber-400 fill-amber-400" />
                แก้ไขข้อผิดพลาดอัตโนมัติ
              </>
            )}
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {report.issues.length > 0 ? report.issues.map((issue) => (
            <div key={issue.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors group">
              <div className="flex items-start gap-4">
                <div className={`mt-1 p-2 rounded-xl border ${getSeverityColor(issue.severity)}`}>
                  <AlertCircle size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-800">{issue.field}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border ${getSeverityColor(issue.severity)}`}>
                      {getSeverityLabel(issue.severity)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{issue.message}</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-white hover:border-amber-400 hover:text-amber-600 shadow-sm transition-all opacity-0 group-hover:opacity-100">
                แก้ไขข้อมูล
              </button>
            </div>
          )) : (
            <div className="p-20 text-center flex flex-col items-center gap-4">
               <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                 <CheckCircle2 size={32} />
               </div>
               <p className="font-bold text-slate-400 uppercase tracking-widest">ไม่พบปัญหาคุณภาพข้อมูลในขณะนี้</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataQuality;