import React, { useState } from 'react';
import { Trip, VehicleProfile } from '../types';
import { 
  Eye, Trash2, FileSpreadsheet, Share2, ChevronRight, 
  Printer, ShieldCheck, Plus, Upload, Calculator, Edit3, Loader2, User
} from 'lucide-react';
import NewTripModal from './NewTripModal';

interface Props {
  trips: Trip[];
  vehicles: VehicleProfile[];
  piiGuard: boolean;
  onDelete: (id: string) => void;
  onAddTrip: (newTrips: Trip[]) => void;
  onUpdateTrip: (updatedTrip: Trip) => void;
}

const TripTable: React.FC<Props> = ({ trips, vehicles, piiGuard, onDelete, onAddTrip, onUpdateTrip }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);

  const maskName = (name: string) => {
    if (!piiGuard) return name;
    if (name.length <= 4) return "****";
    return name.substring(0, 3) + "****";
  };

  const handleEditClick = (trip: Trip) => {
    setEditingTrip(trip);
    setIsModalOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingTrip(undefined);
    setIsModalOpen(true);
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const headers = ['ID', 'ภารกิจ', 'พลขับ', 'ต้นทาง', 'ปลายทาง', 'ระยะทาง', 'งบประมาณ', 'สถานะ'];
      const rows = trips.map(t => [
        t.id,
        `"${t.missionName.replace(/"/g, '""')}"`,
        `"${(t.driverName || 'ไม่ระบุ').replace(/"/g, '""')}"`,
        `"${t.startLocation?.address?.replace(/"/g, '""') || ''}"`,
        `"${t.endLocation?.address?.replace(/"/g, '""') || ''}"`,
        t.distanceKm,
        (t.fuelCost || 0) + (t.allowance || 0) + (t.accommodation || 0),
        t.status
      ]);

      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `trip_report_${Date.now()}.csv`);
      link.click();
    } catch (error) {
      console.error('Export failed', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-700 no-print">
      <div className="p-6 md:p-10 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-white gap-6">
        <div>
          <h4 className="font-black text-xl md:text-3xl text-[#002D62] tracking-tight mb-1">รายการเดินทาง</h4>
          <p className="text-[10px] md:text-sm text-slate-400 font-medium">จัดการและตรวจสอบประวัติการใช้ยานพาหนะ</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <button 
            onClick={handleAddNewClick}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-[#002D62] text-white rounded-xl md:rounded-2xl text-[11px] md:text-sm font-black shadow-lg hover:bg-indigo-900 active:scale-95 transition-all"
          >
            <Plus size={16} className="text-amber-400" /> สร้างการเดินทาง
          </button>
          <button 
            onClick={handleExportExcel} 
            disabled={isExporting}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[11px] md:text-sm font-bold transition-all ${
              isExporting ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />} 
            ส่งออกไฟล์
          </button>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left min-w-[900px] lg:min-w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">ภารกิจ / พลขับ</th>
              <th className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">เส้นทาง</th>
              <th className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">งบประมาณรวม</th>
              <th className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {trips.map((trip) => (
              <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 md:px-10 py-5 md:py-8">
                  <div className="flex flex-col">
                    <span className="font-black text-slate-800 text-sm md:text-lg tracking-tight mb-1">{trip.missionName}</span>
                    <div className="flex items-center gap-2">
                       <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md border border-amber-100 text-[10px] font-black uppercase">
                          <User size={10} className="fill-amber-500" />
                          {maskName(trip.driverName || 'ไม่ระบุ')}
                       </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 md:px-10 py-5 md:py-8">
                  <div className="flex items-center space-x-2 md:space-x-3 text-[11px] md:text-sm">
                    <div className="flex flex-col max-w-[150px]">
                       <span className="text-slate-400 font-bold uppercase text-[8px] tracking-widest">ต้นทาง</span>
                       <span className="text-slate-600 font-bold truncate">{piiGuard ? 'Masked' : trip.startLocation?.address}</span>
                    </div>
                    <ChevronRight size={14} className="text-amber-500 shrink-0" />
                    <div className="flex flex-col max-w-[150px]">
                       <span className="text-slate-400 font-bold uppercase text-[8px] tracking-widest">ปลายทาง</span>
                       <span className="text-slate-900 font-black truncate">{piiGuard ? 'Masked' : trip.endLocation?.address}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 md:px-10 py-5 md:py-8 text-center">
                  <div className="flex flex-col">
                    <span className="text-sm md:text-lg font-black text-[#002D62]">
                      {((trip.fuelCost || 0) + (trip.allowance || 0) + (trip.accommodation || 0)).toLocaleString()} ฿
                    </span>
                    <span className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {trip.distanceKm} KM (ไป-กลับ)
                    </span>
                  </div>
                </td>
                <td className="px-6 md:px-10 py-5 md:py-8">
                  <div className="flex items-center gap-1.5 md:gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                    <button onClick={() => handleEditClick(trip)} className="p-2 md:p-3 bg-white border border-slate-200 rounded-lg md:rounded-xl hover:text-amber-600 shadow-sm transition-all"><Edit3 size={16} /></button>
                    <button onClick={() => confirm('ลบรายการนี้?') && onDelete(trip.id)} className="p-2 md:p-3 bg-white border border-slate-200 rounded-lg md:rounded-xl hover:text-red-500 shadow-sm transition-all"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NewTripModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAddTrip={onAddTrip}
        onUpdateTrip={onUpdateTrip}
        vehicles={vehicles}
        editTrip={editingTrip}
      />
    </div>
  );
};

export default TripTable;