import React, { useState } from 'react';
import { VehicleProfile, VehicleStatus } from '../types';
import { 
  Car, Wrench, ShieldCheck, Calendar, AlertTriangle, 
  FileText, Plus, Edit3, Trash2, X, Save, Clock
} from 'lucide-react';

interface Props {
  vehicles: VehicleProfile[];
  onAddVehicle: (v: VehicleProfile) => void;
  onEditVehicle: (v: VehicleProfile) => void;
  onDeleteVehicle: (id: string) => void;
}

const FleetManager: React.FC<Props> = ({ vehicles, onAddVehicle, onEditVehicle, onDeleteVehicle }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleProfile | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    plateNumber: '',
    type: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    status: 'USABLE' as VehicleStatus,
    fuelType: 'Gasoline 95',
    consumptionRate: 15,
    wearAndTearRate: 1.5
  });

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setFormData({
      name: '',
      plateNumber: '',
      type: '',
      acquisitionDate: new Date().toISOString().split('T')[0],
      status: 'USABLE',
      fuelType: 'Gasoline 95',
      consumptionRate: 15,
      wearAndTearRate: 1.5
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: VehicleProfile) => {
    setEditingVehicle(v);
    setFormData({
      name: v.name,
      plateNumber: v.plateNumber,
      type: v.type,
      acquisitionDate: v.acquisitionDate,
      status: v.status,
      fuelType: v.fuelType,
      consumptionRate: v.consumptionRate,
      wearAndTearRate: v.wearAndTearRate
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('คุณต้องการลบข้อมูลยานพาหนะคันนี้ออกจากระบบใช่หรือไม่?')) {
      onDeleteVehicle(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicleData: VehicleProfile = {
      id: editingVehicle ? editingVehicle.id : 'v-' + Date.now(),
      ...formData
    };

    if (editingVehicle) {
      onEditVehicle(vehicleData);
    } else {
      onAddVehicle(vehicleData);
    }
    setIsModalOpen(false);
  };

  const calculateAge = (dateStr: string) => {
    const acquisition = new Date(dateStr);
    const now = new Date();
    let years = now.getFullYear() - acquisition.getFullYear();
    let months = now.getMonth() - acquisition.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    return `${years} ปี ${months} เดือน`;
  };

  const getStatusConfig = (status: VehicleStatus) => {
    switch (status) {
      case 'USABLE': return { label: 'ใช้การได้', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: ShieldCheck };
      case 'DAMAGED': return { label: 'ชำรุด', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Wrench };
      case 'DISPOSAL': return { label: 'รอจำหน่าย', color: 'bg-red-50 text-red-600 border-red-100', icon: AlertTriangle };
      default: return { label: 'ไม่ระบุ', color: 'bg-slate-50 text-slate-600 border-slate-100', icon: Car };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-xl transition-all">
          <div className="p-5 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <Car size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Fleet</p>
            <h3 className="text-3xl font-black text-slate-800">{vehicles.length} Units</h3>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-xl transition-all">
          <div className="p-5 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-all">
            <Wrench size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">In Maintenance</p>
            <h3 className="text-3xl font-black text-slate-800">
              {vehicles.filter(v => v.status === 'DAMAGED').length} Units
            </h3>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-xl transition-all">
          <div className="p-5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <ShieldCheck size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Usable Ratio</p>
            <h3 className="text-3xl font-black text-slate-800">
              {Math.round((vehicles.filter(v => v.status === 'USABLE').length / (vehicles.length || 1)) * 100)}%
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="font-black text-2xl text-[#002D62] tracking-tight">สถานะยานพาหนะเชิงลึก</h4>
            <p className="text-sm text-slate-400 font-medium">ข้อมูลการซ่อมบำรุง อายุการใช้งาน และสถานภาพ รายคัน</p>
          </div>
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-6 py-3 bg-[#002D62] text-white rounded-2xl text-sm font-black shadow-lg hover:bg-indigo-900 transition-all"
          >
            <Plus size={18} className="text-amber-400" /> เพิ่มยานพาหนะใหม่
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Vehicle / Plate</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">วันที่ได้มา</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">อายุการใช้งาน</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">สถานภาพ</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {vehicles.map((v) => {
                const status = getStatusConfig(v.status);
                return (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-7">
                      <div className="font-black text-lg text-slate-800 tracking-tight">{v.name}</div>
                      <div className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mt-1 font-bold">{v.plateNumber}</div>
                    </td>
                    <td className="px-8 py-7">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                        <Calendar size={14} className="text-amber-500" />
                        {new Date(v.acquisitionDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-8 py-7">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                        <Clock size={14} className="text-indigo-400" />
                        {calculateAge(v.acquisitionDate)}
                      </div>
                    </td>
                    <td className="px-8 py-7">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${status.color}`}>
                        <status.icon size={14} /> {status.label}
                      </div>
                    </td>
                    <td className="px-8 py-7">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleOpenEdit(v)} 
                          className="p-3 bg-white border border-slate-200 rounded-xl hover:text-amber-600 hover:border-amber-200 transition-all shadow-sm"
                          title="แก้ไขข้อมูล"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(v.id)} 
                          className="p-3 bg-white border border-slate-200 rounded-xl hover:text-red-500 hover:border-red-200 transition-all shadow-sm"
                          title="ลบข้อมูล"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold">ไม่พบข้อมูลในคลัง</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#002D62]/70 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-[#002D62] rounded-2xl flex items-center justify-center text-amber-400 shadow-xl">
                  {editingVehicle ? <Edit3 size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#002D62] tracking-tight">{editingVehicle ? 'แก้ไขข้อมูลยานพาหนะ' : 'เพิ่มยานพาหนะใหม่'}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ระบุรายละเอียดข้อมูลทางราชการให้ครบถ้วน</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">ชื่อเรียกยานพาหนะ</label>
                  <input 
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="เช่น Toyota Camry (กองการเจ้าหน้าที่)"
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">หมายเลขโล่ / ทะเบียน</label>
                  <input 
                    type="text" required
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({...formData, plateNumber: e.target.value})}
                    placeholder="เลขทะเบียน"
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">ประเภทยานพาหนะ</label>
                  <input 
                    type="text" required
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    placeholder="เช่น รถเก๋ง, รถตู้, รถบรรทุก"
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">วันที่ได้มา</label>
                  <input 
                    type="date" required
                    value={formData.acquisitionDate}
                    onChange={(e) => setFormData({...formData, acquisitionDate: e.target.value})}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">สถานภาพ</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as VehicleStatus})}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 shadow-inner"
                  >
                    <option value="USABLE">ใช้การได้</option>
                    <option value="DAMAGED">ชำรุด</option>
                    <option value="DISPOSAL">รอจำหน่าย</option>
                  </select>
                </div>
                <div className="col-span-2 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="p-3 bg-white rounded-xl shadow-sm"><Clock className="text-indigo-600" /></div>
                     <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">อายุการใช้งานปัจจุบัน</p>
                       <p className="text-lg font-black text-slate-800">{calculateAge(formData.acquisitionDate)}</p>
                     </div>
                   </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-[#002D62] text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-900/30 hover:bg-indigo-900 transition-all flex items-center justify-center gap-3"
              >
                <Save size={24} className="text-amber-400" />
                {editingVehicle ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลยานพาหนะ'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManager;