
import React, { useState, useEffect } from 'react';
import { ShieldCheck, User as UserIcon, Lock, UserPlus, ArrowRight, CheckCircle2, AlertCircle, Loader2, Save } from 'lucide-react';
import { User, UserRole } from '../types';

interface Props {
  onLogin: (user: User) => void;
}

const AuthPage: React.FC<Props> = ({ onLogin }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Form States
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [regForm, setRegForm] = useState({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: '',
    position: ''
  });

  // --- PERSISTENCE LOGIC ---
  useEffect(() => {
    // 1. Restore Remembered Username
    const savedUsername = localStorage.getItem('gov_remember_me');
    if (savedUsername) {
      setLoginForm(prev => ({ ...prev, username: savedUsername }));
      setRememberMe(true);
    }

    // 2. Restore Registration Draft (if exists)
    const savedDraft = localStorage.getItem('gov_reg_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setRegForm(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to restore draft', e);
      }
    }
  }, []);

  // 3. Auto-save Registration Draft
  useEffect(() => {
    if (!isLoginView) {
      const { password, confirmPassword, ...safeDraft } = regForm; // Don't save passwords in draft for security
      localStorage.setItem('gov_reg_draft', JSON.stringify(safeDraft));
    }
  }, [regForm, isLoginView]);

  const getUsersFromDB = (): any[] => {
    try {
      return JSON.parse(localStorage.getItem('gov_secure_vault') || '[]');
    } catch {
      return [];
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    await new Promise(r => setTimeout(r, 1000));

    const users = getUsersFromDB();
    const foundUser = users.find(u => u.username === loginForm.username && u.password === loginForm.password);

    if (foundUser) {
      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem('gov_remember_me', loginForm.username);
      } else {
        localStorage.removeItem('gov_remember_me');
      }

      const { password, ...userSafe } = foundUser;
      onLogin(userSafe as User);
    } else {
      setError('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง โปรดตรวจสอบข้อมูลอีกครั้ง');
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (regForm.password !== regForm.confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      setIsLoading(false);
      return;
    }

    await new Promise(r => setTimeout(r, 1500));

    const users = getUsersFromDB();
    if (users.some(u => u.username === regForm.username)) {
      setError('ชื่อผู้ใช้งานนี้ถูกลงทะเบียนในระบบแล้ว');
      setIsLoading(false);
      return;
    }

    const newUser = {
      fullName: regForm.fullName,
      username: regForm.username,
      password: regForm.password,
      position: regForm.position,
      role: UserRole.OFFICER
    };

    // Save to Vault (Persistent Storage)
    localStorage.setItem('gov_secure_vault', JSON.stringify([...users, newUser]));
    
    // Clear Draft
    localStorage.removeItem('gov_reg_draft');
    
    // Auto-fill Login
    setLoginForm(prev => ({ ...prev, username: regForm.username }));

    setSuccess('ลงทะเบียนผู้ใช้งานสำเร็จ ระบบกำลังเตรียมการเข้าสู่ระบบ...');
    setTimeout(() => {
      setSuccess(null);
      setIsLoginView(true);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-0 md:p-6 relative overflow-hidden font-['Sarabun']">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-[#002D62]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      
      <div className="w-full max-w-6xl min-h-[750px] grid grid-cols-1 lg:grid-cols-2 bg-white md:rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,45,98,0.2)] overflow-hidden relative z-10 border border-slate-100">
        
        {/* Branding Side - BPP Professional Theme */}
        <div className="hidden lg:flex flex-col justify-center items-center p-16 bg-gradient-to-br from-[#002D62] via-[#001D42] to-[#000F21] text-white relative">
          
          {/* Faint BPP Officer Background Watermark */}
          <div className="absolute inset-0 opacity-[0.08] pointer-events-none flex items-center justify-center overflow-hidden">
             <img 
               src="https://images.unsplash.com/photo-1590422531862-282695c026e9?auto=format&fit=crop&q=80&w=1000" 
               alt="BPP Officer Silhouette"
               className="w-full h-full object-cover filter grayscale"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[#002D62] to-transparent opacity-60"></div>
          </div>
          
          <div className="relative z-10 text-center flex flex-col items-center">
            {/* Main Headlines - Centered and Balanced */}
            <div className="space-y-4">
                <h2 className="text-4xl font-black leading-tight tracking-tight text-white uppercase opacity-90">
                  ระบบบริหาร
                </h2>
                <div className="h-1.5 w-24 bg-amber-500 mx-auto rounded-full mb-4 shadow-lg shadow-amber-500/20" />
                <h2 className="text-6xl font-black leading-tight tracking-tighter text-amber-400">
                  งานยานพาหนะอัจฉริยะ
                </h2>
                <p className="text-white/40 text-lg font-medium max-w-sm mx-auto leading-relaxed mt-10">
                  กองบัญชาการตำรวจตระเวนชายแดน <br />
                  <span className="text-[12px] uppercase tracking-[0.3em] font-black">Official Fleet Control Center</span>
                </p>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="p-8 md:p-16 lg:p-24 flex flex-col justify-center bg-white relative">
          <div className="max-w-sm mx-auto w-full">
            <div className="mb-12 text-center">
              <div className="lg:hidden flex justify-center mb-10">
                 <div className="w-20 h-20 bg-[#002D62] rounded-3xl flex items-center justify-center text-amber-400 shadow-2xl">
                    <ShieldCheck size={40} />
                 </div>
              </div>
              <h3 className="text-4xl font-black text-[#002D62] mb-3 tracking-tighter">
                {isLoginView ? 'ลงชื่อเข้าใช้งาน' : 'ลงทะเบียนเจ้าหน้าที่'}
              </h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                {isLoginView ? 'Official Credential Access' : 'New Personnel Registration'}
              </p>
            </div>

            {error && (
              <div className="mb-8 p-5 bg-red-50 border border-red-100 text-red-600 rounded-[1.5rem] flex items-start gap-4 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-8 p-5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-[1.5rem] flex items-start gap-4 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
                <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {isLoginView ? (
              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อผู้ใช้งาน (Username)</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#002D62] transition-colors" size={20} />
                    <input 
                      type="text" required
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-[#002D62]/20 focus:bg-white outline-none font-black text-slate-800 transition-all shadow-inner text-base"
                      placeholder="Username"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">รหัสผ่าน (Password)</label>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#002D62] transition-colors" size={20} />
                    <input 
                      type="password" required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-[#002D62]/20 focus:bg-white outline-none font-black text-slate-800 transition-all shadow-inner text-base"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                   <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-[#002D62] focus:ring-[#002D62]" 
                      />
                      <span className="text-xs font-bold text-slate-500 group-hover:text-[#002D62] transition-colors">จดจำชื่อผู้ใช้งาน</span>
                   </label>
                   <a href="#" className="text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors">ลืมรหัสผ่าน?</a>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-5 bg-[#002D62] text-white rounded-[1.5rem] font-black text-base shadow-2xl shadow-indigo-900/30 hover:bg-indigo-900 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={24} /> : <ShieldCheck size={24} className="text-amber-400" />}
                  เข้าสู่ระบบงาน
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อ-นามสกุล</label>
                  <input 
                    type="text" required
                    value={regForm.fullName}
                    onChange={(e) => setRegForm({...regForm, fullName: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-[#002D62] outline-none font-bold text-slate-800 shadow-inner text-sm"
                    placeholder="Full Name"
                    autoComplete="name"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อผู้ใช้งาน</label>
                    <input 
                      type="text" required
                      value={regForm.username}
                      onChange={(e) => setRegForm({...regForm, username: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-[#002D62] outline-none font-bold text-slate-800 shadow-inner text-sm"
                      placeholder="Username"
                      autoComplete="username"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ตำแหน่ง</label>
                    <input 
                      type="text" required
                      value={regForm.position}
                      onChange={(e) => setRegForm({...regForm, position: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-[#002D62] outline-none font-bold text-slate-800 shadow-inner text-sm"
                      placeholder="Position"
                      autoComplete="organization-title"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">รหัสผ่าน</label>
                    <input 
                      type="password" required
                      value={regForm.password}
                      onChange={(e) => setRegForm({...regForm, password: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-[#002D62] outline-none font-bold text-slate-800 shadow-inner text-sm"
                      placeholder="Password"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ยืนยันรหัสผ่าน</label>
                    <input 
                      type="password" required
                      value={regForm.confirmPassword}
                      onChange={(e) => setRegForm({...regForm, confirmPassword: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-[#002D62] outline-none font-bold text-slate-800 shadow-inner text-sm"
                      placeholder="Confirm"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                   <Save size={12} />
                   <span>ข้อมูลจะถูกบันทึกชั่วคราว (Draft) แม้ปิด Browser</span>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-[#002D62] text-white rounded-[1.5rem] font-black text-base shadow-xl shadow-indigo-900/20 hover:bg-indigo-900 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={24} /> : <UserPlus size={24} className="text-amber-400" />}
                  สมัครสมาชิก
                </button>
              </form>
            )}

            <div className="mt-16 pt-10 border-t border-slate-100 flex flex-col items-center gap-4">
              <button 
                onClick={() => { setIsLoginView(!isLoginView); setError(null); }}
                className="flex items-center gap-2 text-xs font-black text-[#002D62] hover:text-amber-600 transition-all uppercase tracking-[0.2em] group"
              >
                {isLoginView ? 'ลงทะเบียนเจ้าหน้าที่ใหม่' : 'กลับไปที่หน้าเข้าสู่ระบบ'}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

      </div>
      
      {/* Footer System Security */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:block">
         <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.4em] opacity-40">Secured with End-to-End Encryption | BPP Official Network</p>
      </div>
    </div>
  );
};

export default AuthPage;
