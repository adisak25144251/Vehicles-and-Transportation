
import React, { useState, useEffect, useRef } from 'react';
import { TrackingSession, TelemetryPacket } from '../types';
import { 
  Navigation, Battery, Signal, ShieldCheck, 
  TriangleAlert, Power, MapPin, Search,
  ArrowRight, User, Flag, CheckCircle2,
  Loader2, Radio, Pause, Play, UploadCloud, WifiOff, X,
  Phone, AlertOctagon, Siren, Cloud, RefreshCw, EyeOff
} from 'lucide-react';
import { trackingService } from '../services/trackingService';
import { safetyService } from '../services/safetyService';
import { offlineStorage } from '../services/offlineStorage';
import L from 'leaflet';

interface Props {
  sessionId: string;
  onExit: () => void;
}

interface SearchSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

const DriverMobileView: React.FC<Props> = ({ sessionId, onExit }) => {
  // State Machine: SETUP (Wizard) -> READY -> TRACKING (HUD) -> SUMMARY
  const [viewState, setViewState] = useState<'SETUP_INFO' | 'SETUP_MAP' | 'READY' | 'TRACKING' | 'SUMMARY'>('SETUP_INFO');
  const [trackingStatus, setTrackingStatus] = useState<'ACTIVE' | 'PAUSED'>('ACTIVE');
  const [isPocketMode, setIsPocketMode] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  
  // Data State
  const [telemetry, setTelemetry] = useState<TelemetryPacket | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);
  
  // Trip Stats
  const [totalDist, setTotalDist] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [duration, setDuration] = useState('00:00:00');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Form State - Pre-filled for demo ease
  const [formData, setFormData] = useState({
    driverName: 'ร.ต.ท. มานะ (ตัวอย่าง)',
    department: 'กองกำกับการ 1',
    mission: 'ตรวจเยี่ยมพื้นที่ชายแดน',
    originName: 'ตำแหน่งปัจจุบัน',
    originLat: 0,
    originLng: 0,
    destName: 'ค่ายนเรศวร',
    destLat: 0,
    destLng: 0,
    plateNumber: '1กข 9999'
  });

  // SOS & Crash State
  const [sosPressing, setSosPressing] = useState(false);
  const [sosProgress, setSosProgress] = useState(0);
  const [crashCountdown, setCrashCountdown] = useState<number | null>(null); // If not null, show countdown
  const sosTimerRef = useRef<any>(null);
  const crashTimerRef = useRef<any>(null);

  // Map Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapTarget, setMapTarget] = useState<'ORIGIN' | 'DEST'>('DEST');

  const watchId = useRef<number | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // --- NETWORK LISTENER ---
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Subscribe to tracking service for Queue Updates
  useEffect(() => {
    const unsub = trackingService.subscribeToFleet((sessions) => {
      const mySession = sessions.find(s => s.sessionId === sessionId);
      if (mySession && mySession.pendingQueueSize !== undefined) {
        setQueueSize(mySession.pendingQueueSize);
      }
    });
    return () => unsub();
  }, [sessionId]);

  // --- SOS LOGIC ---
  const handleSosStart = () => {
    if (viewState !== 'TRACKING') return;
    setSosPressing(true);
    let progress = 0;
    sosTimerRef.current = setInterval(() => {
      progress += 2; // 50 ticks = 100% (approx 2 seconds if interval is 40ms)
      setSosProgress(progress);
      if (progress >= 100) {
        triggerSos();
        clearInterval(sosTimerRef.current);
        setSosPressing(false);
        setSosProgress(0);
      }
    }, 40); // 2 seconds total
  };

  const handleSosEnd = () => {
    if (sosTimerRef.current) {
      clearInterval(sosTimerRef.current);
      sosTimerRef.current = null;
    }
    setSosPressing(false);
    setSosProgress(0);
  };

  const triggerSos = () => {
    if (navigator.vibrate) navigator.vibrate([500, 200, 500]); // Haptic feedback
    safetyService.reportIncident({
      type: 'SOS',
      severity: 'CRITICAL',
      vehicleId: formData.plateNumber,
      driverName: formData.driverName || 'Driver',
      location: { 
        lat: telemetry?.lat || 0, 
        lng: telemetry?.lng || 0, 
        accuracy: telemetry?.accuracy || 0 
      },
      description: 'Emergency Button Pressed by Driver'
    });
    alert('ส่งสัญญาณขอความช่วยเหลือฉุกเฉิน (SOS) เรียบร้อยแล้ว ศูนย์ปฏิบัติการกำลังตรวจสอบ');
  };

  // --- CRASH DETECTION SIMULATION ---
  const simulateCrash = () => {
    setCrashCountdown(10);
    if (navigator.vibrate) navigator.vibrate(1000);
    crashTimerRef.current = setInterval(() => {
      setCrashCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(crashTimerRef.current);
          if (prev === 1) {
             // Timeout reached, send crash alert
             safetyService.reportIncident({
                type: 'CRASH',
                severity: 'CRITICAL',
                vehicleId: formData.plateNumber,
                driverName: formData.driverName || 'Driver',
                location: { lat: telemetry?.lat || 0, lng: telemetry?.lng || 0, accuracy: telemetry?.accuracy || 0 },
                description: 'Crash Detected via Sensors (Auto-Reported)'
             });
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const confirmSafe = () => {
    if (crashTimerRef.current) clearInterval(crashTimerRef.current);
    setCrashCountdown(null);
  };

  const confirmNeedHelp = () => {
    if (crashTimerRef.current) clearInterval(crashTimerRef.current);
    setCrashCountdown(null);
    triggerSos();
  };

  const callCenter = () => {
    window.location.href = 'tel:191';
  };

  // --- SETUP & MAP LOGIC ---

  useEffect(() => {
    // Initial Geolocation for Origin (Best effort)
    if (viewState === 'SETUP_INFO') {
      navigator.geolocation.getCurrentPosition(pos => {
        setFormData(prev => ({
          ...prev,
          originLat: pos.coords.latitude,
          originLng: pos.coords.longitude
        }));
      }, () => {
         // Silently fail if GPS not ready yet, allow manual or default
         console.log("Waiting for GPS...");
      });
    }

    // Initialize Map in SETUP_MAP
    if (viewState === 'SETUP_MAP' && mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [formData.originLat || 13.7563, formData.originLng || 100.5018],
        zoom: 13,
        zoomControl: false
      });
      L.tileLayer('https://mt1.google.com/vt?lyrs=y&x={x}&y={y}&z={z}', {
        attribution: 'Google Hybrid'
      }).addTo(map);

      // Add Markers
      const originIcon = L.divIcon({ html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>', className: 'bg-none' });
      const destIcon = L.divIcon({ html: '<div class="w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>', className: 'bg-none' });

      if (formData.originLat) L.marker([formData.originLat, formData.originLng], { icon: originIcon }).addTo(map);
      
      map.on('click', (e) => {
        if (mapTarget === 'DEST') {
           setFormData(prev => ({ ...prev, destLat: e.latlng.lat, destLng: e.latlng.lng, destName: `พิกัด ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}` }));
           L.marker(e.latlng, { icon: destIcon }).addTo(map);
        }
      });

      mapRef.current = map;
    }
  }, [viewState, mapTarget]);

  // Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=5&countrycodes=th`);
          const data = await res.json();
          setSuggestions(data);
        } catch (err) { console.error(err); } finally { setIsSearching(false); }
      } else { setSuggestions([]); }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const selectPlace = (s: SearchSuggestion) => {
    const lat = parseFloat(s.lat);
    const lon = parseFloat(s.lon);
    if (mapTarget === 'DEST') {
      setFormData(prev => ({ ...prev, destName: s.display_name, destLat: lat, destLng: lon }));
    } else {
      setFormData(prev => ({ ...prev, originName: s.display_name, originLat: lat, originLng: lon }));
    }
    setSuggestions([]);
    setSearchQuery('');
    mapRef.current?.setView([lat, lon], 16);
  };

  // --- TRACKING ENGINE ---

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // in meters
  };

  const startTrip = async () => {
    setIsStarting(true);
    
    // 1. Immediately register session (so Fleet Command sees it instantly)
    // Don't wait for GPS here, just send metadata
    await trackingService.startSession(sessionId, {
        driverName: formData.driverName,
        vehicleId: formData.plateNumber,
        mission: formData.mission
    });

    setViewState('TRACKING');
    setStartTime(Date.now());
    setIsStarting(false); // Enable controls immediately
    
    setInterval(() => {
      if (trackingStatus === 'ACTIVE') {
        const now = Date.now();
        setDuration(new Date(Date.now() - startTime).toISOString().substr(11, 8));
      }
    }, 1000);

    if ('geolocation' in navigator) {
      let lastPos: { lat: number, lng: number } | null = null;

      watchId.current = navigator.geolocation.watchPosition(
        async (position) => {
          if (trackingStatus === 'PAUSED') return;

          if (position.coords.accuracy > 50) setErrorMsg('สัญญาณ GPS อ่อน');
          else setErrorMsg('');

          // @ts-ignore
          const battery = await (navigator.getBattery ? navigator.getBattery() : Promise.resolve({ level: 1 }));
          const connection = (navigator as any).connection || { type: 'unknown' };

          const packet: TelemetryPacket = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: (position.coords.speed || 0) * 3.6,
            heading: position.coords.heading || 0,
            altitude: position.coords.altitude || 0,
            timestamp: Date.now(),
            isOffline: !navigator.onLine,
            batteryLevel: battery.level * 100,
            networkType: connection.type || 'unknown'
          };

          setTelemetry(packet);
          
          if (lastPos) {
             const d = calculateDistance(lastPos.lat, lastPos.lng, packet.lat, packet.lng);
             if (d > 5 && (packet.speed > 1 || d > 20)) { 
                setTotalDist(prev => prev + (d / 1000));
             }
          }
          lastPos = { lat: packet.lat, lng: packet.lng };

          trackingService.pushTelemetry(sessionId, packet);
        },
        (err) => {
            setErrorMsg(`GPS Error: ${err.message}. Retrying...`);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const togglePause = () => {
    if (trackingStatus === 'ACTIVE') setTrackingStatus('PAUSED');
    else setTrackingStatus('ACTIVE');
  };

  const endTrip = async () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    await trackingService.endSession(sessionId);
    setViewState('SUMMARY');
  };

  // --- RENDER VIEWS ---

  if (viewState === 'SETUP_INFO') {
    return (
      <div className="fixed inset-0 bg-white z-[200] font-['Sarabun'] flex flex-col">
        <div className="p-6 bg-[#002D62] text-white">
          <h1 className="text-xl font-black">Step 1: ข้อมูลภารกิจ</h1>
          <p className="text-xs text-white/60">ระบุรายละเอียดก่อนเริ่มเดินทาง</p>
        </div>
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div><label className="text-xs font-bold text-slate-500">ยานพาหนะ</label><div className="text-lg font-black text-[#002D62]">{formData.plateNumber}</div></div>
          <div><label className="text-xs font-bold text-slate-500">พลขับ</label><input type="text" className="w-full p-3 bg-slate-50 rounded-xl font-bold" value={formData.driverName} onChange={e => setFormData({...formData, driverName: e.target.value})} placeholder="ชื่อ-สกุล" /></div>
          <div><label className="text-xs font-bold text-slate-500">ภารกิจ</label><input type="text" className="w-full p-3 bg-slate-50 rounded-xl font-bold" value={formData.mission} onChange={e => setFormData({...formData, mission: e.target.value})} placeholder="ระบุภารกิจ" /></div>
        </div>
        <div className="p-6 border-t"><button onClick={() => setViewState('SETUP_MAP')} className="w-full py-4 bg-[#002D62] text-white rounded-xl font-black flex justify-center gap-2">ถัดไป <ArrowRight /></button></div>
      </div>
    );
  }

  if (viewState === 'SETUP_MAP') {
    return (
      <div className="fixed inset-0 bg-white z-[200] font-['Sarabun'] flex flex-col">
        <div className="p-4 bg-[#002D62] text-white flex justify-between items-center">
           <div><h1 className="text-lg font-black">Step 2: เลือกเส้นทาง</h1><p className="text-xs opacity-70">ระบุจุดปลายทางบนแผนที่</p></div>
           <button onClick={() => setViewState('READY')} className="text-xs bg-white/20 px-3 py-1 rounded">ข้าม</button>
        </div>
        <div className="p-2 bg-slate-100 relative z-10">
           <div className="relative">
             <Search className="absolute left-3 top-3 text-slate-400" size={16}/>
             <input type="text" className="w-full p-3 pl-10 rounded-xl text-sm font-bold" placeholder="ค้นหาปลายทาง..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
             {suggestions.length > 0 && (
               <div className="absolute top-full left-0 w-full bg-white shadow-xl rounded-b-xl max-h-48 overflow-y-auto">
                 {suggestions.map((s,i) => <div key={i} onClick={() => selectPlace(s)} className="p-3 border-b text-xs font-bold hover:bg-slate-50">{s.display_name}</div>)}
               </div>
             )}
           </div>
        </div>
        <div className="flex-1 relative">
           <div ref={mapContainerRef} className="absolute inset-0" />
           <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button onClick={() => setMapTarget('DEST')} className={`p-2 rounded-lg shadow font-bold text-xs ${mapTarget === 'DEST' ? 'bg-red-500 text-white' : 'bg-white'}`}>ปลายทาง</button>
              <button onClick={() => setMapTarget('ORIGIN')} className={`p-2 rounded-lg shadow font-bold text-xs ${mapTarget === 'ORIGIN' ? 'bg-blue-500 text-white' : 'bg-white'}`}>ต้นทาง</button>
           </div>
        </div>
        <div className="p-4 bg-white border-t space-y-2">
           <div className="flex items-center gap-2 text-xs"><div className="w-2 h-2 rounded-full bg-blue-500"/> <span className="truncate flex-1">{formData.originName}</span></div>
           <div className="flex items-center gap-2 text-xs"><div className="w-2 h-2 rounded-full bg-red-500"/> <span className="truncate flex-1 font-bold">{formData.destName || 'ยังไม่ระบุ'}</span></div>
           <button onClick={() => setViewState('READY')} disabled={!formData.destName} className="w-full py-3 mt-2 bg-[#002D62] text-white rounded-xl font-black disabled:bg-slate-300">ยืนยันเส้นทาง</button>
        </div>
      </div>
    );
  }

  if (viewState === 'READY') {
    return (
       <div className="fixed inset-0 bg-[#002D62] z-[200] font-['Sarabun'] flex flex-col items-center justify-center p-8 text-white">
          <div className="w-32 h-32 bg-amber-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
             <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                <Power size={48} className="text-white" />
             </div>
          </div>
          <h1 className="text-3xl font-black mb-2">พร้อมเริ่มภารกิจ</h1>
          <p className="text-white/60 mb-10 text-center">กดปุ่มด้านล่างเพื่อเริ่มการเดินทางทันที<br/>ข้อมูลจะถูกส่งไปยังศูนย์สั่งการ</p>
          
          <div className="w-full bg-white/10 rounded-2xl p-6 mb-8 backdrop-blur-sm space-y-4">
             <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-white/60 text-xs">ภารกิจ</span><span className="font-bold">{formData.mission}</span></div>
             <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-white/60 text-xs">ปลายทาง</span><span className="font-bold truncate max-w-[150px]">{formData.destName}</span></div>
          </div>

          <button 
            onClick={startTrip} 
            disabled={isStarting}
            className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
          >
             {isStarting ? <Loader2 className="animate-spin" /> : <Play className="fill-white" />}
             START TRIP
          </button>
       </div>
    );
  }

  if (viewState === 'TRACKING') {
    // --- POCKET MODE OVERLAY ---
    if (isPocketMode) {
      return (
        <div 
          className="fixed inset-0 bg-black z-[500] flex flex-col items-center justify-center text-zinc-800 select-none"
          onClick={() => setIsPocketMode(false)} // Tap to wake
        >
           <div className="text-center animate-pulse">
              <EyeOff size={64} className="mx-auto mb-4 opacity-20" />
              <h2 className="text-2xl font-black opacity-30">Pocket Mode Active</h2>
              <p className="text-xs opacity-20 mt-2">GPS Tracking Running in Background</p>
              <p className="text-xs opacity-20">Tap anywhere to wake screen</p>
           </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black text-white font-['Sarabun'] z-[200] flex flex-col">
        {/* Crash Modal */}
        {crashCountdown !== null && (
          <div className="absolute inset-0 z-[300] bg-red-600 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
             <Siren size={80} className="text-white animate-bounce mb-6" />
             <h2 className="text-3xl font-black text-white mb-2">CRASH DETECTED!</h2>
             <p className="text-white/80 mb-8">เราตรวจพบแรงกระแทกผิดปกติ กรุณายืนยันสถานะ</p>
             <div className="text-6xl font-mono font-black text-white mb-10">{crashCountdown}</div>
             <div className="w-full space-y-4">
                <button onClick={confirmSafe} className="w-full py-5 bg-white text-red-600 rounded-2xl font-black text-xl shadow-xl">I'M SAFE (ปลอดภัย)</button>
                <button onClick={confirmNeedHelp} className="w-full py-5 bg-red-800 text-white border-2 border-red-400 rounded-2xl font-black text-xl">NEED HELP (ต้องการความช่วยเหลือ)</button>
             </div>
          </div>
        )}

        {/* Top Bar - Enhanced for Sync Status */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center relative z-10">
           <div className="flex items-center gap-2">
             <span className={`w-3 h-3 rounded-full ${trackingStatus === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
             <span className="font-black tracking-widest text-sm">{trackingStatus}</span>
           </div>
           
           <div className="flex items-center gap-4">
             {/* Pending Uploads Indicator */}
             {queueSize > 0 && (
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold animate-pulse">
                   <UploadCloud size={14} />
                   <span>Pending: {queueSize}</span>
                </div>
             )}

             <div className="flex gap-3 text-xs font-mono text-slate-400">
               {isOffline ? (
                 <span className="text-red-500 flex items-center gap-1 font-bold"><WifiOff size={12}/> OFFLINE</span>
               ) : (
                 <span className="text-emerald-500 flex items-center gap-1 font-bold"><Signal size={12}/> ONLINE</span>
               )}
               <span className="flex items-center gap-1"><Battery size={12}/> {telemetry?.batteryLevel?.toFixed(0)}%</span>
             </div>
           </div>
        </div>

        {/* Speedometer */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
           <div className={`w-64 h-64 rounded-full border-4 flex flex-col items-center justify-center transition-colors duration-500 ${trackingStatus === 'ACTIVE' ? 'border-emerald-500/30 bg-slate-900' : 'border-amber-500/30 bg-slate-900'}`}>
              <span className="text-8xl font-black font-mono tracking-tighter">{Math.round(telemetry?.speed || 0)}</span>
              <span className="text-sm font-bold text-slate-500 uppercase">KM/H</span>
           </div>
           
           {/* Primary Stats */}
           <div className="grid grid-cols-2 gap-8 mt-12 w-full max-w-xs text-center">
              <div>
                 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Distance</p>
                 <p className="text-3xl font-mono font-black">{totalDist.toFixed(1)} <span className="text-sm text-slate-600">km</span></p>
              </div>
              <div>
                 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Time</p>
                 <p className="text-3xl font-mono font-black">{duration}</p>
              </div>
           </div>

           {/* Alerts */}
           {errorMsg && (
             <div className="absolute bottom-32 bg-red-900/80 px-4 py-2 rounded-full text-red-200 text-xs font-bold flex items-center gap-2 animate-pulse">
               <TriangleAlert size={14} /> {errorMsg}
             </div>
           )}
        </div>

        {/* SOS & Controls */}
        <div className="relative">
           {/* SOS Button (Hold to Trigger) */}
           <div className="absolute bottom-28 right-4 z-20 flex flex-col gap-4">
              {/* Pocket Mode Button */}
              <button 
                onClick={() => setIsPocketMode(true)}
                className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-emerald-400 border border-slate-700 shadow-lg"
                title="Pocket Mode (Screen Off)"
              >
                <EyeOff size={20}/>
              </button>

              <button 
                onClick={callCenter}
                className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-blue-400"
              >
                <Phone size={24}/>
              </button>

              <div className="relative">
                 <button 
                   onMouseDown={handleSosStart}
                   onMouseUp={handleSosEnd}
                   onTouchStart={handleSosStart}
                   onTouchEnd={handleSosEnd}
                   className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-red-900/50 border-4 border-red-500 active:scale-95 transition-transform relative overflow-hidden"
                 >
                    <div 
                      className="absolute inset-0 bg-red-800 transition-all duration-[40ms] ease-linear origin-bottom"
                      style={{ height: `${sosProgress}%` }}
                    />
                    <div className="relative z-10 flex flex-col items-center">
                       <span className="font-black text-xl">SOS</span>
                       <span className="text-[8px] font-bold">HOLD 2S</span>
                    </div>
                 </button>
              </div>
           </div>

           <div className="p-6 bg-slate-900 border-t border-slate-800 pb-10 grid grid-cols-4 gap-4">
              <button onClick={togglePause} className={`col-span-1 rounded-2xl flex flex-col items-center justify-center gap-1 py-4 ${trackingStatus === 'ACTIVE' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                 {trackingStatus === 'ACTIVE' ? <Pause size={24} /> : <Play size={24} />}
                 <span className="text-[9px] font-black uppercase">{trackingStatus === 'ACTIVE' ? 'Pause' : 'Resume'}</span>
              </button>
              <button onClick={endTrip} className="col-span-3 bg-red-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-red-900/50 active:scale-95 transition-all">
                 <Power size={24} /> END TRIP
              </button>
           </div>
        </div>
      </div>
    );
  }

  // SUMMARY VIEW
  return (
    <div className="fixed inset-0 bg-white z-[200] font-['Sarabun'] flex flex-col items-center justify-center p-8 text-center">
       <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
         <UploadCloud size={40} />
       </div>
       <h2 className="text-2xl font-black text-[#002D62] mb-2">ส่งข้อมูลเรียบร้อยแล้ว</h2>
       <p className="text-slate-500 text-sm mb-8">ระยะทางรวม {totalDist.toFixed(2)} กม. เวลา {duration}</p>
       <button onClick={onExit} className="px-8 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">ปิดหน้าต่าง</button>
    </div>
  );
};

export default DriverMobileView;
