
import React, { useState, useEffect } from 'react';
import { opsMonitoringService } from '../services/opsMonitoringService';
import { OpsStats, OpsAlert } from '../types';
import { 
  Server, Activity, AlertOctagon, Database, 
  Wifi, Zap, Terminal, RefreshCw, CheckCircle2,
  TrendingDown, TrendingUp
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

const OpsDashboard: React.FC = () => {
  const [stats, setStats] = useState<OpsStats | null>(null);
  const [alerts, setAlerts] = useState<OpsAlert[]>([]);
  const [latencyHistory, setLatencyHistory] = useState<{time: string, p50: number, p95: number}[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStats = opsMonitoringService.getStats();
      const currentAlerts = opsMonitoringService.getAlerts();
      
      setStats(currentStats);
      setAlerts([...currentAlerts]); // Create copy to trigger render

      // Build Graph Data
      setLatencyHistory(prev => {
        const newVal = {
          time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          p50: currentStats.apiLatency.p50,
          p95: currentStats.apiLatency.p95
        };
        const next = [...prev, newVal];
        return next.length > 20 ? next.slice(next.length - 20) : next;
      });

    }, 2000); // Refresh every 2s

    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div className="p-10 text-center"><RefreshCw className="animate-spin mx-auto text-slate-400" /></div>;

  const getHealthColor = (val: number, type: 'latency' | 'error' | 'load') => {
    if (type === 'latency') return val > 2000 ? 'text-red-500' : val > 1000 ? 'text-amber-500' : 'text-emerald-500';
    if (type === 'error') return val > 5 ? 'text-red-500' : val > 1 ? 'text-amber-500' : 'text-emerald-500';
    if (type === 'load') return val > 90 ? 'text-red-500' : val > 75 ? 'text-amber-500' : 'text-emerald-500';
    return 'text-slate-500';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 font-mono pb-20">
      
      {/* Header Panel */}
      <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl text-emerald-400 border border-slate-800 relative overflow-hidden">
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
               <h3 className="text-3xl font-black mb-2 flex items-center gap-3 text-white">
                  <Terminal size={32} className="text-emerald-500" />
                  System Operations Center
               </h3>
               <p className="text-slate-400 text-sm">Real-time Technical Telemetry & Health Check</p>
            </div>
            <div className="flex gap-4">
               <div className="bg-slate-800 px-6 py-3 rounded-xl border border-slate-700 text-right">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">System Status</p>
                  <p className="text-xl font-bold flex items-center gap-2 text-emerald-400">
                     <CheckCircle2 size={20} /> OPERATIONAL
                  </p>
               </div>
            </div>
         </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between mb-2">
               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">API Latency (P95)</span>
               <Activity size={16} className={getHealthColor(stats.apiLatency.p95, 'latency')} />
            </div>
            <p className={`text-3xl font-black ${getHealthColor(stats.apiLatency.p95, 'latency')}`}>
               {Math.round(stats.apiLatency.p95)} <span className="text-xs text-slate-600">ms</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1">P50: {Math.round(stats.apiLatency.p50)} ms</p>
         </div>

         <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between mb-2">
               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Error Rate</span>
               <AlertOctagon size={16} className={getHealthColor(stats.errorRate, 'error')} />
            </div>
            <p className={`text-3xl font-black ${getHealthColor(stats.errorRate, 'error')}`}>
               {stats.errorRate}%
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Requests failed / total</p>
         </div>

         <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between mb-2">
               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Throughput</span>
               <Zap size={16} className="text-blue-400" />
            </div>
            <p className="text-3xl font-black text-blue-400">
               {stats.ingestionThroughput} <span className="text-xs text-slate-600">pts/s</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Active Conns: {stats.activeConnections}</p>
         </div>

         <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between mb-2">
               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">DB Quota</span>
               <Database size={16} className={getHealthColor(stats.dbQuotaUsage, 'load')} />
            </div>
            <p className={`text-3xl font-black ${getHealthColor(stats.dbQuotaUsage, 'load')}`}>
               {stats.dbQuotaUsage}%
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Daily write limit</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Latency Chart */}
         <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
               <Server size={18} className="text-slate-400" /> API Latency Trend (ms)
            </h4>
            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={latencyHistory}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                     <XAxis dataKey="time" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                     <YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                     <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                     <Line type="monotone" dataKey="p95" stroke="#ef4444" strokeWidth={2} dot={false} name="P95" />
                     <Line type="monotone" dataKey="p50" stroke="#3b82f6" strokeWidth={2} dot={false} name="P50" />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Alert Stream */}
         <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 flex flex-col h-[350px]">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
               <AlertOctagon size={18} className="text-red-500" /> Active Alerts
            </h4>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
               {alerts.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">No active alerts</div>
               ) : (
                  alerts.map(alert => (
                     <div key={alert.id} className={`p-3 rounded-xl border text-xs font-mono ${alert.severity === 'CRITICAL' ? 'bg-red-100 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                        <div className="flex justify-between items-center mb-1">
                           <span className="font-black">{alert.severity}</span>
                           <span className="opacity-60">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p>{alert.message}</p>
                     </div>
                  ))
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default OpsDashboard;
