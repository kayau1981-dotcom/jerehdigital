import { useState, useMemo, useEffect, FormEvent } from 'react';
import { Member, FamilyPhoto } from '../types';
import { 
  ImageIcon, 
  Plus, 
  Calendar, 
  Users, 
  X, 
  Heart, 
  Search, 
  Maximize2,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  MonitorPlay
} from 'lucide-react';

interface AlbumKeluargaViewProps {
  photos: FamilyPhoto[];
  members: Member[];
  onAddPhoto: (newPhoto: FamilyPhoto) => void;
  onAddLog: (tipe: 'tambah' | 'edit' | 'hapus' | 'sinkronisasi', deskripsi: string) => void;
}

export default function AlbumKeluargaView({
  photos,
  members,
  onAddPhoto,
  onAddLog
}: AlbumKeluargaViewProps) {
  
  const [selectedTagMemberId, setSelectedTagMemberId] = useState<string>('A');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [selectedLightboxPhoto, setSelectedLightboxPhoto] = useState<FamilyPhoto | null>(null);

  // Slideshow Mode States
  const [isSlideshowOpen, setIsSlideshowOpen] = useState<boolean>(false);
  const [currentSlideshowIndex, setCurrentSlideshowIndex] = useState<number>(0);
  const [isAutoplay, setIsAutoplay] = useState<boolean>(true);

  // Form State
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>('');
  const [newCaption, setNewCaption] = useState<string>('');
  const [newDate, setNewDate] = useState<string>('');
  const [newTaggedIds, setNewTaggedIds] = useState<string[]>([]);

  // Filtered Photos list
  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      // Filter by tag
      const matchesTag = selectedTagMemberId === 'A' || p.tagAnggotaIds.includes(selectedTagMemberId);
      
      // Filter by caption
      const matchesSearch = searchQuery === '' || p.caption.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTag && matchesSearch;
    });
  }, [photos, selectedTagMemberId, searchQuery]);

  // Slideshow Autoplay Timer effect
  useEffect(() => {
    if (!isSlideshowOpen || !isAutoplay || filteredPhotos.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlideshowIndex((prev) => (prev + 1) % filteredPhotos.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isSlideshowOpen, isAutoplay, filteredPhotos.length]);

  // Keyboard Navigation for Slideshow
  useEffect(() => {
    if (!isSlideshowOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentSlideshowIndex((prev) => (prev + 1) % filteredPhotos.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlideshowIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
      } else if (e.key === 'Escape') {
        setIsSlideshowOpen(false);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsAutoplay((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSlideshowOpen, filteredPhotos.length]);

  // Always keep currentSlideshowIndex bounded when dataset shrinks
  useEffect(() => {
    if (currentSlideshowIndex >= filteredPhotos.length && filteredPhotos.length > 0) {
      setCurrentSlideshowIndex(0);
    }
  }, [filteredPhotos.length, currentSlideshowIndex]);

  // Handle Toggle Tagged Checkbox ID
  const handleToggleTagId = (id: string) => {
    if (newTaggedIds.includes(id)) {
      setNewTaggedIds(prev => prev.filter(item => item !== id));
    } else {
      setNewTaggedIds(prev => [...prev, id]);
    }
  };

  // Handle Save New Photo
  const handleSavePhoto = (e: FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl || !newCaption) return;

    const added: FamilyPhoto = {
      id: `P${String(photos.length + 1).padStart(2, '0')}`,
      url: newPhotoUrl,
      caption: newCaption,
      tanggal: newDate || undefined,
      tagAnggotaIds: newTaggedIds,
    };

    onAddPhoto(added);
    onAddLog('tambah', `Mengunggah foto baru ke Album Keluarga: "${newCaption}"`);
    
    // Clear forms
    setNewPhotoUrl('');
    setNewCaption('');
    setNewDate('');
    setNewTaggedIds([]);
    setIsAddOpen(false);
  };

  // Helper name mapping for tagged lists
  const getMemberName = (id: string) => {
    return members.find(m => m.id === id)?.nama || 'Anggota Terhapus';
  };

  return (
    <div className="space-y-6">
      
      {/* Search, Action, Tag Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Query caption search */}
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Cari keterangan foto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500 placeholder-slate-400 text-slate-800"
            />
          </div>

          {/* Quick select dropdown tags */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold bg-slate-50 p-1.5 rounded-xl border border-slate-150">
            <span>Tag Anggota:</span>
            <select
              value={selectedTagMemberId}
              onChange={(e) => setSelectedTagMemberId(e.target.value)}
              className="bg-white border border-slate-200 rounded-md p-1 font-sans text-xs font-semibold text-slate-800 focus:outline-hidden"
            >
              <option value="A">-- Semua Foto --</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.nama}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {filteredPhotos.length > 0 && (
            <button
              onClick={() => {
                setCurrentSlideshowIndex(0);
                setIsAutoplay(true);
                setIsSlideshowOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/10 flex items-center gap-1.5 cursor-pointer"
              title="Putar Slideshow Kenangan"
            >
              <MonitorPlay size={14} />
              Putar Slideshow ({filteredPhotos.length})
            </button>
          )}

          {/* Upload Photo Trigger */}
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-blue-900/10 flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus size={14} />
            Unggah Kenangan Baru
          </button>
        </div>

      </div>

      {/* Album Photography Gallery View */}
      {filteredPhotos.length === 0 ? (
        <div className="bg-white p-16 text-center text-slate-400 rounded-2xl border border-slate-150 italic font-sans text-xs">
          Tidak ada foto kenangan yang cocok atau ditandai oleh anggota terpilih.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo) => (
            <div 
              key={photo.id}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all group border-b-2 hover:border-b-blue-600"
            >
              {/* Image box visual relative */}
              <div className="relative aspect-video overflow-hidden bg-slate-50">
                <img 
                  src={photo.url} 
                  alt={photo.caption} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                />
                
                {/* Visual control trigger over card cover */}
                <button 
                  onClick={() => setSelectedLightboxPhoto(photo)}
                  className="absolute top-3 right-3 p-1.5 bg-slate-900/60 backdrop-blur-xs text-white rounded-full hover:bg-slate-900 transition-all opacity-0 group-hover:opacity-100"
                  title="Perbesar Layar Penuh"
                >
                  <Maximize2 size={13} />
                </button>
              </div>

              {/* Photo Caption detail parameters */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono font-bold">
                  <Calendar size={12} className="text-slate-400" />
                  <span>{photo.tanggal || 'Tanggal tidak disetel'}</span>
                </div>

                <h3 className="font-bold text-slate-800 text-xs tracking-tight line-clamp-2 leading-relaxed">
                  "{photo.caption}"
                </h3>

                {/* Tagged members display lines */}
                <div className="pt-2 border-t border-slate-50">
                  <div className="flex items-start gap-1 pb-1 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest leading-none">
                    <Users size={11} className="text-slate-400 shrink-0" />
                    <span>Ditandai ({photo.tagAnggotaIds.length}):</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-1">
                    {photo.tagAnggotaIds.slice(0, 4).map(id => (
                      <span 
                        key={id}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-sans text-[9px] font-semibold rounded leading-none select-none"
                        title={getMemberName(id)}
                      >
                        {getMemberName(id).split(' ').slice(0, 2).join(' ')}
                      </span>
                    ))}
                    {photo.tagAnggotaIds.length > 4 && (
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 font-mono text-[9px] font-bold rounded leading-none">
                        +{photo.tagAnggotaIds.length - 4} Lainnya
                      </span>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* PHOTOGRAPHY ADD KENANGAN MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl border border-slate-100">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-800 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={15} className="text-blue-500 animate-pulse" />
                UNGGAH KENANGAN FOTO KELUARGA
              </h3>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePhoto} className="p-5 space-y-4 text-xs font-medium text-slate-600">
              
              <div>
                <label className="block text-[10px] uppercase font-mono font-bold tracking-wide text-slate-400 mb-1">URL Tautan Gambar (Atau Unsplash)</label>
                <input
                  type="url"
                  required
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="Paste URL foto (e.g. Dari Unsplash / Google Drive)"
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold tracking-wide text-slate-400 mb-1">Tanggal Diambil / Momen</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold tracking-wide text-slate-400 mb-1">Judul / Caption Foto</label>
                  <input
                    type="text"
                    required
                    value={newCaption}
                    onChange={(e) => setNewCaption(e.target.value)}
                    placeholder="Makan Malam Syukuran / Liburan"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Tag Selection lists checkboxes */}
              <div>
                <label className="block text-[10px] uppercase font-mono font-bold tracking-wide text-slate-400 mb-1">
                  Pilih Anggota Keluarga yang Ada di Foto ({newTaggedIds.length})
                </label>
                <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl max-h-40 overflow-y-auto space-y-1">
                  {members.map(m => {
                    const isChecked = newTaggedIds.includes(m.id);
                    return (
                      <label 
                        key={m.id}
                        className="flex items-center gap-2.5 p-1 hover:bg-white rounded cursor-pointer text-[11px] text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleTagId(m.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{m.nama} (ID: {m.id})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-950/10"
                >
                  Simpan Foto
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX LAYOVER WINDOW */}
      {selectedLightboxPhoto && (
        <div 
          onClick={() => setSelectedLightboxPhoto(null)}
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none cursor-zoom-out"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative border border-slate-800 cursor-default"
          >
            <button
              onClick={() => setSelectedLightboxPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 text-white hover:text-rose-400 rounded-full transition-all z-10"
            >
              <X size={18} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-5">
              
              {/* Image segment */}
              <div className="md:col-span-3 bg-black aspect-square md:aspect-auto md:h-[450px] flex items-center justify-center overflow-hidden">
                <img 
                  src={selectedLightboxPhoto.url} 
                  alt={selectedLightboxPhoto.caption} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Caption Tag details sidebar */}
              <div className="md:col-span-2 p-6 flex flex-col justify-between h-[300px] md:h-[450px] overflow-y-auto">
                <div className="space-y-4">
                  
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono font-bold pb-2 border-b border-slate-100">
                    <Calendar size={14} className="text-slate-400" />
                    <span>{selectedLightboxPhoto.tanggal || 'Tanggal tidak disetel'}</span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Keterangan Kenangan</span>
                    <h2 className="font-bold text-slate-800 text-sm leading-relaxed">
                      "{selectedLightboxPhoto.caption}"
                    </h2>
                  </div>

                  {/* List whole tags */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Anggota yang Terpampang ({selectedLightboxPhoto.tagAnggotaIds.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                      {selectedLightboxPhoto.tagAnggotaIds.map(id => (
                        <span 
                          key={id}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 font-sans text-xs font-semibold rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer leading-none"
                        >
                          👤 {getMemberName(id)}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>

                <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center font-mono font-medium">
                  ID FOTO: {selectedLightboxPhoto.id} • Silsilah Gallery
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* FULL-SCREEN SLIDESHOW MODAL CAROUSEL */}
      {isSlideshowOpen && filteredPhotos.length > 0 && (() => {
        const activePhoto = filteredPhotos[currentSlideshowIndex];
        return (
          <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-max flex flex-col justify-between p-4 sm:p-6 select-none font-sans" style={{ zIndex: 99999 }}>
            
            {/* Top Toolbar */}
            <div className="flex items-center justify-between z-10 w-full max-w-7xl mx-auto">
              <div className="flex items-center gap-2 text-white">
                <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 border border-emerald-500/25">
                  <MonitorPlay size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-xs tracking-wider uppercase text-slate-100">Slideshow Kenangan Keluarga</h4>
                  <p className="text-[9px] font-mono text-slate-400 leading-none mt-0.5">
                    FOTO {currentSlideshowIndex + 1} DARI {filteredPhotos.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Play / Pause Toggle */}
                <button
                  onClick={() => setIsAutoplay(!isAutoplay)}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-extrabold cursor-pointer border ${
                    isAutoplay 
                      ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20' 
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                  }`}
                  title={isAutoplay ? "Pause Autoplay" : "Mulai Autoplay"}
                >
                  {isAutoplay ? <Pause size={14} /> : <Play size={14} />}
                  <span>{isAutoplay ? 'PAUSE' : 'PLAY'}</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsSlideshowOpen(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white hover:text-rose-400 border border-white/10 rounded-xl transition-all cursor-pointer"
                  title="Tutup Slideshow"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Central Carousel Canvas & Navigation */}
            <div className="flex-1 relative flex items-center justify-center max-w-6xl w-full mx-auto my-4 sm:my-6">
              
              {/* Previous button */}
              <button
                onClick={() => setCurrentSlideshowIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length)}
                className="absolute left-0 sm:left-4 z-10 p-3 sm:p-4 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full transition-all border border-slate-800 hover:scale-105 active:scale-95 cursor-pointer"
                title="Satu Kenangan Sebelumnya (Arah Kiri)"
              >
                <ChevronLeft size={20} />
              </button>

              {/* Main Active image container with animation */}
              <div className="w-full h-full max-h-[65vh] flex items-center justify-center relative rounded-2xl overflow-hidden">
                <img 
                  key={activePhoto.id}
                  src={activePhoto.url} 
                  alt={activePhoto.caption} 
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full object-contain animate-fade-in transition-all duration-300"
                />

                {/* Auto Timer Progress bar visual */}
                {isAutoplay && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                    <div className="h-full bg-emerald-500 w-full animate-progress" />
                  </div>
                )}
              </div>

              {/* Next button */}
              <button
                onClick={() => setCurrentSlideshowIndex((prev) => (prev + 1) % filteredPhotos.length)}
                className="absolute right-0 sm:right-4 z-10 p-3 sm:p-4 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full transition-all border border-slate-800 hover:scale-105 active:scale-95 cursor-pointer"
                title="Satu Kenangan Selanjutnya (Arah Kanan)"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Bottom Panel (Captions & Indicators) */}
            <div className="w-full max-w-4xl mx-auto bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 justify-between">
              <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[10px] text-slate-400 font-mono font-bold">
                  <Calendar size={12} className="text-slate-500" />
                  <span>{activePhoto.tanggal || 'Tanggal tidak disetel'}</span>
                </div>
                <h3 className="font-bold text-white text-sm sm:text-base tracking-tight leading-relaxed">
                  "{activePhoto.caption}"
                </h3>
                {activePhoto.tagAnggotaIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center sm:justify-start mt-1.5">
                    <span className="text-[8px] font-mono text-slate-500 font-bold uppercase tracking-wider self-center mr-1">DITANDAI:</span>
                    {activePhoto.tagAnggotaIds.map(id => (
                      <span 
                        key={id}
                        className="px-1.5 py-0.5 bg-slate-800 border border-slate-700/80 text-slate-300 font-sans text-[10px] font-medium rounded-md"
                      >
                        👤 {getMemberName(id)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Indicator Dots Carousel Jump shortcuts */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 shrink-0 max-w-full overflow-x-auto p-1.5 bg-black/40 rounded-xl max-h-16">
                {filteredPhotos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideshowIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentSlideshowIndex 
                        ? 'w-6 bg-emerald-500' 
                        : 'w-2 bg-slate-700 hover:bg-slate-500 cursor-pointer'
                    }`}
                    title={`Lompat ke Foto ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

          </div>
        );
      })()}

    </div>
  );
}
