import { useState, useMemo, FormEvent } from 'react';
import { Member } from '../types';
import { 
  Search, 
  UserPlus, 
  Download, 
  Trash2, 
  Edit, 
  LayoutGrid, 
  Table, 
  Filter,
  CheckCircle,
  AlertCircle,
  X,
  User,
  Heart,
  Settings,
  PhoneCall,
  QrCode,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Eraser
} from 'lucide-react';
import { generateTemplateCSV, downloadFile } from '../utils/csv';

interface DaftarAnggotaViewProps {
  members: Member[];
  onAddMember: (newMember: Member) => void;
  onUpdateMember: (updatedMember: Member) => void;
  onDeleteMember: (id: string) => void;
  onAddLog: (tipe: 'tambah' | 'edit' | 'hapus' | 'sinkronisasi', deskripsi: string) => void;
  onSelectMember?: (id: string) => void;
}

export default function DaftarAnggotaView({
  members,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onAddLog,
  onSelectMember
}: DaftarAnggotaViewProps) {
  
  const [search, setSearch] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<'A' | 'L' | 'P'>('A');
  const [statusFilter, setStatusFilter] = useState<'A' | 'H' | 'W'>('A');
  const [generationFilter, setGenerationFilter] = useState<number | 'A'>('A');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Advanced filters states
  const [ageRangeFilter, setAgeRangeFilter] = useState<'A' | 'anak' | 'remaja' | 'dewasa' | 'lansia'>('A');
  const [cityFilter, setCityFilter] = useState<string>('A');
  const [occupationFilter, setOccupationFilter] = useState<string>('A');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);
  
  // Modal controllers
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedQRMember, setSelectedQRMember] = useState<Member | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Member>>({
    id: '',
    nama: '',
    gender: 'L',
    statusHidup: 'Hidup',
    tanggalLahir: '',
    tempatLahir: '',
    tanggalWafat: '',
    pekerjaan: '',
    telepon: '',
    email: '',
    domisili: '',
    foto: '',
    catatan: '',
    ayahId: '',
    ibuId: '',
    pasanganId: '',
  });

  // Unique list of generational numbers
  const generations = useMemo(() => {
    const set = new Set<number>();
    members.forEach(m => {
      if (m.generasi) set.add(m.generasi);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [members]);

  // Unique lists of cleanly formatted cities and occupations
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    members.forEach(m => {
      if (m.domisili?.trim()) {
        set.add(m.domisili.trim());
      }
    });
    return Array.from(set).sort();
  }, [members]);

  const uniqueOccupations = useMemo(() => {
    const set = new Set<string>();
    members.forEach(m => {
      if (m.pekerjaan?.trim()) {
        set.add(m.pekerjaan.trim());
      }
    });
    return Array.from(set).sort();
  }, [members]);

  // Helper function to check if age is within selected category range
  const matchesAgeRange = (m: Member, range: 'A' | 'anak' | 'remaja' | 'dewasa' | 'lansia') => {
    if (range === 'A') return true;
    if (!m.tanggalLahir) return false;
    
    const parts = m.tanggalLahir.split('-');
    if (parts.length < 1) return false;
    const birthYear = parseInt(parts[0]);
    if (isNaN(birthYear)) return false;
    
    const age = 2026 - birthYear; // Unified with 2026 chronological anchor
    
    switch (range) {
      case 'anak': // 0-12 Years
        return age >= 0 && age <= 12;
      case 'remaja': // 13-18 Years
        return age >= 13 && age <= 18;
      case 'dewasa': // 19-55 Years
        return age >= 19 && age <= 55;
      case 'lansia': // 56+ Years Active elders
        return age >= 56;
      default:
        return true;
    }
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return members.filter((m) => {
      // Search
      const searchLower = search.toLowerCase();
      const matchSearch = m.nama.toLowerCase().includes(searchLower) ||
        (m.pekerjaan && m.pekerjaan.toLowerCase().includes(searchLower)) ||
        (m.domisili && m.domisili.toLowerCase().includes(searchLower));

      // Gender
      const matchGender = genderFilter === 'A' || m.gender === genderFilter;

      // Status
      const matchStatus = statusFilter === 'A' || 
        (statusFilter === 'H' && m.statusHidup === 'Hidup') ||
        (statusFilter === 'W' && m.statusHidup === 'Wafat');

      // Generation
      const matchGen = generationFilter === 'A' || m.generasi === generationFilter;

      // City / Domisili
      const matchCity = cityFilter === 'A' || (m.domisili && m.domisili.trim() === cityFilter);

      // Job / Pekerjaan
      const matchOccupation = occupationFilter === 'A' || (m.pekerjaan && m.pekerjaan.trim() === occupationFilter);

      // Age category
      const matchAge = matchesAgeRange(m, ageRangeFilter);

      return matchSearch && matchGender && matchStatus && matchGen && matchCity && matchOccupation && matchAge;
    });
  }, [members, search, genderFilter, statusFilter, generationFilter, cityFilter, occupationFilter, ageRangeFilter]);

  // Export database as CSV file
  const handleExportCSV = () => {
    try {
      const headers = ['ID', 'Nama Lengkap', 'Jenis Kelamin (L/P)', 'ID Ayah', 'ID Ibu', 'ID Pasangan', 'Tanggal Lahir (YYYY-MM-DD)', 'Tempat Lahir', 'Status (Hidup/Wafat)', 'Tanggal Wafat', 'Pekerjaan', 'Nomor Telepon', 'Email', 'Kota Tinggal', 'URL Foto', 'Catatan Keluarga'].join(',');
      
      const csvRows = filteredList.map(m => {
        return [
          `"${m.id}"`,
          `"${m.nama.replace(/"/g, '""')}"`,
          `"${m.gender}"`,
          `"${m.ayahId || ''}"`,
          `"${m.ibuId || ''}"`,
          `"${m.pasanganId || ''}"`,
          `"${m.tanggalLahir || ''}"`,
          `"${m.tempatLahir || ''}"`,
          `"${m.statusHidup}"`,
          `"${m.tanggalWafat || ''}"`,
          `"${m.pekerjaan || ''}"`,
          `"${m.telepon || ''}"`,
          `"${m.email || ''}"`,
          `"${m.domisili || ''}"`,
          `"${m.foto || ''}"`,
          `"${(m.catatan || '').replace(/"/g, '""')}"`
        ].join(',');
      });

      const csvContent = [headers, ...csvRows].join('\n');
      downloadFile(csvContent, 'database_silsilah_keluarga.csv', 'text/csv;charset=utf-8;');
      onAddLog('sinkronisasi', `Mengekspor ${filteredList.length} anggota ke format CSV.`);
    } catch (e) {
      console.error(e);
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingMember(null);
    setFormData({
      id: `M${String(members.length + 1).padStart(2, '0')}_${Math.random().toString(36).substr(2, 4)}`,
      nama: '',
      gender: 'L',
      statusHidup: 'Hidup',
      tanggalLahir: '',
      tempatLahir: '',
      tanggalWafat: '',
      pekerjaan: '',
      telepon: '',
      email: '',
      domisili: '',
      foto: '',
      catatan: '',
      ayahId: '',
      ibuId: '',
      pasanganId: '',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (m: Member) => {
    setEditingMember(m);
    setFormData({
      ...m,
      ayahId: m.ayahId || '',
      ibuId: m.ibuId || '',
      pasanganId: m.pasanganId || '',
      tanggalLahir: m.tanggalLahir || '',
      tempatLahir: m.tempatLahir || '',
      tanggalWafat: m.tanggalWafat || '',
      pekerjaan: m.pekerjaan || '',
      telepon: m.telepon || '',
      email: m.email || '',
      domisili: m.domisili || '',
      foto: m.foto || '',
      catatan: m.catatan || '',
    });
    setIsModalOpen(true);
  };

  // Save Modal Member Form
  const handleSaveForm = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.nama) return;

    // Convert empty relationship values to undefined
    const cleaned: Member = {
      id: formData.id || '',
      nama: formData.nama,
      gender: formData.gender as 'L' | 'P',
      statusHidup: formData.statusHidup as 'Hidup' | 'Wafat',
      ayahId: formData.ayahId || undefined,
      ibuId: formData.ibuId || undefined,
      pasanganId: formData.pasanganId || undefined,
      tanggalLahir: formData.tanggalLahir || undefined,
      tempatLahir: formData.tempatLahir || undefined,
      tanggalWafat: formData.tanggalWafat || undefined,
      pekerjaan: formData.pekerjaan || undefined,
      telepon: formData.telepon || undefined,
      email: formData.email || undefined,
      domisili: formData.domisili || undefined,
      foto: formData.foto || undefined,
      catatan: formData.catatan || undefined,
    };

    if (editingMember) {
      onUpdateMember(cleaned);
      onAddLog('edit', `Memperbarui profil anggota: ${cleaned.nama}`);
    } else {
      onAddMember(cleaned);
      onAddLog('tambah', `Menambahkan anggota baru: ${cleaned.nama}`);
    }
    setIsModalOpen(false);
  };

  // Delete Member Trigger
  const handleDeleteTrigger = (id: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus "${nama}" dari silsilah? Hubungan keluarga terkait mungkin akan terputus.`)) {
      onDeleteMember(id);
      onAddLog('hapus', `Menghapus anggota silsilah: ${nama}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search and control actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Input filter */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Cari berdasarkan nama, kota, profesi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500 placeholder-slate-400"
          />
        </div>

        {/* View mode toggle & Action triggers */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Card Gri vs spreadsheet list Table toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-slate-600 transition-all ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-blue-600' : 'hover:bg-slate-50'
              }`}
              title="Tampilan Grid Card"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-slate-600 transition-all ${
                viewMode === 'table' ? 'bg-white shadow-xs text-blue-600' : 'hover:bg-slate-50'
              }`}
              title="Tampilan Tabel Database"
            >
              <Table size={15} />
            </button>
          </div>

          {/* Export to CSV download */}
          <button
            id="export-to-csv-btn"
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white border border-transparent rounded-xl text-xs font-semibold shadow-md shadow-emerald-900/10 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Export all family members as a formatted CSV file"
          >
            <Download size={14} />
            Export to CSV
          </button>

          {/* Add member trigger */}
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md shadow-blue-900/10 flex items-center gap-1.5"
          >
            <UserPlus size={14} />
            Tambah Anggota
          </button>
        </div>

      </div>

      {/* Side filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-slate-400" />
          <span>Filter Pokok:</span>
        </div>

        {/* Gender Filter */}
        <div className="flex bg-slate-50 rounded-lg p-0.5 border border-slate-150">
          <button 
            type="button"
            onClick={() => setGenderFilter('A')}
            className={`px-3 py-1 rounded text-[11px] font-semibold leading-none cursor-pointer ${genderFilter === 'A' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'}`}
          >
            Semua Gender
          </button>
          <button 
            type="button"
            onClick={() => setGenderFilter('L')}
            className={`px-3 py-1 rounded text-[11px] font-semibold leading-none cursor-pointer ${genderFilter === 'L' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
          >
            ♂ Laki-Laki
          </button>
          <button 
            type="button"
            onClick={() => setGenderFilter('P')}
            className={`px-3 py-1 rounded text-[11px] font-semibold leading-none cursor-pointer ${genderFilter === 'P' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-500'}`}
          >
            ♀ Perempuan
          </button>
        </div>

        {/* Status Hidup Filter */}
        <div className="flex bg-slate-50 rounded-lg p-0.5 border border-slate-150">
          <button 
            type="button"
            onClick={() => setStatusFilter('A')}
            className={`px-3 py-1 rounded text-[11px] font-semibold leading-none cursor-pointer ${statusFilter === 'A' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'}`}
          >
            Semua Masa
          </button>
          <button 
            type="button"
            onClick={() => setStatusFilter('H')}
            className={`px-3 py-1 rounded text-[11px] font-semibold leading-none cursor-pointer ${statusFilter === 'H' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500'}`}
          >
            Hidup
          </button>
          <button 
            type="button"
            onClick={() => setStatusFilter('W')}
            className={`px-3 py-1 rounded text-[11px] font-semibold leading-none cursor-pointer ${statusFilter === 'W' ? 'bg-white text-slate-500 shadow-xs' : 'text-slate-500'}`}
          >
            Wafat (Alm)
          </button>
        </div>

        {/* Generation Filter */}
        <div className="flex bg-slate-50 rounded-lg p-0.5 border border-slate-150">
          <button 
            type="button"
            onClick={() => setGenerationFilter('A')}
            className={`px-3 py-1 rounded text-[11px] font-semibold leading-none cursor-pointer ${generationFilter === 'A' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'}`}
          >
            Semua Generasi
          </button>
          {generations.map((gen) => (
            <button 
              key={gen}
              type="button"
              onClick={() => setGenerationFilter(gen)}
              className={`px-3 py-1 rounded text-[11px] font-semibold leading-none cursor-pointer ${generationFilter === gen ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'}`}
            >
              Generasi {gen}
            </button>
          ))}
        </div>

        {/* Toggle Button for advanced filters */}
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
            isAdvancedOpen 
              ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <SlidersHorizontal size={12} />
          <span>Filter Lanjutan</span>
          {isAdvancedOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {/* Reset Filter Button */}
        {(genderFilter !== 'A' || statusFilter !== 'A' || generationFilter !== 'A' || ageRangeFilter !== 'A' || cityFilter !== 'A' || occupationFilter !== 'A' || search !== '') && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setGenderFilter('A');
              setStatusFilter('A');
              setGenerationFilter('A');
              setAgeRangeFilter('A');
              setCityFilter('A');
              setOccupationFilter('A');
            }}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-transparent transition-all cursor-pointer flex items-center gap-1 sm:ml-auto"
          >
            <Eraser size={11} />
            Reset Filter
          </button>
        )}

      </div>

      {/* COLLAPSIBLE ADVANCED FILTER GRID PANEL */}
      {isAdvancedOpen && (
        <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Column 1: Rentang Usia */}
          <div className="space-y-2">
            <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase block font-mono">Rentang Usia (HUT 2026):</span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { key: 'A', name: 'Semua Usia' },
                { key: 'anak', name: '👦 Anak (0-12 th)' },
                { key: 'remaja', name: '🎒 Remaja (13-18 th)' },
                { key: 'dewasa', name: '💼 Dewasa (19-55 th)' },
                { key: 'lansia', name: '👵 Lansia (56+ th)' },
              ].map(item => {
                const isActive = ageRangeFilter === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setAgeRangeFilter(item.key as any)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-left border transition-all ${
                      isActive 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-2xs' 
                        : 'bg-white hover:bg-slate-100 border-slate-200/80 text-slate-700 cursor-pointer'
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: Kota Tinggal / Domisili Dropdown */}
          <div className="space-y-2">
            <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase block font-mono">Kota Domisili Tinggal ({uniqueCities.length}):</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              <option value="A">📍 Semua Kota / Domisili</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <p className="text-[9.5px] text-slate-400 font-medium">Berdasarkan data kota tinggal para anggota keluarga besar.</p>
          </div>

          {/* Column 3: Kategori Pekerjaan / Profesi Dropdown */}
          <div className="space-y-2">
            <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase block font-mono">Kategori Profesi / Pekerjaan ({uniqueOccupations.length}):</label>
            <select
              value={occupationFilter}
              onChange={(e) => setOccupationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              <option value="A">💼 Semua Pekerjaan / Kegiatan</option>
              {uniqueOccupations.map(job => (
                <option key={job} value={job}>{job}</option>
              ))}
            </select>
            <p className="text-[9.5px] text-slate-400 font-medium">Berdasarkan aktivitas, profesi, atau karir anggota.</p>
          </div>

        </div>
      )}

      {/* Main Listing View container */}
      {filteredList.length === 0 ? (
        <div className="bg-white p-16 text-center rounded-2xl border border-slate-150 text-slate-400 font-sans italic text-xs">
          Tidak menemukan anggota keluarga yang cocok dengan kriteria filter Anda.
        </div>
      ) : viewMode === 'grid' ? (
        
        // GRID CARD VIEW (Mobile-friendly multi-columns)
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredList.map((m) => {
            const isMale = m.gender === 'L';
            return (
              <div 
                key={m.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-2xs hover:shadow-md hover:border-slate-200 transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Top Header Card */}
                  <div className={`h-11 relative ${
                    isMale ? 'bg-sky-50' : 'bg-pink-50'
                  }`}>
                    <span className="absolute top-2.5 right-3 text-[9px] font-mono font-bold text-slate-400 bg-white shadow-2xs px-2 py-0.5 rounded">
                      ID: {m.id}
                    </span>
                  </div>

                  {/* Body Details widget */}
                  <div className="p-4 pt-0 -mt-7 text-center relative">
                    <img 
                      src={m.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                      alt={m.nama} 
                      referrerPolicy="no-referrer"
                      className={`w-14 h-14 rounded-full object-cover border-4 border-white shadow-xs mx-auto ${
                        m.statusHidup === 'Wafat' ? 'filter grayscale border-slate-200' : ''
                      }`}
                    />
                    
                    <h3 className="font-bold text-slate-800 text-sm mt-2 leading-tight tracking-tight line-clamp-1">{m.nama}</h3>
                    <p className="text-[10px] text-slate-400 font-semibold font-mono mt-0.5 uppercase tracking-wide">
                      GENERASI {m.generasi || 1} • {isMale ? 'Laki-Laki' : 'Perempuan'}
                    </p>

                    <div className="mt-3 space-y-1 text-[11px] text-slate-500 text-left border-t border-slate-50 pt-2">
                      <p className="truncate">📍 {m.domisili || 'Solo, Jawa Tengah'}</p>
                      <p className="truncate">💼 {m.pekerjaan || 'Ibu Rumah Tangga'}</p>
                      {m.tanggalLahir && <p className="truncate">🎂 {m.tanggalLahir}</p>}
                    </div>

                    {m.statusHidup === 'Wafat' && (
                      <span className="mt-2.5 inline-block text-[8px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-500 tracking-wider">
                        ✝ WAFAT (ALMARHUM)
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 border-t border-slate-50 bg-slate-50/50 flex gap-2 justify-end opacity-90 group-hover:opacity-100">
                  <button
                    id={`qr-btn-${m.id}`}
                    onClick={() => setSelectedQRMember(m)}
                    className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 text-emerald-600 rounded-md transition-all cursor-pointer"
                    title="Buat Kartu QR Anggota"
                  >
                    <QrCode size={13} />
                  </button>
                  <button
                    onClick={() => openEditModal(m)}
                    className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 text-amber-500 rounded-md transition-all"
                    title="Ubah Rincian Profil"
                  >
                    <Edit size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteTrigger(m.id, m.nama)}
                    className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 text-rose-500 rounded-md transition-all"
                    title="Hapus dari Silsilah"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (

        // TABLE VIEW (Detailed, horizontal scrollable)
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <th className="p-4 font-semibold font-mono text-[10px]">ID</th>
                  <th className="p-4 font-semibold">NAMA LENGKAP</th>
                  <th className="p-4 font-semibold">GENDER</th>
                  <th className="p-4 font-semibold font-mono text-[10px]">AYAH/IBU</th>
                  <th className="p-4 font-semibold font-mono text-[10px]">PASANGAN</th>
                  <th className="p-4 font-semibold">TANGGAL LAHIR</th>
                  <th className="p-4 font-semibold">DOMISILI</th>
                  <th className="p-4 font-semibold">PEKERJAAN</th>
                  <th className="p-4 font-semibold">STATUS</th>
                  <th className="p-4 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((m) => {
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/40 text-slate-700 font-medium">
                      <td className="p-4 font-mono font-bold text-slate-400 text-[11px]">{m.id}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={m.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'} 
                            alt={m.nama} 
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div>
                            <span className="font-bold text-slate-800 block leading-none">{m.nama}</span>
                            <span className="text-[9px] text-slate-400 mt-0.5 block">Generasi {m.generasi}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          m.gender === 'L' ? 'bg-sky-50 text-sky-600' : 'bg-pink-50 text-pink-600'
                        }`}>
                          {m.gender === 'L' ? 'L' : 'P'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-400 font-bold text-[10px]">
                        {m.ayahId || m.ibuId ? (
                          <span>
                            {m.ayahId || '-'}/{m.ibuId || '-'}
                          </span>
                        ) : '---'}
                      </td>
                      <td className="p-4 font-mono text-slate-400 font-bold text-[10px]">
                        {m.pasanganId || '---'}
                      </td>
                      <td className="p-4">{m.tanggalLahir || 'Solo, --'}</td>
                      <td className="p-4">{m.domisili || 'Solo'}</td>
                      <td className="p-4">{m.pekerjaan || 'Ibu Rumah Tangga'}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          m.statusHidup === 'Hidup' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {m.statusHidup.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setSelectedQRMember(m)}
                            className="p-1 hover:bg-white border border-slate-200 text-emerald-600 rounded transition-all cursor-pointer"
                            title="Buat Kartu QR Anggota"
                          >
                            <QrCode size={12} />
                          </button>
                          <button
                            onClick={() => openEditModal(m)}
                            className="p-1 hover:bg-white border border-slate-200 text-amber-500 rounded transition-all"
                            title="Ubah"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteTrigger(m.id, m.nama)}
                            className="p-1 hover:bg-white border border-slate-200 text-rose-500 rounded transition-all"
                            title="Hapus"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL SHEET DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl border border-slate-100">
            
            {/* Modal Title */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-800 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                <User size={15} className="text-blue-500" />
                {editingMember ? 'UBAH RINCIAN ANGGOTA' : 'TAMBAH ANGGOTA BARU'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveForm} className="p-5 space-y-4 text-xs font-medium text-slate-600">
              
              {/* ID & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold tracking-wide text-slate-400 mb-1">ID Unik Anggota (Harus Unik)</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingMember}
                    value={formData.id}
                    onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value.toUpperCase().replace(/\s+/g, '') }))}
                    placeholder="E.g. M14"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold tracking-wide text-slate-400 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                    placeholder="E.g. Siti Aminah"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Gender & Status Hidup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold tracking-wide text-slate-400 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'L' | 'P' }))}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="L">Laki-Laki (♂)</option>
                    <option value="P">Perempuan (♀)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold tracking-wide text-slate-400 mb-1">Status Keberadaan</label>
                  <select
                    value={formData.statusHidup}
                    onChange={(e) => setFormData(prev => ({ ...prev, statusHidup: e.target.value as 'Hidup' | 'Wafat' }))}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="Hidup">Hidup / Berdomisili</option>
                    <option value="Wafat">Leluhur wafat (Alm/Almah)</option>
                  </select>
                </div>
              </div>

              {/* Tempat & Tanggal Lahir */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold tracking-wide text-slate-400 mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    value={formData.tempatLahir}
                    onChange={(e) => setFormData(prev => ({ ...prev, tempatLahir: e.target.value }))}
                    placeholder="E.g. Solo"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold tracking-wide text-slate-400 mb-1">Tanggal Lahir (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={formData.tanggalLahir}
                    onChange={(e) => setFormData(prev => ({ ...prev, tanggalLahir: e.target.value }))}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Tanggal Wafat & Domisili */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold tracking-wide text-slate-400 mb-1">Kota Domisili Tinggal</label>
                  <input
                    type="text"
                    value={formData.domisili}
                    onChange={(e) => setFormData(prev => ({ ...prev, domisili: e.target.value }))}
                    placeholder="E.g. Jakarta Selatan"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                {formData.statusHidup === 'Wafat' && (
                  <div>
                    <label className="block text-[10px] uppercase font-mono font-bold tracking-wide text-slate-400 mb-1">Tanggal Berpulang (Wafat)</label>
                    <input
                      type="date"
                      value={formData.tanggalWafat}
                      onChange={(e) => setFormData(prev => ({ ...prev, tanggalWafat: e.target.value }))}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Profesi & Photo URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold tracking-wide text-slate-400 mb-1">Pekerjaan / Aktivitas</label>
                  <input
                    type="text"
                    value={formData.pekerjaan}
                    onChange={(e) => setFormData(prev => ({ ...prev, pekerjaan: e.target.value }))}
                    placeholder="E.g. Wiraswasta"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold tracking-wide text-slate-400 mb-1">URL Foto Profil (Optional - JPG/PNG)</label>
                  <input
                    type="url"
                    value={formData.foto}
                    onChange={(e) => setFormData(prev => ({ ...prev, foto: e.target.value }))}
                    placeholder="Contoh: https://domain.com/foto.jpg atau .png"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                  />
                  <span className="text-[9px] text-slate-400 mt-1 block">Mendukung tautan foto langsung berformat JPG, JPEG, atau PNG.</span>
                </div>
              </div>

              {/* Kontak Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold tracking-wide text-slate-400 mb-1">Alamat Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="E.g. budi@mail.com"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold tracking-wide text-slate-400 mb-1">Nomor Telepon WA</label>
                  <input
                    type="text"
                    value={formData.telepon}
                    onChange={(e) => setFormData(prev => ({ ...prev, telepon: e.target.value }))}
                    placeholder="E.g. 081234..."
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Parental Hierarchy Mapping (very critical for linking!!) */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 space-y-3">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Pemetaan Pohon Silsilah (Tulis ID Pasangan/Orangtua)</span>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] uppercase text-slate-400 mb-1">ID Ayah</label>
                    <select
                      value={formData.ayahId}
                      onChange={(e) => setFormData(prev => ({ ...prev, ayahId: e.target.value }))}
                      className="w-full p-1.5 border border-slate-200 bg-white rounded-md focus:outline-hidden text-[11px] font-mono"
                    >
                      <option value="">(Tanpa Ayah)</option>
                      {members.filter(m => m.gender === 'L' && m.id !== formData.id).map(m => (
                        <option key={m.id} value={m.id}>{m.id} - {m.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase text-slate-400 mb-1">ID Ibu</label>
                    <select
                      value={formData.ibuId}
                      onChange={(e) => setFormData(prev => ({ ...prev, ibuId: e.target.value }))}
                      className="w-full p-1.5 border border-slate-200 bg-white rounded-md focus:outline-hidden text-[11px] font-mono"
                    >
                      <option value="">(Tanpa Ibu)</option>
                      {members.filter(m => m.gender === 'P' && m.id !== formData.id).map(m => (
                        <option key={m.id} value={m.id}>{m.id} - {m.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase text-slate-400 mb-1">ID Pasangan</label>
                    <select
                      value={formData.pasanganId}
                      onChange={(e) => setFormData(prev => ({ ...prev, pasanganId: e.target.value }))}
                      className="w-full p-1.5 border border-slate-200 bg-white rounded-md focus:outline-hidden text-[11px] font-mono"
                    >
                      <option value="">(Tanpa Pasangan)</option>
                      {members.filter(m => m.id !== formData.id).map(m => (
                        <option key={m.id} value={m.id}>{m.id} - {m.nama}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Bio Notes */}
              <div>
                <label className="block text-[10px] uppercase font-mono font-bold tracking-wide text-slate-400 mb-1">Catatan Singkat Keluarga</label>
                <textarea
                  value={formData.catatan}
                  onChange={(e) => setFormData(prev => ({ ...prev, catatan: e.target.value }))}
                  placeholder="E.g. Menyukai musik keroncong rukun tetangga, saat ini mengajar arsitektur..."
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 h-16"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-950/10"
                >
                  {editingMember ? 'Simpan Perubahan' : 'Simpan Anggota'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* QR CODE GENERATOR & DIGITAL CARD MODAL */}
      {selectedQRMember && (() => {
        const qrURL = `${window.location.origin}${window.location.pathname}?memberId=${selectedQRMember.id}`;
        
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans">
            <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
              
              {/* Header Branding */}
              <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-white/15 p-1.5 rounded-lg">
                    <QrCode size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-wide uppercase">KARTU QR DIGITAL</h3>
                    <p className="text-[9px] font-mono opacity-80 leading-none">JEREH DIGITAL PORTAL</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedQRMember(null)}
                  className="p-1 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                
                {/* QR Code and Meta Section */}
                <div className="flex flex-col sm:flex-row items-center gap-6 justify-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {/* Real QR Code Image */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-xs flex flex-col items-center justify-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrURL)}`} 
                      alt={`QR Code ${selectedQRMember.nama}`}
                      className="w-40 h-40 object-contain select-none"
                    />
                    <span className="text-[10px] font-bold font-mono text-slate-400 mt-2">ID: {selectedQRMember.id}</span>
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <h4 className="text-slate-800 font-bold text-sm">Pindai Kode QR</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Gunakan kamera ponsel untuk memindai kode QR di samping untuk langsung membuka profil digital halaman silsilah keluarga secara langsung.
                    </p>
                    
                    <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(qrURL);
                          alert('Tautan profil berhasil disalin ke papan klip!');
                        }}
                        className="px-3 py-1.5 bg-slate-150 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        Salin Tautan
                      </button>
                      <a
                        href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrURL)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                      >
                        Unduh File QR
                      </a>
                    </div>
                  </div>
                </div>

                {/* Individual Identity Profile details */}
                <div className="border border-slate-100 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                    <img 
                      src={selectedQRMember.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                      alt={selectedQRMember.nama} 
                      className={`w-12 h-12 rounded-full object-cover border-2 border-slate-100 shadow-2xs ${
                        selectedQRMember.statusHidup === 'Wafat' ? 'filter grayscale' : ''
                      }`}
                    />
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight">{selectedQRMember.nama}</h4>
                      <p className="text-[10px] text-slate-400 font-bold font-mono mt-0.5 uppercase tracking-wide">
                        GENERASI {selectedQRMember.generasi || 1} • {selectedQRMember.gender === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                    <div>
                      <p className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Tempat, Tanggal Lahir</p>
                      <p className="text-slate-700 mt-0.5">{selectedQRMember.tempatLahir || 'Solo'}, {selectedQRMember.tanggalLahir || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Kota Domisili</p>
                      <p className="text-slate-700 mt-0.5">{selectedQRMember.domisili || 'Solo, Jawa Tengah'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Pekerjaan</p>
                      <p className="text-slate-700 mt-0.5">{selectedQRMember.pekerjaan || 'Ibu Rumah Tangga'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Status Kehidupan</p>
                      <span className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded mt-1 ${
                        selectedQRMember.statusHidup === 'Hidup' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {selectedQRMember.statusHidup.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {selectedQRMember.catatan && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-500 leading-relaxed italic">
                      " {selectedQRMember.catatan} "
                    </div>
                  )}

                  {/* Parental references */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] font-mono text-slate-400 grid grid-cols-3 gap-2">
                    <div>
                      <span className="block text-[8px] uppercase font-bold text-slate-400">ID Ayah</span>
                      <span className="font-bold text-slate-600">{selectedQRMember.ayahId || '---'}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase font-bold text-slate-400">ID Ibu</span>
                      <span className="font-bold text-slate-600">{selectedQRMember.ibuId || '---'}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase font-bold text-slate-400">Pasangan</span>
                      <span className="font-bold text-slate-600">{selectedQRMember.pasanganId || '---'}</span>
                    </div>
                  </div>

                </div>

              </div>

              {/* Action shortcuts */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedQRMember(null)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-all cursor-pointer"
                >
                  Tutup
                </button>
                {onSelectMember && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectMember(selectedQRMember.id);
                      setSelectedQRMember(null);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/10 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>🎯</span> Lihat di Pohon Silsilah
                  </button>
                )}
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
