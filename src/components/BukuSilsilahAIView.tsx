import { useState } from 'react';
import { Member } from '../types';
import { 
  Sparkles, 
  BookOpen, 
  Globe, 
  HelpCircle, 
  Network, 
  History, 
  RefreshCw, 
  Copy, 
  FileDown, 
  Lock
} from 'lucide-react';

interface BukuSilsilahAIProps {
  members: Member[];
  familyTitle: string;
}

export default function BukuSilsilahAIView({ members, familyTitle }: BukuSilsilahAIProps) {
  const [activeMode, setActiveMode] = useState<'history' | 'relationships' | 'trivia' | 'fullbook'>('fullbook');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedTitle, setGeneratedTitle] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [errorText, setErrorText] = useState<string>('');

  const generateAIBook = async () => {
    setIsLoading(true);
    setErrorText('');
    setGeneratedContent('');
    setGeneratedTitle('');

    try {
      const response = await fetch('/api/generate-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          members: members,
          mode: activeMode,
          familyTitle: familyTitle
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server error occurred while calling Gemini.');
      }

      setGeneratedTitle(data.title);
      setGeneratedContent(data.content);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'Terjadi kesalahan saat menyusun buku silsilah AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    alert('Buku silsilah keluarga berhasil disalin ke papan klip!');
  };

  const downloadAsTextFile = () => {
    if (!generatedContent) return;
    const element = document.createElement('a');
    const file = new Blob([generatedContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${generatedTitle || 'Buku_Silsilah_Keluarga_AI'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Simple Markdown to beautiful HTML renderer for clean presentation without bulky dependencies
  const renderSimpleMarkdown = (markdown: string) => {
    if (!markdown) return null;
    
    const lines = markdown.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith('# ')) {
        return <h1 key={idx} className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mt-6 mb-3 border-b border-slate-100 pb-2">{trimmed.slice(2)}</h1>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={idx} className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight mt-5 mb-2.5 flex items-center gap-1.5">{trimmed.slice(3)}</h2>;
      }
      if (trimmed.startsWith('### ')) {
        return <h3 key={idx} className="text-sm sm:text-base font-bold text-slate-705 tracking-tight mt-4 mb-2">{trimmed.slice(4)}</h3>;
      }
      
      // Blockquotes
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-4 border-blue-500 bg-blue-50/50 p-4 rounded-r-xl italic text-slate-600 text-xs my-4 leading-relaxed font-sans">
            {trimmed.slice(2)}
          </blockquote>
        );
      }
      
      // Bullets
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <ul key={idx} className="list-disc pl-5 text-slate-600 text-xs my-1 font-sans leading-normal">
            <li>{trimmed.slice(2)}</li>
          </ul>
        );
      }

      // Divider
      if (trimmed === '---') {
        return <hr key={idx} className="border-slate-100 my-6" />;
      }

      // Empty lines
      if (!trimmed) {
        return <div key={idx} className="h-2.5" />;
      }

      // Regular paragraph
      return <p key={idx} className="text-xs sm:text-sm text-slate-600 leading-relaxed my-2 font-sans">{trimmed}</p>;
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Intro header with logo */}
      <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 tracking-tight uppercase flex items-center gap-2">
              <Sparkles size={16} className="text-yellow-500 animate-pulse" />
              Silsilah Book AI Generator (Gemini Engine)
            </h2>
            <p className="text-xs text-slate-400 mt-1">Dapatkan narasi mendalam, cerita, atau buku komprehensif tertulis otomatis dari database silsilah anda</p>
          </div>
          <div className="text-[10px] bg-slate-100 text-slate-500 border border-slate-150 py-1.5 px-3 rounded-xl font-mono flex items-center gap-1.5 max-w-fit">
            <Lock size={12} className="text-slate-400" />
            <span>KUNCI SECRETS LAYANAN AMAN</span>
          </div>
        </div>
      </div>

      {/* Selector Options Block */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        
        {/* Left selector menu */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <h3 className="font-bold text-xs uppercase font-mono tracking-wider text-slate-400 border-b border-slate-50 pb-2">
              Pilih Jenis Dokumentasi AI
            </h3>

            <div className="space-y-2">
              
              <button
                type="button"
                onClick={() => setActiveMode('fullbook')}
                className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                  activeMode === 'fullbook' 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex gap-3">
                  <BookOpen size={18} className="shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold font-sans">Buku Silsilah Utama</h4>
                    <p className={`text-[10px] mt-0.5 font-medium leading-normal ${activeMode === 'fullbook' ? 'text-blue-100' : 'text-slate-400'}`}>
                      Karya sastra silsilah komparatif lengkap mulai kata pengantar hingga generasi akhir.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('history')}
                className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                  activeMode === 'history' 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex gap-3">
                  <History size={18} className="shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold font-sans">Riwayat & Biografi Tokoh</h4>
                    <p className={`text-[10px] mt-0.5 font-medium leading-normal ${activeMode === 'history' ? 'text-blue-100' : 'text-slate-400'}`}>
                      Menceritakan ulasan hidup kreatif mengenai leluhur utama dan pencapaian mereka.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('relationships')}
                className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                  activeMode === 'relationships' 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex gap-3">
                  <Network size={18} className="shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold font-sans">Dinamika & Analisis Hubungan</h4>
                    <p className={`text-[10px] mt-0.5 font-medium leading-normal ${activeMode === 'relationships' ? 'text-blue-100' : 'text-slate-400'}`}>
                      Tinjauan statistik sosiologi perkawinan, generasi, serta penyebaran domisili keluarga.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('trivia')}
                className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                  activeMode === 'trivia' 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex gap-3">
                  <HelpCircle size={18} className="shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold font-sans">Kuis Trivia & Fun Facts</h4>
                    <p className={`text-[10px] mt-0.5 font-medium leading-normal ${activeMode === 'trivia' ? 'text-blue-100' : 'text-slate-400'}`}>
                      Materi kegemilangan seru, kuis tebakan, keunikan profesi keluarga yang menghibur.
                    </p>
                  </div>
                </div>
              </button>

            </div>

            <button
              onClick={generateAIBook}
              disabled={isLoading || members.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-505 disabled:bg-blue-300 hover:scale-101 hover:shadow-lg text-white font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all mt-6 shadow-md shadow-blue-600/10"
            >
              {isLoading ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {isLoading ? 'Menyusun Bab Buku...' : 'Susun Sastra AI Sekarang'}
            </button>
          </div>
        </div>

        {/* Right Preview Output container */}
        <div className="md:col-span-3 space-y-4">
          {isLoading ? (
            <div className="bg-white p-16 rounded-2xl border border-slate-150 flex flex-col items-center justify-center text-center h-[500px]">
              <div className="relative">
                <Sparkles size={38} className="text-blue-600 animate-spin-slow mb-4" />
                <BookOpen size={20} className="absolute left-2.5 top-2.5 text-blue-400" />
              </div>
              <h4 className="font-bold text-slate-750 text-xs font-mono uppercase tracking-widest animate-pulse">Menghimpun Berkas Sastra</h4>
              <p className="text-slate-400 text-xs max-w-sm mt-2 leading-relaxed">
                Gemini sedang membaca silsilah {members.length} anggota secara relasional untuk merangkai kata demi kata dalam format penulisan sastra klasik. Mohon tunggu sekitar 5-15 detik...
              </p>
            </div>
          ) : errorText ? (
            <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl space-y-3 h-[500px] flex flex-col items-center justify-center text-center">
              <h3 className="font-bold text-rose-800 text-xs font-mono uppercase tracking-widest">Penyusunan Ditutup Terhenti</h3>
              <p className="text-xs text-rose-700 max-w-md leading-relaxed">{errorText}</p>
              <button 
                onClick={generateAIBook}
                className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all"
              >
                COBA LAGI SINKRON
              </button>
            </div>
          ) : generatedContent ? (
            <div className="bg-slate-900 border border-slate-800 text-slate-205 rounded-2xl shadow-xl flex flex-col max-h-[700px] overflow-hidden">
              {/* Header Action Bar */}
              <div className="bg-slate-950 px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Output Silsilah Buku AI</span>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-all"
                    title="Salin Naskah"
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    onClick={downloadAsTextFile}
                    className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-all"
                    title="Unduh Berkas Teks"
                  >
                    <FileDown size={15} />
                  </button>
                </div>
              </div>

              {/* Viewport content */}
              <div className="p-6 sm:p-8 overflow-y-auto bg-slate-950/20 text-slate-100 flex-1 space-y-1">
                {renderSimpleMarkdown(generatedContent)}
              </div>
            </div>
          ) : (
            <div className="bg-white p-16 rounded-2xl border border-slate-150 h-[500px] flex flex-col items-center justify-center text-center text-slate-400">
              <BookOpen size={48} className="text-slate-300 animate-pulse mb-3" />
              <h4 className="font-bold text-slate-700 text-xs uppercase font-mono tracking-widest">Naskah Siap Diracik</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                Silakan pilih kategori dokumentasi AI di sebelah kiri dan tekan tombol susun di bawahnya untuk memerintahkan robot sejarawan menulis karya silsilah.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
