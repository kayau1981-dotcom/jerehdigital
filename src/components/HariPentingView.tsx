import { useState, useMemo, FormEvent } from 'react';
import { Member } from '../types';
import { 
  Calendar, 
  Cake, 
  Heart, 
  BookOpen, 
  Sparkles, 
  Plus, 
  Trash2, 
  Gift, 
  Clock, 
  MapPin, 
  BellRing,
  Award
} from 'lucide-react';

export interface FamilyEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD or MM-DD
  type: 'Lahir' | 'Kematian' | 'Pernikahan' | 'Reuni' | 'Pencapaian';
  description: string;
  location?: string;
}

interface HariPentingProps {
  members: Member[];
  onAddLog: (tipe: 'tambah' | 'edit' | 'hapus' | 'sinkronisasi', deskripsi: string) => void;
}

const INITIAL_EVENTS: FamilyEvent[] = [
  {
    id: 'E01',
    title: 'Halal Bihalal Silsilah Keluarga Joyo Sutiko',
    date: '2026-04-12',
    type: 'Reuni',
    description: 'Silaturahmi agung mempererat persaudaraan seluruh keturunan Mbah Joyo Sutiko di Solo.',
    location: 'Solo (Griya Joyo Sutiko)'
  },
  {
    id: 'E02',
    title: 'Peringatan Haul Mbah H. Joyo Sutiko',
    date: '11-05', // Anniversary-based date
    type: 'Kematian',
    description: 'Doa bersama mengenang jasa dan sejarah perjuangan almarhum sesepuh Mbah Joyo Sutiko.',
    location: 'Masjid Jami Al-Hidayah Solo'
  },
  {
    id: 'E03',
    title: 'Ulang Tahun Pernikahan Emas Mbah Joyo & Nenek Marsilah',
    date: '11-12',
    type: 'Pernikahan',
    description: 'Syukuran hari jadi ikatan kasih suci pernikahan bersejarah generasi pertama.',
    location: 'Yogyakarta'
  }
];

export default function HariPentingView({ members, onAddLog }: HariPentingProps) {
  const [events, setEvents] = useState<FamilyEvent[]>(() => {
    try {
      const stored = localStorage.getItem('silsilah_events_db');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_EVENTS;
  });

  const [filterType, setFilterType] = useState<string>('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Event Form
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<FamilyEvent['type']>('Reuni');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  // Dynamically extract birthdays of all living members to compile automatic birthday events!
  const generatedMemberBirthdays = useMemo(() => {
    const bdays: FamilyEvent[] = [];
    members.forEach(m => {
      if (m.tanggalLahir && m.statusHidup === 'Hidup') {
        // Extract month & day
        const parts = m.tanggalLahir.split('-');
        if (parts.length >= 3) {
          const md = `${parts[1]}-${parts[2]}`;
          bdays.push({
            id: `B_AUTO_${m.id}`,
            title: `Hari Jadi / Milad ${m.nama}`,
            date: md,
            type: 'Lahir',
            description: `Ulang tahun ${m.nama}. Generasi ke-${m.generasi || 3}. Hubungi dan kirimkan doa restu!`,
            location: m.domisili || 'Rumah Masing-masing'
          });
        }
      }
    });
    return bdays;
  }, [members]);

  // Combined all events
  const allEvents = useMemo(() => {
    const list = [...events, ...generatedMemberBirthdays];
    
    // Sort events by chronological upcoming relevance (by month & day)
    return list.sort((a, b) => {
      const getMonthAndDay = (dateStr: string) => {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          return `${parts[1]}-${parts[2]}`;
        }
        return dateStr;
      };

      const mdA = getMonthAndDay(a.date);
      const mdB = getMonthAndDay(b.date);
      return mdA.localeCompare(mdB);
    });
  }, [events, generatedMemberBirthdays]);

  // Filter criteria
  const filteredEvents = useMemo(() => {
    if (filterType === 'Semua') return allEvents;
    return allEvents.filter(e => e.type === filterType);
  }, [allEvents, filterType]);

  const handleCreateEvent = (e: FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    const newEvent: FamilyEvent = {
      id: `Event_${Math.random().toString(36).substring(2, 9)}`,
      title,
      date,
      type,
      description,
      location: location || undefined
    };

    const updated = [newEvent, ...events];
    setEvents(updated);
    localStorage.setItem('silsilah_events_db', JSON.stringify(updated));
    onAddLog('tambah', `Menambahkan jadwal penting baru: ${title}`);

    // Clean up
    setTitle('');
    setDate('');
    setType('Reuni');
    setDescription('');
    setLocation('');
    setIsModalOpen(false);
  };

  const handleDeleteEvent = (id: string, name: string) => {
    if (id.startsWith('B_AUTO_')) {
      alert('Jadwal ini tergenerasi otomatis secara dinamis dari tanggal lahir anggota. Silakan edit profil anggota langsung jika ingin merubah lahir.');
      return;
    }

    if (confirm(`Apakah Anda yakin menghapus rangkaian peringatan "${name}"?`)) {
      const updated = events.filter(e => e.id !== id);
      setEvents(updated);
      localStorage.setItem('silsilah_events_db', JSON.stringify(updated));
      onAddLog('hapus', `Menghapus jadwal kegiatan: ${name}`);
    }
  };

  const getEventIcon = (type: FamilyEvent['type']) => {
    switch (type) {
      case 'Lahir': return <Cake className="text-pink-500" size={18} />;
      case 'Kematian': return <BookOpen className="text-slate-500" size={18} />;
      case 'Pernikahan': return <Heart className="text-rose-500" size={18} />;
      case 'Reuni': return <Sparkles className="text-indigo-500" size={18} />;
      case 'Pencapaian': return <Award className="text-yellow-500" size={18} />;
    }
  };

  const getEventBg = (type: FamilyEvent['type']) => {
    switch (type) {
      case 'Lahir': return 'bg-pink-50 border-pink-100 text-pink-700';
      case 'Kematian': return 'bg-slate-100 border-slate-200 text-slate-700';
      case 'Pernikahan': return 'bg-rose-50 border-rose-100 text-rose-700';
      case 'Reuni': return 'bg-indigo-50 border-indigo-100 text-indigo-700';
      case 'Pencapaian': return 'bg-yellow-50 border-yellow-100 text-yellow-800';
    }
  };

  const formatEventDate = (dateStr: string) => {
    // If MM-DD
    const parts = dateStr.split('-');
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    if (parts.length === 2) {
      const monthIdx = parseInt(parts[0], 10) - 1;
      return `${parseInt(parts[1], 10)} ${months[monthIdx] || parts[0]}`;
    } else if (parts.length === 3) {
      const monthIdx = parseInt(parts[1], 10) - 1;
      return `${parseInt(parts[2], 10)} ${months[monthIdx] || parts[1]} ${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight uppercase flex items-center gap-2">
            <Calendar size={16} className="text-rose-500" />
            Kalender Hari Penting & Kegiatan Keluarga
          </h2>
          <p className="text-xs text-slate-400 mt-1">Ingat milad, reuni, syukuran, pernikahan emas, haul leluhur, serta pencapaian sakral keturunan</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-rose-600 hover:bg-rose-500 hover:scale-102 transition-all text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/10"
        >
          <Plus size={15} />
          TAMBAH JADWAL
        </button>
      </div>

      {/* Navigation Filter Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['Semua', 'Lahir', 'Reuni', 'Pernikahan', 'Kematian', 'Pencapaian'].map((typeOption) => (
          <button
            key={typeOption}
            onClick={() => setFilterType(typeOption)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
              filterType === typeOption 
                ? 'bg-rose-600 border-rose-600 text-white shadow-xs' 
                : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'
            }`}
          >
            {typeOption === 'Semua' ? 'Semua Kategori' : typeOption}
          </button>
        ))}
      </div>

      {/* Event Timeline Content */}
      {filteredEvents.length > 0 ? (
        <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-3xs p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 divide-y divide-slate-100">
            {filteredEvents.map((evt) => {
              const isAuto = evt.id.startsWith('B_AUTO_');
              return (
                <div 
                  key={evt.id} 
                  id={`event-${evt.id}`}
                  className="py-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 px-2 rounded-xl transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Badge left */}
                    <div className={`p-3 rounded-2xl shrink-0 border flex flex-col items-center justify-center ${getEventBg(evt.type)}`}>
                      {getEventIcon(evt.type)}
                      <span className="text-[8px] uppercase font-bold tracking-wide mt-1 block leading-none">{evt.type}</span>
                    </div>

                    {/* Middle summary */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                          {evt.title}
                        </h4>
                        {isAuto && (
                          <span className="text-[8px] font-mono font-bold bg-pink-100 border border-pink-200 text-pink-700 px-1.5 py-0.5 rounded-sm shrink-0 uppercase">
                            Dinamis AI
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-500 leading-normal max-w-2xl font-sans">
                        {evt.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-[11px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-slate-300" />
                          {formatEventDate(evt.date)}
                        </span>
                        {evt.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-slate-300" />
                            {evt.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions (Delete button) */}
                  <div className="self-end sm:self-center shrink-0">
                    {!isAuto ? (
                      <button
                        onClick={() => handleDeleteEvent(evt.id, evt.title)}
                        className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-slate-100 transition-all"
                        title="Hapus Kegitan"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <BellRing size={12} className="animate-bounce" />
                        Aktif
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white p-16 rounded-2xl border border-slate-150 shadow-3xs flex flex-col items-center text-center">
          <Calendar size={48} className="text-slate-350 animate-pulse mb-3" />
          <h3 className="font-bold text-slate-700 text-sm uppercase font-mono tracking-widest">Tidak Ada Jadwal</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
            Tidak ada peringatan terdaftar dalam filter ini. Klik tambah jadwal di kanan atas untuk menyematkan hajat keluarga baru.
          </p>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="bg-slate-900 text-white p-5">
              <h3 className="font-bold text-sm tracking-wide uppercase font-mono">Tambah Jadwal Penting</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Sematkan peringatan tahunan atau seketika untuk keluarga</p>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Judul Peringatan / Agenda</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Reuni Akbar Lebaran Kedua"
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-rose-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Jenis Kegiatan</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as FamilyEvent['type'])}
                      className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-rose-500 font-medium"
                    >
                      <option value="Reuni">Reuni / Kumpulan</option>
                      <option value="Lahir">Ulang Tahun / Milad</option>
                      <option value="Pernikahan">Wedding / Syukuran</option>
                      <option value="Kematian">Mati / Haul Leluhur</option>
                      <option value="Pencapaian">Pencapaian / Prestasi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Tanggal (Bulan & Hari)</label>
                    <input
                      type="text"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder="Format: MM-DD atau YYYY-MM-DD"
                      className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Lokasi Tempat Berlangsung</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Contoh: Rumah Solo Utama"
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-rose-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Keterangan Ringkas</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Masukkan detail tambahan tentang acara atau upeti kado yang disarankan dsb."
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-rose-500 font-medium"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl"
                >
                  SIMPAN JADWAL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
