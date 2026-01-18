
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Bot, X, Send, Sparkles, FileText, ShieldCheck, 
  PieChart, AlertTriangle, Zap, ChevronDown, Eraser,
  BrainCircuit, CheckCircle2, Loader2, Database, Gavel,
  Siren, Search, Briefcase
} from 'lucide-react';
import { Trip, VehicleProfile, CostConfig } from '../types';
import { lifecycleService } from '../services/lifecycleService';
import { requestService } from '../services/apiService';
import { auditService } from '../services/auditService';
import { geofenceService } from '../services/geofenceService';
import { privacyService } from '../services/privacyService';
import { trackingService } from '../services/trackingService';
import { safetyService } from '../services/safetyService';
import { scoringService } from '../services/scoringService';
import { opsMonitoringService } from '../services/opsMonitoringService';

interface Props {
  contextData: {
    trips: Trip[];
    vehicles: VehicleProfile[];
    config: CostConfig;
    userRole?: string;
  };
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

// ----------------------------------------------------------------------
// FOCI FRAUD HUNTER LOGIC (Rule Catalog & Scoring)
// ----------------------------------------------------------------------
const FRAUD_RULES = `
[RULE CATALOG - 20 ANOMALY PATTERNS]
1. F01-MPG_Dev: Fuel efficiency < 20% of standard. (Severity: High)
2. F02-Tank_Overflow: Refill amount > tank capacity. (Severity: Critical)
3. F03-Freq_Refill: Refill > 2 times/day or < 100km interval. (Severity: Medium)
4. F04-Loc_Mismatch: Fuel receipt location != GPS location (>5km). (Severity: Critical)
5. F05-Ghost_Fill: Receipt exists but GPS shows no stop/movement. (Severity: High)
6. F06-Holiday_Refill: Refill on weekend/holiday without mission. (Severity: Medium)
7. U01-Route_Dev: Deviation > 5km or 10% from planned route. (Severity: Medium)
8. U02-Ghost_Trip: Vehicle moving > 10km/h without approved request. (Severity: High)
9. U03-Geofence: Entering Red Zone or leaving Allowed Zone. (Severity: Critical)
10. U04-Mileage_Jump: Odometer gap between consecutive logs. (Severity: High)
11. T01-Curfew: Driving during restricted hours (e.g. 22:00-05:00). (Severity: Medium)
12. T02-Idle_Abuse: Idling (Speed 0, Engine On) > 45 mins. (Severity: Low)
13. T03-Trip_Overlap: Same driver driving 2 cars simultaneously. (Severity: Critical)
14. T04-Imp_Speed: Avg speed > 160km/h or unrealistic travel time. (Severity: High)
15. M01-Ghost_Parts: Same part replaced twice in 3 months. (Severity: High)
16. M02-Cost_Ratio: Repair cost > 40% of vehicle value. (Severity: Medium)
17. M03-Premature_PM: Maintenance done > 2000km early. (Severity: Low)
18. D01-GPS_Blackout: GPS signal lost > 30 mins during trip. (Severity: High)
19. D02-Retro_Edit: Critical data edited > 24hrs after event. (Severity: Medium)
20. D03-Phantom_Pax: Allowance claimed for pax but sensor load low. (Severity: Medium)

[RISK SCORING FORMULA]
Base Score = 0.
Add points per violation: Critical=+40, High=+20, Medium=+10, Low=+5.
Score 0-20: Normal (Green).
Score 21-50: Warning (Yellow).
Score 51-75: Investigation Required (Orange).
Score 76-100: Critical Fraud Alert (Red).
`;

const FOCI_SYSTEM_PROMPT = `
คุณคือ “FleetOps Compliance Intelligence (FOCI)”
บทบาท: World-Class GovTech Product Team (PM + UX + Full-Stack + Data/AI + Security)

ภารกิจ: วิเคราะห์ข้อมูลยานพาหนะภาครัฐทุกมิติ (360° View) เพื่อสร้างความโปร่งใสและประสิทธิภาพสูงสุด โดยปฏิบัติตามพฤติกรรมหลัก 4 ข้ออย่างเคร่งครัด:

---
PROTOCOL 1: INITIALIZATION (เริ่มบทสนทนา)
หากผู้ใช้ยังไม่ระบุบริบท ให้เริ่มด้วยการถาม 3 ข้อนี้เท่านั้น:
1. ระดับการวิเคราะห์ที่ต้องการ (Executive / Auditor / Operational)
2. แหล่งข้อมูลที่มี (Sheet / CSV / Tracking System / เอกสารจริง)
3. ช่วงเวลาที่ต้องการตรวจสอบ (เดือนนี้ / ไตรมาส / ปีงบประมาณ)

PROTOCOL 2: DATA INTAKE & ACTION (รับข้อมูลและทำทันที)
- สร้าง "Data Intake Checklist" (ใช้รูปแบบ [ ] Item) เพื่อให้ผู้ใช้ตรวจสอบว่ามีข้อมูลครบหรือไม่
- ห้ามหยุดรอ! ให้เริ่มวิเคราะห์จากข้อมูล Context (JSON) ที่ระบบส่งให้ทันที โดยไม่ต้องรอไฟล์จากผู้ใช้
- ข้อมูลที่ระบบส่งให้ครอบคลุม: Trips, Fuel, Maintenance, Request, Tracking (GPS Real-time), Safety (SOS), Driver Behavior, Geofence, Audit Log, Ops Monitoring

PROTOCOL 3: MANDATORY FOOTER (ส่วนปิดท้ายบังคับ)
ทุกคำตอบ ต้องจบด้วยส่วนนี้เสมอ ห้ามขาด:
---
**Next Actions:**
1. [Action ที่เป็นรูปธรรม 1]
2. [Action ที่เป็นรูปธรรม 2]
3. [Action ที่เป็นรูปธรรม 3]

**To Confirm:**
- [สิ่งที่ต้องให้ผู้ใช้ยืนยัน หรือข้อมูลที่ขาด ถ้าไม่มีให้ระบุว่า -None-]

PROTOCOL 4: HIGH RISK INCIDENT (กรณีความเสี่ยงสูง)
หากพบความเสี่ยงสูง (Risk Score > 75) หรือ Anomaly ร้ายแรง ให้ใช้รูปแบบรายงานแบบ "Incident-style" ดังนี้:

## 🚨 INCIDENT REPORT: [ชื่อเหตุการณ์]
**What Happened:** อธิบายสิ่งที่เกิดขึ้นสั้นๆ กระชับ
**Impact:** ผลกระทบ (มูลค่าความเสียหาย / ความปลอดภัย / ชื่อเสียงองค์กร)
**Evidence:** หลักฐาน (Log ID, Timestamp, Location, กฎที่ละเมิด)
**Immediate Actions:** สิ่งที่ต้องทำทันที (ระงับรถ / ตั้งกรรมการสอบ / แจ้งเตือน)

---
ข้อมูลอ้างอิง (Context Data):
ใช้ข้อมูล JSON ที่แนบมานี้ในการวิเคราะห์เท่านั้น ห้ามสร้างข้อมูลเท็จ
${FRAUD_RULES}
`;

const AIBot: React.FC<Props> = ({ contextData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'สวัสดีครับ ผมคือ FOCI (FleetOps Compliance Intelligence)\n\nผมเชื่อมต่อกับระบบฐานข้อมูลครบทุกส่วนแล้ว (Trips, Tracking, Safety, Behavior, Ops, Audit)\n\nเพื่อให้การวิเคราะห์แม่นยำและตรงจุด ขอทราบข้อมูลเบื้องต้น 3 ข้อครับ:\n\n1. 📊 **ระดับการวิเคราะห์** (เช่น ผู้บริหาร / ผู้ตรวจ / ปฏิบัติการ)\n2. 💾 **แหล่งข้อมูลที่มี** (เช่น Excel, GPS Tracking, เอกสาร)\n3. 📅 **ช่วงเวลาที่ต้องการ** (เช่น เดือนนี้, ไตรมาส 2, ปีงบประมาณ)',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    // Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Gather Deep Context Data (From ALL Services)
      // We pull real-time snapshots from every module in the app
      const [
        requests, 
        activeGeofences,
        activeAlerts,
        activeIncidents,
        driverScores,
        opsStats,
        opsAlerts,
        trackingSnapshot
      ] = await Promise.all([
        requestService.getAll(),
        Promise.resolve(geofenceService.getGeofences()),
        Promise.resolve(geofenceService.getAlerts()),
        Promise.resolve(safetyService.getActiveIncidents()),
        Promise.resolve(scoringService.getAllDriverScores()),
        Promise.resolve(opsMonitoringService.getStats()),
        Promise.resolve(opsMonitoringService.getAlerts()),
        Promise.resolve(trackingService.getSessionSnapshot())
      ]);

      const audits = auditService.getAll().slice(0, 50); // Last 50 actions
      const retentionPolicy = privacyService.getRetentionPolicy();

      // Aggregate Fleet Data (Fuel & Maintenance) with deeper history
      const fleetDetails = contextData.vehicles.map(v => ({
        profile: {
           id: v.id,
           plate: v.plateNumber,
           type: v.type,
           status: v.status,
           odometer: v.currentOdometer,
           age_data: v.acquisitionDate,
           standard_consumption: v.consumptionRate,
           tank_capacity: 70 // Mock capacity for rule check
        },
        fuel_logs: lifecycleService.getFuelLogs(v.id).slice(0, 20),
        maintenance_tickets: lifecycleService.getTickets(v.id).slice(0, 20)
      }));

      // 2. Prepare Omni-Channel Data Snapshot
      const dataSnapshot = JSON.stringify({
        meta: {
          org_context: `BPP Fleet Management`,
          mode: 'FULL_SYSTEM_ANALYSIS',
          timestamp: new Date().toISOString()
        },
        // Module 1: Trips & Planning
        A_Trips_History: contextData.trips.slice(0, 30).map(t => ({
           id: t.id,
           mission: t.missionName,
           driver: t.driverName,
           dist_km: t.distanceKm,
           fuel_cost: t.fuelCost,
           status: t.status,
           privacy: t.privacyLevel
        })),
        // Module 2: Fleet Master
        B_Fleet_Lifecycle: {
           vehicles: fleetDetails.map(f => f.profile),
           recent_fuel: fleetDetails.map(f => ({ plate: f.profile.plate, logs: f.fuel_logs })),
           recent_maint: fleetDetails.map(f => ({ plate: f.profile.plate, tickets: f.maintenance_tickets }))
        },
        // Module 3: Request & Approval
        C_Workflow: {
           pending_approvals: requests.filter(r => r.status === 'SUBMITTED').length,
           recent_requests: requests.slice(0, 10),
        },
        // Module 4: Real-time Tracking & Ops
        D_Live_Operations: {
           active_vehicles: trackingSnapshot.length,
           vehicles_moving: trackingSnapshot.filter(s => s.currentLocation.speed > 0).length,
           live_sessions: trackingSnapshot.map(s => ({
              vid: s.vehicleId,
              driver: s.driverName,
              speed: s.currentLocation.speed,
              status: s.status,
              battery: s.batteryLevel,
              last_update: s.lastUpdate
           })),
           system_health: opsStats,
           system_alerts: opsAlerts
        },
        // Module 5: Safety & Security
        E_Safety_Security: {
           active_incidents: activeIncidents.filter(i => i.status !== 'RESOLVED'),
           security_alerts: activeAlerts.slice(0, 20),
           geofences: activeGeofences.filter(g => g.active).map(g => g.name)
        },
        // Module 6: Behavior Scoring
        F_Driver_Behavior: {
           scores: driverScores.map(d => ({ name: d.driverName, score: d.score, grade: d.grade, violations: d.events }))
        },
        // Module 7: Governance
        G_Governance: {
           recent_audit_trails: audits.map(a => `[${a.timestamp}] ${a.action} by ${a.actor.name}: ${a.details}`),
           privacy_policy: retentionPolicy
        },
        // Module 8: Settings
        H_Config: contextData.config
      }, null, 2);

      // 3. Init Gemini
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // 4. Construct Full Prompt
      const fullPrompt = `
      FULL SYSTEM CONTEXT (JSON):
      ${dataSnapshot}

      USER COMMAND:
      ${textToSend}
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: fullPrompt,
        config: {
          systemInstruction: FOCI_SYSTEM_PROMPT
        }
      });
      
      const responseText = result.text || 'ไม่สามารถประมวลผลข้อมูลได้';

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error("AI Error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: 'เกิดข้อผิดพลาดในการประมวลผล (Processing Error) กรุณาลองใหม่อีกครั้ง',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    { label: "วิเคราะห์ผู้บริหาร (Executive)", icon: PieChart, prompt: "1. ผู้บริหาร\n2. Tracking System\n3. ไตรมาสนี้\n\nช่วยวิเคราะห์ภาพรวม KPI และความคุ้มค่าของการใช้งบประมาณให้หน่อย" },
    { label: "ตรวจสอบทุจริต (Auditor)", icon: Siren, prompt: "1. ผู้ตรวจ\n2. GPS & Fuel Logs\n3. เดือนนี้\n\nช่วยสแกนหาทุจริต (Fraud) ตามกฎ 20 ข้อ และสรุปเคสเสี่ยงสูงให้ด้วย" },
    { label: "ติดตามงาน (Operational)", icon: FileText, prompt: "1. ปฏิบัติการ\n2. Tracking\n3. วันนี้\n\nติดตามสถานะรถปัจจุบัน และแจ้งเตือนรถที่ออกนอกเส้นทาง" },
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[9999] p-4 rounded-full shadow-2xl transition-all duration-500 flex items-center justify-center group ${
          isOpen ? 'bg-slate-800 rotate-90' : 'bg-gradient-to-r from-[#002D62] to-[#004e92] hover:scale-110 border-2 border-amber-400'
        }`}
      >
        {isOpen ? <X className="text-white" /> : <Bot className="text-white w-8 h-8" />}
        {!isOpen && (
          <span className="absolute right-full mr-4 bg-white px-4 py-2 rounded-xl text-xs font-black text-[#002D62] shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100 flex items-center gap-2">
            <BrainCircuit size={16} className="text-amber-500" />
            FOCI Intelligence
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[95vw] md:w-[800px] h-[85vh] md:h-[850px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 z-[9998] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 font-['Sarabun']">
          
          {/* Header */}
          <div className="bg-[#002D62] p-6 flex items-center justify-between shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Briefcase size={100} className="text-white" />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/20">
                <Sparkles className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-white font-black text-xl leading-tight">FOCI Strategy</h3>
                <p className="text-amber-400/80 text-[10px] uppercase tracking-widest font-bold">Executive Decision Support</p>
              </div>
            </div>
            <button onClick={() => setMessages([messages[0]])} className="text-slate-400 hover:text-white transition-colors relative z-10 bg-white/10 p-2 rounded-xl" title="Clear Chat">
              <Eraser size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[95%] p-6 rounded-3xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-[#002D62] text-white rounded-br-none'
                      : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none prose prose-sm max-w-none'
                  }`}
                >
                  {msg.role === 'model' ? (
                    <div className="whitespace-pre-wrap font-medium">
                      {msg.text.split('\n').map((line, i) => {
                        const trimmed = line.trim();
                        // Formatting for Report Sections
                        const isHeader = 
                           trimmed.startsWith('ส่วนที่') || 
                           trimmed.startsWith('INCIDENT REPORT') ||
                           trimmed.startsWith('Data Intake') ||
                           trimmed.startsWith('Next Actions') ||
                           trimmed.startsWith('To Confirm');
                        
                        const isIncident = line.includes('INCIDENT REPORT') || line.includes('🚨');

                        if (isHeader) {
                          let colorClass = 'text-[#002D62] border-slate-100';
                          let bgClass = 'bg-amber-500';
                          
                          if (isIncident) {
                             colorClass = 'text-red-700 border-red-100';
                             bgClass = 'bg-red-500';
                          } else if (line.includes('Next Actions')) {
                             colorClass = 'text-emerald-700 border-emerald-100';
                             bgClass = 'bg-emerald-500';
                          }

                          return (
                            <div key={i} className={`flex items-center gap-2 font-black mt-6 mb-3 pb-2 text-base border-b-2 ${colorClass}`}>
                               <div className={`w-2 h-6 rounded-full ${bgClass} mr-2`} />
                               {line}
                            </div>
                          );
                        }
                        
                        // Bold key metrics and Resolutions
                        let processedLine = line
                          .replace(/(\d{1,3}(,\d{3})*(\.\d+)?)(\s?)(บาท|KM|Liters|%|คน|รายการ)/gi, '<b>$1$2$3</b>')
                          .replace(/(Critical|High Risk|Fraud|ทุจริต|ความเสี่ยงสูง)/gi, '<span class="text-red-600 font-black bg-red-50 px-1 rounded">$1</span>')
                          .replace(/(\[ \])|(\[x\])/gi, '<span class="font-mono text-slate-400 mr-1">$1</span>');
                        
                        return <div key={i} className="mb-1.5" dangerouslySetInnerHTML={{__html: processedLine}} />;
                      })}
                    </div>
                  ) : (
                    msg.text
                  )}
                  <div className={`text-[9px] mt-2 font-bold opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-5 rounded-3xl rounded-bl-none shadow-sm border border-slate-100 flex flex-col gap-2 animate-pulse">
                  <div className="flex items-center gap-2">
                     <Loader2 className="animate-spin text-amber-500" size={16} />
                     <span className="text-xs text-slate-500 font-bold">FOCI กำลังวิเคราะห์ข้อมูล (AI Processing)...</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-6">
                     <span className="text-[9px] px-2 py-0.5 bg-indigo-50 text-indigo-400 rounded border border-indigo-100">Checking Protocol</span>
                     <span className="text-[9px] px-2 py-0.5 bg-indigo-50 text-indigo-400 rounded border border-indigo-100">Scanning Risks</span>
                     <span className="text-[9px] px-2 py-0.5 bg-indigo-50 text-indigo-400 rounded border border-indigo-100">Formulating Actions</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions (Suggestions) */}
          {messages.length < 3 && (
            <div className="p-4 bg-white border-t border-slate-100 flex gap-3 overflow-x-auto custom-scrollbar">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s.prompt)}
                  className="flex items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-2xl transition-all shrink-0 group min-w-[240px]"
                >
                  <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400 group-hover:text-indigo-600 transition-colors">
                     <s.icon size={16} />
                  </div>
                  <div className="text-left">
                     <span className="block text-xs font-black text-slate-700 group-hover:text-indigo-800">{s.label}</span>
                     <span className="text-[9px] text-slate-400">คลิกเพื่อดำเนินการ</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-5 bg-white border-t border-slate-100">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="ตอบคำถาม 3 ข้อ หรือสั่งการวิเคราะห์..."
                className="w-full pl-5 pr-14 py-4 bg-slate-50 border-2 border-transparent focus:border-amber-400 rounded-2xl outline-none text-sm font-bold text-slate-700 placeholder:text-slate-400 shadow-inner transition-all"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2.5 bg-[#002D62] text-white rounded-xl hover:bg-indigo-900 disabled:opacity-50 disabled:hover:bg-[#002D62] transition-all shadow-lg active:scale-95"
              >
                {isLoading ? <Zap size={20} className="animate-pulse text-amber-400" /> : <Send size={20} />}
              </button>
            </div>
            <div className="flex justify-between items-center mt-3 px-1">
               <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest flex items-center gap-1">
                 <ShieldCheck size={10} /> Official Government Standard
               </p>
               <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">
                 Powered by Gemini 3
               </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIBot;
