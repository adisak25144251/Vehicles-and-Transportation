import React, { useState } from 'react';
import { 
  BookOpen, ChevronRight, AlertCircle, CheckCircle2, 
  Shield, FileText, Search, Printer, Menu, X, Info,
  Zap, Lock, HelpCircle, Layers, Database, User,
  CornerDownRight, AlertTriangle, ClipboardCheck,
  PhoneCall, LifeBuoy, FileInput, Activity, PenTool, ShieldAlert
} from 'lucide-react';

const UserManual: React.FC = () => {
  const [activeSection, setActiveSection] = useState('front-matter');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // System Metadata Placeholders
  const META = {
    SYS_NAME: 'BPP Fleet Intelligence',
    VERSION: '2.4.0 (Enterprise)',
    DATE: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
    ORG: 'กองบัญชาการตำรวจตระเวนชายแดน (BPP)',
    CLASS: 'UNCLASSIFIED / INTERNAL USE ONLY'
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
    const el = document.getElementById('manual-content');
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const chapters = [
    { id: 'front-matter', title: 'ส่วนหน้า: ข้อมูลเอกสาร (Front Matter)' },
    { id: 'ch1', title: 'บทที่ 1: ภาพรวมระบบ (System Overview)' },
    { id: 'ch2', title: 'บทที่ 2: การเริ่มต้นใช้งาน (Getting Started)' },
    { id: 'ch3', title: 'บทที่ 3: ทะเบียนยานพาหนะ (Vehicle Master)' },
    { id: 'ch4', title: 'บทที่ 4: ข้อมูลบุคลากรพลขับ (Driver)' },
    { id: 'ch5', title: 'บทที่ 5: การขอใช้รถและอนุมัติ (Workflow)' },
    { id: 'ch6', title: 'บทที่ 6: การติดตามและ QR (Tracking)' },
    { id: 'ch7', title: 'บทที่ 7: บันทึกการเดินทาง (Trip History)' },
    { id: 'ch8', title: 'บทที่ 8: น้ำมันเชื้อเพลิงและต้นทุน (Fuel)' },
    { id: 'ch9', title: 'บทที่ 9: การซ่อมบำรุง (Maintenance)' },
    { id: 'ch10', title: 'บทที่ 10: การจำหน่าย/โอน (Disposal)' },
    { id: 'ch11', title: 'บทที่ 11: เอกสารและรายงาน (Reports)' },
    { id: 'ch12', title: 'บทที่ 12: ความปลอดภัยและตรวจสอบ (Audit)' },
    { id: 'ch13', title: 'บทที่ 13: Troubleshooting & FAQ' },
    { id: 'appendix', title: 'ภาคผนวก (Appendix)' }
  ];

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden font-['Sarabun'] animate-in fade-in duration-500 relative">
      
      {/* Mobile Toggle */}
      <button 
        className="lg:hidden absolute top-4 right-4 z-50 p-2 bg-slate-100 rounded-full text-slate-600 shadow-md"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar TOC */}
      <div className={`
        absolute lg:static inset-y-0 left-0 z-40 w-80 bg-slate-50 border-r border-slate-100 flex flex-col transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#002D62] text-white rounded-lg">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="font-black text-[#002D62] text-sm">คู่มือการใช้งานระบบ</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{META.VERSION}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {chapters.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeSection === section.id ? 'bg-[#002D62] text-white shadow-lg' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
            >
              <span className="truncate">{section.title}</span>
              {activeSection === section.id && <ChevronRight size={14} className="text-amber-400 shrink-0" />}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-slate-100 bg-white">
           <button className="w-full py-3 flex items-center justify-center gap-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all" onClick={() => window.print()}>
              <Printer size={16} /> พิมพ์คู่มือ (Print PDF)
           </button>
        </div>
      </div>

      {/* Content Area */}
      <div id="manual-content" className="flex-1 overflow-y-auto p-8 md:p-16 custom-scrollbar bg-white relative scroll-smooth">
        
        {/* FRONT MATTER */}
        {activeSection === 'front-matter' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="min-h-[60vh] flex flex-col justify-center text-center border-b border-slate-100 pb-10 mb-10">
                <div className="w-24 h-24 bg-slate-100 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-inner">
                   <Shield size={48} className="text-[#002D62]" />
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-[#002D62] mb-4 tracking-tight leading-tight">
                   คู่มือปฏิบัติงานระบบบริหารจัดการ<br/>ยานพาหนะและขนส่ง (Standard Operation Procedure)
                </h1>
                <p className="text-lg text-slate-500 font-medium mb-8">{META.SYS_NAME}</p>
                <div className="inline-flex gap-4 mx-auto text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-6 py-2 rounded-full border border-slate-100">
                   <span>{META.ORG}</span>
                   <span>•</span>
                   <span>{META.CLASS}</span>
                   <span>•</span>
                   <span>{META.DATE}</span>
                </div>
             </div>

             <div className="max-w-4xl mx-auto space-y-12">
                <div>
                   <h3 className="text-xl font-black text-slate-800 mb-4 border-b pb-2">ขอบเขตเอกสาร (Scope)</h3>
                   <p className="text-slate-600 leading-relaxed text-sm">
                      เอกสารฉบับนี้ครอบคลุมกระบวนการใช้งานระบบตั้งแต่การลงทะเบียนยานพาหนะ, การขอใช้รถ, การอนุมัติ, การติดตามตำแหน่ง (Tracking), 
                      การซ่อมบำรุง, และการตรวจสอบข้อมูลย้อนหลัง (Audit) สำหรับบุคลากรทุกระดับในหน่วยงาน
                   </p>
                </div>

                <div>
                   <h3 className="text-xl font-black text-slate-800 mb-4 border-b pb-2">นิยามศัพท์ (Glossary)</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                         <strong className="text-[#002D62]">Trip Token</strong>
                         <p className="text-slate-500 mt-1">รหัสอ้างอิงใบงานรูปแบบ QR Code สำหรับให้พลขับสแกนเพื่อเริ่มภารกิจ</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                         <strong className="text-[#002D62]">Geofence</strong>
                         <p className="text-slate-500 mt-1">พื้นที่เสมือนที่กำหนดไว้เพื่อแจ้งเตือนเมื่อรถเข้าหรือออกนอกพื้นที่</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                         <strong className="text-[#002D62]">Telemetry</strong>
                         <p className="text-slate-500 mt-1">ข้อมูลพิกัด ความเร็ว และสถานะเซ็นเซอร์ที่ส่งจากรถแบบ Real-time</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                         <strong className="text-[#002D62]">Immutable Audit</strong>
                         <p className="text-slate-500 mt-1">บันทึกประวัติการใช้งานที่ไม่สามารถลบหรือแก้ไขได้ (เพื่อความโปร่งใส)</p>
                      </div>
                   </div>
                </div>

                <div>
                   <h3 className="text-xl font-black text-slate-800 mb-4 border-b pb-2">บทบาทผู้ใช้งาน (User Roles)</h3>
                   <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                       <thead className="bg-slate-100 text-slate-600 font-bold">
                         <tr><th className="p-3 rounded-l-lg">Role</th><th className="p-3">หน้าที่หลัก</th><th className="p-3 rounded-r-lg">การเข้าถึง</th></tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                         <tr><td className="p-3 font-bold">OFFICER</td><td className="p-3">ผู้ขอใช้รถ</td><td className="p-3">สร้างคำขอ, ดูสถานะตนเอง</td></tr>
                         <tr><td className="p-3 font-bold">MANAGER</td><td className="p-3">ผู้อนุมัติ</td><td className="p-3">อนุมัติ/ปฏิเสธ, ดูรายงานภาพรวม</td></tr>
                         <tr><td className="p-3 font-bold">DISPATCHER</td><td className="p-3">ศูนย์สั่งการ</td><td className="p-3">จัดรถ/คนขับ, ติดตามรถ, ออก QR</td></tr>
                         <tr><td className="p-3 font-bold">DRIVER</td><td className="p-3">พลขับ</td><td className="p-3">รับงาน, บันทึกการเดินทาง (Mobile)</td></tr>
                         <tr><td className="p-3 font-bold">ADMIN</td><td className="p-3">ผู้ดูแลระบบ</td><td className="p-3">จัดการ Users, Config, Audit Log</td></tr>
                       </tbody>
                     </table>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* CHAPTER 1 */}
        {activeSection === 'ch1' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Chapter 01</span>
                <h2 className="text-3xl font-black text-[#002D62]">ภาพรวมระบบและหลักการทำงาน</h2>
             </div>
             <p className="text-slate-700 leading-relaxed">
               ระบบถูกออกแบบมาเพื่อลดขั้นตอนการทำงานเอกสาร (Paperless) และเพิ่มประสิทธิภาพการบริหารจัดการยานพาหนะผ่านเทคโนโลยี Cloud และ AI โดยมีกระบวนการทำงานหลัก 4 ขั้นตอน ดังนี้:
             </p>
             
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['1. Request', '2. Approve', '3. Dispatch', '4. Track & Audit'].map((step, i) => (
                   <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <div className="w-10 h-10 bg-[#002D62] text-white rounded-full flex items-center justify-center mx-auto mb-3 font-black text-sm">{i+1}</div>
                      <h4 className="font-bold text-slate-800">{step.split('. ')[1]}</h4>
                   </div>
                ))}
             </div>

             <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex gap-4">
                <Info className="text-blue-600 shrink-0" />
                <div className="text-sm text-blue-900">
                   <strong>Hybrid Operation Capability:</strong> ระบบรองรับการทำงานแบบ Offline-First กรณีที่สัญญาณอินเทอร์เน็ตขัดข้อง ข้อมูลจะถูกเก็บในเครื่อง (Local Queue) และส่งขึ้น Server ทันทีเมื่อกลับมาออนไลน์
                </div>
             </div>
          </div>
        )}

        {/* CHAPTER 2 */}
        {activeSection === 'ch2' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Chapter 02</span>
                <h2 className="text-3xl font-black text-[#002D62]">การเริ่มต้นใช้งาน (Getting Started)</h2>
             </div>

             <div className="space-y-6">
                <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2"><CornerDownRight className="text-amber-500"/> 2.1 การเข้าสู่ระบบ</h4>
                <ol className="list-decimal list-inside space-y-3 text-slate-600 text-sm ml-4">
                   <li>เข้าสู่เว็บไซต์ผ่าน URL ของหน่วยงาน (แนะนำให้ใช้ Chrome หรือ Edge)</li>
                   <li>ระบุ <strong>Username</strong> และ <strong>Password</strong> ที่ได้รับจากผู้ดูแลระบบ</li>
                   <li>กดปุ่ม <strong>"เข้าสู่ระบบงาน"</strong></li>
                   <li>หากเป็นการใช้งานครั้งแรก ระบบอาจขออนุญาตเข้าถึงพิกัด (Allow Location) ให้กด <strong>Allow</strong> เพื่อให้แผนที่ทำงานสมบูรณ์</li>
                </ol>
                <div className="bg-slate-100 h-40 rounded-xl flex items-center justify-center text-slate-400 border-2 border-dashed text-sm">
                   [รูปที่ 2.1: หน้าจอ Login Page]
                </div>

                <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2 mt-8"><CornerDownRight className="text-amber-500"/> 2.2 หน้าจอหลัก (Dashboard)</h4>
                <p className="text-sm text-slate-600">เมื่อเข้าสู่ระบบสำเร็จ จะพบหน้า Dashboard แสดงภาพรวม:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm ml-4">
                   <li><strong>Summary Cards:</strong> สรุปงบประมาณ, ระยะทางรวม, จำนวนรถพร้อมใช้</li>
                   <li><strong>Mission Chart:</strong> กราฟแสดงสถิติการเดินทางรายสัปดาห์</li>
                   <li><strong>AI Insights:</strong> ข้อเสนอแนะอัจฉริยะเพื่อลดต้นทุน</li>
                </ul>
             </div>
          </div>
        )}

        {/* CHAPTER 3 */}
        {activeSection === 'ch3' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Chapter 03</span>
                <h2 className="text-3xl font-black text-[#002D62]">โมดูลทะเบียนยานพาหนะ (Vehicle Master)</h2>
             </div>
             
             <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-900 mb-6">
                <strong>สิทธิ์การใช้งาน:</strong> ADMIN, DISPATCHER
             </div>

             <div className="space-y-6">
                <h4 className="font-bold text-slate-800">ขั้นตอนการเพิ่มรถใหม่</h4>
                <div className="space-y-4 text-sm text-slate-600">
                   <div className="flex gap-4">
                      <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 shrink-0">1</div>
                      <p>ไปที่เมนู <strong>"จัดการยานพาหนะ" (Fleet Manager)</strong></p>
                   </div>
                   <div className="flex gap-4">
                      <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 shrink-0">2</div>
                      <p>กดปุ่ม <strong>"เพิ่มรถยนต์" (New Vehicle)</strong> มุมขวาบน</p>
                   </div>
                   <div className="flex gap-4">
                      <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 shrink-0">3</div>
                      <div>
                         <p>กรอกข้อมูลให้ครบถ้วน โดยเฉพาะ:</p>
                         <ul className="list-disc list-inside mt-2 ml-2 text-slate-500">
                            <li><strong>ทะเบียน:</strong> (เช่น 1กข 1234) ใช้เป็น Key หลัก</li>
                            <li><strong>อัตราสิ้นเปลือง (km/L):</strong> สำคัญมาก ใช้คำนวณงบประมาณ</li>
                            <li><strong>เลขไมล์ปัจจุบัน:</strong> ใช้คำนวณรอบซ่อมบำรุง (PM)</li>
                         </ul>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 shrink-0">4</div>
                      <p>กด <strong>"ยืนยัน"</strong> เพื่อบันทึกข้อมูล</p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* CHAPTER 5: WORKFLOW */}
        {activeSection === 'ch5' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Chapter 05</span>
                <h2 className="text-3xl font-black text-[#002D62]">โมดูลการขอใช้รถและอนุมัติ (Workflow)</h2>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Request */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                   <h4 className="font-bold text-[#002D62] mb-4 flex items-center gap-2">1. ผู้ขอ (Requester)</h4>
                   <ul className="space-y-3 text-sm text-slate-600">
                      <li>• เข้าเมนู <strong>"อนุมัติการใช้รถ"</strong> &gt; <strong>"สร้างคำขอใหม่"</strong></li>
                      <li>• ระบุ: ภารกิจ, ปลายทาง (Search แผนที่), เวลา, จำนวนคน</li>
                      <li>• กด <strong>"ยืนยัน"</strong> (สถานะ: SUBMITTED)</li>
                   </ul>
                </div>

                {/* 2. Approve */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                   <h4 className="font-bold text-[#002D62] mb-4 flex items-center gap-2">2. ผู้อนุมัติ (Manager)</h4>
                   <ul className="space-y-3 text-sm text-slate-600">
                      <li>• เข้าเมนู <strong>"อนุมัติการใช้รถ"</strong> &gt; แท็บ <strong>"อนุมัติงาน"</strong></li>
                      <li>• ตรวจสอบรายละเอียด หากถูกต้องกด <strong>"อนุมัติ"</strong></li>
                      <li>• หากไม่อนุมัติ ต้องระบุเหตุผล (สถานะ: REJECTED)</li>
                   </ul>
                </div>

                {/* 3. Dispatch */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                   <h4 className="font-bold text-[#002D62] mb-4 flex items-center gap-2">3. ศูนย์สั่งการ (Dispatcher)</h4>
                   <ul className="space-y-3 text-sm text-slate-600">
                      <li>• เข้าแท็บ <strong>"จัดรถ/ออก QR"</strong></li>
                      <li>• เลือกรายการที่ Approved</li>
                      <li>• Assign ยานพาหนะและพลขับ</li>
                      <li>• กด <strong>"ออก QR Code"</strong> เพื่อส่งให้พลขับ</li>
                   </ul>
                </div>
             </div>

             <div className="p-4 bg-slate-50 border-l-4 border-blue-500 rounded-r-xl mt-6">
                <h5 className="font-bold text-slate-800 text-sm mb-1">หมายเหตุ: Policy Control</h5>
                <p className="text-xs text-slate-500">
                   หากมีการขอใช้รถเกินเกณฑ์ที่ตั้งไว้ (เช่น ระยะทางเกิน 450 กม./วัน) ระบบจะแสดงธงแจ้งเตือน (Flag) ให้ผู้อนุมัติพิจารณาเป็นพิเศษ
                </p>
             </div>
          </div>
        )}

        {/* CHAPTER 6: TRACKING */}
        {activeSection === 'ch6' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Chapter 06</span>
                <h2 className="text-3xl font-black text-[#002D62]">การติดตามและ QR Code (Tracking)</h2>
             </div>

             <div className="space-y-6">
                <h4 className="text-lg font-bold text-slate-800">สำหรับพลขับ (Driver Mobile View)</h4>
                <div className="bg-slate-900 text-white p-6 rounded-2xl">
                   <ol className="space-y-4 text-sm">
                      <li className="flex gap-3 items-center">
                         <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-white shrink-0">1</div>
                         <span>เปิดกล้องมือถือสแกน <strong>Trip QR Code</strong> ที่ได้รับจากศูนย์สั่งการ</span>
                      </li>
                      <li className="flex gap-3 items-center">
                         <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-white shrink-0">2</div>
                         <span>หน้าจอมือถือจะเปลี่ยนเป็นโหมด <strong>"Driver App"</strong> อัตโนมัติ (ไม่ต้องลงแอป)</span>
                      </li>
                      <li className="flex gap-3 items-center">
                         <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-white shrink-0">3</div>
                         <span>กดปุ่ม <strong>"START TRIP"</strong> เมื่อเริ่มล้อหมุน ระบบจะเริ่มส่งพิกัด GPS</span>
                      </li>
                      <li className="flex gap-3 items-center">
                         <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center font-bold text-white shrink-0">4</div>
                         <span>เมื่อถึงปลายทาง กดปุ่ม <strong>"END TRIP"</strong> เพื่อจบงานและสรุประยะทาง</span>
                      </li>
                   </ol>
                </div>

                <h4 className="text-lg font-bold text-slate-800 mt-8">สำหรับศูนย์สั่งการ (Fleet Command)</h4>
                <p className="text-sm text-slate-600 mb-4">
                   เข้าเมนู <strong>"ติดตามยานพาหนะ"</strong> เพื่อดูตำแหน่ง Real-time ของรถทุกคันบนแผนที่ Hybrid
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                   <div className="p-4 border rounded-xl">
                      <strong className="text-emerald-500 flex items-center gap-1"><Zap size={16}/> ONLINE</strong>
                      <p className="text-slate-500">รถกำลังเคลื่อนที่และส่งสัญญาณปกติ</p>
                   </div>
                   <div className="p-4 border rounded-xl">
                      <strong className="text-slate-500 flex items-center gap-1"><Zap size={16}/> OFFLINE</strong>
                      <p className="text-slate-500">รถดับเครื่องหรืออยู่ในจุดอับสัญญาณ (ข้อมูลจะถูก Sync ทีหลัง)</p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* CHAPTER 12: AUDIT & SECURITY */}
        {activeSection === 'ch12' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Chapter 12</span>
                <h2 className="text-3xl font-black text-[#002D62]">ความปลอดภัยและตรวจสอบ (Audit)</h2>
             </div>

             <div className="space-y-6">
                <div>
                   <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><Database size={18} className="text-blue-500"/> Immutable Audit Trail</h4>
                   <p className="text-sm text-slate-600 leading-relaxed">
                      ระบบบันทึกทุกกิจกรรม (Log) ด้วยเทคโนโลยี <strong>Hash Chaining</strong> (คล้าย Blockchain) ทำให้ข้อมูลที่ถูกบันทึกแล้วไม่สามารถแก้ไขหรือลบย้อนหลังได้ เพื่อใช้เป็นหลักฐานทางราชการ
                   </p>
                   <div className="mt-4 p-4 bg-slate-50 font-mono text-xs text-slate-500 rounded-xl border border-slate-200">
                      Sample Log: [2024-03-22 10:00:00] | ACTOR: Admin | ACTION: APPROVE_REQ | HASH: 8a7f...c3b1
                   </div>
                </div>

                <div>
                   <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><Lock size={18} className="text-amber-500"/> Privacy Mode (PII Guard)</h4>
                   <p className="text-sm text-slate-600 leading-relaxed">
                      เจ้าหน้าที่สามารถเปิดโหมด <strong>PII Guard</strong> (รูปดวงตาบน Header) เพื่อซ่อนข้อมูลส่วนบุคคล เช่น ชื่อพลขับ หรือรายละเอียดสถานที่ เมื่อต้องแสดงหน้าจอในที่สาธารณะหรือ Capture หน้าจอรายงาน
                   </p>
                </div>
             </div>
          </div>
        )}

        {/* CHAPTER 13: TROUBLESHOOTING */}
        {activeSection === 'ch13' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Chapter 13</span>
                <h2 className="text-3xl font-black text-[#002D62]">การแก้ไขปัญหาเบื้องต้น (FAQ)</h2>
             </div>

             <div className="space-y-4">
                <details className="group bg-white border border-slate-200 rounded-xl overflow-hidden cursor-pointer">
                   <summary className="flex justify-between items-center p-4 bg-slate-50 font-bold text-slate-700">
                      Q: พิกัดรถไม่ Update หรือขึ้นสถานะ OFFLINE?
                      <ChevronRight className="transition-transform group-open:rotate-90 text-slate-400"/>
                   </summary>
                   <div className="p-4 text-sm text-slate-600 border-t border-slate-200 bg-white">
                      <p><strong>สาเหตุ:</strong> มือถือพลขับอาจอยู่ในจุดอับสัญญาณ หรือหน้าจอดับทำให้ GPS หยุดทำงาน</p>
                      <p className="mt-2"><strong>แก้ไข:</strong></p>
                      <ul className="list-disc list-inside ml-2 mt-1">
                         <li>ตรวจสอบว่าพลขับเปิดหน้าจอ Driver App ค้างไว้หรือไม่ (ระบบมี Wake Lock ช่วย)</li>
                         <li>หากเน็ตหลุด ข้อมูลจะถูกเก็บใน &quot;Offline Queue&quot; และส่งอัตโนมัติเมื่อต่อเน็ตได้</li>
                      </ul>
                   </div>
                </details>

                <details className="group bg-white border border-slate-200 rounded-xl overflow-hidden cursor-pointer">
                   <summary className="flex justify-between items-center p-4 bg-slate-50 font-bold text-slate-700">
                      Q: ไม่สามารถกดอนุมัติคำขอได้?
                      <ChevronRight className="transition-transform group-open:rotate-90 text-slate-400"/>
                   </summary>
                   <div className="p-4 text-sm text-slate-600 border-t border-slate-200 bg-white">
                      <p><strong>แก้ไข:</strong> ตรวจสอบสิทธิ์ (Role) ว่าท่านเป็น MANAGER หรือไม่ และตรวจสอบสถานะคำขอว่าถูกดำเนินการไปแล้วหรือไม่ (หากสถานะไม่ใช่ SUBMITTED จะกดไม่ได้)</p>
                   </div>
                </details>

                <details className="group bg-white border border-slate-200 rounded-xl overflow-hidden cursor-pointer">
                   <summary className="flex justify-between items-center p-4 bg-slate-50 font-bold text-slate-700">
                      Q: รายงาน Excel ภาษาต่างดาว?
                      <ChevronRight className="transition-transform group-open:rotate-90 text-slate-400"/>
                   </summary>
                   <div className="p-4 text-sm text-slate-600 border-t border-slate-200 bg-white">
                      <p><strong>แก้ไข:</strong> ไฟล์ CSV จากระบบใช้มาตรฐาน UTF-8 BOM หากเปิดใน Excel เก่าอาจเพี้ยน ให้ใช้การ Import Data &gt; From Text/CSV แทนการดับเบิ้ลคลิก</p>
                   </div>
                </details>
             </div>
          </div>
        )}

        {/* APPENDIX */}
        {activeSection === 'appendix' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
             
             {/* Appendix Header */}
             <div className="border-b border-slate-100 pb-6 mb-8 text-center bg-slate-50 rounded-[2rem] p-10">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Enterprise Resource</span>
                <h2 className="text-3xl font-black text-[#002D62] mb-4">ภาคผนวก (Appendix)</h2>
                <p className="text-slate-500 max-w-xl mx-auto">รวบรวมระเบียบปฏิบัติมาตรฐาน (SOP), แบบฟอร์มสำรองฉุกเฉิน, และข้อมูลการติดต่อเพื่อสนับสนุนการใช้งานระดับองค์กร</p>
             </div>

             {/* 1. SOPs */}
             <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 border-l-4 border-[#002D62] pl-4">
                   <ClipboardCheck className="text-amber-500" />
                   1. ระเบียบปฏิบัติมาตรฐาน (SOP: Standard Operating Procedures)
                </h3>
                
                <details className="group bg-white border border-slate-200 rounded-2xl overflow-hidden">
                   <summary className="flex justify-between items-center p-5 bg-slate-50/50 cursor-pointer hover:bg-slate-100 font-bold text-[#002D62]">
                      SOP-01: การบริหารจัดการทริปปกติ (Normal Trip Workflow)
                      <ChevronRight className="transition-transform group-open:rotate-90 text-slate-400"/>
                   </summary>
                   <div className="p-6 border-t border-slate-100 bg-white space-y-4 text-sm text-slate-600">
                      <ol className="relative border-l border-slate-200 ml-2 space-y-6">
                         <li className="ml-6">
                            <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full ring-4 ring-white font-bold text-blue-600 text-[10px]">1</span>
                            <h4 className="font-bold text-slate-800">ผู้ขอ (Request)</h4>
                            <p>สร้างคำขอผ่าน Web App ระบุภารกิจและสถานที่ หากระบบ Offline ให้ใช้ <span className="font-mono text-amber-600">Form-01</span></p>
                         </li>
                         <li className="ml-6">
                            <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full ring-4 ring-white font-bold text-blue-600 text-[10px]">2</span>
                            <h4 className="font-bold text-slate-800">อนุมัติ (Approve)</h4>
                            <p>หัวหน้างานตรวจสอบความเหมาะสมและงบประมาณ กด Approve เพื่อส่งต่อศูนย์สั่งการ</p>
                         </li>
                         <li className="ml-6">
                            <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full ring-4 ring-white font-bold text-blue-600 text-[10px]">3</span>
                            <h4 className="font-bold text-slate-800">สั่งการ (Dispatch)</h4>
                            <p>จนท.ศูนย์ฯ จับคู่รถและพลขับ กด &quot;ออก QR Code&quot; และส่งภาพ QR ให้พลขับทางไลน์</p>
                         </li>
                         <li className="ml-6">
                            <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 bg-emerald-100 rounded-full ring-4 ring-white font-bold text-emerald-600 text-[10px]">4</span>
                            <h4 className="font-bold text-slate-800">ปฏิบัติงาน (Operation)</h4>
                            <p>พลขับสแกน QR เพื่อเข้า Driver Mode -&gt; กด <strong>Start Trip</strong> -&gt; เมื่อจบภารกิจกด <strong>End Trip</strong></p>
                         </li>
                      </ol>
                   </div>
                </details>

                <details className="group bg-white border border-slate-200 rounded-2xl overflow-hidden">
                   <summary className="flex justify-between items-center p-5 bg-slate-50/50 cursor-pointer hover:bg-slate-100 font-bold text-red-600">
                      SOP-02: การแจ้งเหตุฉุกเฉิน (SOS / Incident Response)
                      <ChevronRight className="transition-transform group-open:rotate-90 text-slate-400"/>
                   </summary>
                   <div className="p-6 border-t border-slate-100 bg-white space-y-4 text-sm text-slate-600">
                      <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-4 flex gap-3">
                         <AlertTriangle className="text-red-500 shrink-0" />
                         <p className="text-red-800 font-bold">Priority: สูงสุด (Immediate Action Required)</p>
                      </div>
                      <ul className="space-y-3 list-disc list-inside">
                         <li><strong>พลขับ:</strong> กดปุ่ม <span className="bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold">SOS</span> ค้างไว้ 3 วินาที หรือโทรเบอร์ฉุกเฉินศูนย์ฯ</li>
                         <li><strong>ศูนย์สั่งการ:</strong> หน้าจอ Ops Dashboard จะขึ้นแจ้งเตือนสีแดงพร้อมเสียง ให้กดรับทราบ (Ack) ทันที</li>
                         <li><strong>การตอบสนอง:</strong> ตรวจสอบพิกัดล่าสุด -&gt; ประสานกู้ภัย/ตำรวจท้องที่ -&gt; แจ้งผู้บังคับบัญชา</li>
                         <li><strong>การปิดงาน:</strong> บันทึกรายละเอียดการช่วยเหลือลงใน Incident Log และกด &quot;Mark Resolved&quot;</li>
                      </ul>
                   </div>
                </details>

                <details className="group bg-white border border-slate-200 rounded-2xl overflow-hidden">
                   <summary className="flex justify-between items-center p-5 bg-slate-50/50 cursor-pointer hover:bg-slate-100 font-bold text-slate-700">
                      SOP-03: การจัดการข้อมูลผิดพลาด (Data Handling)
                      <ChevronRight className="transition-transform group-open:rotate-90 text-slate-400"/>
                   </summary>
                   <div className="p-6 border-t border-slate-100 bg-white space-y-4 text-sm text-slate-600">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="p-4 border rounded-xl">
                            <h5 className="font-bold text-slate-800 mb-2">GPS Drift / สัญญาณเพี้ยน</h5>
                            <p>หากพิกัดกระโดดไกลเกินจริง ให้ตรวจสอบค่า <strong>Accuracy</strong> ในหน้า Tracking หากเกิน 50m ให้ยึดตามเลขไมล์รถแทน</p>
                         </div>
                         <div className="p-4 border rounded-xl">
                            <h5 className="font-bold text-slate-800 mb-2">Offline / เน็ตหลุด</h5>
                            <p>แอปจะเก็บข้อมูลลง <strong>Local Queue</strong> ห้ามปิดหน้าจอแอป เมื่อต่อเน็ตได้ระบบจะ Auto Sync ให้อัตโนมัติ</p>
                         </div>
                      </div>
                   </div>
                </details>
             </div>

             {/* 2. Forms */}
             <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 border-l-4 border-[#002D62] pl-4">
                   <FileInput className="text-amber-500" />
                   2. แบบฟอร์มสำรอง (Offline Forms)
                </h3>
                <p className="text-sm text-slate-500">สำหรับใช้งานกรณีระบบขัดข้อง หรือพื้นที่ปฏิบัติงานไม่มีสัญญาณอินเทอร์เน็ต</p>
                
                <div className="overflow-x-auto">
                   <div className="min-w-[600px] border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-100 p-3 font-bold text-center text-[#002D62]">แบบฟอร์มขอใช้รถส่วนกลาง (Form-01)</div>
                      <table className="w-full text-sm">
                         <tbody className="divide-y divide-slate-200">
                            <tr>
                               <td className="p-3 font-bold w-1/4 bg-slate-50">ชื่อผู้ขอ / สังกัด</td>
                               <td className="p-3 border-r">......................................................................</td>
                               <td className="p-3 font-bold w-1/4 bg-slate-50">วันที่ / เวลา</td>
                               <td className="p-3">....../....../...... เวลา ...........</td>
                            </tr>
                            <tr>
                               <td className="p-3 font-bold bg-slate-50">ภารกิจ</td>
                               <td className="p-3 border-r" colSpan={3}>.......................................................................................................................................</td>
                            </tr>
                            <tr>
                               <td className="p-3 font-bold bg-slate-50">สถานที่ปลายทาง</td>
                               <td className="p-3 border-r">......................................................................</td>
                               <td className="p-3 font-bold bg-slate-50">จำนวนผู้โดยสาร</td>
                               <td className="p-3">................ คน</td>
                            </tr>
                            <tr>
                               <td className="p-3 font-bold bg-slate-50 text-center" colSpan={4}>ส่วนสำหรับผู้อนุมัติ</td>
                            </tr>
                            <tr>
                               <td className="p-3 h-20 align-bottom text-center border-r" colSpan={2}>(ลงชื่อ) ........................................ ผู้ขอ</td>
                               <td className="p-3 h-20 align-bottom text-center" colSpan={2}>(ลงชื่อ) ........................................ ผู้อนุมัติ</td>
                            </tr>
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>

             {/* 3. Checklists */}
             <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 border-l-4 border-[#002D62] pl-4">
                   <CheckCircle2 className="text-amber-500" />
                   3. รายการตรวจสอบ (Checklists)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h5 className="font-bold text-[#002D62] mb-4 border-b pb-2">ประจำวัน (Daily Check)</h5>
                      <ul className="space-y-3 text-sm text-slate-600">
                         <li className="flex items-center gap-3"><input type="checkbox" className="w-4 h-4"/> ตรวจสอบระดับน้ำมันเครื่อง / น้ำกลั่น</li>
                         <li className="flex items-center gap-3"><input type="checkbox" className="w-4 h-4"/> ตรวจสอบลมยางและสภาพยาง</li>
                         <li className="flex items-center gap-3"><input type="checkbox" className="w-4 h-4"/> ตรวจสอบระบบไฟส่องสว่าง / แตร</li>
                         <li className="flex items-center gap-3"><input type="checkbox" className="w-4 h-4"/> <strong>App:</strong> Login และเช็คสถานะ GPS</li>
                      </ul>
                   </div>
                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h5 className="font-bold text-[#002D62] mb-4 border-b pb-2">ประจำสัปดาห์ (Weekly Check)</h5>
                      <ul className="space-y-3 text-sm text-slate-600">
                         <li className="flex items-center gap-3"><input type="checkbox" className="w-4 h-4"/> ทำความสะอาดภายใน/ภายนอกรถ</li>
                         <li className="flex items-center gap-3"><input type="checkbox" className="w-4 h-4"/> ตรวจสอบอุปกรณ์ฉุกเฉิน (แม่แรง/ยางอะไหล่)</li>
                         <li className="flex items-center gap-3"><input type="checkbox" className="w-4 h-4"/> <strong>System:</strong> Upload ข้อมูลค้างส่ง (Sync)</li>
                      </ul>
                   </div>
                </div>
             </div>

             {/* 4. Policies */}
             <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 border-l-4 border-[#002D62] pl-4">
                   <Lock className="text-amber-500" />
                   4. นโยบายข้อมูล (Data Governance)
                </h3>
                
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-slate-100 text-slate-700">
                         <tr>
                            <th className="p-4 rounded-tl-xl border-b">หัวข้อ (Topic)</th>
                            <th className="p-4 border-b">รายละเอียด (Policy Detail)</th>
                            <th className="p-4 rounded-tr-xl border-b">ผู้รับผิดชอบ</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                         <tr>
                            <td className="p-4 font-bold">Data Retention</td>
                            <td className="p-4">เก็บข้อมูลพิกัดดิบ 30 วัน, ข้อมูลสรุป 1 ปี, ข้อมูลอุบัติเหตุ 3 ปี</td>
                            <td className="p-4">System Admin</td>
                         </tr>
                         <tr>
                            <td className="p-4 font-bold">Privacy Class</td>
                            <td className="p-4">ข้อมูลภารกิจลับ (Secret) จะถูกปิดกั้นการเข้าถึง ยกเว้น Admin ระดับสูง</td>
                            <td className="p-4">Commander</td>
                         </tr>
                         <tr>
                            <td className="p-4 font-bold">Access Control</td>
                            <td className="p-4">เข้าถึงข้อมูลตามลำดับชั้นบังคับบัญชา (Role-Based Access Control)</td>
                            <td className="p-4">HR / Admin</td>
                         </tr>
                      </tbody>
                   </table>
                </div>
             </div>

             {/* 5. Support & SLA */}
             <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 border-l-4 border-[#002D62] pl-4">
                   <LifeBuoy className="text-amber-500" />
                   5. ช่องทางติดต่อและ SLA Support
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                   <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                      <h5 className="font-bold text-emerald-800 mb-1">Level 1: General</h5>
                      <p className="text-xs text-emerald-600 mb-4">สอบถามการใช้งาน / ลืมรหัส</p>
                      <p className="text-2xl font-black text-emerald-700">Line @BPP_Help</p>
                      <p className="text-xs text-slate-400 mt-2">08:00 - 17:00 (จ-ศ)</p>
                   </div>
                   <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                      <h5 className="font-bold text-amber-800 mb-1">Level 2: Ops</h5>
                      <p className="text-xs text-amber-600 mb-4">แจ้งเหตุ / ระบบขัดข้อง / อนุมัติด่วน</p>
                      <p className="text-2xl font-black text-amber-700">02-XXX-XXXX</p>
                      <p className="text-xs text-slate-400 mt-2">24 Hours (ศูนย์วิทยุ)</p>
                   </div>
                   <div className="p-6 bg-red-50 rounded-2xl border border-red-100 text-center">
                      <h5 className="font-bold text-red-800 mb-1">Level 3: Critical</h5>
                      <p className="text-xs text-red-600 mb-4">อุบัติเหตุร้ายแรง / SOS</p>
                      <p className="text-2xl font-black text-red-700">191 / 1669</p>
                      <p className="text-xs text-slate-400 mt-2">Emergency Only</p>
                   </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                   <h5 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Activity size={16}/> Service Level Agreement (SLA)</h5>
                   <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                         <thead className="font-bold text-slate-500 border-b border-slate-200">
                            <tr><th className="pb-2">ความรุนแรง (Severity)</th><th className="pb-2">เวลาตอบรับ (Response)</th><th className="pb-2">เวลาแก้ไข (Resolution)</th></tr>
                         </thead>
                         <tbody className="divide-y divide-slate-200">
                            <tr><td className="py-2 text-red-600 font-bold">Critical (ระบบล่ม/SOS)</td><td className="py-2">ทันที (&lt; 5 นาที)</td><td className="py-2">ภายใน 2 ชม.</td></tr>
                            <tr><td className="py-2 text-amber-600 font-bold">High (ใช้งานไม่ได้บางส่วน)</td><td className="py-2">ภายใน 30 นาที</td><td className="py-2">ภายใน 4 ชม.</td></tr>
                            <tr><td className="py-2 text-blue-600 font-bold">Medium (คำถามทั่วไป)</td><td className="py-2">ภายใน 4 ชม.</td><td className="py-2">ภายใน 24 ชม.</td></tr>
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>

             {/* 6. Documentation Style Guide (NEW) */}
             <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 border-l-4 border-[#002D62] pl-4">
                   <PenTool className="text-amber-500" />
                   6. มาตรฐานการจัดทำเอกสาร (Style Guide)
                </h3>
                <p className="text-sm text-slate-500">เกณฑ์มาตรฐานสำหรับการปรับปรุงหรือแก้ไขคู่มือฉบับนี้ในอนาคต (For Maintainers)</p>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                   <div className="p-6 border-b border-slate-100 bg-slate-50">
                      <h5 className="font-bold text-[#002D62]">6.1 โทนภาษาและรูปแบบ (Tone & Typography)</h5>
                   </div>
                   <div className="p-6 space-y-6 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <strong className="block text-slate-700 mb-2">Tone of Voice</strong>
                            <ul className="list-disc list-inside text-slate-600 space-y-1">
                               <li><strong>Professional & Instructional:</strong> ใช้ภาษาทางการแต่เข้าใจง่าย กระชับ</li>
                               <li><strong>Active Voice:</strong> เน้นประธานเป็นผู้กระทำ (เช่น &quot;ระบบบันทึกข้อมูล&quot; แทน &quot;ข้อมูลถูกบันทึก&quot;)</li>
                               <li><strong>Direct Action:</strong> เริ่มประโยคด้วยกริยาเมื่อบอกขั้นตอน (เช่น &quot;กด&quot;, &quot;เลือก&quot;, &quot;กรอก&quot;)</li>
                            </ul>
                         </div>
                         <div>
                            <strong className="block text-slate-700 mb-2">Heading Hierarchy</strong>
                            <div className="space-y-2 border p-4 rounded-xl bg-slate-50">
                               <div className="text-2xl font-black text-[#002D62]">H1: ชื่อบท (30pt)</div>
                               <div className="text-xl font-bold text-slate-800">H2: ชื่อโมดูล (24pt)</div>
                               <div className="text-lg font-bold text-slate-700">H3: ชื่อหัวข้อย่อย (18pt)</div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                   <div className="p-6 border-b border-slate-100 bg-slate-50">
                      <h5 className="font-bold text-[#002D62]">6.2 สัญลักษณ์ช่วยเตือน (Callouts)</h5>
                   </div>
                   <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
                         <Info size={20} className="text-blue-600 shrink-0" />
                         <div>
                            <strong className="text-blue-800 text-xs uppercase tracking-widest block mb-1">Note (หมายเหตุ)</strong>
                            <p className="text-xs text-blue-900">ข้อมูลเพิ่มเติม หรือเงื่อนไขประกอบที่ไม่ส่งผลร้ายแรง</p>
                         </div>
                      </div>
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-3">
                         <Zap size={20} className="text-emerald-600 shrink-0" />
                         <div>
                            <strong className="text-emerald-800 text-xs uppercase tracking-widest block mb-1">Tip (เคล็ดลับ)</strong>
                            <p className="text-xs text-emerald-900">ทางลัด หรือวิธีการที่ช่วยให้ทำงานเร็วขึ้น</p>
                         </div>
                      </div>
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                         <AlertCircle size={20} className="text-amber-600 shrink-0" />
                         <div>
                            <strong className="text-amber-800 text-xs uppercase tracking-widest block mb-1">Warning (คำเตือน)</strong>
                            <p className="text-xs text-amber-900">สิ่งที่ควรระวัง อาจทำให้เกิดความสับสนหรือข้อมูลคลาดเคลื่อน</p>
                         </div>
                      </div>
                      <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3">
                         <ShieldAlert size={20} className="text-red-600 shrink-0" />
                         <div>
                            <strong className="text-red-800 text-xs uppercase tracking-widest block mb-1">Critical (ข้อควรระวังความปลอดภัย)</strong>
                            <p className="text-xs text-red-900">ห้ามทำโดยเด็ดขาด หรือขั้นตอนที่เกี่ยวกับความปลอดภัยในชีวิต/ทรัพย์สิน</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                   <div className="p-6 border-b border-slate-100 bg-slate-50">
                      <h5 className="font-bold text-[#002D62]">6.3 มาตรฐานคำศัพท์ (Glossary Standards)</h5>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                         <thead className="bg-slate-100 text-slate-500">
                            <tr><th className="p-3">ไทย (Thai)</th><th className="p-3">อังกฤษ (English)</th><th className="p-3">คำย่อ (Abbr.)</th></tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            <tr><td className="p-3">ยานพาหนะ</td><td className="p-3">Vehicle</td><td className="p-3">-</td></tr>
                            <tr><td className="p-3">พลขับ/พนักงานขับรถ</td><td className="p-3">Driver</td><td className="p-3">-</td></tr>
                            <tr><td className="p-3">ผู้ขอใช้รถ</td><td className="p-3">Requester</td><td className="p-3">-</td></tr>
                            <tr><td className="p-3">ศูนย์สั่งการ</td><td className="p-3">Dispatch Center</td><td className="p-3">Ops</td></tr>
                            <tr><td className="p-3">พิกัดตำแหน่ง</td><td className="p-3">Geolocation / Coordinates</td><td className="p-3">GPS</td></tr>
                            <tr><td className="p-3">การตรวจสอบย้อนหลัง</td><td className="p-3">Audit Trail</td><td className="p-3">Log</td></tr>
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default UserManual;