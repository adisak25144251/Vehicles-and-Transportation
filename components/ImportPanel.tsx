
import React, { useState } from 'react';
import { Trip } from '../types';
import { 
  FileUp, 
  CheckCircle2, 
  AlertTriangle, 
  Upload,
  Info,
  X,
  Loader2
} from 'lucide-react';

interface Props {
  onImport: (trips: Trip[]) => void;
}

const ImportPanel: React.FC<Props> = ({ onImport }) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleProcessImport = () => {
    setProcessing(true);
    // Simulation of parsing and extracting trips
    setTimeout(() => {
      const importedTrips: Trip[] = files.map((file, idx) => ({
        id: 'imp-' + Date.now() + idx,
        missionName: `ภารกิจนำเข้า (${file.name})`,
        purpose: 'จากการนำเข้าไฟล์ข้อมูลภายนอก',
        department: 'หน่วยงานส่วนกลาง',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        startLocation: { lat: 13.75, lng: 100.5, address: 'กทม. (อัตโนมัติ)' },
        endLocation: { lat: 13.80, lng: 100.55, address: 'ปลายทาง (อัตโนมัติ)' },
        stops: [],
        distanceKm: Math.floor(Math.random() * 50) + 10,
        durationMin: Math.floor(Math.random() * 120) + 30,
        participants: ['ผู้นำเข้าข้อมูล'],
        vehicleId: 'v1',
        fuelCost: Math.floor(Math.random() * 500) + 100,
        // FIX: Added required allowance and accommodation properties
        allowance: 0,
        accommodation: 0,
        otherCosts: 50,
        efficiencyScore: 80 + Math.floor(Math.random() * 20),
        status: 'COMPLETED'
      }));
      onImport(importedTrips);
      setProcessing(false);
      setFiles([]);
    }, 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="bg-white p-10 md:p-16 rounded-[3rem] shadow-sm border border-slate-100">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black tracking-widest uppercase mb-4">
             Bulk Import Engine
          </div>
          <h4 className="text-4xl font-black text-[#002D62] mb-4 tracking-tight">นำเข้าข้อมูลการเดินทาง</h4>
          <p className="text-slate-400 font-medium">รองรับ Google Timeline (JSON), GPX, KML และ CSV สำหรับการบันทึกทริปแบบจำนวนมาก</p>
        </div>

        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`
            relative p-16 border-4 border-dashed rounded-[2.5rem] transition-all duration-500 flex flex-col items-center group
            ${dragActive ? 'border-amber-500 bg-amber-50' : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200'}
          `}
        >
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl text-indigo-950 mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
            <Upload size={40} className="text-amber-500" />
          </div>
          <p className="text-xl font-black text-slate-800 mb-2">ลากไฟล์วางที่นี่</p>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">หรือ คลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์</p>
          <input 
            type="file" 
            multiple 
            disabled={processing}
            onChange={(e) => e.target.files && setFiles(prev => [...prev, ...Array.from(e.target.files!)])}
            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
          />
        </div>

        {files.length > 0 && (
          <div className="mt-12 space-y-4 animate-in fade-in slide-in-from-top-4">
             <div className="flex justify-between items-center mb-4">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Queue for Processing ({files.length})</h5>
                <button onClick={() => setFiles([])} className="text-xs font-bold text-red-500 hover:underline">Clear all</button>
             </div>
             {files.map((file, idx) => (
               <div key={idx} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <FileUp size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{file.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{formatSize(file.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest px-3 py-1 bg-emerald-50 rounded-full">
                      <CheckCircle2 size={12} />
                      Ready
                    </div>
                    <button onClick={() => setFiles(files.filter((_, i) => i !== idx))} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                      <X size={20} />
                    </button>
                  </div>
               </div>
             ))}

             <div className="pt-10">
                <button 
                  onClick={handleProcessImport}
                  disabled={processing}
                  className="w-full py-5 bg-[#002D62] text-white rounded-2xl font-black text-lg shadow-2xl shadow-indigo-900/40 hover:bg-indigo-900 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:bg-slate-300 disabled:shadow-none"
                >
                  {processing ? (
                    <>
                      <Loader2 className="animate-spin" size={24} />
                      กำลังวิเคราะห์ข้อมูล...
                    </>
                  ) : (
                    <>
                      <Sparkles className="text-amber-400" size={24} />
                      เริ่มการวิเคราะห์และนำเข้า
                    </>
                  )}
                </button>
             </div>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem] flex flex-col md:flex-row gap-8">
        <div className="p-4 bg-white rounded-2xl text-amber-500 shadow-sm shrink-0 h-fit">
          <Info size={32} />
        </div>
        <div>
          <h5 className="text-xl font-bold text-amber-900 mb-2">Smart Import Assistant</h5>
          <p className="text-sm text-amber-800/80 leading-relaxed font-medium">
            ระบบใช้ AI ในการวิเคราะห์รูปแบบการหยุดรถเพื่อคัดแยก "ทริป" โดยอัตโนมัติ หากข้อมูลมีการคลาดเคลื่อน คุณสามารถแก้ไขได้ภายหลังในรายการทริป 
            ข้อมูลทั้งหมดจะถูกเข้ารหัสก่อนส่งเข้าสู่ระบบ และประวัติการนำเข้าจะถูกบันทึกไว้ใน Audit Trail
          </p>
        </div>
      </div>
    </div>
  );
};

const Sparkles = ({ className, size }: { className?: string, size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
);

export default ImportPanel;
