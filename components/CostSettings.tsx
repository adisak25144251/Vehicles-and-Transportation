import React, { useState } from 'react';
import { CostConfig, VehicleProfile, VehicleStatus } from '../types';
import { 
  Settings, Fuel, Car, User, Leaf, Save, Plus, Trash2, 
  CheckCircle2, Loader2, AlertCircle, TrendingDown, Info, X
} from 'lucide-react';

interface Props {
  config: CostConfig;
  setConfig: React.Dispatch<React.SetStateAction<CostConfig>>;
  vehicles: VehicleProfile[];
  setVehicles: (v: VehicleProfile[]) => void;
}

const CostSettings: React.FC<Props> = ({ config, setConfig, vehicles, setVehicles }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newVehicle, setNewVehicle] = useState({
    name: '',
    plateNumber: '',
    type: 'SEDAN',
    fuelType: 'Gasoline 95',
    consumptionRate: 15.0,
    wearAndTearRate: 1.5,
    status: 'USABLE' as VehicleStatus
  });

  const handleDeleteVehicle = (id: string) => {
    if (confirm('ยืนยันการลบข้อมูลยานพาหนะนี้ออกจากระบบ?')) {
      setVehicles(vehicles.filter(v => v.id !== id));
    }
  };

  const handleAddVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle: VehicleProfile = {
      id: 'v-' + Date.now(),
      ...newVehicle,
      acquisitionDate: new Date().toISOString().split('T')[0]
    };
    setVehicles([...vehicles, vehicle]);
    setIsModalOpen(false);
    setNewVehicle({
      name: '',
      plateNumber: '',
      type: 'SEDAN',
      fuelType: 'Gasoline 95',
      consumptionRate: 15.0,
      wearAndTearRate: 1.5,
      status: 'USABLE'
    });
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    // จำลองการเชื่อมต่อฐานข้อมูลภาครัฐและการบันทึก Audit Trail
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    setIsSaving(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-700 pb-20">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 sticky top-4">
          <h4 className="text-xl font-black text-[#002D62] mb-6 flex items-center gap-3">
            <Settings size={24} className="text-amber-500" /> 
            พารามิเตอร์ต้นทุน
          </h4>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ราคาน้ำมันเชื้อเพลิง (฿ / ลิตร)</label>
              <div className="relative group">
                <Fuel className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input 
                  type="number" 
                  step="0.01"
                  value={config.fuelPricePerLiter} 
                  onChange={(e) => setConfig({...config, fuelPricePerLiter: Number(e.target.value)})} 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-amber-400 focus:bg-white outline-none font-black text-slate-700 transition-all shadow-inner" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ค่าเสื่อมราคาเบื้องต้น (฿ / วัน)</label>
              <div className="relative group">
                <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  type="number" 
                  value={config.depreciationPerDay} 
                  onChange={(e) => setConfig({...config, depreciationPerDay: Number(e.target.value)})} 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-indigo-400 focus:bg-white outline-none font-black text-slate-700 transition-all shadow-inner" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ค่าจ้างพนักงานขับรถ (฿ / ชม.)</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  type="number" 
                  value={config.driverRatePerHour} 
                  onChange={(e) => setConfig({...config, driverRatePerHour: Number(e.target.value)})} 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-indigo-400 focus:bg-white outline-none font-black text-slate-700 transition-all shadow-inner" 
                />
              </div>
            </div>

            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between transition-all hover:bg-emerald-100">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-white rounded-xl shadow-sm"><Leaf className="text-emerald-600" size={18} /></div>
                 <div>
                   <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">CO2 Footprint</p>
                   <p className="text-[9px] text-emerald-600 font-bold leading-tight">คำนวณการปล่อยก๊าซในรายงาน</p>
                 </div>
               </div>
               <input 
                type="checkbox" 
                checked={config.enableCO2} 
                onChange={(e) => setConfig({...config, enableCO2: e.target.checked})} 
                className="w-6 h-6 accent-emerald-600 cursor-pointer rounded-lg" 
               />
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button 
              onClick={handleSaveConfig}
              disabled={isSaving}
              className={`w-full py-5 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 ${
                showSuccess 
                ? 'bg-emerald-500 text-white' 
                : 'bg-[#002D62] text-white hover:bg-indigo-900 shadow-indigo-900/20'
              } disabled:bg-slate-300 disabled:shadow-none`}
            >
              {isSaving ? (
                <Loader2 size={20} className="animate-spin" />
              ) : showSuccess ? (
                <CheckCircle2 size={20} className="animate-bounce" />
              ) : (
                <Save size={20} className="text-amber-400" />
              )}
              {isSaving ? 'กำลังบันทึกข้อมูล...' : showSuccess ? 'บันทึกสำเร็จ!' : 'บันทึกการตั้งค่า'}
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-slate-100">
           <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
             <div>
                <h4 className="text-3xl font-black text-[#002D62] tracking-tight">คลังยานพาหนะ</h4>
                <p className="text-sm text-slate-400 font-medium">จัดการข้อมูลทางเทคนิคของรถยนต์ในสังกัดเพื่อความแม่นยำในการวิเคราะห์</p>
             </div>
             <button 
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-4 bg-amber-500 text-indigo-950 rounded-2xl font-black text-sm shadow-xl shadow-amber-500/20 hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <Plus size={20} />
                เพิ่มรถยนต์
              </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="p-8 rounded-[2rem] border border-slate-100 bg-slate-50/40 group hover:border-amber-200 hover:bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
                   <div className="flex justify-between items-start mb-8 relative z-10">
                     <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md text-[#002D62] group-hover:bg-[#002D62] group-hover:text-amber-400 transition-all duration-500">
                        <Car size={28} />
                     </div>
                     <button 
                        onClick={() => handleDeleteVehicle(vehicle.id)} 
                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={20} />
                      </button>
                   </div>

                   <div className="relative z-10">
                    <h5 className="font-black text-2xl text-slate-800 mb-1">{vehicle.name}</h5>
                    <div className="inline-flex px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black tracking-widest uppercase mb-6 border border-indigo-100">
                      {vehicle.plateNumber}
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">อัตราสิ้นเปลือง</p>
                          <p className="text-sm font-black text-slate-700">{vehicle.consumptionRate} กม./ลิตร</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ประเภทเชื้อเพลิง</p>
                          <p className="text-sm font-black text-indigo-600">{vehicle.fuelType}</p>
                        </div>
                    </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#002D62]/70 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-indigo-950 shadow-xl">
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#002D62] tracking-tight">เพิ่มรถยนต์ในคลัง</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ระบุข้อมูลเพื่อใช้ในการคำนวณต้นทุน</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddVehicleSubmit} className="p-10 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">ชื่อเรียก / รุ่นรถ</label>
                  <input 
                    required
                    type="text" 
                    value={newVehicle.name}
                    onChange={(e) => setNewVehicle({...newVehicle, name: e.target.value})}
                    placeholder="เช่น Toyota Camry (ส่วนกลาง)"
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">หมายเลขทะเบียน</label>
                  <input 
                    required
                    type="text" 
                    value={newVehicle.plateNumber}
                    onChange={(e) => setNewVehicle({...newVehicle, plateNumber: e.target.value})}
                    placeholder="เช่น 1กข 1234"
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 shadow-inner"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">อัตราสิ้นเปลือง (กม./ลิตร)</label>
                    <input 
                      required
                      type="number" 
                      step="0.1"
                      value={newVehicle.consumptionRate}
                      onChange={(e) => setNewVehicle({...newVehicle, consumptionRate: Number(e.target.value)})}
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">ค่าเสื่อม/กม. (฿)</label>
                    <input 
                      required
                      type="number" 
                      step="0.1"
                      value={newVehicle.wearAndTearRate}
                      onChange={(e) => setNewVehicle({...newVehicle, wearAndTearRate: Number(e.target.value)})}
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 shadow-inner"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">ประเภทเชื้อเพลิง</label>
                  <select 
                    value={newVehicle.fuelType}
                    onChange={(e) => setNewVehicle({...newVehicle, fuelType: e.target.value})}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 shadow-inner"
                  >
                    <option>Gasoline 95</option>
                    <option>Gasoline 91</option>
                    <option>Diesel</option>
                    <option>E20</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-[#002D62] text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-900/30 hover:bg-indigo-900 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <CheckCircle2 size={24} className="text-amber-400" />
                ยืนยันการเพิ่มรถยนต์
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostSettings;