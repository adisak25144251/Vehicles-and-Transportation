
import React, { useState, useEffect } from 'react';
import { VehicleRequest, RequestStatus, VehicleProfile, UserRole } from '../types';
import { requestService, vehicleService } from '../services/apiService';
import { auditService } from '../services/auditService'; // Imported
import { 
  FileText, CheckCircle2, XCircle, Clock, Truck, 
  User, Calendar, MapPin, QrCode, ArrowRight,
  ShieldCheck, AlertTriangle, Plus, Search,
  Printer, Share2, Send, Loader2, CalendarDays, Settings, Wifi, Link as LinkIcon, RefreshCw
} from 'lucide-react';

interface Props {
  currentUserRole?: string; // MOCK ROLE for demo
}

const RequestManager: React.FC<Props> = ({ currentUserRole = 'MANAGER' }) => {
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [vehicles, setVehicles] = useState<VehicleProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'MY_REQUESTS' | 'APPROVALS' | 'DISPATCH'>('MY_REQUESTS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // QR Code Configuration
  const [customQrUrl, setCustomQrUrl] = useState('');
  const [showQrConfig, setShowQrConfig] = useState(false);
  
  // New Request Form
  const [newReq, setNewReq] = useState({
    mission: '',
    department: '',
    destination: '',
    startTime: '',
    endTime: '',
    passengers: 1
  });

  // Selected for Action
  const [selectedReq, setSelectedReq] = useState<VehicleRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [dispatchData, setDispatchData] = useState({ vehicleId: '', driverName: '' });

  useEffect(() => {
    loadData();
    // Auto-switch tab based on role for better UX
    if (currentUserRole === 'MANAGER') setActiveTab('APPROVALS');
    if (currentUserRole === 'DISPATCHER') setActiveTab('DISPATCH');
  }, [currentUserRole]);

  // Update Custom URL when selected request changes
  useEffect(() => {
    if (selectedReq && selectedReq.status === RequestStatus.ISSUED && selectedReq.tripToken) {
        // Default to current window location
        const baseUrl = window.location.origin + window.location.pathname;
        const fullUrl = `${baseUrl}?driver_token=${selectedReq.tripToken}`;
        setCustomQrUrl(fullUrl);
    }
  }, [selectedReq]);

  const loadData = async () => {
    try {
      const [reqs, vehs] = await Promise.all([
        requestService.getAll(),
        vehicleService.getAll()
      ]);
      setRequests(reqs);
      setVehicles(vehs);
    } catch (error) {
      console.error("Load data error", error);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
        const result = await requestService.create({
          requesterName: 'User (Demo)', // In real app, get from auth
          department: newReq.department,
          mission: newReq.mission,
          destination: newReq.destination,
          startTime: newReq.startTime,
          endTime: newReq.endTime,
          passengers: newReq.passengers
        });
        
        // Log Audit
        auditService.log(
          'REQ_CREATE', 
          { fullName: 'User (Demo)', role: UserRole.OFFICER }, 
          result.id, 
          'REQUEST', 
          `Created request for mission: ${newReq.mission}`
        );

        setIsModalOpen(false);
        await loadData();
        setNewReq({ mission: '', department: '', destination: '', startTime: '', endTime: '', passengers: 1 });
    } catch (error) {
        console.error("Failed to create request", error);
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleApprove = async (req: VehicleRequest) => {
    // Direct action without confirm dialog for smoother UX in demo
    setIsActionLoading(true);
    try {
        await requestService.updateStatus(req.id, RequestStatus.APPROVED, {
          approverName: 'Manager (Demo)',
          approvalDate: new Date().toISOString()
        });

        // Log Audit with Diff
        auditService.log(
          'REQ_APPROVE', 
          { fullName: 'Manager (Demo)', role: UserRole.MANAGER }, 
          req.id, 
          'REQUEST', 
          `Approved request ${req.id}`,
          { before: { status: req.status }, after: { status: RequestStatus.APPROVED } }
        );

        await loadData();
        // Update selectedReq to reflect changes immediately in UI
        setSelectedReq(prev => prev ? { ...prev, status: RequestStatus.APPROVED, approverName: 'Manager (Demo)', approvalDate: new Date().toISOString() } : null);
        
    } catch (error) {
        console.error("Error approving request:", error);
        alert("เกิดข้อผิดพลาดในการอนุมัติ");
    } finally {
        setIsActionLoading(false);
    }
  };

  const handleReject = async (req: VehicleRequest) => {
    if (!rejectReason) return alert('โปรดระบุเหตุผลที่ไม่อนุมัติ');
    setIsActionLoading(true);
    try {
        await requestService.updateStatus(req.id, RequestStatus.REJECTED, {
          approverName: 'Manager (Demo)',
          approvalDate: new Date().toISOString(),
          rejectionReason: rejectReason
        });

        // Log Audit
        auditService.log(
          'REQ_REJECT', 
          { fullName: 'Manager (Demo)', role: UserRole.MANAGER }, 
          req.id, 
          'REQUEST', 
          `Rejected request: ${rejectReason}`
        );

        await loadData();
        setSelectedReq(null);
        setRejectReason('');
    } catch (error) {
        console.error("Error rejecting request:", error);
        alert("เกิดข้อผิดพลาด");
    } finally {
        setIsActionLoading(false);
    }
  };

  const handleDispatch = async (req: VehicleRequest) => {
    if (!dispatchData.vehicleId || !dispatchData.driverName) return alert('โปรดระบุรถและคนขับ');
    setIsActionLoading(true);
    
    try {
        // Generate Secure Token
        const token = `FLEETQR-${req.id}-${Date.now()}`;
        const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

        await requestService.updateStatus(req.id, RequestStatus.ISSUED, {
          assignedVehicleId: dispatchData.vehicleId,
          assignedDriverName: dispatchData.driverName,
          tripToken: token,
          tokenExpiresAt: expiresAt
        });
        
        // Log Audit
        auditService.log(
          'REQ_DISPATCH', 
          { fullName: 'Dispatcher (Demo)', role: UserRole.DISPATCHER }, 
          req.id, 
          'REQUEST', 
          `Dispatched vehicle ${dispatchData.vehicleId} with driver ${dispatchData.driverName}`
        );

        await loadData();
        
        // Update selected view
        const updatedRequests = await requestService.getAll();
        setSelectedReq(updatedRequests.find(r => r.id === req.id) || null);
        
    } catch (error) {
        console.error("Dispatch error:", error);
        alert("เกิดข้อผิดพลาดในการจ่ายงาน");
    } finally {
        setIsActionLoading(false);
    }
  };

  const handleShareLine = () => {
      if (!selectedReq) return;
      const vehicle = vehicles.find(v => v.id === selectedReq.assignedVehicleId);
      
      const message = `📋 *คำสั่งเดินทาง (e-Ticket)*\n\n` +
          `📌 ภารกิจ: ${selectedReq.mission}\n` +
          `🚗 รถหมายเลข: ${vehicle?.plateNumber || '-'}\n` +
          `👤 พลขับ: ${selectedReq.assignedDriverName}\n` +
          `📅 วันที่: ${new Date(selectedReq.startTime).toLocaleDateString('th-TH')}\n` +
          `🕒 เวลา: ${new Date(selectedReq.startTime).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}\n` +
          `📍 ปลายทาง: ${selectedReq.destination}\n\n` +
          `🔗 กดรับงาน: ${customQrUrl}`;
      
      // Open LINE URL Scheme
      window.open(`https://line.me/R/msg/text/?${encodeURIComponent(message)}`, '_blank');
  };

  // --- RENDER HELPERS ---

  const getStatusBadge = (status: RequestStatus) => {
    const config = {
      [RequestStatus.SUBMITTED]: { color: 'bg-blue-50 text-blue-600', label: 'รออนุมัติ', icon: Clock },
      [RequestStatus.APPROVED]: { color: 'bg-emerald-50 text-emerald-600', label: 'อนุมัติแล้ว', icon: CheckCircle2 },
      [RequestStatus.REJECTED]: { color: 'bg-red-50 text-red-600', label: 'ไม่อนุมัติ', icon: XCircle },
      [RequestStatus.ISSUED]: { color: 'bg-[#002D62] text-amber-400', label: 'พร้อมเดินทาง', icon: QrCode },
      [RequestStatus.STARTED]: { color: 'bg-indigo-50 text-indigo-600', label: 'กำลังเดินทาง', icon: Truck },
      [RequestStatus.ENDED]: { color: 'bg-slate-50 text-slate-600', label: 'จบภารกิจ', icon: CheckCircle2 },
      [RequestStatus.CANCELLED]: { color: 'bg-slate-100 text-slate-400', label: 'ยกเลิก', icon: XCircle },
    };
    const c = config[status];
    return (
      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${c.color}`}>
        <c.icon size={12} /> {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 font-['Sarabun'] pb-20">
      
      {/* HEADER & TABS */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-black text-[#002D62] tracking-tight">ระบบอนุมัติการใช้รถ</h3>
          <p className="text-sm text-slate-400 font-medium">Trip Approval Workflow & Resource Dispatching</p>
        </div>
        <div className="flex bg-slate-50 p-1 rounded-2xl">
           <button onClick={() => setActiveTab('MY_REQUESTS')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'MY_REQUESTS' ? 'bg-white shadow text-[#002D62]' : 'text-slate-400 hover:text-slate-600'}`}>คำขอของฉัน</button>
           <button onClick={() => setActiveTab('APPROVALS')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'APPROVALS' ? 'bg-white shadow text-[#002D62]' : 'text-slate-400 hover:text-slate-600'}`}>อนุมัติงาน ({requests.filter(r => r.status === RequestStatus.SUBMITTED).length})</button>
           <button onClick={() => setActiveTab('DISPATCH')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'DISPATCH' ? 'bg-white shadow text-[#002D62]' : 'text-slate-400 hover:text-slate-600'}`}>จัดรถ/ออก QR</button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LIST VIEW */}
        <div className="lg:col-span-2 space-y-4">
           {activeTab === 'MY_REQUESTS' && (
             <button onClick={() => setIsModalOpen(true)} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold hover:bg-slate-50 hover:border-amber-400 hover:text-amber-600 transition-all flex items-center justify-center gap-2">
                <Plus size={20} /> สร้างคำขอใหม่
             </button>
           )}

           {requests
             .filter(r => {
                if (activeTab === 'MY_REQUESTS') return true; 
                if (activeTab === 'APPROVALS') return r.status === RequestStatus.SUBMITTED;
                if (activeTab === 'DISPATCH') return r.status === RequestStatus.APPROVED || r.status === RequestStatus.ISSUED;
                return false;
             })
             .map(req => (
               <div 
                 key={req.id} 
                 onClick={() => setSelectedReq(req)}
                 className={`bg-white p-6 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden ${selectedReq?.id === req.id ? 'border-amber-400 shadow-md ring-1 ring-amber-400' : 'border-slate-100 hover:border-indigo-100 hover:shadow-lg'}`}
               >
                  {/* Status Strip */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${req.status === RequestStatus.ISSUED ? 'bg-amber-400' : req.status === RequestStatus.APPROVED ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  
                  <div className="flex justify-between items-start mb-4 pl-4">
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-slate-300">#{req.id}</span>
                          {getStatusBadge(req.status)}
                        </div>
                        <h4 className="text-lg font-black text-[#002D62]">{req.mission}</h4>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">วันที่ขอ</p>
                        <p className="text-xs font-bold text-slate-600">{new Date(req.requestDate).toLocaleDateString('th-TH')}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pl-4 text-xs">
                     <div>
                        <p className="font-bold text-slate-400 mb-1">ผู้ขอ</p>
                        <div className="flex items-center gap-1 font-bold text-slate-700"><User size={12}/> {req.requesterName}</div>
                     </div>
                     <div>
                        <p className="font-bold text-slate-400 mb-1">ปลายทาง</p>
                        <div className="flex items-center gap-1 font-bold text-slate-700"><MapPin size={12}/> {req.destination}</div>
                     </div>
                     <div>
                        <p className="font-bold text-slate-400 mb-1">เวลานัดหมาย</p>
                        <div className="flex items-center gap-1 font-bold text-slate-700"><Calendar size={12}/> {new Date(req.startTime).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}</div>
                     </div>
                     <div>
                        <p className="font-bold text-slate-400 mb-1">ผู้โดยสาร</p>
                        <div className="flex items-center gap-1 font-bold text-slate-700">{req.passengers} ท่าน</div>
                     </div>
                  </div>
               </div>
             ))}

             {requests.length === 0 && (
               <div className="text-center py-20 text-slate-400">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"><FileText size={32} /></div>
                  <p>ไม่พบรายการคำขอ</p>
               </div>
             )}
        </div>

        {/* DETAIL & ACTION PANEL */}
        <div className="lg:col-span-1">
           {selectedReq ? (
             <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden sticky top-4">
                <div className="bg-[#002D62] p-6 text-white relative">
                   <h4 className="font-black text-lg">รายละเอียดคำขอ</h4>
                   <p className="text-xs opacity-70">ID: {selectedReq.id}</p>
                   {selectedReq.status === RequestStatus.ISSUED && (
                      <div className="absolute top-4 right-4 bg-white p-2 rounded-xl">
                         <QrCode className="text-[#002D62]" size={40} />
                      </div>
                   )}
                </div>
                
                <div className="p-6 space-y-6">
                   {/* Timeline */}
                   <div className="space-y-4 relative">
                      <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-slate-100" />
                      <div className="relative pl-6">
                         <div className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-blue-500 shadow-sm" />
                         <p className="text-xs font-bold text-slate-800">สร้างคำขอ</p>
                         <p className="text-[10px] text-slate-400">{new Date(selectedReq.requestDate).toLocaleString('th-TH')}</p>
                      </div>
                      {selectedReq.approvalDate && (
                        <div className="relative pl-6">
                           <div className={`absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${selectedReq.status === RequestStatus.REJECTED ? 'bg-red-500' : 'bg-emerald-500'}`} />
                           <p className="text-xs font-bold text-slate-800">{selectedReq.status === RequestStatus.REJECTED ? 'ไม่อนุมัติ' : 'อนุมัติแล้ว'}</p>
                           <p className="text-[10px] text-slate-400">โดย {selectedReq.approverName}</p>
                           {selectedReq.rejectionReason && <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg mt-1">{selectedReq.rejectionReason}</p>}
                        </div>
                      )}
                      {selectedReq.status === RequestStatus.ISSUED && (
                        <div className="relative pl-6">
                           <div className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-amber-400 shadow-sm" />
                           <p className="text-xs font-bold text-slate-800">ออกคำสั่ง (QR Code)</p>
                           <p className="text-[10px] text-slate-400">รถ: {vehicles.find(v => v.id === selectedReq.assignedVehicleId)?.plateNumber}</p>
                           <p className="text-[10px] text-slate-400">คนขับ: {selectedReq.assignedDriverName}</p>
                        </div>
                      )}
                   </div>

                   {/* ACTIONS: APPROVER */}
                   {activeTab === 'APPROVALS' && selectedReq.status === RequestStatus.SUBMITTED && (
                      <div className="space-y-3 pt-4 border-t border-slate-100">
                         <p className="text-xs font-bold text-slate-400 uppercase">ส่วนการอนุมัติ</p>
                         <button 
                            disabled={isActionLoading}
                            onClick={() => handleApprove(selectedReq)} 
                            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex justify-center items-center gap-2 disabled:bg-slate-300"
                         >
                            {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                            อนุมัติคำขอ
                         </button>
                         <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="ระบุเหตุผล (กรณีไม่อนุมัติ)" 
                              className="flex-1 px-3 bg-slate-50 border-none rounded-xl text-xs text-black"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                            />
                            <button 
                                disabled={isActionLoading}
                                onClick={() => handleReject(selectedReq)} 
                                className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm transition-all disabled:text-slate-400"
                            >
                               ไม่อนุมัติ
                            </button>
                         </div>
                      </div>
                   )}

                   {/* ACTIONS: DISPATCHER */}
                   {activeTab === 'DISPATCH' && selectedReq.status === RequestStatus.APPROVED && (
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                         <p className="text-xs font-bold text-slate-400 uppercase">จัดรถและออกคำสั่ง</p>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400">เลือกยานพาหนะ</label>
                            <select 
                              className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none text-black"
                              onChange={(e) => setDispatchData({...dispatchData, vehicleId: e.target.value})}
                              value={dispatchData.vehicleId}
                            >
                               <option value="">-- เลือกรถ --</option>
                               {vehicles.filter(v => v.status === 'USABLE').map(v => (
                                 <option key={v.id} value={v.id}>{v.plateNumber} - {v.name}</option>
                               ))}
                            </select>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400">ระบุคนขับ</label>
                            <input 
                              type="text" 
                              placeholder="ชื่อ-สกุล พลขับ"
                              className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none text-black"
                              value={dispatchData.driverName}
                              onChange={(e) => setDispatchData({...dispatchData, driverName: e.target.value})}
                            />
                         </div>
                         <button 
                            disabled={isActionLoading}
                            onClick={() => handleDispatch(selectedReq)} 
                            className="w-full py-3 bg-[#002D62] text-amber-400 rounded-xl font-black text-sm shadow-lg hover:bg-indigo-900 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300"
                         >
                            {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                            ออก QR Code
                         </button>
                      </div>
                   )}

                   {/* VIEW: QR CODE & TRACKING LINK */}
                   {selectedReq.status === RequestStatus.ISSUED && customQrUrl && (
                      <div className="pt-4 border-t border-slate-100 text-center space-y-4">
                         {/* Network Configuration for QR Code */}
                         <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-left">
                            <div className="flex items-center justify-between mb-2">
                               <div className="flex items-center gap-1.5 text-amber-800 font-bold text-[10px] uppercase">
                                  <Wifi size={12} /> Link Configuration
                               </div>
                               <button onClick={() => setShowQrConfig(!showQrConfig)} className="text-[10px] underline text-slate-500">
                                  {showQrConfig ? 'Hide' : 'Edit URL'}
                               </button>
                            </div>
                            
                            {showQrConfig ? (
                               <div className="space-y-2">
                                  <p className="text-[9px] text-slate-500">
                                     แก้ไข URL ให้ถูกต้อง (เช่น เปลี่ยน <code>localhost</code> เป็น IP <code>http://192.168.1.X:5173</code> เพื่อทดสอบผ่านมือถือในวง LAN เดียวกัน)
                                  </p>
                                  <input 
                                    type="text" 
                                    value={customQrUrl}
                                    onChange={(e) => setCustomQrUrl(e.target.value)}
                                    className="w-full p-2 text-xs font-bold border border-amber-200 rounded-lg bg-white break-all"
                                  />
                                  <button 
                                    onClick={() => {
                                        const baseUrl = window.location.origin + window.location.pathname;
                                        setCustomQrUrl(`${baseUrl}?driver_token=${selectedReq.tripToken}`);
                                    }}
                                    className="text-[9px] text-blue-500 underline flex items-center gap-1"
                                  >
                                    <RefreshCw size={10} /> Reset to Default
                                  </button>
                               </div>
                            ) : (
                               <div className="text-[10px] text-slate-500 break-all bg-white p-2 rounded border border-slate-100 cursor-pointer hover:bg-slate-50" onClick={() => setShowQrConfig(true)}>
                                  <div className="flex items-center gap-1 mb-1 font-bold text-slate-400">
                                     <LinkIcon size={10} /> Current Link Target:
                                  </div>
                                  {customQrUrl}
                               </div>
                            )}
                         </div>

                         <div className="bg-white p-4 rounded-2xl border-2 border-[#002D62] inline-block shadow-lg">
                            {/* Generated QR Code uses the Configurable Full URL */}
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(customQrUrl)}`} 
                                alt="Trip QR Code" 
                                className="w-32 h-32 object-contain"
                            />
                         </div>
                         <div>
                            <p className="text-xs font-bold text-slate-800">TRIP TOKEN: {selectedReq.tripToken?.substring(0, 15)}...</p>
                            <p className="text-[10px] text-red-500 font-bold mt-1">หมดอายุ: {new Date(selectedReq.tokenExpiresAt || 0).toLocaleString()}</p>
                         </div>
                         
                         <div className="flex gap-2">
                            <button className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1"><Printer size={14}/> พิมพ์</button>
                            <button 
                                onClick={handleShareLine}
                                className="flex-1 py-2 bg-[#06C755] text-white hover:bg-[#05b34c] rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                            >
                                <Share2 size={14}/> ส่งไลน์
                            </button>
                         </div>
                      </div>
                   )}
                </div>
             </div>
           ) : (
             <div className="h-full bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 p-10 text-center">
                <ShieldCheck size={48} className="mb-4" />
                <p className="font-bold">เลือกรายการเพื่อดำเนินการ</p>
                <p className="text-xs">อนุมัติ / จัดรถ / ตรวจสอบสถานะ</p>
             </div>
           )}
        </div>
      </div>

      {/* NEW REQUEST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#002D62]/70 backdrop-blur-xl animate-in fade-in">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 relative z-10">
              <h3 className="text-xl font-black text-[#002D62] mb-6 flex items-center gap-2">
                 <FileText className="text-amber-500" /> สร้างคำขอใช้รถใหม่
              </h3>
              <form onSubmit={handleCreateRequest} className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ภารกิจ</label>
                    <input required type="text" value={newReq.mission} onChange={e => setNewReq({...newReq, mission: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold text-black outline-none border border-transparent focus:border-amber-400 placeholder:text-slate-400" placeholder="ระบุภารกิจ" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">หน่วยงาน</label>
                    <input required type="text" value={newReq.department} onChange={e => setNewReq({...newReq, department: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold text-black outline-none placeholder:text-slate-400" placeholder="สังกัด" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ปลายทาง</label>
                    <input required type="text" value={newReq.destination} onChange={e => setNewReq({...newReq, destination: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold text-black outline-none placeholder:text-slate-400" placeholder="สถานที่ไปปฏิบัติราชการ" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <CalendarDays size={12} className="text-amber-500"/> เริ่มเดินทาง
                       </label>
                       <input 
                         required 
                         type="datetime-local" 
                         value={newReq.startTime} 
                         onChange={e => setNewReq({...newReq, startTime: e.target.value})} 
                         className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold text-black outline-none cursor-pointer hover:bg-slate-100 transition-colors" 
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <CalendarDays size={12} className="text-amber-500"/> สิ้นสุด
                       </label>
                       <input 
                         required 
                         type="datetime-local" 
                         value={newReq.endTime} 
                         onChange={e => setNewReq({...newReq, endTime: e.target.value})} 
                         className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold text-black outline-none cursor-pointer hover:bg-slate-100 transition-colors" 
                       />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">จำนวนผู้โดยสาร</label>
                    <input required type="number" min="1" value={newReq.passengers} onChange={e => setNewReq({...newReq, passengers: parseInt(e.target.value) || 0})} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold text-black outline-none" />
                 </div>
                 
                 <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-sm">ยกเลิก</button>
                    <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-[#002D62] text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 disabled:bg-slate-300">
                        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                        ยืนยันคำขอ
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};

export default RequestManager;
