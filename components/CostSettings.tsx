
import React from 'react';
import { CostConfig, VehicleProfile } from '../types';
import { Settings, Fuel, Car, User, Leaf, Save, Plus, Trash2 } from 'lucide-react';

interface Props {
  config: CostConfig;
  setConfig: React.Dispatch<React.SetStateAction<CostConfig>>;
  vehicles: VehicleProfile[];
  setVehicles: (v: VehicleProfile[]) => void;
}

const CostSettings: React.FC<Props> = ({ config, setConfig, vehicles, setVehicles }) => {
  const handleDeleteVehicle = (id: string) => {
    if (confirm('ยืนยันการลบข้อมูลยานพาหนะนี้?')) {
      setVehicles(vehicles.filter(v => v.id !== id));
    }
  };

  const handleAddVehicle = () => {
    const name = prompt('กรุณาระบุชื่อรถยนต์:');
    const plate = prompt('กรุณาระบุหมายเลขทะเบียน:');
    if (name && plate) {
      // FIX: Added acquisitionDate and status properties to satisfy VehicleProfile interface
      const newVehicle: VehicleProfile = {
        id: 'v-' + Date.now(),
        name: name,
        plateNumber: plate,
        type: 'SEDAN',
        fuelType: 'Gasoline 95',
        consumptionRate: 15.0,
        wearAndTearRate: 1.5,
        acquisitionDate: new Date().toISOString().split('T')[0],
        status: 'USABLE'
      };
      setVehicles([...vehicles, newVehicle]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold text-[#002D62] mb-6 flex items-center gap-2"><Settings size={20} className="text-slate-400" /> พารามิเตอร์ต้นทุนระบบ</h4>
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">ราคาน้ำมัน (฿ / ลิตร)</label>
              <div className="relative group">
                <Fuel className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input type="number" value={config.fuelPricePerLiter} onChange={(e) => setConfig({...config, fuelPricePerLiter: Number(e.target.value)})} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-amber-400 outline-none font-bold" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">ค่าเสื่อมราคา (฿ / วัน)</label>
              <div className="relative group">
                <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input type="number" value={config.depreciationPerDay} onChange={(e) => setConfig({...config, depreciationPerDay: Number(e.target.value)})} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-amber-400 outline-none font-bold" />
              </div>
            </div>
            <div className="flex items-center justify-between p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-white rounded-xl shadow-sm"><Leaf className="text-emerald-600" size={18} /></div>
                 <span className="text-xs font-bold text-emerald-800">คำนวณ CO2 Footprint</span>
               </div>
               <input type="checkbox" checked={config.enableCO2} onChange={(e) => setConfig({...config, enableCO2: e.target.checked})} className="w-6 h-6 accent-emerald-600 cursor-pointer" />
            </div>
          </div>
          <button className="w-full mt-10 py-4 bg-[#002D62] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl hover:bg-indigo-900 transition-all">
            <Save size={18} className="text-amber-400" /> บันทึกการตั้งค่า
          </button>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
           <div className="flex items-center justify-between mb-8">
             <div>
                <h4 className="text-2xl font-black text-[#002D62] tracking-tight">คลังยานพาหนะ</h4>
                <p className="text-sm text-slate-400 font-medium">จัดการโปรไฟล์รถยนต์สำหรับการวิเคราะห์ข้อมูลเชิงลึก</p>
             </div>
             <button onClick={handleAddVehicle} className="p-4 bg-amber-500 text-indigo-950 rounded-2xl shadow-xl hover:bg-amber-400 hover:scale-110 transition-all"><Plus size={24} /></button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="p-8 rounded-3xl border border-slate-100 bg-slate-50/30 group hover:border-amber-200 hover:bg-white hover:shadow-xl transition-all">
                   <div className="flex justify-between items-start mb-6">
                     <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md text-[#002D62] group-hover:bg-amber-500 group-hover:text-white transition-all"><Car size={24} /></div>
                     <button onClick={() => handleDeleteVehicle(vehicle.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={20} /></button>
                   </div>
                   <h5 className="font-black text-xl text-slate-800">{vehicle.name}</h5>
                   <p className="text-xs font-mono text-indigo-600 font-bold mb-6 tracking-wider">{vehicle.plateNumber}</p>
                   <div className="space-y-3 border-t border-slate-100 pt-6">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-widest">Efficiency</span>
                        <span className="font-black text-slate-800 px-3 py-1 bg-slate-100 rounded-lg">{vehicle.consumptionRate} km/L</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-widest">Fuel Type</span>
                        <span className="font-black text-indigo-600 px-3 py-1 bg-indigo-50 rounded-lg">{vehicle.fuelType}</span>
                      </div>
                   </div>
                </div>
              ))}
              {vehicles.length === 0 && <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold">ไม่พบข้อมูลยานพาหนะ</div>}
           </div>
        </div>
      </div>
    </div>
  );
};

export default CostSettings;
