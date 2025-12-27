import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trip } from '../types';
import { 
  MapPin, Navigation, Play, Pause, RotateCcw, 
  Activity, AlertCircle, Maximize2, Minimize2,
  Eye, Locate, Compass, Gauge, FastForward,
  ArrowUp, ArrowDown, Zap, ChevronUp, ChevronDown,
  Clock
} from 'lucide-react';
import L from 'leaflet';

interface Props {
  trips: Trip[];
}

const TripMap: React.FC<Props> = ({ trips }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(trips.length > 0 ? trips[0] : null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isFollowMode, setIsFollowMode] = useState(true);
  const [isTrafficVisible, setIsTrafficVisible] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1); 
  const [simZoom, setSimZoom] = useState(17); 
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const trafficLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<{ 
    start?: L.Marker, 
    end?: L.Marker, 
    path?: L.Polyline, 
    passedPath?: L.Polyline,
    vehicle?: L.Marker 
  }>({});

  // Speed levels: 1.0 (Normal) and 5 slower levels
  const speedLevels = [
    { label: 'ปกติ (1.0x)', value: 1 },
    { label: '0.8x', value: 0.8 },
    { label: '0.6x', value: 0.6 },
    { label: '0.4x', value: 0.4 },
    { label: '0.2x', value: 0.2 },
    { label: '0.1x (ช้ามาก)', value: 0.1 },
  ];

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [13.7563, 100.5018],
        zoom: 17,
        zoomControl: false,
        fadeAnimation: true,
        markerZoomAnimation: true,
        tap: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      map.on('zoomend', () => setSimZoom(map.getZoom()));
      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    if (isTrafficVisible) {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = L.tileLayer('https://mt1.google.com/vt?lyrs=h,traffic&x={x}&y={y}&z={z}', { maxZoom: 20, opacity: 0.8 });
      }
      trafficLayerRef.current.addTo(mapRef.current);
    } else if (trafficLayerRef.current) {
      trafficLayerRef.current.remove();
    }
  }, [isTrafficVisible]);

  useEffect(() => {
    if (!mapRef.current || !selectedTrip) return;
    (Object.values(markersRef.current) as (L.Layer | undefined)[]).forEach(m => m?.remove());
    markersRef.current = {};
    setProgress(0); setIsPlaying(false); setCurrentSpeed(0);

    const { startLocation, endLocation, routePath } = selectedTrip;

    markersRef.current.start = L.marker([startLocation.lat, startLocation.lng], {
      icon: L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="bg-blue-600 w-7 h-7 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      })
    }).addTo(mapRef.current);

    markersRef.current.end = L.marker([endLocation.lat, endLocation.lng], {
      icon: L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="bg-[#002D62] w-7 h-7 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-amber-400"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      })
    }).addTo(mapRef.current);

    if (routePath && routePath.length > 0) {
      markersRef.current.path = L.polyline(routePath, { color: '#002D62', weight: 8, opacity: 0.1, lineCap: 'round' }).addTo(mapRef.current);
      markersRef.current.passedPath = L.polyline([], { color: '#3B82F6', weight: 8, opacity: 0.8, lineCap: 'round' }).addTo(mapRef.current);
      mapRef.current.setView([startLocation.lat, startLocation.lng], 16);
    }

    markersRef.current.vehicle = L.marker([startLocation.lat, startLocation.lng], {
      icon: L.divIcon({
        className: 'custom-div-icon',
        html: `<div id="replay-vehicle" class="bg-amber-500 w-10 h-10 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white transition-transform duration-300 transform-gpu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      })
    }).addTo(mapRef.current);
  }, [selectedTrip]);

  useEffect(() => {
    let interval: any;
    if (isPlaying && selectedTrip) {
      const step = 0.05 * speedMultiplier;
      interval = setInterval(() => setProgress(p => p < 100 ? p + step : 100), 40);
    } else clearInterval(interval);
    return () => clearInterval(interval);
  }, [isPlaying, selectedTrip, speedMultiplier]);

  useEffect(() => {
    if (!selectedTrip || !markersRef.current.vehicle || !mapRef.current) return;
    const path = selectedTrip.routePath || [[selectedTrip.startLocation.lat, selectedTrip.startLocation.lng], [selectedTrip.endLocation.lat, selectedTrip.endLocation.lng]];
    if (path.length < 2) return;

    const totalDist = path.reduce((acc, curr, idx) => idx === 0 ? 0 : acc + L.latLng(path[idx-1][0], path[idx-1][1]).distanceTo(L.latLng(curr[0], curr[1])), 0);
    const targetDist = (progress / 100) * totalDist;
    let acc = 0, target: [number, number] = path[0], bearing = 0, passed: [number, number][] = [path[0]];

    for (let i = 1; i < path.length; i++) {
      const p1 = L.latLng(path[i-1][0], path[i-1][1]), p2 = L.latLng(path[i][0], path[i][1]), seg = p1.distanceTo(p2);
      if (acc + seg >= targetDist) {
        const ratio = (targetDist - acc) / (seg || 1);
        target = [p1.lat + (p2.lat - p1.lat) * ratio, p1.lng + (p2.lng - p1.lng) * ratio];
        passed.push(target);
        const y = Math.sin((p2.lng-p1.lng)*Math.PI/180)*Math.cos(p2.lat*Math.PI/180), x = Math.cos(p1.lat*Math.PI/180)*Math.sin(p2.lat*Math.PI/180)-Math.sin(p1.lat*Math.PI/180)*Math.cos(p2.lat*Math.PI/180)*Math.cos((p2.lng-p1.lng)*Math.PI/180);
        bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
        if (isPlaying) setCurrentSpeed(Math.round(Math.max(10, (40 + Math.sin(progress)) * speedMultiplier)));
        break;
      }
      passed.push(path[i]); acc += seg;
    }
    markersRef.current.vehicle.setLatLng(target);
    if (markersRef.current.passedPath) markersRef.current.passedPath.setLatLngs(passed);
    const el = document.getElementById('replay-vehicle'); if (el) el.style.transform = `rotate(${bearing}deg)`;
    if (isFollowMode && isPlaying) mapRef.current.panTo(target, { animate: true, duration: 0.4 });
    if (progress >= 100) { setIsPlaying(false); setProgress(100); setCurrentSpeed(0); }
  }, [progress, selectedTrip, isFollowMode, isPlaying, speedMultiplier]);

  useEffect(() => { if (mapRef.current) setTimeout(() => mapRef.current?.invalidateSize(), 500); }, [isMapExpanded]);

  if (trips.length === 0) return (
    <div className="h-[400px] md:h-[750px] bg-white rounded-3xl border flex flex-col items-center justify-center space-y-4">
      <div className="p-4 bg-slate-50 text-slate-300 rounded-full"><MapPin size={32} /></div>
      <p className="text-sm font-bold text-slate-400">ไม่พบข้อมูลเพื่อแสดงผล</p>
    </div>
  );

  return (
    <div className={`flex flex-col ${isMapExpanded ? 'h-[90vh]' : 'h-[600px] md:h-[800px]'} transition-all duration-500 gap-4 overflow-hidden`}>
      <div className="flex-1 bg-slate-200 rounded-3xl relative overflow-hidden shadow-lg border-[4px] border-white">
        <div ref={mapContainerRef} className="absolute inset-0 z-[1]" />
        
        {/* HUD Overlay - Stackable for Mobile */}
        <div className="absolute top-4 left-4 z-[10] flex flex-col gap-3 pointer-events-none max-w-[calc(100%-2rem)]">
          <div className="bg-[#002D62]/95 backdrop-blur-lg p-4 md:p-6 rounded-2xl shadow-xl border border-white/10 min-w-[200px] md:min-w-[320px] pointer-events-auto">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0"><Compass size={24} /></div>
                <div className="flex-1 truncate">
                  <h4 className="font-black text-white text-sm md:text-lg truncate leading-tight">{selectedTrip?.missionName}</h4>
                  <p className="text-[8px] md:text-[9px] text-white/50 font-black uppercase tracking-widest">{isPlaying ? 'กำลังจำลองเส้นทาง' : 'โหมดพร้อมทำงาน'}</p>
                </div>
             </div>
             
             <div className="flex gap-3 mb-4">
                <div className="flex-1 bg-white/5 p-3 rounded-xl border border-white/5">
                   <p className="text-[7px] font-black text-white/30 uppercase tracking-widest">ความเร็ว</p>
                   <p className="text-xl font-black text-white">{currentSpeed} <span className="text-[8px] opacity-30">กม./ชม.</span></p>
                </div>
                <div className="flex-1 bg-white/5 p-3 rounded-xl border border-white/5">
                   <p className="text-[7px] font-black text-white/30 uppercase tracking-widest">ความเร็วการจำลอง</p>
                   <select 
                      value={speedMultiplier} 
                      onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                      className="bg-transparent text-white font-black text-sm outline-none w-full"
                   >
                     {speedLevels.map(lvl => (
                       <option key={lvl.value} value={lvl.value} className="text-slate-800">{lvl.label}</option>
                     ))}
                   </select>
                </div>
             </div>

             <div className="flex gap-2">
                <button onClick={() => setIsPlaying(!isPlaying)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all ${isPlaying ? 'bg-red-500 text-white' : 'bg-amber-500 text-indigo-950'}`}>
                   {isPlaying ? 'หยุดชั่วคราว' : 'เริ่มจำลอง'}
                </button>
                <button onClick={() => {setProgress(0); setIsPlaying(false); setCurrentSpeed(0);}} className="p-3 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-all" title="รีเซ็ต">
                  <RotateCcw size={16} />
                </button>
             </div>
          </div>
        </div>

        {/* Catalog Drawer for Mobile */}
        <button onClick={() => setIsCatalogOpen(!isCatalogOpen)} className="absolute bottom-4 left-4 z-[20] lg:hidden bg-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 font-bold text-xs text-[#002D62]">
          {isCatalogOpen ? <ChevronDown size={16}/> : <ChevronUp size={16}/>} เลือกรายการทริป
        </button>

        <div className={`absolute bottom-0 left-0 right-0 z-[25] lg:hidden bg-white rounded-t-3xl shadow-2xl transition-transform duration-500 ${isCatalogOpen ? 'translate-y-0' : 'translate-y-full'} max-h-[50vh] overflow-y-auto p-6`}>
           <h5 className="font-black text-slate-800 mb-4">เลือกการเดินทาง</h5>
           <div className="space-y-3">
              {trips.map(t => (
                <div key={t.id} onClick={() => {setSelectedTrip(t); setIsCatalogOpen(false); setProgress(0);}} className={`p-4 rounded-xl border-2 transition-all ${selectedTrip?.id === t.id ? 'border-amber-500 bg-amber-50' : 'border-slate-50'}`}>
                  <p className="font-bold text-slate-800 text-xs">{t.missionName}</p>
                </div>
              ))}
           </div>
        </div>

        {/* Desktop Controls */}
        <div className="absolute top-4 right-4 z-[10] flex flex-col gap-2">
           <button onClick={() => setIsMapExpanded(!isMapExpanded)} className="p-3 bg-white shadow-lg text-[#002D62] rounded-xl border border-slate-100 hover:bg-slate-50 transition-all" title="ขยายแผนที่"><Maximize2 size={20}/></button>
           <button onClick={() => setIsTrafficVisible(!isTrafficVisible)} className={`p-3 shadow-lg rounded-xl border transition-all ${isTrafficVisible ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400'}`} title="การจราจร"><Zap size={20}/></button>
           <button onClick={() => setIsFollowMode(!isFollowMode)} className={`p-3 shadow-lg rounded-xl border transition-all ${isFollowMode ? 'bg-[#002D62] text-amber-400' : 'bg-white text-slate-400'}`} title="ติดตามรถ"><Eye size={20}/></button>
        </div>
      </div>

      {/* Desktop Trip List - Shown side by side on large screens */}
      {!isMapExpanded && (
        <div className="hidden lg:flex w-full bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex-col overflow-hidden max-h-[250px]">
           <h5 className="font-black text-[#002D62] mb-4 flex items-center gap-2 tracking-tight"><FastForward size={18} className="text-amber-500" /> รายการจำลองการเดินทาง (Catalog)</h5>
           <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {trips.map(t => (
                <div key={t.id} onClick={() => {setSelectedTrip(t); setProgress(0);}} className={`min-w-[260px] p-5 rounded-2xl border-2 transition-all cursor-pointer group ${selectedTrip?.id === t.id ? 'border-blue-400 bg-blue-50/50' : 'border-slate-50 hover:border-slate-200 hover:bg-slate-50'}`}>
                  <p className="font-black text-slate-800 text-sm mb-2 truncate group-hover:text-blue-700">{t.missionName}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{t.distanceKm} กม.</span>
                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{t.durationMin} นาที</span>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}
      
      <style>{`.custom-div-icon { background: none; border: none; }`}</style>
    </div>
  );
};

export default TripMap;