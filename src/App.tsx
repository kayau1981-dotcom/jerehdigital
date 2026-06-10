import { useState, useEffect } from 'react';
import { Member, ActivityLog, FamilyPhoto, ColumnMapping, ConnectionConfig } from './types';
import { 
  MOCK_MEMBERS, 
  MOCK_PHOTOS, 
  MOCK_LOGS, 
  DEFAULT_MAPPING 
} from './data/mockData';
import { calculateGenerations } from './utils/treeLayout';

// Sub Views
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import SilsilahTreeView from './components/SilsilahTreeView';
import DaftarAnggotaView from './components/DaftarAnggotaView';
import AlbumKeluargaView from './components/AlbumKeluargaView';
import IntegrasiSheetView from './components/IntegrasiSheetView';
import ArsipBerkasView from './components/ArsipBerkasView';
import HariPentingView from './components/HariPentingView';
import BukuSilsilahAIView from './components/BukuSilsilahAIView';
import LaporanView from './components/LaporanView';
import PengaturanPortalView from './components/PengaturanPortalView';
import LoginView from './components/LoginView';
import QuickJumpFAB from './components/QuickJumpFAB';

import { Menu, GitFork, RefreshCw, Layers, LogOut, User as UserIcon, Search, X } from 'lucide-react';

export default function App() {
  
  // 0. Authentication Reactive State
  const [currentUser, setCurrentUser] = useState<{ role: 'Admin' | 'Anggota'; name: string } | null>(() => {
    try {
      const stored = localStorage.getItem('silsilah_logged_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  // 1. Core Reactive States initialized with LocalStorage sandbox persistence
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const stored = localStorage.getItem('silsilah_members_db');
      if (stored) {
        const parsed = JSON.parse(stored);
        return calculateGenerations(parsed);
      }
    } catch (e) {
      console.error(e);
    }
    return calculateGenerations(MOCK_MEMBERS);
  });

  const [photos, setPhotos] = useState<FamilyPhoto[]>(() => {
    try {
      const stored = localStorage.getItem('silsilah_photos_db');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return MOCK_PHOTOS;
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    try {
      const stored = localStorage.getItem('silsilah_logs_db');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return MOCK_LOGS;
  });

  const [connection, setConnection] = useState<ConnectionConfig>(() => {
    try {
      const stored = localStorage.getItem('silsilah_sheet_config');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {
      sheetUrl: '',
      isLinked: false,
      mapping: DEFAULT_MAPPING
    };
  });

  const [familyTitle, setFamilyTitle] = useState<string>(() => {
    return localStorage.getItem('silsilah_family_title') || 'Hayo Pahari Samandiai Keleh Itah Pakat Manampa Jereh Digital Akan Tampayah Anak Eson Itah Andau Harian.';
  });

  const [logoUrl, setLogoUrl] = useState<string>(() => {
    return localStorage.getItem('silsilah_logo_url') || '';
  });

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  
  // Dark Mode State with Sandbox Local Storage persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('silsilah_dark_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('silsilah_dark_mode', String(isDarkMode));
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const matchedMembers = searchQuery.trim() === ''
    ? []
    : members.filter(m => m.nama.toLowerCase().includes(searchQuery.toLowerCase()));

  // 2. Synchronize states with local storage on updates
  useEffect(() => {
    localStorage.setItem('silsilah_members_db', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('silsilah_photos_db', JSON.stringify(photos));
  }, [photos]);

  useEffect(() => {
    localStorage.setItem('silsilah_logs_db', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('silsilah_sheet_config', JSON.stringify(connection));
  }, [connection]);

  useEffect(() => {
    localStorage.setItem('silsilah_family_title', familyTitle);
  }, [familyTitle]);

  useEffect(() => {
    localStorage.setItem('silsilah_logo_url', logoUrl);
  }, [logoUrl]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('silsilah_logged_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('silsilah_logged_user');
    }
  }, [currentUser]);

  // Handle scanned/deep-linked QR profiles on mount or database load
  useEffect(() => {
    if (members.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const mId = params.get('memberId') || params.get('id');
    if (mId) {
      const exists = members.some(m => m.id === mId);
      if (exists) {
        // Log deep link scanned
        handleAddLog('sinkronisasi', `Mengakses profil cepat ID Anggota: "${mId}" dari pemindaian QR.`);
        handleSelectMemberId(mId);
        // Clear parameters to keep URL clean on subsequent reloads
        try {
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('memberId');
          cleanUrl.searchParams.delete('id');
          window.history.replaceState({}, '', cleanUrl.toString());
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [members]);

  // 3. Logger helper
  const handleAddLog = (tipe: 'tambah' | 'edit' | 'hapus' | 'sinkronisasi', deskripsi: string) => {
    const newLog: ActivityLog = {
      id: `L_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      tipe,
      deskripsi
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50)); // limit to 50 logs max
  };

  // 4. CRUD operations callbacks
  const handleAddMember = (m: Member) => {
    setMembers(prev => calculateGenerations([...prev, m]));
  };

  const handleUpdateMember = (updated: Member) => {
    setMembers(prev => calculateGenerations(prev.map(m => m.id === updated.id ? updated : m)));
  };

  const handleDeleteMember = (id: string) => {
    // We filter out the member
    setMembers(prev => {
      const filtered = prev.filter(m => m.id !== id);
      
      // Also clean up relations referencing deleted ID so we don't hold stale IDs!
      const cleaned = filtered.map(m => {
        const item = { ...m };
        if (item.ayahId === id) delete item.ayahId;
        if (item.ibuId === id) delete item.ibuId;
        if (item.pasanganId === id) delete item.pasanganId;
        return item;
      });

      return calculateGenerations(cleaned);
    });
  };

  const handleAddPhoto = (newPhoto: FamilyPhoto) => {
    setPhotos(prev => [newPhoto, ...prev]);
  };

  // 5. Google Sheets Integration callbacks
  const handleLinkSheet = (url: string, finalMapping: ColumnMapping, parsedMembers: Member[]) => {
    setConnection({
      sheetUrl: url,
      isLinked: true,
      lastSynced: new Date().toISOString(),
      mapping: finalMapping
    });
    setMembers(calculateGenerations(parsedMembers));
  };

  const handleUnlinkSheet = () => {
    setConnection({
      sheetUrl: '',
      isLinked: false,
      lastSynced: undefined,
      mapping: DEFAULT_MAPPING
    });
    // Restore Mock Members for Demo Play as baseline, or allow manual editing
    setMembers(calculateGenerations(MOCK_MEMBERS));
  };

  // 6. Navigation selector helper from widgets (e.g. clicking a birthday card child)
  const handleSelectMemberId = (memberId: string) => {
    setSelectedMemberId(memberId);
    setCurrentView('tree'); // Switch immediately to FAMILY TREE
  };

  // Switch view title descriptor
  const getHeaderTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Dasbor Genealogy & Analitik';
      case 'tree': return 'Visual Komponen Pohon Silsilah';
      case 'members': return 'Pangkalan Data Anggota Keluarga';
      case 'album': return 'Dokumentasi Album Foto Momen Bersama';
      case 'files': return 'Lembari Arsip Dokumen Resmi';
      case 'events': return 'Kalender Hari Penting & Kegiatan';
      case 'aibook': return 'Pustaka & Pengarang Silsilah AI';
      case 'reports': return 'Laporan Visual & Analisis Penduduk';
      case 'integration': return 'Sinkronisasi Backend Google Sheets';
      case 'settings_portal': return 'Manajemen Konfigurasi Portal Silsilah';
      default: return 'Genealogy Framework';
    }
  };

  if (!currentUser) {
    return (
      <LoginView 
        onLogin={(role, name) => {
          setCurrentUser({ role, name });
          handleAddLog('sinkronisasi', `Pengguna "${name}" (${role}) berhasil masuk ke sistem.`);
        }} 
      />
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-200 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-700'}`}>
      
      {/* 1. SIDEBAR Navigation - collapsible on mobile */}
      <Sidebar 
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          setSelectedMemberId(undefined); // clear active widget jumps
        }}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isLinked={connection.isLinked}
        totalMembers={members.length}
        familyTitle={familyTitle}
        currentUser={currentUser}
        onLogout={() => {
          if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
            handleAddLog('sinkronisasi', `Pengguna "${currentUser?.name}" keluar dari sistem.`);
            setCurrentUser(null);
          }
        }}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => {
          setIsDarkMode(!isDarkMode);
          handleAddLog('sinkronisasi', `Mengubah tema visual portal ke Mode ${!isDarkMode ? 'Malam (Gelap)' : 'Siang (Terang)'}.`);
        }}
      />

      {/* 2. MAIN WORKING SPACE */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 shrink-0 bg-white border-b border-slate-100 px-4 md:px-6 flex items-center justify-between select-none shadow-[y-1px_0_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            {/* Hamburger mobile drawer selector */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3">
              {logoUrl && (
                <img 
                  src={logoUrl} 
                  alt="Family Logo" 
                  className="w-8 h-8 rounded-full hidden sm:block object-cover border border-slate-200"
                  referrerPolicy="no-referrer"
                />
              )}
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block leading-none">{familyTitle}</span>
                <h2 className="font-bold text-slate-800 text-sm md:text-base mt-1.5 tracking-tight leading-none">{getHeaderTitle()}</h2>
              </div>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="hidden sm:block flex-1 max-w-xs md:max-w-md mx-4 relative" id="global-search-container">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Cari nama anggota keluarga..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                className="w-full pl-9 pr-8 py-1.5 md:py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Floating Dropdown Results */}
            {showSearchResults && searchQuery.trim() !== '' && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowSearchResults(false)} />
                <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-900/10 z-50 overflow-hidden max-h-80 overflow-y-auto flex flex-col font-sans">
                  <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">
                    <span>Hasil Pencarian ({matchedMembers.length})</span>
                    <span>Akses Cepat</span>
                  </div>
                  {matchedMembers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 font-medium">
                      Tidak ditemukan anggota bernama "{searchQuery}"
                    </div>
                  ) : (
                    <div className="py-1 divide-y divide-slate-50">
                      {matchedMembers.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            handleSelectMemberId(m.id);
                            setSearchQuery('');
                            setShowSearchResults(false);
                          }}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer group"
                        >
                          {m.fotoUrl ? (
                            <img
                              src={m.fotoUrl}
                              alt={m.nama}
                              className="w-8 h-8 rounded-full object-cover border border-slate-100"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/60 flex items-center justify-center font-bold text-xs text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                              {m.nama.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                              {m.nama}
                            </p>
                            <p className="text-[10px] font-mono font-medium text-slate-400 mt-0.5 leading-none">
                              {m.generasi !== undefined ? `Generasi ${m.generasi} • ` : ''}{m.kotaTinggal || m.pekerjaan || 'Anggota Keluarga'}
                            </p>
                          </div>
                          <div className="text-[9px] font-mono font-bold text-slate-300 group-hover:text-blue-500 transition-colors uppercase tracking-wider bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">
                            LIHAT POHON
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            
            {/* Quick sheets sink indicator */}
            {connection.isLinked && (
              <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono">
                <RefreshCw size={11} className="text-emerald-500 animate-spin-slow" />
                <span>SHEET CLOUD LINKED</span>
              </div>
            )}

            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-slate-700">June 2026</p>
              <p className="text-[9px] text-slate-400 font-semibold font-mono tracking-wider font-bold">PORTAL SILSILAH</p>
            </div>

            {/* User Profile Banner & Logout Button */}
            <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
              <div className="flex flex-col text-right">
                <span className="text-[11px] font-bold text-slate-800 leading-tight">{currentUser?.name}</span>
                <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase leading-none">{currentUser?.role === 'Admin' ? 'Super Admin' : 'Peserta/Anggota'}</span>
              </div>
              <button
                onClick={() => {
                  if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
                    handleAddLog('sinkronisasi', `Pengguna "${currentUser?.name}" keluar dari sistem.`);
                    setCurrentUser(null);
                  }
                }}
                className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all ml-1"
                title="Keluar / Logout"
              >
                <LogOut size={16} />
              </button>
            </div>

          </div>
        </header>

        {/* Dynamic active view viewport wrapper */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
          
          <div className="h-full">
            {currentView === 'dashboard' && (
              <DashboardView 
                members={members}
                photosCount={photos.length}
                logs={logs}
                onViewChange={setCurrentView}
                onSelectMember={handleSelectMemberId}
                isLinked={connection.isLinked}
                familyTitle={familyTitle}
                isDarkMode={isDarkMode}
                onAddLog={handleAddLog}
                currentUser={currentUser}
              />
            )}

            {currentView === 'tree' && (
              <SilsilahTreeView 
                members={members}
                onSelectMemberId={selectedMemberId}
                onClearSelectedMember={() => setSelectedMemberId(undefined)}
                onAddLog={handleAddLog}
              />
            )}

            {currentView === 'members' && (
              <DaftarAnggotaView 
                members={members}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                onDeleteMember={handleDeleteMember}
                onAddLog={handleAddLog}
                onSelectMember={handleSelectMemberId}
              />
            )}

            {currentView === 'album' && (
              <AlbumKeluargaView 
                photos={photos}
                members={members}
                onAddPhoto={handleAddPhoto}
                onAddLog={handleAddLog}
              />
            )}

            {currentView === 'files' && (
              <ArsipBerkasView 
                members={members}
                onAddLog={handleAddLog}
              />
            )}

            {currentView === 'events' && (
              <HariPentingView 
                members={members}
                onAddLog={handleAddLog}
              />
            )}

            {currentView === 'aibook' && (
              <BukuSilsilahAIView 
                members={members}
                familyTitle={familyTitle}
              />
            )}

            {currentView === 'reports' && (
              <LaporanView 
                members={members}
                familyTitle={familyTitle}
              />
            )}

            {currentView === 'integration' && (
              <IntegrasiSheetView 
                sheetUrl={connection.sheetUrl}
                isLinked={connection.isLinked}
                onLinkSheet={handleLinkSheet}
                onUnlinkSheet={handleUnlinkSheet}
                mappingConfig={connection.mapping}
                onAddLog={handleAddLog}
              />
            )}

            {currentView === 'settings_portal' && (
              <PengaturanPortalView 
                familyTitle={familyTitle}
                onChangeFamilyTitle={setFamilyTitle}
                logoUrl={logoUrl}
                onChangeLogoUrl={setLogoUrl}
                onAddLog={handleAddLog}
                members={members}
                photos={photos}
                logs={logs}
              />
            )}
          </div>

        </main>

      </div>

      <QuickJumpFAB currentView={currentView} onViewChange={setCurrentView} />

    </div>
  );
}
