import { useMemo, useState } from 'react';
import { Member, ActivityLog } from '../types';
import GeografisMapCard from './GeografisMapCard';
import TaskDelegationCard from './TaskDelegationCard';
import { 
  Users, 
  Heart, 
  ImageIcon, 
  FileText, 
  Calendar, 
  ChevronRight, 
  Database,
  ArrowUpRight,
  TrendingUp,
  UserPlus,
  Edit,
  RefreshCw,
  Trash2,
  Cake,
  Gift,
  Bell,
  X,
  Send,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface DashboardViewProps {
  members: Member[];
  photosCount: number;
  logs: ActivityLog[];
  onViewChange: (view: string) => void;
  onSelectMember: (memberId: string) => void;
  isLinked: boolean;
  familyTitle: string;
  isDarkMode: boolean;
  onAddLog?: (tipe: 'tambah' | 'edit' | 'hapus' | 'sinkronisasi', deskripsi: string) => void;
  currentUser?: { role: 'Admin' | 'Anggota'; name: string } | null;
}

export default function DashboardView({
  members,
  photosCount,
  logs,
  onViewChange,
  onSelectMember,
  isLinked,
  familyTitle,
  isDarkMode,
  onAddLog,
  currentUser
}: DashboardViewProps) {

  // Current date info - anchor is 2026
  const CURRENT_YEAR = 2026;
  const CURRENT_MONTH = 6; // June (based on metadata June 2026)

  // 1. Calculate stats
  const stats = useMemo(() => {
    const total = members.length;
    
    // Nuclear Families defined as couples/heads
    // Let's find spouses or parents which represent households
    const households = new Set<string>();
    members.forEach(m => {
      if (m.pasanganId) {
        const sortedPair = [m.id, m.pasanganId].sort().join('-');
        households.add(sortedPair);
      }
    });
    // If no spouse, count single parent households
    members.forEach(m => {
      if ((m.ayahId || m.ibuId) && !m.pasanganId) {
        const parentId = m.ayahId || m.ibuId;
        if (parentId) households.add(parentId);
      }
    });

    const totalHouseholds = households.size || Math.round(total / 4) || 1;

    // Calculate maximum generations level
    let maxGen = 1;
    members.forEach(m => {
      if (m.generasi && m.generasi > maxGen) {
        maxGen = m.generasi;
      }
    });

    return {
      total,
      households: totalHouseholds, // "Keluarga Inti / Hubs"
      photos: photosCount,
      generations: maxGen // "Generasi"
    };
  }, [members, photosCount]);

  // 2. Demographic age groups calculation
  const demographicData = useMemo(() => {
    let groupUnder10 = 0;   // 0-10
    let group11to25 = 0;  // 11-25
    let group26to45 = 0;  // 26-45
    let group46to60 = 0;  // 46-60
    let groupAbove60 = 0; // 60+

    members.forEach(m => {
      if (!m.tanggalLahir) {
        // Fallback guess based on generation level to keep chart populated
        const gen = m.generasi || 2;
        if (gen === 1) groupAbove60++;
        else if (gen === 2) group46to60++;
        else group11to25++;
        return;
      }

      // Parse birth year
      const birthYear = parseInt(m.tanggalLahir.split('-')[0]);
      if (isNaN(birthYear)) {
        group26to45++;
        return;
      }

      const age = CURRENT_YEAR - birthYear;
      if (age <= 10) groupUnder10++;
      else if (age <= 25) group11to25++;
      else if (age <= 45) group26to45++;
      else if (age <= 60) group46to60++;
      else groupAbove60++;
    });

    return [
      { name: '0-10 Thn', jumlah: groupUnder10, color: '#3b82f6' },   // blue
      { name: '11-25 Thn', jumlah: group11to25, color: '#10b981' },  // emerald
      { name: '26-45 Thn', jumlah: group26to45, color: '#f59e0b' },  // amber
      { name: '46-60 Thn', jumlah: group46to60, color: '#ec4899' },  // pink
      { name: '60+ Thn', jumlah: groupAbove60, color: '#8b5cf6' },   // violet
    ];
  }, [members]);

  // 3. Birthdays this month (June)
  const birthdaysThisMonth = useMemo(() => {
    return members.filter(m => {
      if (!m.tanggalLahir || m.statusHidup === 'Wafat') return false;
      
      const parts = m.tanggalLahir.split('-');
      if (parts.length < 2) return false;
      const month = parseInt(parts[1]);
      return month === CURRENT_MONTH;
    }).map(m => {
      const parts = m.tanggalLahir!.split('-');
      const day = parseInt(parts[2]);
      const birthYear = parseInt(parts[0]);
      const age = CURRENT_YEAR - birthYear;
      return {
        member: m,
        day,
        age
      };
    }).sort((a, b) => a.day - b.day);
  }, [members]);

  // 4. Recently added members (last 3)
  const recentlyAdded = useMemo(() => {
    // Return last 3 members (or based on numeric order ids / slice)
    return [...members].slice(-3).reverse();
  }, [members]);

  // Helper date Indonesian formatting
  const formatDateIndo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Baru saja';
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Baru saja';
    }
  };

  // 5. Calculate upcoming birthdays in next 7 days based on simulated current local date June 10, 2026
  const upcomingBirthdays = useMemo(() => {
    const today = new Date(2026, 5, 10); // June 10, 2026 (based on system local time anchor)
    
    const results: {
      member: Member;
      daysCount: number;
      age: number;
      dateString: string;
    }[] = [];
    
    members.forEach(m => {
      if (!m.tanggalLahir || m.statusHidup === 'Wafat') return;
      
      const parts = m.tanggalLahir.split('-');
      if (parts.length < 3) return;
      
      const birthYear = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // 0-indexed
      const day = parseInt(parts[2]);
      
      // Target birthday standardizing on 2026
      let bday = new Date(2026, month, day);
      
      // Calculate difference in days
      let diffMs = bday.getTime() - today.getTime();
      let diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        bday = new Date(2027, month, day);
        diffMs = bday.getTime() - today.getTime();
        diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      }
      
      if (diffDays >= 0 && diffDays <= 7) {
        const age = 2026 - birthYear;
        const monthNames = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        results.push({
          member: m,
          daysCount: diffDays,
          age,
          dateString: `${day} ${monthNames[month]}`
        });
      }
    });
    
    return results.sort((a, b) => a.daysCount - b.daysCount);
  }, [members]);

  // Modal & notification states for birthday wishes
  const [selectedBirthdayMember, setSelectedBirthdayMember] = useState<{
    member: Member;
    age: number;
    daysCount: number;
  } | null>(null);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [greetSuccess, setGreetSuccess] = useState<boolean>(false);
  const [greetChannelUsed, setGreetChannelUsed] = useState<'wa' | 'portal' | null>(null);

  // Trigger modal launch
  const handleOpenGreetModal = (m: Member, age: number, daysCount: number) => {
    setSelectedBirthdayMember({ member: m, age, daysCount });
    const defaultTemplate = `Barakallah fii umrik ${m.nama} sayang! Selamat ulang tahun yang ke-${age}. Semoga panjang umur, senantiasa dilimpahi berkah kesehatan, keselamatan, rezeki yang lancar, dan terus membawa sukacita di keluarga besar kita. Amin!`;
    setCustomMessage(defaultTemplate);
    setGreetSuccess(false);
    setGreetChannelUsed(null);
  };

  // Perform portal log entry / save wish
  const handleSubmitPortalWish = () => {
    if (!selectedBirthdayMember || !onAddLog) return;
    
    const { member, age } = selectedBirthdayMember;
    
    onAddLog(
      'sinkronisasi', 
      `Mengirimkan Doa & Ucapan Selamat Ulang Tahun Ke-${age} untuk "${member.nama}" di Portal Silsilah: "${customMessage}"`
    );
    
    setGreetChannelUsed('portal');
    setGreetSuccess(true);
    setTimeout(() => {
      setSelectedBirthdayMember(null);
      setGreetSuccess(false);
    }, 2200);
  };

  // Send via WhatsApp
  const handleSendWhatsAppWish = () => {
    if (!selectedBirthdayMember) return;
    
    if (onAddLog) {
      onAddLog(
        'sinkronisasi', 
        `Meneruskan Pesan Ucapan Ultah Ke-${selectedBirthdayMember.member.nama} lewat integrasi chat WhatsApp.`
      );
    }
    
    const tokenMsg = encodeURIComponent(customMessage);
    const waUrl = `https://api.whatsapp.com/send?text=${tokenMsg}`;
    
    // Explicitly open the WhatsApp link
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    
    setGreetChannelUsed('wa');
    setGreetSuccess(true);
    setTimeout(() => {
      setSelectedBirthdayMember(null);
      setGreetSuccess(false);
    }, 2200);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Hero Info */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 text-white border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-mono text-blue-400 uppercase tracking-widest">
              <Database size={13} />
              <span>Silsilah Terintegrasi Cloud</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">{familyTitle}</h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl font-sans">
              Selamat datang di portal genealogy interaktif. Kelola silsilah, hubungkan database Google Sheet, lacak ulang tahun keluarga, dan unggah dokumentasi album bersama.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => onViewChange('tree')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-md shadow-blue-900/30 flex items-center gap-1.5"
            >
              Lihat Pohon Silsilah
              <ArrowUpRight size={14} />
            </button>
            <button
              onClick={() => onViewChange('integration')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white rounded-lg text-xs font-semibold tracking-wide border border-slate-700 transition-all"
            >
              Atur Google Sheets
            </button>
          </div>
        </div>
      </div>

      {/* NOTIFIKASI OTOMATIS: ANGGOTA KELUARGA YANG BERULANG TAHUN DALAM 7 HARI KE DEPAN */}
      <div id="automatic-birthday-reminder" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs font-sans">
        <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl text-rose-500 dark:text-rose-400 shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider leading-none">Notifikasi Otomatis Ulang Tahun Terdekat</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Sistem memonitor daftar anggota keluarga besar yang berulang tahun dalam 7 hari ke depan.</p>
            </div>
          </div>
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/10 rounded-md shrink-0">
            HUT 7 HARI DEPAN
          </span>
        </div>

        {upcomingBirthdays.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-slate-50/50 dark:bg-slate-950/10 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <span className="text-xl shrink-0">🌸</span>
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Hubungan Keluarga Harmonis</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Tidak ada anggota keluarga yang berulang tahun dalam 7 hari ke depan. Tetaplah terhubung untuk mempererat silaturahmi!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingBirthdays.map(({ member, daysCount, age, dateString }) => {
              const isToday = daysCount === 0;
              return (
                <div 
                  key={member.id}
                  className={`flex flex-col justify-between p-4 rounded-xl border transition-all ${
                    isToday 
                      ? 'bg-rose-50/30 dark:bg-rose-950/15 border-rose-200 dark:border-rose-900/40 shadow-xs' 
                      : 'bg-amber-50/15 dark:bg-amber-950/10 border-amber-100/50 dark:border-amber-900/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src={member.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                        alt={member.nama} 
                        referrerPolicy="no-referrer"
                        className={`w-9.5 h-9.5 rounded-full object-cover border-2 shrink-0 ${
                          isToday ? 'border-rose-400' : 'border-amber-300'
                        }`}
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">{member.nama}</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">🎂 {dateString}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {isToday ? (
                        <span className="inline-block text-[9px] font-black tracking-widest text-white bg-rose-500 px-2 py-0.5 rounded-full animate-pulse uppercase leading-none">
                          HARI INI
                        </span>
                      ) : (
                        <span className="inline-block text-[9px] font-bold tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full uppercase leading-none">
                          {daysCount} Hari Lagi
                        </span>
                      )}
                      <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 font-mono mt-1">HUT Ke-{age}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectMember(member.id)}
                      className="flex-1 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center border border-slate-150 dark:border-slate-750"
                    >
                      Profil Detail
                    </button>
                    <button
                      onClick={() => handleOpenGreetModal(member, age, daysCount)}
                      className={`flex-1 py-1.5 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                        isToday 
                          ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/10' 
                          : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/10'
                      }`}
                    >
                      <Sparkles size={11} className="animate-pulse" />
                      <span>Kirim Ucapan</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STATS grid-cols-4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-100 flex items-center justify-between hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Total Anggota</p>
            <p className="text-2xl font-black text-slate-800 mt-1 font-mono">{stats.total}</p>
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-sm mt-1 inline-block">Terdaftar Aktif</span>
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
            <Users size={22} className="stroke-2" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-100 flex items-center justify-between hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Keluarga Inti / Hubs</p>
            <p className="text-2xl font-black text-slate-800 mt-1 font-mono">{stats.households}</p>
            <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded-sm mt-1 inline-block">Pilar Rumah Tangga</span>
          </div>
          <div className="p-3.5 bg-pink-50 text-pink-500 rounded-xl">
            <Heart size={22} className="stroke-2 fill-pink-50" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-100 flex items-center justify-between hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Album Bersama</p>
            <p className="text-2xl font-black text-slate-800 mt-1 font-mono">{stats.photos}</p>
            <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded-sm mt-1 inline-block">Kenangan Foto</span>
          </div>
          <div className="p-3.5 bg-yellow-50 text-amber-500 rounded-xl">
            <ImageIcon size={22} className="stroke-2" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-100 flex items-center justify-between hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Jumlah Generasi</p>
            <p className="text-2xl font-black text-slate-800 mt-1 font-mono">{stats.generations}</p>
            <span className="text-[10px] text-teal-600 font-semibold bg-teal-50 px-1.5 py-0.5 rounded-sm mt-1 inline-block">Garis Silsilah</span>
          </div>
          <div className="p-3.5 bg-teal-50 text-teal-600 rounded-xl">
            <FileText size={22} className="stroke-2" />
          </div>
        </div>
      </div>

      {/* Demographic and Birthday row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART Column - Demographics */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-xs border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm tracking-tight uppercase">Sebaran Profil Generasi & Demografi</h3>
                <p className="text-xs text-slate-400">Distribusi usia seluruh anggota silsilah terdaftar saat ini</p>
              </div>
              <div className="text-[10px] font-mono font-medium text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded inline-block">
                UNIT: ORANG
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={demographicData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ 
                      borderRadius: '8px', 
                      borderColor: '#e2e8f0', 
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                  />
                  <Bar dataKey="jumlah" radius={[4, 4, 0, 0]}>
                    {demographicData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Balita/Anak (0-10)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Remaja/Pemuda (11-25)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Produktif (26-45)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-pink-500" /> Paruh Baya (46-60)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-violet-500" /> Lansia (60+)
            </span>
          </div>
        </div>

        {/* BIRTHDAY WIDGET Column */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
              <h3 className="font-bold text-slate-800 text-sm tracking-tight uppercase flex items-center gap-2">
                🎂 HUT Bulan Juni ({CURRENT_MONTH})
              </h3>
              <Calendar size={16} className="text-pink-500 animate-bounce" />
            </div>

            {birthdaysThisMonth.length === 0 ? (
              <div className="text-slate-400 text-xs italic text-center py-16 flex flex-col items-center gap-2">
                <span className="text-2xl">☘️</span>
                Tidak ada ulang tahun bulan ini.
              </div>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {birthdaysThisMonth.map((item) => (
                  <div 
                    key={item.member.id}
                    onClick={() => onSelectMember(item.member.id)}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-slate-50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={item.member.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                        alt={item.member.nama} 
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 leading-tight line-clamp-1">{item.member.nama}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Tanggal {item.day} Juni • Gen {item.member.generasi}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full font-mono">
                        {item.age} Thn
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button 
            onClick={() => onViewChange('members')}
            className="w-full mt-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
          >
            LIHAT KALENDER / ANGGOTA LENGKAP
            <ChevronRight size={14} />
          </button>
        </div>

      </div>

      {/* SEBARAN GEOGRAFIS MAP SECTION */}
      <GeografisMapCard 
        members={members} 
        onSelectMember={onSelectMember} 
        isDarkMode={isDarkMode} 
      />

      {/* DELEGASI TUGAS PENELITIAN SILSILAH SECTION */}
      <TaskDelegationCard 
        members={members}
        currentUser={currentUser}
        onAddLog={onAddLog}
      />

      {/* Recents: New Members & Log Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* New Members column */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-100">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
            <div>
              <h3 className="font-bold text-slate-800 text-sm tracking-tight">ANGGOTA BARU DITAMBAHKAN</h3>
              <p className="text-xs text-slate-400">Anggota yang baru saja dimasukkan ke database</p>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Histori Jaringan</span>
          </div>

          <div className="space-y-4">
            {recentlyAdded.map((item) => (
              <div 
                key={item.id}
                onClick={() => onSelectMember(item.id)}
                className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={item.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                    alt={item.nama}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 bg-slate-100 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 mb-0.5 leading-tight">{item.nama}</h4>
                    <p className="text-[10px] text-slate-400">{item.pekerjaan || 'Ibu Rumah Tangga'} • {item.domisili || 'Klaten'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[9px] font-mono font-medium px-2 py-0.5 rounded ${
                    item.gender === 'L' ? 'bg-sky-50 text-sky-600 border border-sky-100' : 'bg-pink-50 text-pink-600 border border-pink-100'
                  }`}>
                    {item.gender === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN'}
                  </span>
                  <p className="text-[9px] text-slate-400 mt-1">Generasi {item.generasi || 3}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log column */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-100">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
            <div>
              <h3 className="font-bold text-slate-800 text-sm tracking-tight">LOG AKTIVITAS PERUBAHAN</h3>
              <p className="text-xs text-slate-400">Catatan riwayat sinkronisasi & aksi database</p>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Audit Trail</span>
          </div>

          <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1 select-none">
            {logs.slice(0, 6).map((log) => {
              // Icon selector
              let iconNode = <RefreshCw size={13} className="text-slate-400" />;
              let colorClasses = 'bg-slate-50 text-slate-600';
              if (log.tipe === 'tambah') {
                iconNode = <UserPlus size={13} className="text-emerald-500" />;
                colorClasses = 'bg-emerald-50 text-emerald-600';
              } else if (log.tipe === 'edit') {
                iconNode = <Edit size={13} className="text-amber-500" />;
                colorClasses = 'bg-amber-50 text-amber-600';
              } else if (log.tipe === 'hapus') {
                iconNode = <Trash2 size={13} className="text-rose-500" />;
                colorClasses = 'bg-rose-50 text-rose-600';
              } else if (log.tipe === 'sinkronisasi') {
                iconNode = <RefreshCw size={13} className="text-blue-500 animate-spin-slow" />;
                colorClasses = 'bg-blue-50 text-blue-600';
              }

              return (
                <div key={log.id} className="flex gap-3 text-xs leading-none">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${colorClasses}`}>
                    {iconNode}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 text-xs font-medium leading-normal break-words">{log.deskripsi}</p>
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">{formatDateIndo(log.timestamp)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* WISH / GREET BIRTHDAY MODAL POPUP */}
      {selectedBirthdayMember && (
        <div id="birthday-greeting-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="bg-rose-500 text-white p-2 rounded-xl">
                  <Cake size={18} className="animate-bounce" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider leading-none">Kirim Kartu Ucapan Milad</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Tali asih & doa tulus memperhangat silaturahmi keluarga</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedBirthdayMember(null)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              
              {/* Member card info */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <img 
                  src={selectedBirthdayMember.member.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                  alt={selectedBirthdayMember.member.nama} 
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover border-2 border-rose-400/80 bg-white"
                />
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-none">{selectedBirthdayMember.member.nama}</h4>
                  <p className="text-[11px] text-rose-500 dark:text-rose-400 font-bold mt-1.5 uppercase tracking-wider">
                    {selectedBirthdayMember.daysCount === 0 ? 'Sedang Berulang Tahun Hari Ini!' : `Berulang Tahun dalam ${selectedBirthdayMember.daysCount} hari lagi`}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Ulang tahun ke-{selectedBirthdayMember.age} (Lahir {selectedBirthdayMember.member.tanggalLahir})</p>
                </div>
              </div>

              {/* Success Alert state */}
              {greetSuccess ? (
                <div className="p-6 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl animate-in slide-in-from-bottom-2 duration-200">
                  <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-base font-bold">
                    ✓
                  </div>
                  <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Ucapan Selamat Terkirim!</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto font-medium">
                    {greetChannelUsed === 'wa' 
                      ? 'Berhasil dialihkan ke aplikasi WhatsApp Web/Mobile untuk mengirim pesan langsung kepada kerabat keluarga Anda.' 
                      : 'Ucapan & Doa mulia Anda telah dicatat dan disemarakkan di Buku Log Aktivitas Portal Silsilah secara permanen!'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Preset Templates */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Format Ucapan Siap Pakai:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          const msg = `Selamat ulang tahun yang ke-${selectedBirthdayMember.age} untuk ${selectedBirthdayMember.member.nama}. Semoga senantiasa diberikan kelimpahan berkah, kesehatan yang prima, kebahagiaan, dan kemudahan dalam segala urusan. Amin ya rabbal alamin.`;
                          setCustomMessage(msg);
                        }}
                        className="p-2.5 border border-slate-100 dark:border-slate-800/80 hover:border-rose-300 dark:hover:border-rose-800 bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100/50 dark:hover:bg-slate-900 text-left rounded-lg text-[10px] text-slate-600 dark:text-slate-300 font-medium transition-all"
                      >
                        <strong className="block text-rose-500 mb-0.5">🌸 Islami / Doa</strong>
                        Dilimpahi berkah kesehatan, kemudahan urusan...
                      </button>
                      <button
                        onClick={() => {
                          const msg = `Selamat hari jadi ke-${selectedBirthdayMember.age}, ${selectedBirthdayMember.member.nama}! Sangat bersyukur memilikimu di keluarga besar kita. Semoga makin sukses, panjang umur, sehat selalu, dan cita-citanya tercapai. Doa kami sekeluarga menyertaimu selalu!`;
                          setCustomMessage(msg);
                        }}
                        className="p-2.5 border border-slate-100 dark:border-slate-800/80 hover:border-rose-300 dark:hover:border-rose-800 bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100/50 dark:hover:bg-slate-900 text-left rounded-lg text-[10px] text-slate-600 dark:text-slate-300 font-medium transition-all"
                      >
                        <strong className="block text-rose-500 mb-0.5">❤️ Keluarga Besar</strong>
                        Sangat bersyukur memilikimu di keluarga...
                      </button>
                      <button
                        onClick={() => {
                          const msg = `HBD ke-${selectedBirthdayMember.age} ${selectedBirthdayMember.member.nama}! 🎉 Semoga tahun ini dipenuhi tawa, cinta, dan rezeki yang lancar. Sukses selalu dalam karir dan aktivitasmu!`;
                          setCustomMessage(msg);
                        }}
                        className="p-2.5 border border-slate-100 dark:border-slate-800/80 hover:border-rose-300 dark:hover:border-rose-800 bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100/50 dark:hover:bg-slate-900 text-left rounded-lg text-[10px] text-slate-600 dark:text-slate-300 font-medium transition-all"
                      >
                        <strong className="block text-rose-500 mb-0.5">⚡ Santai / Ceria</strong>
                        HBD! Semoga tahun ini penuh cinta & rezeki...
                      </button>
                    </div>
                  </div>

                  {/* Textarea editor */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block font-mono">Tulis Sendiri / Edit Pesan:</label>
                    <textarea 
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Tuliskan ucapan ultah yang hangat..."
                      className="w-full h-24 p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                    />
                  </div>
                </>
              )}

            </div>

            {/* Modal Footer Controls */}
            {!greetSuccess && (
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col sm:flex-row items-center gap-3 justify-end">
                <button
                  onClick={() => setSelectedBirthdayMember(null)}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Batal
                </button>
                
                <button
                  onClick={handleSubmitPortalWish}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare size={14} />
                  <span>Semarakkan di Portal</span>
                </button>

                <button
                  onClick={handleSendWhatsAppWish}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send size={12} />
                  <span>Kirim via WhatsApp</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
