
import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, Map, Plus, Trash2, 
  AlertTriangle, CheckCircle2, Clock, 
  Bell, Filter, Search, X, Layers, Maximize2, Minimize2
} from 'lucide-react';
import { geofenceService } from '../services/geofenceService';
import { Geofence, SecurityAlert } from '../types';
import L from 'leaflet';

const GeofenceManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALERTS' | 'ZONES'>('ALERTS');
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  
  // Map Refs
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    // Poll for alerts & geofences
    const interval = setInterval(() => {
       setAlerts([...geofenceService.getAlerts()]);
       setGeofences([...geofenceService.getGeofences()]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Map when tab changes to ZONES
  useEffect(() => {
    if (activeTab === 'ZONES' && mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [13.7563, 100.5018],
        zoom: 12,
        zoomControl: false,
      });

      L.tileLayer('https://mt1.google.com/vt?lyrs=y&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google Maps',
        maxZoom: 20,
      }).addTo(map);

      mapRef.current = map;
    }

    // Render Geofences on Map
    if (activeTab === 'ZONES' && mapRef.current) {
      // Clear old layers
      layersRef.current.forEach(l => l.remove());
      layersRef.current = [];

      geofences.forEach(gf => {
        if (!gf.active) return;

        let layer: L.Layer;
        const color = gf.severity === 'HIGH' ? '#EF4444' : '#10B981'; // Red for High, Emerald for Medium/Low
        const fillColor = gf.severity === 'HIGH' ? '#EF4444' : '#10B981';

        if (gf.type === 'CIRCLE') {
           const center = gf.coordinates as [number, number];
           layer = L.circle(center, {
              radius: gf.radius || 500,
              color: color,
              fillColor: fillColor,
              fillOpacity: 0.3,
              weight: 2,
              dashArray: '5, 5'
           });
        } else {
           const points = gf.coordinates as [number, number][];
           layer = L.polygon(points, {
              color: color,
              fillColor: fillColor,
              fillOpacity: 0.3,
              weight: 2
           });
        }

        // Add Popup/Tooltip
        layer.bindTooltip(`
          <div class="text-center">
            <div class="font-bold text-xs">${gf.name}</div>
            <div class="text-[9px] uppercase font-black tracking-widest text-slate-500">${gf.type}</div>
          </div>
        `, { permanent: true, direction: 'center', className: 'bg-white/90 border-none shadow-sm rounded-lg px-2 py-1' });

        layer.addTo(mapRef.current!);
        layersRef.current.push(layer);
      });

      // Auto-fit bounds if we have geofences
      if (layersRef.current.length > 0) {
         const group = L.featureGroup(layersRef.current);
         mapRef.current.fitBounds(group.getBounds(), { padding: [50, 50] });
      }
    }

    // Cleanup map when leaving tab
    return () => {
      if (activeTab !== 'ZONES' && mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layersRef.current = [];
      }
    };
  }, [activeTab, geofences]);

  const handleAck = (id: string) => {
    geofenceService.ackAlert(id);
    setAlerts([...geofenceService.getAlerts()]);
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-50 text-red-700 border-red-200';
      case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
       {/* Header */}
       <div className="bg-[#002D62] p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
             <ShieldAlert size={120} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
             <div>
                <h3 className="text-2xl font-black mb-2 flex items-center gap-3">
                   <Map size={28} className="text-amber-400" />
                   Security Command Center
                </h3>
                <p className="text-white/60 text-sm">ตรวจสอบการออกนอกเส้นทางและพื้นที่ควบคุม (Geofencing)</p>
             </div>
             <div className="flex bg-white/10 p-1 rounded-2xl">
                <button 
                  onClick={() => setActiveTab('ALERTS')}
                  className={`px-6 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'ALERTS' ? 'bg-white text-[#002D62] shadow-lg' : 'text-white/70 hover:bg-white/5'}`}
                >
                  Active Alerts ({alerts.filter(a => a.status === 'NEW').length})
                </button>
                <button 
                  onClick={() => setActiveTab('ZONES')}
                  className={`px-6 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'ZONES' ? 'bg-white text-[#002D62] shadow-lg' : 'text-white/70 hover:bg-white/5'}`}
                >
                  Manage Zones ({geofences.length})
                </button>
             </div>
          </div>
       </div>

       {activeTab === 'ALERTS' && (
         <div className="space-y-4">
            {alerts.length === 0 ? (
               <div className="bg-white p-20 rounded-[2.5rem] border border-slate-100 text-center text-slate-400">
                  <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500" />
                  <p className="font-bold">เหตุการณ์ปกติ</p>
                  <p className="text-xs">ไม่พบการแจ้งเตือนความปลอดภัยในขณะนี้</p>
               </div>
            ) : (
               alerts.map(alert => (
                 <div key={alert.id} className={`p-6 rounded-3xl border-2 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${alert.status === 'NEW' ? 'bg-white border-red-100 shadow-lg' : 'bg-slate-50 border-slate-100 opacity-70'}`}>
                    <div className="flex items-start gap-4">
                       <div className={`p-3 rounded-2xl ${getSeverityStyle(alert.severity)}`}>
                          <AlertTriangle size={24} />
                       </div>
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${getSeverityStyle(alert.severity)}`}>
                                {alert.type.replace('_', ' ')}
                             </span>
                             <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                <Clock size={10} /> {new Date(alert.timestamp).toLocaleTimeString()}
                             </span>
                          </div>
                          <p className="font-black text-slate-800">{alert.message}</p>
                          <p className="text-xs text-slate-500">Vehicle: <span className="font-mono font-bold">{alert.vehicleId}</span></p>
                       </div>
                    </div>
                    
                    {alert.status === 'NEW' && (
                      <button 
                        onClick={() => handleAck(alert.id)}
                        className="px-6 py-3 bg-[#002D62] text-white rounded-xl font-bold text-xs shadow-lg hover:bg-indigo-900 transition-all whitespace-nowrap"
                      >
                         Acknowledge
                      </button>
                    )}
                 </div>
               ))
            )}
         </div>
       )}

       {activeTab === 'ZONES' && (
         <div className="space-y-6">
            {/* MAP CONTAINER */}
            <div className="h-[400px] w-full rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-200 relative bg-slate-100">
               <div ref={mapContainerRef} className="absolute inset-0 z-0" />
               <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                     <Layers size={14} /> Zone Visualization
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Create New Card */}
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center p-10 cursor-pointer hover:bg-white hover:border-amber-400 hover:text-amber-600 transition-all group min-h-[200px]">
                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                      <Plus size={32} />
                   </div>
                   <p className="font-black">Add New Geofence</p>
                   <p className="text-xs text-slate-400">Circle or Polygon</p>
                </div>

                {geofences.map(geo => (
                   <div key={geo.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all min-h-[200px] flex flex-col">
                      <div className={`absolute top-0 left-0 w-2 h-full ${geo.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <div className="flex justify-between items-start mb-4 pl-4">
                         <div>
                            <h4 className="font-black text-slate-800">{geo.name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{geo.type} • {geo.triggers.join(', ')}</p>
                         </div>
                         <button onClick={() => geofenceService.removeGeofence(geo.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 size={18} />
                         </button>
                      </div>
                      <div className="pl-4 flex-1">
                         <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <div className={`p-1.5 rounded-lg ${geo.type === 'CIRCLE' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                               <Map size={16} />
                            </div>
                            <span className="text-xs font-bold text-slate-600">
                               {geo.type === 'CIRCLE' ? `Radius: ${geo.radius}m` : `Points: ${(geo.coordinates as any[]).length}`}
                            </span>
                         </div>
                         
                         <div className="mt-auto">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                               <span>Severity: <span className={geo.severity === 'HIGH' ? 'text-red-500' : 'text-emerald-500'}>{geo.severity}</span></span>
                               <div className={`w-3 h-3 rounded-full ${geo.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                            </div>
                         </div>
                      </div>
                   </div>
                ))}
            </div>
         </div>
       )}
    </div>
  );
};

export default GeofenceManager;
