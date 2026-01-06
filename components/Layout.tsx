
import React, { useState } from 'react';
import { ViewMode } from '../types';
import { 
  Users, 
  CalendarCheck, 
  LayoutDashboard, 
  Sparkles,
  Settings as SettingsIcon,
  Lock,
  Unlock,
  ChevronRight,
  UserX,
  Globe,
  Camera,
  MessageSquareQuote,
  Eye
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  isAdmin: boolean;
  setIsAdmin: (status: boolean) => void;
  onlineUserCount?: number;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, isAdmin, setIsAdmin, onlineUserCount = 0 }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');

  const menuItems = [
    { id: ViewMode.DASHBOARD, label: 'HOME', fullLabel: 'HOME', icon: LayoutDashboard },
    { id: ViewMode.ATTENDANCE, label: '오프라인', fullLabel: '벙 참여 현황', icon: CalendarCheck },
    { id: ViewMode.ONLINE_ATTENDANCE, label: '온라인', fullLabel: '온라인 벙 현황', icon: Globe },
    { id: ViewMode.MEMBERS, label: '회원', fullLabel: '회원 관리', icon: Users },
    { id: ViewMode.SUGGESTIONS, label: '건의함', fullLabel: '건의함', icon: MessageSquareQuote },
    { id: ViewMode.BLACKLIST, label: '블랙', fullLabel: '블랙리스트 관리', icon: UserX },
    { id: ViewMode.AI_REPORT, label: 'AI', fullLabel: 'AI 분석 리포트', icon: Sparkles },
    { id: ViewMode.SETTINGS, label: '설정', fullLabel: '설정 및 백업', icon: SettingsIcon },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '0114') {
      setIsAdmin(true);
      setShowLogin(false);
      setPassword('');
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  const handleLogout = () => {
    if (window.confirm('관리자 모드를 종료하시겠습니까?')) {
      setIsAdmin(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col shadow-sm shrink-0">
        <div className="p-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <span className="italic">Hordegraphy</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 mt-1 tracking-widest uppercase">Photography Club</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                activeView === item.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeView === item.id ? 'text-white' : 'text-slate-400'}`} />
              {item.fullLabel}
            </button>
          ))}
        </nav>
        
        <div className="p-6 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</p>
            <p className="text-xs font-bold text-slate-600 mt-1">v1.5.0 Cloud-Free</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative pb-20 lg:pb-0">
        <header className="h-16 lg:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-10 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg lg:text-xl font-black text-slate-800 tracking-tight">
              {menuItems.find(m => m.id === activeView)?.fullLabel}
            </h2>
            {isAdmin ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full border border-indigo-200">
                <Unlock className="w-3 h-3" />
                ADMIN MODE
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full border border-slate-200">
                <Lock className="w-3 h-3" />
                VIEW ONLY
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3 lg:gap-5">
            {/* 실시간 접속자 표시 */}
            {onlineUserCount > 0 && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </div>
                <span className="text-[10px] lg:text-xs font-black text-slate-600 uppercase tracking-tighter">
                  LIVE: <span className="text-blue-600">{onlineUserCount}</span>
                </span>
              </div>
            )}

            {isAdmin ? (
              <button 
                onClick={handleLogout}
                className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"
              >
                LOGOUT
              </button>
            ) : (
              <button 
                onClick={() => setShowLogin(true)}
                className="px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">관리자 인증</span>
                <span className="sm:hidden">인증</span>
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-10 bg-slate-50/50">
          {children}
        </div>

        {/* Mobile Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex items-center justify-around px-2 z-40 shadow-xl">
          {menuItems.slice(0, 5).concat(menuItems.slice(6, 8)).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                activeView === item.id ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeView === item.id ? 'scale-110' : ''}`} />
              <span className="text-[9px] font-black uppercase tracking-tighter">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Login Modal */}
        {showLogin && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-8 lg:p-10 animate-in fade-in zoom-in-95">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-5 shadow-inner">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Hordegraphy Auth</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">관리자 전용 비밀번호를 입력하세요.</p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-5">
                <input
                  autoFocus
                  type="password"
                  inputMode="numeric"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-black text-center text-2xl tracking-[1em]"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-100 active:scale-95"
                  >
                    확인 <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLogin(false)}
                    className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Layout;
