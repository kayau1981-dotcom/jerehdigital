import { useState, useMemo, FormEvent } from 'react';
import { Member } from '../types';
import { 
  FolderOpen, 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  Tag, 
  Calendar, 
  Filter,
  Check,
  Paperclip,
  Share2,
  FileCode,
  Globe
} from 'lucide-react';

export interface FamilyFile {
  id: string;
  name: string;
  url: string;
  category: 'KTP' | 'KK' | 'Akte Lahir' | 'Ijazah' | 'Sertifikat' | 'Lainnya';
  uploadedAt: string;
  size: string;
  description: string;
  taggedMemberIds: string[];
}

interface ArsipBerkasProps {
  members: Member[];
  onAddLog: (tipe: 'tambah' | 'edit' | 'hapus' | 'sinkronisasi', deskripsi: string) => void;
}

const INITIAL_FILES: FamilyFile[] = [
  {
    id: 'F01',
    name: 'Kartu Keluarga Utama Joyo Sutiko.pdf',
    url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400',
    category: 'KK',
    uploadedAt: '2025-02-15',
    size: '1.4 MB',
    description: 'Salinan Kartu Keluarga Utama terbitan Kota Surakarta.',
    taggedMemberIds: ['M01', 'M02', 'M03', 'M05', 'M07']
  },
  {
    id: 'F02',
    name: 'Sertifikat Tanah Rumah Induk Solo.pdf',
    url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
    category: 'Sertifikat',
    uploadedAt: '2024-08-10',
    size: '4.2 MB',
    description: 'Sertifikat hak milik tanah dan bangunan rumah induk keluarga besar di Solo.',
    taggedMemberIds: ['M01', 'M02']
  },
  {
    id: 'F03',
    name: 'Akte Kelahiran Sarah Kartika Joyo.pdf',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
    category: 'Akte Lahir',
    uploadedAt: '2026-01-05',
    size: '850 KB',
    description: 'Akte kelahiran anak Bambang Joyo yang diperlukan untuk keperluan pendaftaran koas.',
    taggedMemberIds: ['M10', 'M03']
  }
];

export default function ArsipBerkasView({ members, onAddLog }: ArsipBerkasProps) {
  const [files, setFiles] = useState<FamilyFile[]>(() => {
    try {
      const stored = localStorage.getItem('silsilah_files_db');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_FILES;
  });

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<FamilyFile['category']>('Lainnya');
  const [size, setSize] = useState('1.2 MB');
  const [description, setDescription] = useState('');
  const [taggedIds, setTaggedIds] = useState<string[]>([]);

  // Filter & Search
  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) || 
                            f.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'Semua' || f.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [files, search, selectedCategory]);

  const handleSaveFile = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    const newFile: FamilyFile = {
      id: `F_${Math.random().toString(36).substring(2, 9)}`,
      name,
      url,
      category,
      uploadedAt: new Date().toISOString().split('T')[0],
      size,
      description,
      taggedMemberIds: taggedIds
    };

    const updated = [newFile, ...files];
    setFiles(updated);
    localStorage.setItem('silsilah_files_db', JSON.stringify(updated));
    onAddLog('tambah', `Mengarsipkan berkas baru: ${name} (${category})`);

    // Reset
    setName('');
    setUrl('');
    setCategory('Lainnya');
    setSize('1.2 MB');
    setDescription('');
    setTaggedIds([]);
    setIsModalOpen(false);
  };

  const handleDeleteFile = (id: string, fileName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus arsip ${fileName}?`)) {
      const updated = files.filter(f => f.id !== id);
      setFiles(updated);
      localStorage.setItem('silsilah_files_db', JSON.stringify(updated));
      onAddLog('hapus', `Menghapus arsip berkas: ${fileName}`);
    }
  };

  const toggleTagMember = (memberId: string) => {
    setTaggedIds(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId) 
        : [...prev, memberId]
    );
  };

  const mockDownload = (file: FamilyFile) => {
    onAddLog('sinkronisasi', `Mengunduh arsip berkas: ${file.name}`);
    alert(`Mensimulasikan unduhan berkas "${file.name}" dari: ${file.url}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Upper header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight uppercase flex items-center gap-2">
            <FolderOpen size={16} className="text-blue-600 animate-pulse" />
            Lembari Arsip Dokumen Keluarga
          </h2>
          <p className="text-xs text-slate-400 mt-1">Simpan salinan berkas penting (KK, Ijazah, Akta, Sertifikat) yang tertata rapi</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 hover:scale-102 transition-all text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/10"
        >
          <Plus size={15} />
          TAMBAH ARSIP
        </button>
      </div>

      {/* Control filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama berkas atau deskripsi..."
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-hidden focus:border-blue-600"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 shrink-0">
          {['Semua', 'KK', 'KTP', 'Akte Lahir', 'Ijazah', 'Sertifikat', 'Lainnya'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid listing */}
      {filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map((f) => (
            <div 
              key={f.id} 
              id={`file-card-${f.id}`}
              className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-5 space-y-4">
                {/* Upper info */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
                    <FileText size={22} className="stroke-[1.5]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md">
                      {f.category}
                    </span>
                    <h3 className="font-bold text-slate-800 text-xs mt-1.5 truncate leading-tight hover:text-blue-600 transition-colors" title={f.name}>
                      {f.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{f.size} • Diunggah {f.uploadedAt}</p>
                  </div>
                </div>

                <p className="text-slate-500 text-xs leading-relaxed font-sans line-clamp-3">
                  {f.description || 'Tidak ada deskripsi berkas.'}
                </p>

                {/* Tagged members info */}
                {f.taggedMemberIds.length > 0 && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      <Tag size={10} className="text-slate-400" />
                      Sangkutan Anggota ({f.taggedMemberIds.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {f.taggedMemberIds.map((memberId) => {
                        const m = members.find(item => item.id === memberId);
                        return m ? (
                          <span key={memberId} className="bg-white border border-slate-200 text-[10px] py-0.5 px-2 rounded-full font-medium text-slate-600 shadow-3xs">
                            {m.nama}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons footer */}
              <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 flex items-center justify-between">
                <button
                  onClick={() => mockDownload(f)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-all"
                >
                  <Download size={13} />
                  UNDUH BERKAS
                </button>
                <button
                  onClick={() => handleDeleteFile(f.id, f.name)}
                  className="text-[11px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-all"
                >
                  <Trash2 size={13} />
                  HAPUS
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-16 rounded-2xl border border-slate-150 shadow-3xs flex flex-col items-center text-center">
          <FolderOpen size={48} className="text-slate-300 animate-pulse mb-3" />
          <h3 className="font-bold text-slate-700 text-sm uppercase font-mono tracking-widest">Arsip Kosong</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
            Tidak ada arsip dokumen dari pencarian atau kategori ini. Silakan tambahkan berkas penting keluarga Anda terlebih dahulu.
          </p>
        </div>
      )}

      {/* CREATE FILE ARSIPLE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="bg-slate-900 text-white p-5">
              <h3 className="font-bold text-sm tracking-wide uppercase font-mono">Arsipkan Berkas Baru</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Lengkapi identitas berkas penting keluarga</p>
            </div>

            <form onSubmit={handleSaveFile} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nama Dokumen</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Akta Kelahiran Mbah Joyo.pdf"
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Jenis Dokumen</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FamilyFile['category'])}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 font-medium"
                  >
                    <option value="KK">Kartu Keluarga (KK)</option>
                    <option value="KTP">KTP</option>
                    <option value="Akte Lahir">Akte Lahir</option>
                    <option value="Ijazah">Ijazah</option>
                    <option value="Sertifikat">Sertifikat</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Ukuran Berkas</label>
                  <input
                    type="text"
                    required
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Tautan Berkas (PDF/Gambar/Cloud Drive URL)</label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Keterangan / Deskripsi Berkas</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Masukkan uraian ringkas mengenai berkas fisik aslinya dipegang oleh siapa atau tanggal kadaluarsa jika ada."
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Tagging section */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Sangkutkan Dengan Anggota Keluarga</label>
                <div className="max-h-24 overflow-y-auto border border-slate-150 rounded-xl p-2.5 grid grid-cols-2 gap-2 bg-slate-50/50">
                  {members.map((m) => {
                    const isTagged = taggedIds.includes(m.id);
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => toggleTagMember(m.id)}
                        className={`flex items-center gap-1.5 p-1.5 rounded-lg text-left text-[11px] font-semibold transition-all ${
                          isTagged 
                            ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                            : 'bg-white hover:bg-slate-100 border border-slate-150 text-slate-600'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center border ${
                          isTagged ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isTagged && <Check size={10} className="stroke-[3]" />}
                        </div>
                        <span className="truncate">{m.nama}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-505 text-white text-xs font-bold rounded-xl"
                >
                  SIMPAN ARSIP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
