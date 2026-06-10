import { 
  BarChart3, 
  GitFork, 
  Users, 
  Image as ImageIcon, 
  Settings, 
  Heart, 
  CheckCircle, 
  AlertCircle,
  Menu,
  X,
  FolderOpen,
  Calendar,
  Sparkles,
  PieChart,
  LogOut,
  User as UserIcon
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  isLinked: boolean;
  totalMembers: number;
  familyTitle: string;
  currentUser?: { role: 'Admin' | 'Anggota'; name: string } | null;
  onLogout?: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Sidebar({ 
  currentView, 
  onViewChange, 
  isOpen, 
  onToggle, 
  isLinked,
  totalMembers,
  familyTitle,
  currentUser,
  onLogout,
  isDarkMode,
  onToggleDarkMode
}: SidebarProps) {
  
  const menuItems = [
    { id: 'dashboard', label: 'Beranda & Stats', icon: BarChart3 },
    { id: 'tree', label: 'Pohon Silsilah', icon: GitFork },
    { id: 'members', label: 'Daftar Anggota', icon: Users },
    { id: 'album', label: 'Album Keluarga', icon: ImageIcon },
    { id: 'files', label: 'Arsip Berkas', icon: FolderOpen },
    { id: 'events', label: 'Hari Penting', icon: Calendar },
    { id: 'aibook', label: 'Buku Silsilah AI', icon: Sparkles },
    { id: 'reports', label: 'Laporan', icon: PieChart },
    { id: 'integration', label: 'Google Sheets', icon: Settings },
    { id: 'settings_portal', label: 'Pengaturan Portal', icon: Settings },
  ];

  const handleMenuClick = (viewId: string) => {
    onViewChange(viewId);
    if (window.innerWidth < 1024) {
      onToggle(); // Auto-close on mobile
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onToggle}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar Wrapper */}
      <aside 
        className={`fixed inset-y-0 left-0 w-72 bg-slate-900 text-slate-100 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 z-50 lg:translate-x-0 lg:static overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg text-white">
                <GitFork size={20} className="stroke-2 rotate-90" />
              </div>
              <div>
                <h1 className="font-sans font-bold text-sm tracking-tight leading-none text-white font-sans">JEREH DIGITAL</h1>
                <span className="font-mono text-[9px] text-slate-400 font-medium tracking-wider">DATABASE GENERASI</span>
              </div>
            </div>
            {/* Mobile close trigger */}
            <button 
              onClick={onToggle}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="px-3 py-2 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-medium tracking-wide transition-all ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-sm font-bold shadow-blue-900/30' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="shrink-0">
          {/* Global Dark Mode Switch */}
          <div className="mx-4 mb-3" id="dark-mode-toggle-container">
            <button
              onClick={onToggleDarkMode}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700/80 rounded-xl text-[11px] font-semibold text-slate-300 hover:text-white transition-all cursor-pointer group"
              title="Aktifkan Mode Gelap/Terang"
            >
              <div className="flex items-center gap-2">
                {isDarkMode ? (
                  <>
                    <span className="text-amber-400 select-none text-xs">☀️</span>
                    <span className="font-bold tracking-wide text-amber-100">MODE TERANG</span>
                  </>
                ) : (
                  <>
                    <span className="text-blue-400 select-none text-xs">🌙</span>
                    <span className="font-bold tracking-wide text-slate-200">MODE GELAP</span>
                  </>
                )}
              </div>
              <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 ${isDarkMode ? 'bg-amber-500' : 'bg-slate-700'}`}>
                <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 transform ${isDarkMode ? 'translate-x-3.5' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>

          {/* Active User Session details & Logout (Keluar-Masuk) */}
          {currentUser && (
            <div className="mx-4 mb-3 p-3 bg-slate-950/45 border border-slate-800 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs select-none shadow-sm shadow-blue-500/5 ring-1 ring-blue-500/10">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-slate-200 truncate leading-tight">{currentUser.name}</p>
                  <p className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">{currentUser.role === 'Admin' ? 'Super Admin' : 'Anggota Portal'}</p>
                </div>
              </div>
              
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 rounded-lg text-[10px] font-extrabold text-rose-400 hover:text-rose-350 transition-all cursor-pointer shadow-xs uppercase tracking-wider"
                >
                  <LogOut size={12} className="stroke-2" />
                  <span>Keluar dari Portal</span>
                </button>
              )}
            </div>
          )}

          {/* Footer info/credits */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-center text-[10px] text-slate-500 font-mono">
            <p className="font-semibold text-slate-400">@2026 KAYAUDIGITAL</p>
            <p className="mt-0.5 font-medium text-slate-600">Vercel & Github Deploy Ready</p>
          </div>
        </div>
      </aside>
    </>
  );
}
