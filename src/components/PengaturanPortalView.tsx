import { useState, useEffect, FormEvent } from 'react';
import { 
  Settings, 
  Check, 
  RotateCcw, 
  Trash2, 
  ShieldAlert, 
  Layout, 
  UserSquare2,
  Users,
  UserPlus,
  Shield,
  Mail,
  Edit2,
  Plus,
  X,
  Search,
  Lock,
  Download
} from 'lucide-react';
import { PortalUser, Member, FamilyPhoto, ActivityLog } from '../types';

interface PengaturanPortalProps {
  familyTitle: string;
  onChangeFamilyTitle: (title: string) => void;
  logoUrl: string;
  onChangeLogoUrl: (url: string) => void;
  onAddLog: (tipe: 'tambah' | 'edit' | 'hapus' | 'sinkronisasi', deskripsi: string) => void;
  members: Member[];
  photos: FamilyPhoto[];
  logs: ActivityLog[];
}

const DEFAULT_PORTAL_USERS: PortalUser[] = [
  {
    id: 'U_1',
    nama: 'Administrator Utama (Joyo)',
    email: 'admin.joyosutiko@gmail.com',
    role: 'Admin',
    status: 'Aktif',
    tanggalDibuat: '2026-01-10'
  },
  {
    id: 'U_2',
    nama: 'Kurniawan Joyo',
    email: 'kurniawan@joyosutiko.or.id',
    role: 'Anggota',
    status: 'Aktif',
    tanggalDibuat: '2026-03-12'
  },
  {
    id: 'U_3',
    nama: 'Sari Rahmayanti',
    email: 'sari.rama@gmail.com',
    role: 'Anggota',
    status: 'Aktif',
    tanggalDibuat: '2026-05-04'
  }
];

export default function PengaturanPortalView({
  familyTitle,
  onChangeFamilyTitle,
  logoUrl,
  onChangeLogoUrl,
  onAddLog,
  members,
  photos,
  logs
}: PengaturanPortalProps) {
  
  const [activeTab, setActiveTab] = useState<'identitas' | 'pengguna'>('identitas');
  
  // Tab 1: Identitas States
  const [localTitle, setLocalTitle] = useState(familyTitle);
  const [localLogo, setLocalLogo] = useState(logoUrl);
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('silsilah_portal_accent') || 'blue';
  });
  const [defaultLayout, setDefaultLayout] = useState(() => {
    return localStorage.getItem('silsilah_portal_layout') || 'hierarki';
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Download complete master master JSON backup
  const handleDownloadJSONBackup = () => {
    let files = [];
    try {
      const storedFiles = localStorage.getItem('silsilah_files_db');
      if (storedFiles) files = JSON.parse(storedFiles);
    } catch (e) {
      console.error('Failed to parse files db', e);
    }

    let events = [];
    try {
      const storedEvents = localStorage.getItem('silsilah_events_db');
      if (storedEvents) events = JSON.parse(storedEvents);
    } catch (e) {
      console.error('Failed to parse events db', e);
    }

    const backupData = {
      familyTitle,
      logoUrl,
      accentColor,
      defaultLayout,
      members,
      photos,
      logs,
      files,
      events,
      users,
      backupTimestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    
    const cleanTitle = familyTitle.toLowerCase()
      .replace(/[^a-z0-0a-z]+/g, '-')
      .substring(0, 25);
      
    const dateFormatted = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute("download", `master-backup-silsilah-${cleanTitle || 'keluarga'}-${dateFormatted}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);

    onAddLog('sinkronisasi', `Berhasil mengunduh Berkas Master Backup Utama JSON (${members.length} anggota silsilah, ${photos.length} momen foto, ${logs.length} catatan log aktivitas).`);
  };

  // Tab 2: Pengguna States
  const [users, setUsers] = useState<PortalUser[]>(() => {
    try {
      const stored = localStorage.getItem('silsilah_portal_users_db');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_PORTAL_USERS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  
  // User Form States
  const [editingUser, setEditingUser] = useState<PortalUser | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'Admin' | 'Anggota'>('Anggota');
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');

  // Sync users to localStorage
  useEffect(() => {
    localStorage.setItem('silsilah_portal_users_db', JSON.stringify(users));
  }, [users]);

  const handleSaveSettings = (e: FormEvent) => {
    e.preventDefault();
    onChangeFamilyTitle(localTitle);
    onChangeLogoUrl(localLogo);
    localStorage.setItem('silsilah_portal_accent', accentColor);
    localStorage.setItem('silsilah_portal_layout', defaultLayout);

    setSaveSuccess(true);
    onAddLog('edit', `Memperbarui pengaturan portal: Menyetel nama keluarga "${localTitle}"`);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetEntireApp = () => {
    if (confirm('PERINGATAN KRITIS: Anda akan menghapus seluruh data lokal silsilah keluarga, logs, foto, berkas, dan agenda yang telah ditambahkan dan mengembalikannya ke demo awal. Apakah Anda benar-benar yakin?')) {
      localStorage.clear();
      onAddLog('hapus', 'Melakukan reset pabrik seluruh database silsilah lokal.');
      alert('Aplikasi telah di-reset ke data bawaan. Halaman akan dimuat ulang sekarang.');
      window.location.reload();
    }
  };

  const handleSaveUser = (e: FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    if (editingUser) {
      // Edit User Action
      const updatedUsers = users.map(u => 
        u.id === editingUser.id 
          ? { ...u, nama: formName.trim(), email: formEmail.trim(), role: formRole, status: formStatus } 
          : u
      );
      setUsers(updatedUsers);
      onAddLog('edit', `Memperbarui hak akses pengguna: ${formName} (${formRole})`);
      setEditingUser(null);
    } else {
      // Add User Action
      const newUser: PortalUser = {
        id: `U_${Math.random().toString(36).substr(2, 9)}`,
        nama: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        status: formStatus,
        tanggalDibuat: new Date().toISOString().split('T')[0]
      };
      setUsers(prev => [newUser, ...prev]);
      onAddLog('tambah', `Menambahkan pengguna portal baru: ${formName} (${formRole})`);
    }

    // Clear form inputs
    setFormName('');
    setFormEmail('');
    setFormRole('Anggota');
    setFormStatus('Aktif');
  };

  const handleStartEditUser = (user: PortalUser) => {
    setEditingUser(user);
    setFormName(user.nama);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormStatus(user.status);
  };

  const handleCancelEditUser = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormRole('Anggota');
    setFormStatus('Aktif');
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`Apakah Anda benar-benar yakin ingin menghapus akses pengguna "${name}" dari portal?`)) {
      setUsers(prev => prev.filter(u => u.id !== id));
      onAddLog('hapus', `Menghapus akses pengguna portal: ${name}`);
      if (editingUser?.id === id) {
        handleCancelEditUser();
      }
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter(u => 
    u.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Intro Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800 tracking-tight uppercase flex items-center gap-2">
              <Settings size={16} className="text-slate-600" />
              Konfigurasi Sistem & Pengguna Portal
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Atur identitas utama keluarga besar, preferensi layout visual, serta manajemen hak akses admin dan anggota.
            </p>
          </div>
          <div className="flex text-[11px] font-bold text-slate-500 font-mono gap-1 items-center bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-xl self-start">
            <Lock size={12} className="text-slate-400" />
            <span>SANDBOX LOCAL PERSISTENCE</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu navigation */}
      <div className="flex border-b border-slate-200 gap-2 select-none overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('identitas')}
          className={`pb-3 pt-1 px-4 text-xs font-bold font-mono uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'identitas'
              ? 'border-blue-600 text-blue-600 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Identitas Portal
        </button>
        <button
          onClick={() => setActiveTab('pengguna')}
          className={`pb-3 pt-1 px-4 text-xs font-bold font-mono uppercase tracking-wider border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'pengguna'
              ? 'border-blue-600 text-blue-600 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users size={14} />
          Pengguna & Hak Akses ({users.length})
        </button>
      </div>

      {/* TAB CONTENT 1: IDENTITAS */}
      {activeTab === 'identitas' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          <div className="md:col-span-2">
            <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-5">
              <h3 className="font-bold text-slate-800 text-xs font-mono uppercase tracking-widest pb-2 border-b border-slate-50 flex items-center gap-1.5">
                <Layout size={15} className="text-blue-500" />
                Kelola Identitas Portal
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nama Keluarga Besar Utama</label>
                  <input
                    type="text"
                    required
                    value={localTitle}
                    onChange={(e) => setLocalTitle(e.target.value)}
                    placeholder="Contoh: Keluarga Besar Joyo Sutiko"
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Tautan Foto / Logo Sampul Portal</label>
                  <input
                    type="url"
                    value={localLogo}
                    onChange={(e) => setLocalLogo(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 font-mono text-slate-500"
                  />
                </div>

                {/* Accent settings */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Skema Warna Aksen Utama</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'blue', color: 'bg-blue-600', name: 'Biru' },
                      { id: 'indigo', color: 'bg-indigo-600', name: 'Indigo' },
                      { id: 'rose', color: 'bg-rose-600', name: 'Rose' },
                      { id: 'emerald', color: 'bg-emerald-600', name: 'Emerald' }
                    ].map((preset) => (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => setAccentColor(preset.id)}
                        className={`flex-1 py-1 px-1 text-[11px] font-bold rounded-xl border flex flex-col items-center gap-1 transition-all ${
                          accentColor === preset.id 
                            ? 'border-slate-800 bg-slate-50 text-slate-850' 
                            : 'border-slate-200 bg-white text-slate-500'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full ${preset.color}`} />
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tree default layout */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Default Tampilan Pohon Silsilah</label>
                  <select
                    value={defaultLayout}
                    onChange={(e) => setDefaultLayout(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden"
                  >
                    <option value="hierarki">Tata Letak Pohon Vertikal Klasik</option>
                    <option value="bento">Tata Letak Kotak Bento Modern</option>
                  </select>
                </div>
              </div>

              {/* Submit & indicator success */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                {saveSuccess ? (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
                    <Check size={14} />
                    Perubahan Berhasil Disimpan
                  </span>
                ) : <div />}

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-all"
                >
                  SIMPAN SETELAN
                </button>
              </div>
            </form>
          </div>

          {/* Right column system operations Reset/Wipe database */}
          <div className="space-y-6">
            
            {/* Logo preview */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
              <h4 className="text-[10px] uppercase font-bold font-mono tracking-widest text-slate-400 border-b border-slate-50 pb-2">PREVIEW LOGO SAMPUL</h4>
              <div className="aspect-video w-full rounded-xl bg-slate-100 overflow-hidden relative border border-slate-200">
                {localLogo ? (
                  <img 
                    src={localLogo} 
                    alt="Family Logo" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <UserSquare2 size={24} className="stroke-[1.5]" />
                    <span className="text-[10px] font-bold font-mono mt-1">Belum Ada Foto Logo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Premium Download JSON Backup Card */}
            <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs space-y-4 font-sans">
              <h3 className="font-bold text-emerald-800 text-xs font-mono uppercase tracking-widest pb-2 border-b border-emerald-50 flex items-center gap-1.5">
                <Download size={15} className="text-emerald-500" />
                Unduh Master Backup
              </h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Sistem mengemas seluruh data silsilah, dokumen arsip berkas, catatan perubahan logs, dan album kenangan ke dalam format berkas standard JSON lokal.
              </p>
              <button
                type="button"
                onClick={handleDownloadJSONBackup}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Download size={14} />
                UNDUH MASTER BACKUP (JSON)
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-4">
              <h3 className="font-bold text-rose-800 text-xs font-mono uppercase tracking-widest pb-2 border-b border-rose-50 flex items-center gap-1.5">
                <ShieldAlert size={15} className="text-rose-500" />
                Operasi Bahaya Database
              </h3>
              <p className="text-[11px] text-slate-500 leading-normal font-sans">
                Apabila Anda mengalami inkonsistensi sinkronisasi, keliru memasukkan baris, atau ingin mereset seluruh database lokal portal ke skema simulasi orisinal awal.
              </p>
              <button
                type="button"
                onClick={handleResetEntireApp}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw size={14} />
                RESET ULANG LOKAL DATABASE
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT 2: PENGGUNA (ADMIN DAN ANGGOTA) */}
      {activeTab === 'pengguna' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in items-start">
          
          {/* User List Panel (Takes 2 columns in large screens) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-150 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                  <Users size={15} className="text-blue-500" />
                  Daftar Pengguna ({filteredUsers.length})
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Akses portal untuk akun Administrator dan Anggota Keluarga</p>
              </div>

              {/* Search user */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, email, role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs w-full sm:w-48 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-slate-50"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* List Table / Responsive grid */}
            <div className="overflow-x-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-16 text-center text-slate-400 font-sans italic text-xs">
                  Tidak ada data pengguna yang terdaftar atau cocok dengan pencarian Anda.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 select-none text-[10px] font-mono font-bold uppercase text-slate-400">
                      <th className="p-4 pl-6">Pengguna</th>
                      <th className="p-4">Peran Akses</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Dibuat</th>
                      <th className="p-4 pr-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-705">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/40">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs uppercase font-mono ${
                              user.role === 'Admin' 
                                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                                : 'bg-slate-50 text-slate-600 border border-slate-150'
                            }`}>
                              {user.nama.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 font-sans text-xs">{user.nama}</p>
                              <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                <Mail size={10} />
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            user.role === 'Admin'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            <Shield size={9} />
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            user.status === 'Aktif'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Aktif' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {user.status}
                          </span>
                        </td>
                        <td className="p-4 text-[11px] text-slate-400 font-mono">
                          {user.tanggalDibuat}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEditUser(user)}
                              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-all"
                              title="Sunting Pengguna"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.nama)}
                              className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-all"
                              title="Hapus Akses"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Form Create/Edit Panel (Takes 1 column in large screens) */}
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xs p-5 space-y-4">
            <h3 className="font-bold text-slate-800 text-xs font-mono uppercase tracking-widest pb-2 border-b border-slate-50 flex items-center gap-1.5">
              {editingUser ? <Edit2 size={14} className="text-blue-500" /> : <UserPlus size={14} className="text-blue-500" />}
              {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
            </h3>

            <form onSubmit={handleSaveUser} className="space-y-4 font-sans">
              
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nama Pengguna</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Muhammad Yusuf"
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Alamat Email</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="m.yusuf@keluarga.org"
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 font-mono text-slate-650"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Hak Peran</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as 'Admin' | 'Anggota')}
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden bg-white font-bold"
                  >
                    <option value="Anggota">Anggota</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Status Akses</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'Aktif' | 'Nonaktif')}
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden bg-white font-bold"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>

              </div>

              {/* Action buttons */}
              <div className="pt-2 flex flex-col gap-2">
                
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  {editingUser ? <Check size={14} /> : <Plus size={14} />}
                  <span>{editingUser ? 'TERAPKAN EDIT' : 'SIMPAN PENGGUNA'}</span>
                </button>

                {editingUser && (
                  <button
                    type="button"
                    onClick={handleCancelEditUser}
                    className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 font-bold text-xs py-2 rounded-xl transition-all"
                  >
                    Batal Edit
                  </button>
                )}

              </div>

            </form>
          </div>

        </div>
      )}

    </div>
  );
}
