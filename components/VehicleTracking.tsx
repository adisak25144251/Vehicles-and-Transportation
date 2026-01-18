
import React, { useState, useEffect, useRef } from 'react';
import { VehicleProfile, TrackingSession, TelemetryPacket, Geofence, UserRole } from '../types';
import { trackingService } from '../services/trackingService';
import { geofenceService } from '../services/geofenceService';
import { privacyService } from '../services/privacyService';
import { 
  Radar, MapPin, Navigation, Signal, Battery, 
  QrCode, User, Radio, RefreshCw, Smartphone, ExternalLink,
  Layers, History, Play, Pause, AlertTriangle, FileSpreadsheet,
  Search, Filter, ChevronRight, Gauge, Clock, Maximize2, Minimize2, Locate, Zap, ShieldAlert,
  Lock, EyeOff
} from 'lucide-react';
import L from 'leaflet';

interface Props {
  vehicles: VehicleProfile[];
  userRole?: UserRole; // To check permissions
  targetVehicleId?: string | null; // For direct navigation
}

const VehicleTracking: React.FC<Props> = ({ vehicles, userRole = UserRole.MANAGER, targetVehicleId }) => {
  // --- STATE ---
  const [sessions, setSessions] = useState<TrackingSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'STREET' | 'HYBRID'>('HYBRID');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'OFFLINE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isTrafficVisible, setIsTrafficVisible] = useState(false);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);

  // Replay State
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [replayData, setReplayData] = useState<TelemetryPacket[]>([]);
  const [replayProgress, setReplayProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Map Refs
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Record<string, L.Marker | L.Circle>>({});
  const polylineRef = useRef<L.Polyline | null>(null);
  const replayMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const trafficLayerRef = useRef<L.TileLayer | null>(null);
  const geofenceLayersRef = useRef<L.Layer[]>([]);

  // --- 1. DATA SUBSCRIPTION ---
  useEffect(() => {
    const unsubscribe = trackingService.subscribeToFleet((data) => {
      // Apply Privacy Redaction Layer before setting state
      const processed = data.map(s => privacyService.applyPrivacyToSession(s, userRole));
      setSessions(processed);
    });
    const alertUnsub = geofenceService.subscribeToAlerts((alerts) => {
      setActiveAlertsCount(alerts.filter(a => a.status === 'NEW').length);
    });
    return () => { unsubscribe(); alertUnsub(); };
  }, [userRole]);

  // --- 1.5 HANDLE TARGET VEHICLE NAVIGATION ---
  useEffect(() => {
    if (targetVehicleId && sessions.length > 0) {
      const foundSession = sessions.find(s => s.vehicleId === targetVehicleId);
      if (foundSession) {
        setSelectedSessionId(foundSession.sessionId);
        // Map pan will be handled by the marker update logic in useEffect #3
      }
    }
  }, [targetVehicleId, sessions]);

  // --- 2. MAP INITIALIZATION & TILE SWITCHING ---
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [13.7563, 100.5018],
        zoom: 12,
        zoomControl: false,
      });
      mapRef.current = map;
    }

    if (mapRef.current) {
      // Clear existing layer
      if (tileLayerRef.current) mapRef.current.removeLayer(tileLayerRef.current);

      let url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'; // Street
      let attr = '&copy; OpenStreetMap';

      if (mapMode === 'HYBRID') {
        // Google Hybrid (Satellite + Labels)
        url = 'https://mt1.google.com/vt?lyrs=y&x={x}&y={y}&z={z}';
        attr = '&copy; Google Maps';
      }

      tileLayerRef.current = L.tileLayer(url, { attribution: attr, maxZoom: 20 }).addTo(mapRef.current);
      
      // Render Geofences
      renderGeofences();
    }
  }, [mapMode]);

  // Handle Geofence Rendering
  const renderGeofences = () => {
    if (!mapRef.current) return;
    
    // Clear old layers
    geofenceLayersRef.current.forEach(l => l.remove());
    geofenceLayersRef.current = [];

    const geofences = geofenceService.getGeofences();
    geofences.filter(g => g.active).forEach(gf => {
       let layer: L.Layer;
       const color = gf.severity === 'HIGH' ? '#EF4444' : '#F59E0B';
       
       if (gf.type === 'CIRCLE') {
          const center = gf.coordinates as [number, number];
          layer = L.circle(center, {
             radius: gf.radius || 500,
             color: color,
             fillColor: color,
             fillOpacity: 0.2,
             dashArray: '5, 5'
          });
       } else {
          const points = gf.coordinates as [number, number][];
          layer = L.polygon(points, {
             color: color,
             fillColor: color,
             fillOpacity: 0.2
          });
       }
       
       layer.bindTooltip(gf.name, { permanent: true, direction: 'center', className: 'text-[10px] font-bold bg-white/80 border-none' });
       layer.addTo(mapRef.current!);
       geofenceLayersRef.current.push(layer);
    });
  };

  // Re-render geofences periodically (simple approach) or when mode changes
  useEffect(() => {
     renderGeofences();
  }, [mapMode]);


  // Handle Map Resize
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 300); // Wait for transition animation
    }
  }, [isMapExpanded]);

  // Handle Traffic Layer
  useEffect(() => {
    if (!mapRef.current) return;

    if (isTrafficVisible) {
      if (!trafficLayerRef.current) {
        // Overlay Google Traffic (Hybrid style to see roads clearly)
        trafficLayerRef.current = L.tileLayer('https://mt1.google.com/vt?lyrs=h,traffic&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          zIndex: 50 // Ensure it's above the base layer
        });
      }
      trafficLayerRef.current.addTo(mapRef.current);
    } else {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.remove();
      }
    }
  }, [isTrafficVisible]);

  // --- 3. LIVE MARKER UPDATES (PRIVACY AWARE) ---
  useEffect(() => {
    if (!mapRef.current || isReplayMode) return;

    sessions.forEach(session => {
      // Filter Logic
      const matchesSearch = session.driverName.includes(searchQuery) || session.vehicleId.includes(searchQuery);
      const matchesFilter = filterStatus === 'ALL' || 
                           (filterStatus === 'ACTIVE' && session.status === 'ACTIVE') ||
                           (filterStatus === 'OFFLINE' && session.status !== 'ACTIVE');

      // Manage Marker Visibility based on filter
      if (!matchesSearch || !matchesFilter) {
         const existing = markersRef.current[session.sessionId];
         if (existing) {
            existing.remove();
            delete markersRef.current[session.sessionId];
         }
         return;
      }

      const { lat, lng, heading } = session.currentLocation;
      
      // -- PRIVACY RENDERING LOGIC --
      // If lat/lng is 0 (Secret), don't show on map
      if (lat === 0 && lng === 0) {
         return;
      }

      // If sensitive, render fuzzy circle area instead of pin
      if (session.privacyLevel === 'SENSITIVE' && !privacyService.canAccessFullData(userRole, 'SENSITIVE')) {
         const existing = markersRef.current[session.sessionId];
         if (existing && existing instanceof L.Circle) {
            existing.setLatLng([lat, lng]);
         } else {
            if (existing) existing.remove();
            const circle = L.circle([lat, lng], {
               radius: 1000, // 1km vague area
               color: '#6366f1',
               fillColor: '#6366f1',
               fillOpacity: 0.3,
               weight: 1
            }).addTo(mapRef.current);
            markersRef.current[session.sessionId] = circle;
         }
         return;
      }

      // Standard Marker
      const color = session.status === 'ACTIVE' ? '#10B981' : '#64748B'; // Emerald vs Slate
      const pulseClass = session.status === 'ACTIVE' ? 'animate-pulse' : '';
      
      const iconHtml = `
        <div class="relative w-12 h-12 flex items-center justify-center transition-transform duration-700 ease-linear" style="transform: rotate(${heading}deg);">
           <div class="absolute inset-0 bg-white rounded-full opacity-30 ${pulseClass}"></div>
           <div class="absolute inset-2 bg-white rounded-full shadow-sm"></div>
           <svg class="relative z-10" width="24" height="24" viewBox="0 0 24 24" fill="${color}" stroke="none">
             <path d="M12 2L2 22l10-3 10 3L12 2z"/>
           </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'bg-transparent border-none',
        html: iconHtml,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });

      const existingMarker = markersRef.current[session.sessionId];
      if (existingMarker && existingMarker instanceof L.Marker) {
        existingMarker.setLatLng([lat, lng]);
        existingMarker.setIcon(customIcon);
        
        if (selectedSessionId === session.sessionId && !isReplayMode) {
           mapRef.current?.panTo([lat, lng], { animate: true, duration: 1 });
        }
      } else {
        if (existingMarker) existingMarker.remove(); // Cleanup if type changed
        const marker = L.marker([lat, lng], { icon: customIcon })
          .addTo(mapRef.current)
          .bindTooltip(session.vehicleId, { permanent: false, direction: 'bottom' });
          
        marker.on('click', () => {
           setSelectedSessionId(session.sessionId);
           setIsReplayMode(false); // Reset to live
        });
        markersRef.current[session.sessionId] = marker;
      }
    });
  }, [sessions, selectedSessionId, mapMode, searchQuery, filterStatus, isReplayMode, userRole]);


  // --- 4. REPLAY ENGINE ---
  const handleEnterReplay = async () => {
    if (!selectedSessionId) return;
    setIsReplayMode(true);
    setIsPlaying(false);
    setReplayProgress(0);

    // Mock Fetch History
    const history = await trackingService.getHistory(selectedSessionId);
    setReplayData(history);

    if (mapRef.current && history.length > 0) {
       // Clear live markers temporarily
       Object.values(markersRef.current).forEach((m: any) => m.remove());
       
       // Draw Path
       const latlngs = history.map(p => [p.lat, p.lng] as [number, number]);
       if (polylineRef.current) polylineRef.current.remove();
       polylineRef.current = L.polyline(latlngs, { color: '#F59E0B', weight: 4 }).addTo(mapRef.current);
       mapRef.current.fitBounds(polylineRef.current.getBounds(), { padding: [50, 50] });

       // Add Replay Marker
       if (replayMarkerRef.current) replayMarkerRef.current.remove();
       replayMarkerRef.current = L.marker(latlngs[0], {
          icon: L.divIcon({
             html: `<div class="w-4 h-4 bg-amber-500 rounded-full border-2 border-white shadow-xl"></div>`,
             className: 'bg-transparent'
          })
       }).addTo(mapRef.current);
    }
  };

  const handleExitReplay = () => {
    setIsReplayMode(false);
    setIsPlaying(false);
    if (polylineRef.current) polylineRef.current.remove();
    if (replayMarkerRef.current) replayMarkerRef.current.remove();
    // Live markers will reappear on next effect tick
  };

  // Replay Animation Loop
  useEffect(() => {
    let animationFrame: number;
    
    const animate = () => {
      if (isPlaying && replayData.length > 1) {
        setReplayProgress(prev => {
           const next = prev + 0.5; // Speed factor
           if (next >= 100) {
             setIsPlaying(false);
             return 100;
           }
           return next;
        });
        animationFrame = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, replayData]);

  // Sync Replay Marker
  useEffect(() => {
     if (isReplayMode && replayData.length > 1 && replayMarkerRef.current) {
        const totalIndex = replayData.length - 1;
        const currentIndex = (replayProgress / 100) * totalIndex;
        const floorIndex = Math.floor(currentIndex);
        const ceilIndex = Math.min(floorIndex + 1, totalIndex);
        const ratio = currentIndex - floorIndex;

        const p1 = replayData[floorIndex];
        const p2 = replayData[ceilIndex];

        const lat = p1.lat + (p2.lat - p1.lat) * ratio;
        const lng = p1.lng + (p2.lng - p1.lng) * ratio;

        replayMarkerRef.current.setLatLng([lat, lng]);
     }
  }, [replayProgress, isReplayMode, replayData]);

  // Handle Locate Me
  const handleLocateMe = () => {
    if (!mapRef.current) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      mapRef.current?.flyTo([latitude, longitude], 15, { animate: true, duration: 1.5 });
      // Add a temporary ping marker
      const ping = L.circleMarker([latitude, longitude], {
        radius: 10,
        color: '#fff',
        fillColor: '#3b82f6',
        fillOpacity: 1,
        weight: 3
      }).addTo(mapRef.current);
      
      // Remove after animation
      setTimeout(() => ping.remove(), 3000);
    }, (err) => {
      console.error(err);
      alert('ไม่สามารถระบุตำแหน่งได้ กรุณาเปิด GPS');
    });
  };

  // --- VIEW HELPERS ---
  const selectedSession = sessions.find(s => s.sessionId === selectedSessionId);
  const filteredSessions = sessions.filter(s => 
    (filterStatus === 'ALL' || (filterStatus === 'ACTIVE' && s.status === 'ACTIVE') || (filterStatus === 'OFFLINE' && s.status !== 'ACTIVE')) &&
    (s.driverName.includes(searchQuery) || s.vehicleId.includes(searchQuery))
  );

  return (
    <div className="relative h-[calc(100vh-100px)] rounded-[2rem] overflow-hidden border border-slate-200 bg-slate-100 flex font-['Sarabun']">
      
      {/* 1. SIDEBAR (Collapsible List) */}
      <div className={`bg-white border-r border-slate-200 flex flex-col z-20 shadow-xl transition-all duration-300 ${isMapExpanded ? 'w-0 opacity-0 overflow-hidden' : 'w-80'}`}>
        <div className="p-5 bg-[#002D62] text-white">
           <h3 className="font-black text-lg flex items-center gap-2 mb-4">
             <Radar className="text-amber-400" /> Fleet Command
           </h3>
           
           {/* Filters */}
           <div className="space-y-3">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                 <input 
                   type="text" 
                   placeholder="ค้นหาทะเบียน / พลขับ..."
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs placeholder:text-white/50 focus:outline-none focus:border-amber-400"
                 />
              </div>
              <div className="flex gap-2">
                 {['ALL', 'ACTIVE', 'OFFLINE'].map(status => (
                    <button 
                      key={status}
                      onClick={() => setFilterStatus(status as any)}
                      className={`flex-1 py-1.5 text-[9px] font-black rounded-md transition-all ${filterStatus === status ? 'bg-amber-500 text-[#002D62]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                      {status}
                    </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Alert Summary in Sidebar */}
        {activeAlertsCount > 0 && (
          <div className="mx-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-pulse cursor-pointer">
             <div className="p-2 bg-red-100 rounded-full text-red-600">
                <ShieldAlert size={16} />
             </div>
             <div>
                <p className="text-xs font-black text-red-700">{activeAlertsCount} Security Alerts</p>
                <p className="text-[10px] text-red-500">Check Geofence Manager</p>
             </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar bg-slate-50">
           {filteredSessions.map(session => (
             <div 
               key={session.sessionId}
               onClick={() => {
                 setSelectedSessionId(session.sessionId);
                 handleExitReplay();
               }}
               className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${selectedSessionId === session.sessionId ? 'bg-white border-amber-400 shadow-md ring-1 ring-amber-400' : 'bg-white border-slate-100 hover:border-slate-300'}`}
             >
                <div className="flex justify-between items-start mb-1">
                   <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${session.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      <span className="font-black text-slate-800 text-sm">{session.vehicleId}</span>
                   </div>
                   <span className="text-[10px] font-mono text-slate-400">{new Date(session.lastUpdate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2">
                   <User size={12} /> {session.driverName}
                </div>
                <div className="flex justify-between items-end">
                   {session.status === 'ACTIVE' && (
                     <div className="flex gap-2">
                        <div className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold flex items-center gap-1">
                           <Gauge size={10} /> {Math.round(session.currentLocation.speed)} km/h
                        </div>
                     </div>
                   )}
                   {session.privacyLevel === 'SECRET' && (
                      <span className="text-[9px] px-2 py-0.5 bg-slate-800 text-white rounded font-black flex items-center gap-1"><Lock size={8}/> SECRET</span>
                   )}
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* 2. MAIN MAP AREA */}
      <div className="flex-1 relative">
         <div ref={mapContainerRef} className="absolute inset-0 z-0" />

         {/* Map Controls (Top Right) */}
         <div className="absolute top-4 right-4 z-[100] flex flex-col gap-2">
            <button 
              onClick={() => setIsMapExpanded(!isMapExpanded)}
              className="p-3 bg-white rounded-xl shadow-lg border border-slate-100 text-slate-600 hover:text-[#002D62] transition-all"
              title={isMapExpanded ? "ย่อแผนที่" : "ขยายเต็มจอ"}
            >
               {isMapExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button 
              onClick={() => setIsTrafficVisible(!isTrafficVisible)}
              className={`p-3 rounded-xl shadow-lg border transition-all ${isTrafficVisible ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-100 hover:text-[#002D62]'}`}
              title="จราจร Real-time"
            >
               <Zap size={20} className={isTrafficVisible ? "fill-white" : ""} />
            </button>
            <button 
              onClick={() => setMapMode(mapMode === 'STREET' ? 'HYBRID' : 'STREET')}
              className="p-3 bg-white rounded-xl shadow-lg border border-slate-100 text-slate-600 hover:text-[#002D62] transition-all"
              title="เปลี่ยนชั้นข้อมูลแผนที่"
            >
               <Layers size={20} />
            </button>
         </div>

         {/* Map Controls (Bottom Right) - Locate Me */}
         <div className="absolute bottom-6 right-4 z-[100] flex flex-col gap-2">
            <button 
              onClick={handleLocateMe}
              className="p-3 bg-[#002D62] text-white rounded-xl shadow-lg border border-white/20 hover:bg-indigo-900 transition-all active:scale-95"
              title="ตำแหน่งปัจจุบัน"
            >
               <Locate size={20} />
            </button>
         </div>

         {/* 3. TELEMETRY HUD & REPLAY (Bottom Overlay) */}
         {selectedSession && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl bg-white/95 backdrop-blur-xl rounded-[1.5rem] shadow-2xl border border-white/20 z-[100] p-6 animate-in slide-in-from-bottom-10">
               
               {/* Header Info */}
               <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
                  <div>
                     <h3 className="text-xl font-black text-[#002D62] flex items-center gap-2">
                        {selectedSession.vehicleId} 
                        <span className="text-sm font-normal text-slate-500">| {selectedSession.mission}</span>
                     </h3>
                     <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        {selectedSession.privacyLevel === 'SECRET' ? (
                           <span className="flex items-center gap-1 text-red-500 font-bold"><EyeOff size={12}/> LOCATION MASKED</span>
                        ) : (
                           <span className="flex items-center gap-1"><MapPin size={12}/> Lat: {selectedSession.currentLocation.lat.toFixed(5)}, Lng: {selectedSession.currentLocation.lng.toFixed(5)}</span>
                        )}
                        <span className="flex items-center gap-1"><Signal size={12} className="text-emerald-500"/> Signal: {selectedSession.signalStrength}</span>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     {!isReplayMode ? (
                       <button onClick={handleEnterReplay} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 transition-all">
                          <History size={16} /> Replay History
                       </button>
                     ) : (
                       <button onClick={handleExitReplay} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs transition-all">
                          Exit Replay
                       </button>
                     )}
                     <button className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl font-bold text-xs flex items-center gap-2 transition-all">
                        <FileSpreadsheet size={16} /> Export
                     </button>
                  </div>
               </div>

               {/* Mode Switch: Live vs Replay */}
               {!isReplayMode ? (
                  <div className="grid grid-cols-4 gap-4">
                     <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Speed</p>
                        <p className="text-2xl font-black text-[#002D62]">{Math.round(selectedSession.currentLocation.speed)} <span className="text-xs text-slate-400">km/h</span></p>
                     </div>
                     <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Heading</p>
                        <p className="text-2xl font-black text-[#002D62]">{Math.round(selectedSession.currentLocation.heading)}°</p>
                     </div>
                     <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Battery</p>
                        <p className="text-2xl font-black text-emerald-600">{selectedSession.batteryLevel}%</p>
                     </div>
                     <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                        <p className={`text-lg font-black uppercase ${selectedSession.status === 'ACTIVE' ? 'text-emerald-500' : 'text-slate-400'}`}>{selectedSession.status}</p>
                     </div>
                  </div>
               ) : (
                  <div className="space-y-4">
                     <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setIsPlaying(!isPlaying)}
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 ${isPlaying ? 'bg-amber-500' : 'bg-[#002D62]'}`}
                        >
                           {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                        </button>
                        <div className="flex-1">
                           <input 
                             type="range" 
                             min="0" max="100" 
                             value={replayProgress} 
                             onChange={(e) => setReplayProgress(parseFloat(e.target.value))}
                             className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#002D62]"
                           />
                           <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                              <span>08:30 Start</span>
                              <span>Playback Progress: {Math.round(replayProgress)}%</span>
                              <span>17:00 End</span>
                           </div>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         )}
      </div>

    </div>
  );
};

export default VehicleTracking;
