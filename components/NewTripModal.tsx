import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Upload, FileText, MapPin, 
  CheckCircle2, Plus, Search, Loader2, 
  Navigation, MousePointer2, AlertCircle,
  Maximize2, Minimize2, Trash2 as ClearIcon,
  Save, Zap, User, ArrowRight, Check
} from 'lucide-react';
import { Trip, VehicleProfile, Location } from '../types';
import L from 'leaflet';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddTrip: (trips: Trip[]) => void;
  onUpdateTrip?: (trip: Trip) => void;
  vehicles: VehicleProfile[];
  editTrip?: Trip;
}

interface SearchSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

const NewTripModal: React.FC<Props> = ({ isOpen, onClose, onAddTrip, onUpdateTrip, vehicles, editTrip }) => {
  const [formData, setFormData] = useState({
    missionName: '',
    purpose: '',
    driverName: '',
    date: new Date().toISOString().split('T')[0],
    time: '08:30',
    allowance: 0,
    accommodation: 0,
    vehicleId: vehicles[0]?.id || '',
  });

  const [locationStep, setLocationStep] = useState<'start' | 'end'>('start');
  const stepRef = useRef(locationStep);
  
  useEffect(() => {
    stepRef.current = locationStep;
  }, [locationStep]);

  const [startLoc, setStartLoc] = useState<Location | null>(null);
  const [endLoc, setEndLoc] = useState<Location | null>(null);
  const [currentRoutePath, setCurrentRoutePath] = useState<[number, number][] | undefined>(undefined);
  const [mapSearch, setMapSearch] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dieselPrice] = useState(32.94); 

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ start?: L.Marker, end?: L.Marker, path?: L.Polyline }>({});

  const [calcResults, setCalcResults] = useState({
    distance: 0,
    fuelUsed: 0,
    fuelCost: 0,
    totalCost: 0,
  });

  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);

  useEffect(() => {
    if (isOpen && editTrip) {
      setFormData({
        missionName: editTrip.missionName,
        purpose: editTrip.purpose,
        driverName: editTrip.driverName || '',
        date: editTrip.startTime.split('T')[0],
        time: editTrip.startTime.split('T')[1].substring(0, 5),
        allowance: editTrip.allowance || 0,
        accommodation: editTrip.accommodation || 0,
        vehicleId: editTrip.vehicleId,
      });
      setStartLoc(editTrip.startLocation);
      setEndLoc(editTrip.endLocation);
      setCurrentRoutePath(editTrip.routePath);
      setLocationStep('end');
    } else if (isOpen) {
      setFormData({
        missionName: '',
        purpose: '',
        driverName: '',
        date: new Date().toISOString().split('T')[0],
        time: '08:30',
        allowance: 0,
        accommodation: 0,
        vehicleId: vehicles[0]?.id || '',
      });
      setStartLoc(null);
      setEndLoc(null);
      setCurrentRoutePath(undefined);
      setLocationStep('start');
    }
  }, [isOpen, editTrip, vehicles]);

  const getAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      return data.display_name || `พิกัด (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    } catch (err) {
      return `พิกัด (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    }
  };

  const fetchRoute = useCallback(async (start: Location, end: Location) => {
    if (!mapRef.current) return;
    setIsCalculating(true);
    setError(null);

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();

      if (data.code === 'Ok' && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
        setCurrentRoutePath(coordinates);

        if (markersRef.current.path) markersRef.current.path.remove();

        markersRef.current.path = L.polyline(coordinates, {
          color: '#002D62',
          weight: 6,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(mapRef.current);

        mapRef.current.fitBounds(markersRef.current.path.getBounds(), { padding: [40, 40] });
        updateResults(route.distance / 1000);
      }
    } catch (err) {
      console.error("Routing error", err);
    } finally {
      setIsCalculating(false);
    }
  }, [selectedVehicle, dieselPrice, formData.allowance, formData.accommodation]);

  const updateResults = (oneWayDistance: number) => {
    const roundTripDist = (oneWayDistance * 2);
    const roundedDist = Math.round(roundTripDist * 10) / 10;
    const fuelUsed = roundedDist / (selectedVehicle?.consumptionRate || 15);
    const fuelCost = fuelUsed * dieselPrice;
    const total = fuelCost + Number(formData.allowance) + Number(formData.accommodation);

    setCalcResults({
      distance: roundedDist,
      fuelUsed: Number(fuelUsed.toFixed(2)),
      fuelCost: Math.round(fuelCost),
      totalCost: Math.round(total),
    });
  };

  const handleMapAction = useCallback(async (lat: number, lng: number, manualAddr?: string) => {
    const address = manualAddr || await getAddressFromCoords(lat, lng);
    const newLoc: Location = { lat, lng, address };
    
    if (stepRef.current === 'start') {
      setStartLoc(newLoc);
      setLocationStep('end');
    } else {
      setEndLoc(newLoc);
    }
  }, []);

  const handleSelectSuggestion = (s: SearchSuggestion) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    handleMapAction(lat, lng, s.display_name);
    setSuggestions([]);
    setMapSearch('');
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 16);
    }
  };

  useEffect(() => {
    if (isOpen && mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [13.7563, 100.5018],
        zoom: 13,
        zoomControl: false,
        scrollWheelZoom: true,
        tap: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        handleMapAction(lat, lng);
      });

      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOpen, handleMapAction]);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 500);
    }
  }, [isMapExpanded]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (startLoc) {
      if (!markersRef.current.start) {
        markersRef.current.start = L.marker([startLoc.lat, startLoc.lng], {
          draggable: true,
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="bg-blue-600 w-8 h-8 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          })
        }).addTo(mapRef.current);
        markersRef.current.start.on('dragend', async (e: any) => {
          const pos = e.target.getLatLng();
          const addr = await getAddressFromCoords(pos.lat, pos.lng);
          setStartLoc({ lat: pos.lat, lng: pos.lng, address: addr });
        });
      } else {
        markersRef.current.start.setLatLng([startLoc.lat, startLoc.lng]);
      }
    }

    if (endLoc) {
      if (!markersRef.current.end) {
        markersRef.current.end = L.marker([endLoc.lat, endLoc.lng], {
          draggable: true,
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="bg-[#002D62] w-8 h-8 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-amber-400"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          })
        }).addTo(mapRef.current);
        markersRef.current.end.on('dragend', async (e: any) => {
          const pos = e.target.getLatLng();
          const addr = await getAddressFromCoords(pos.lat, pos.lng);
          setEndLoc({ lat: pos.lat, lng: pos.lng, address: addr });
        });
      } else {
        markersRef.current.end.setLatLng([endLoc.lat, endLoc.lng]);
      }
    }

    if (startLoc && endLoc) {
      fetchRoute(startLoc, endLoc);
    }
  }, [startLoc, endLoc, fetchRoute]);

  const handleSave = () => {
    if (!formData.missionName || !startLoc || !endLoc) {
      alert('กรุณากรอกข้อมูลและระบุจุดเริ่มต้น/ปลายทางบนแผนที่ให้ครบถ้วน');
      return;
    }

    const tripData: Trip = {
      id: editTrip ? editTrip.id : 'T-' + Date.now(),
      missionName: formData.missionName,
      purpose: formData.purpose || 'ปฏิบัติราชการตามที่ได้รับมอบหมาย',
      driverName: formData.driverName,
      department: 'ส่วนกลาง',
      startTime: `${formData.date}T${formData.time}:00Z`,
      endTime: `${formData.date}T17:00:00Z`,
      startLocation: startLoc,
      endLocation: endLoc,
      routePath: currentRoutePath,
      stops: [],
      distanceKm: calcResults.distance,
      durationMin: Math.round(calcResults.distance * 1.5),
      participants: editTrip ? editTrip.participants : ['เจ้าหน้าที่ผู้บันทึก'],
      vehicleId: formData.vehicleId,
      fuelCost: calcResults.fuelCost,
      allowance: Number(formData.allowance),
      accommodation: Number(formData.accommodation),
      otherCosts: editTrip ? editTrip.otherCosts : 0,
      efficiencyScore: 100,
      status: editTrip ? editTrip.status : 'COMPLETED'
    };

    if (editTrip && onUpdateTrip) {
      onUpdateTrip(tripData);
    } else {
      onAddTrip([tripData]);
    }
    onClose();
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (mapSearch.length > 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearch)}&addressdetails=1&limit=5&countrycodes=th`);
          const data = await res.json();
          setSuggestions(data);
        } catch (err) {
          console.error("Search failed", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [mapSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-[#002D62]/70 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden">
      <div className={`bg-white w-full h-full md:max-w-7xl md:h-[92vh] md:rounded-[3rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-500`}>
        {/* Header */}
        <div className="px-6 md:px-10 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#002D62] rounded-xl flex items-center justify-center text-amber-400">
              {editTrip ? <Save size={20} /> : <Plus size={20} />}
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-black text-[#002D62] tracking-tight">
                {editTrip ? 'แก้ไขการเดินทาง' : 'สร้างการเดินทาง'}
              </h3>
              <p className="hidden md:block text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ระบบบันทึกพิกัดและคำนวณงบประมาณอัตโนมัติ</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 md:p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row relative">
          {/* Info Side */}
          <div className={`${isMapExpanded ? 'hidden' : 'flex'} w-full lg:w-[32%] p-6 md:p-10 overflow-y-auto custom-scrollbar flex-col space-y-6 bg-white border-r border-slate-100 shrink-0`}>
            <div className="space-y-4">
              <h5 className="text-[10px] font-black text-[#002D62] uppercase tracking-[0.25em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                ข้อมูลการเดินทาง
              </h5>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">ชื่อภารกิจหลัก</label>
                  <input 
                    type="text" 
                    value={formData.missionName}
                    onChange={(e) => setFormData({...formData, missionName: e.target.value})}
                    placeholder="ระบุชื่อภารกิจ"
                    className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-800 text-sm shadow-inner focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">วันที่เดินทาง</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full p-3 bg-slate-50 border-none rounded-xl font-bold text-xs shadow-inner" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">เวลาที่เริ่ม</label>
                    <input type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full p-3 bg-slate-50 border-none rounded-xl font-bold text-xs shadow-inner" />
                  </div>
                </div>

                <div>
                   <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">เจ้าหน้าที่พลขับ</label>
                   <div className="relative group">
                     <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={16} />
                     <input 
                      type="text" 
                      value={formData.driverName}
                      onChange={(e) => setFormData({...formData, driverName: e.target.value})}
                      placeholder="ระบุชื่อพลขับ"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-xl font-bold text-slate-800 text-sm shadow-inner focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                   </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">ยานพาหนะ</label>
                  <select 
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
                    className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-800 text-sm shadow-inner outline-none"
                  >
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber} - {v.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">เบี้ยเลี้ยง (฿)</label>
                    <input type="number" value={formData.allowance || ''} onChange={(e) => setFormData({...formData, allowance: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border-none rounded-xl font-bold text-xs shadow-inner" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">ค่าที่พัก (฿)</label>
                    <input type="number" value={formData.accommodation || ''} onChange={(e) => setFormData({...formData, accommodation: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border-none rounded-xl font-bold text-xs shadow-inner" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-auto">
              <button 
                onClick={handleSave}
                className="w-full py-5 bg-[#002D62] text-white rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-900 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <CheckCircle2 size={18} className="text-amber-400" />
                บันทึกข้อมูลการเดินทาง
              </button>
            </div>
          </div>

          {/* Map Side */}
          <div className="flex-1 flex flex-col relative bg-slate-100 overflow-hidden">
            {/* Map Search Overlay */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-xl px-4 flex flex-col gap-2">
              <div className="flex bg-white p-2 rounded-2xl shadow-2xl border border-slate-100 items-center">
                <div className="flex-1 flex items-center gap-3 px-3">
                  {isSearching ? <Loader2 className="animate-spin text-amber-500" size={18} /> : <Search className="text-[#002D62]" size={18} />}
                  <input 
                    type="text" 
                    placeholder="ค้นหาสถานที่เพื่อปักหมุด..." 
                    value={mapSearch}
                    onChange={(e) => setMapSearch(e.target.value)}
                    className="w-full py-2 bg-transparent outline-none font-bold text-slate-800 text-sm placeholder:text-slate-300"
                  />
                </div>
                <button 
                  onClick={() => setIsMapExpanded(!isMapExpanded)}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-all text-[#002D62] hidden md:block"
                >
                  {isMapExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
              </div>
              
              {suggestions.length > 0 && (
                <div className="bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden max-h-48 overflow-y-auto">
                   {suggestions.map((s, idx) => (
                     <button key={idx} onClick={() => handleSelectSuggestion(s)} className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b last:border-none text-xs">
                        <p className="font-black text-slate-800 truncate">{s.display_name.split(',')[0]}</p>
                        <p className="text-[10px] text-slate-400 truncate">{s.display_name}</p>
                     </button>
                   ))}
                </div>
              )}
            </div>

            {/* Location Step Toggle - RESTORED & ENHANCED */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[999] flex bg-white/95 backdrop-blur-md p-2 rounded-[2rem] shadow-2xl border border-slate-100 gap-2">
               <button 
                onClick={() => {
                  setLocationStep('start');
                  if (startLoc && mapRef.current) mapRef.current.setView([startLoc.lat, startLoc.lng], 16);
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${locationStep === 'start' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
               >
                 <div className={`w-2 h-2 rounded-full ${startLoc ? 'bg-emerald-400 animate-pulse' : 'bg-current opacity-30'}`} />
                 {startLoc ? <Check size={14} className="text-white" /> : <MapPin size={14} />}
                 จุดเริ่มต้น
               </button>
               <div className="w-[1px] bg-slate-200 my-2" />
               <button 
                onClick={() => {
                  setLocationStep('end');
                  if (endLoc && mapRef.current) mapRef.current.setView([endLoc.lat, endLoc.lng], 16);
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${locationStep === 'end' ? 'bg-[#002D62] text-amber-400 shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
               >
                 <div className={`w-2 h-2 rounded-full ${endLoc ? 'bg-emerald-400 animate-pulse' : 'bg-current opacity-30'}`} />
                 {endLoc ? <Check size={14} className="text-amber-400" /> : <Navigation size={14} />}
                 จุดปลายทาง
               </button>
            </div>

            {/* Map Container */}
            <div ref={mapContainerRef} className="flex-1 z-[1]" />

            {/* Summary Bar Desktop */}
            <div className={`hidden lg:grid grid-cols-4 p-8 bg-white/95 backdrop-blur-md border-t border-slate-100 shrink-0 z-[1000] gap-8 transition-all duration-300 ${isMapExpanded ? 'h-0 p-0 opacity-0 overflow-hidden' : 'h-auto opacity-100'}`}>
                <div className="flex flex-col">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ระยะทางรวม (ไป-กลับ)</p>
                  <p className="text-2xl font-black text-slate-800">{calcResults.distance} กม.</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">เชื้อเพลิงที่ใช้</p>
                  <p className="text-2xl font-black text-indigo-600">{calcResults.fuelUsed} ลิตร</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">งบค่าเชื้อเพลิง</p>
                  <p className="text-2xl font-black text-slate-800">฿{calcResults.fuelCost.toLocaleString()}</p>
                </div>
                <div className="bg-[#002D62] p-4 rounded-2xl text-center shadow-lg shadow-indigo-900/20">
                  <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">รวมงบประมาณทั้งสิ้น</p>
                  <p className="text-2xl font-black text-amber-400">฿{calcResults.totalCost.toLocaleString()}</p>
                </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`.custom-div-icon { background: none; border: none; }`}</style>
    </div>
  );
};

export default NewTripModal;