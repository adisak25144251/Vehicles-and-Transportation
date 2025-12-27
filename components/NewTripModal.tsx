import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Upload, FileText, MapPin, 
  CheckCircle2, Plus, Search, Loader2, 
  Navigation, MousePointer2, AlertCircle,
  Maximize2, Minimize2, Trash2 as ClearIcon,
  Save, Zap
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
  const [method, setMethod] = useState<'upload' | 'manual'>('manual');
  const [formData, setFormData] = useState({
    missionName: '',
    purpose: '',
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
  const [isTrafficVisible, setIsTrafficVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dieselPrice] = useState(32.94); 

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const trafficLayerRef = useRef<L.TileLayer | null>(null);
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
        date: editTrip.startTime.split('T')[0],
        time: editTrip.startTime.split('T')[1].substring(0, 5),
        allowance: editTrip.allowance || 0,
        accommodation: editTrip.accommodation || 0,
        vehicleId: editTrip.vehicleId,
      });
      setStartLoc(editTrip.startLocation);
      setEndLoc(editTrip.endLocation);
      setCurrentRoutePath(editTrip.routePath);
      setMethod('manual');
      setLocationStep('end');
    } else if (isOpen) {
      setFormData({
        missionName: '',
        purpose: '',
        date: new Date().toISOString().split('T')[0],
        time: '08:30',
        allowance: 0,
        accommodation: 0,
        vehicleId: vehicles[0]?.id || '',
      });
      setStartLoc(null);
      setEndLoc(null);
      setCurrentRoutePath(undefined);
      setMethod('manual');
      setLocationStep('start');
    }
  }, [isOpen, editTrip, vehicles]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (isTrafficVisible) {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = L.tileLayer('https://mt1.google.com/vt?lyrs=h,traffic&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          opacity: 0.8
        });
      }
      trafficLayerRef.current.addTo(mapRef.current);
    } else {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.remove();
      }
    }
  }, [isTrafficVisible]);

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
      } else {
        throw new Error('ไม่สามารถหาเส้นทางบนถนนได้');
      }
    } catch (err) {
      setError('ใช้เส้นตรงแทน');
      setCurrentRoutePath([[start.lat, start.lng], [end.lat, end.lng]]);
      if (markersRef.current.path) markersRef.current.path.remove();
      markersRef.current.path = L.polyline(
        [[start.lat, start.lng], [end.lat, end.lng]],
        { color: '#EF4444', weight: 4, dashArray: '10, 10', opacity: 0.6 }
      ).addTo(mapRef.current);
      
      const directDist = L.latLng(start.lat, start.lng).distanceTo(L.latLng(end.lat, end.lng)) / 1000 * 1.3;
      updateResults(directDist);
    } finally {
      setIsCalculating(false);
    }
  }, [selectedVehicle, dieselPrice, formData.allowance, formData.accommodation]);

  const updateResults = (distance: number) => {
    const roundedDist = Math.round(distance * 10) / 10;
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

  useEffect(() => {
    if (isOpen && method === 'manual' && mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [13.7563, 100.5018],
        zoom: 13,
        zoomControl: false,
        scrollWheelZoom: true,
        tap: true // Essential for mobile
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
  }, [isOpen, method, handleMapAction]);

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
        const marker = L.marker([startLoc.lat, startLoc.lng], {
          draggable: true,
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="bg-blue-600 w-8 h-8 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          })
        }).addTo(mapRef.current);

        marker.on('dragend', async (e: L.LeafletEvent) => {
          const m = e.target as L.Marker;
          const pos = m.getLatLng();
          const address = await getAddressFromCoords(pos.lat, pos.lng);
          setStartLoc({ lat: pos.lat, lng: pos.lng, address });
        });
        markersRef.current.start = marker;
      } else {
        markersRef.current.start.setLatLng([startLoc.lat, startLoc.lng]);
      }
    }

    if (endLoc) {
      if (!markersRef.current.end) {
        const marker = L.marker([endLoc.lat, endLoc.lng], {
          draggable: true,
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="bg-[#002D62] w-8 h-8 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-amber-400"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          })
        }).addTo(mapRef.current);

        marker.on('dragend', async (e: L.LeafletEvent) => {
          const m = e.target as L.Marker;
          const pos = m.getLatLng();
          const address = await getAddressFromCoords(pos.lat, pos.lng);
          setEndLoc({ lat: pos.lat, lng: pos.lng, address });
        });
        markersRef.current.end = marker;
      } else {
        markersRef.current.end.setLatLng([endLoc.lat, endLoc.lng]);
      }
    }

    if (startLoc && endLoc) {
      fetchRoute(startLoc, endLoc);
    }
  }, [startLoc, endLoc, fetchRoute]);

  const handleSelectSuggestion = (s: SearchSuggestion) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    handleMapAction(lat, lng, s.display_name);
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 17, { animate: true, duration: 1 });
    }
    setMapSearch('');
    setSuggestions([]);
  };

  const handleSaveManual = () => {
    if (!formData.missionName) {
      alert('กรุณากรอกชื่อภารกิจ');
      return;
    }
    if (!startLoc || !endLoc) {
      alert('กรุณาเลือกจุดเริ่มต้นและจุดปลายทางบนแผนที่');
      return;
    }

    const tripData: Trip = {
      id: editTrip ? editTrip.id : 'T-' + Date.now(),
      missionName: formData.missionName,
      purpose: formData.purpose || 'ปฏิบัติราชการตามที่ได้รับมอบหมาย',
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
        {/* Header - Optimized for Mobile */}
        <div className="px-4 md:px-10 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3 md:gap-6">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#002D62] rounded-xl flex items-center justify-center text-amber-400">
              {editTrip ? <Save size={20} /> : <Plus size={20} />}
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-black text-[#002D62] tracking-tight">{editTrip ? 'แก้ไขภารกิจ' : 'บันทึกทริปใหม่'}</h3>
              <p className="hidden md:block text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ลากหมุดหรือคลิกบนแผนที่เพื่อปักหมุด</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 md:p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row relative">
          {/* Sidebar - Stacks on Mobile */}
          <div className={`${isMapExpanded ? 'hidden' : 'flex'} w-full lg:w-[32%] p-6 md:p-10 overflow-y-auto custom-scrollbar flex-col space-y-6 md:space-y-8 bg-white border-r border-slate-100 shrink-0`}>
            <div className="space-y-4">
              <h5 className="text-[10px] font-black text-[#002D62] uppercase tracking-[0.25em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                ข้อมูลภารกิจ
              </h5>
              <div className="space-y-4">
                <input 
                  type="text" 
                  value={formData.missionName}
                  onChange={(e) => setFormData({...formData, missionName: e.target.value})}
                  placeholder="ชื่อภารกิจ"
                  className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-800 text-sm shadow-inner"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full p-3 bg-slate-50 border-none rounded-xl font-bold text-xs" />
                  <input type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full p-3 bg-slate-50 border-none rounded-xl font-bold text-xs" />
                </div>
                <select 
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
                  className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-800 text-sm shadow-inner"
                >
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber} - {v.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="เบี้ยเลี้ยง" value={formData.allowance || ''} onChange={(e) => setFormData({...formData, allowance: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border-none rounded-xl font-bold text-xs" />
                  <input type="number" placeholder="ที่พัก" value={formData.accommodation || ''} onChange={(e) => setFormData({...formData, accommodation: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border-none rounded-xl font-bold text-xs" />
                </div>
              </div>
            </div>

            <div className="pt-4 mt-auto">
              <button 
                onClick={handleSaveManual}
                className="w-full py-4 bg-[#002D62] text-white rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-900 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <CheckCircle2 size={18} className="text-amber-400" />
                บันทึกข้อมูลทริป
              </button>
            </div>
          </div>

          {/* Map Area */}
          <div className="flex-1 flex flex-col relative bg-[#f1eee8] overflow-hidden">
            <div className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-xl px-4 flex flex-col gap-2">
              <div className="flex bg-white/95 backdrop-blur-2xl p-1 md:p-2 rounded-xl md:rounded-[1.5rem] shadow-xl border border-white">
                <div className="flex-1 flex items-center gap-2 px-3">
                  <Search className={`${isSearching ? 'text-amber-500 animate-pulse' : 'text-[#002D62]'}`} size={18} />
                  <input 
                    type="text" 
                    placeholder="ค้นหาสถานที่..." 
                    value={mapSearch}
                    onChange={(e) => setMapSearch(e.target.value)}
                    className="w-full py-2 bg-transparent outline-none font-bold text-slate-800 text-sm placeholder:text-slate-300"
                  />
                </div>
              </div>
              
              {suggestions.length > 0 && (
                <div className="bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden max-h-48 overflow-y-auto">
                   {suggestions.map((s, idx) => (
                     <button key={idx} onClick={() => handleSelectSuggestion(s)} className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b last:border-none text-xs">
                        <p className="font-bold text-slate-800 truncate">{s.display_name.split(',')[0]}</p>
                        <p className="text-[10px] text-slate-400 truncate">{s.display_name}</p>
                     </button>
                   ))}
                </div>
              )}

              {/* Mobile Tab Control */}
              <div className="flex justify-center mt-2">
                <div className="flex bg-[#002D62] p-1 rounded-xl shadow-xl gap-1">
                   <button onClick={() => setLocationStep('start')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${locationStep === 'start' ? 'bg-amber-500 text-white' : 'text-white/50'}`}>Start</button>
                   <button onClick={() => setLocationStep('end')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${locationStep === 'end' ? 'bg-amber-500 text-white' : 'text-white/50'}`}>End</button>
                </div>
              </div>
            </div>

            <div ref={mapContainerRef} className="flex-1 z-[1]" />

            {/* Float Stats - Bottom of Map */}
            <div className="absolute bottom-4 left-4 right-4 z-[1000] lg:hidden">
               <div className="bg-[#002D62] p-4 rounded-2xl text-white shadow-2xl flex justify-between items-center">
                  <div>
                    <p className="text-[8px] font-black text-white/50 uppercase tracking-widest">Total Estimated</p>
                    <p className="text-xl font-black text-amber-400">฿{calcResults.totalCost.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-white/50 uppercase tracking-widest">Distance</p>
                    <p className="text-sm font-bold">{calcResults.distance} km</p>
                  </div>
               </div>
            </div>

            {/* Desktop Stats - Only visible on LG */}
            <div className={`hidden lg:grid grid-cols-4 p-8 bg-white/90 backdrop-blur-md border-t border-slate-100 shrink-0 z-[1000] gap-8 transition-all ${isMapExpanded ? 'h-0 p-0 overflow-hidden' : ''}`}>
                <div className="flex flex-col">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Distance</p>
                  <p className="text-2xl font-black text-slate-800">{calcResults.distance} km</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fuel Consumption</p>
                  <p className="text-2xl font-black text-indigo-600">{calcResults.fuelUsed} L</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fuel Cost</p>
                  <p className="text-2xl font-black text-slate-800">฿{calcResults.fuelCost.toLocaleString()}</p>
                </div>
                <div className="bg-[#002D62] p-4 rounded-2xl text-center">
                  <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Grand Total</p>
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