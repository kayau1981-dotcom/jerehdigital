import { useMemo, useState } from 'react';
import { Member } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Download, 
  Percent, 
  Briefcase, 
  MapPin, 
  Users,
  Award,
  BookOpen,
  PieChartIcon,
  Printer,
  Flame,
  FileText
} from 'lucide-react';

interface LaporanProps {
  members: Member[];
  familyTitle: string;
}

const COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function LaporanView({ members, familyTitle }: LaporanProps) {
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  const handlePrint = () => {
    const style = document.createElement('style');
    style.id = 'print-override-style';
    style.innerHTML = `
      @media print {
        /* Sembunyikan seluruh elemen di layar utama */
        body > * {
          display: none !important;
        }
        body {
          background-color: white !important;
          color: black !important;
        }
        /* Tampilkan khusus area dokumen cetak */
        #printable-report-area {
          display: block !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 24px !important;
          box-shadow: none !important;
          border: none !important;
          background: white !important;
        }
        #printable-report-area * {
          background-color: transparent !important;
          color: black !important;
          border-color: #cbd5e1 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    // Bersihkan style override setelah print dialog ditutup
    setTimeout(() => {
      const el = document.getElementById('print-override-style');
      if (el) el.remove();
    }, 1000);
  };
  
  // 1. Generation stats
  const generationData = useMemo(() => {
    const list = [0, 0, 0, 0, 0]; // up to 5 generations
    members.forEach(m => {
      const gen = m.generasi || 1;
      if (gen >= 1 && gen <= 5) {
        list[gen - 1]++;
      }
    });

    return [
      { name: 'Generasi 1 (Sesepuh)', Jumlah: list[0] },
      { name: 'Generasi 2 (Anak)', Jumlah: list[1] },
      { name: 'Generasi 3 (Cucu/Anak Inti)', Jumlah: list[2] },
      { name: 'Generasi 4', Jumlah: list[3] },
      { name: 'Generasi 5', Jumlah: list[4] }
    ].filter(item => item.Jumlah > 0);
  }, [members]);

  // 2. Gender stats
  const genderData = useMemo(() => {
    let l = 0;
    let p = 0;
    members.forEach(m => {
      if (m.gender === 'L') l++;
      else p++;
    });

    return [
      { name: 'Laki-laki', value: l },
      { name: 'Perempuan', value: p }
    ];
  }, [members]);

  // 3. Alive vs Passed states
  const lifeStatusData = useMemo(() => {
    let alive = 0;
    let deceased = 0;
    members.forEach(m => {
      if (m.statusHidup === 'Hidup') alive++;
      else deceased++;
    });

    return [
      { name: 'Hidup', value: alive },
      { name: 'Wafat', value: deceased }
    ];
  }, [members]);

  // 4. Job breakdown listing table
  const jobsStats = useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach(m => {
      const job = m.pekerjaan || 'Ibu Rumah Tangga / Lainnya';
      counts[job] = (counts[job] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [members]);

  // 5. Domisili Map cities
  const domisiliStats = useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach(m => {
      const city = m.domisili || 'Tidak Diketahui';
      counts[city] = (counts[city] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [members]);

  const handleDownloadReportText = () => {
    const reportHeadline = `=== LAPORAN STATISTIK RESMI SILSILAH KELUARGA ===\n`;
    const sub = `Keluarga Besar: ${familyTitle || 'Joyo Sutiko'}\n`;
    const val = `Total Anggota Terdaftar: ${members.length}\n`;
    const genHeadline = `\n1. SEBARAN ANGGOTA PER GENERASI\n`;
    const gens = generationData.map(g => `- ${g.name}: ${g.Jumlah} Orang`).join('\n');
    
    const jbHeadline = `\n2. SEBARAN PROFESI/PEKERJAAN TERATAS\n`;
    const jb = jobsStats.map(j => `- ${j.name}: ${j.count} Orang`).join('\n');
    
    const dmHeadline = `\n3. SEBARAN KOTA DOMISILI TERATAS\n`;
    const dm = domisiliStats.map(d => `- ${d.name}: ${d.count} Orang`).join('\n');

    const fulltext = reportHeadline + sub + val + genHeadline + gens + jbHeadline + jb + dmHeadline + dm;

    const element = document.createElement('a');
    const file = new Blob([fulltext], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Laporan_Statistik_Silsilah_${familyTitle.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      
      {/* Upper info card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight uppercase flex items-center gap-2">
            <PieChartIcon size={16} className="text-blue-600 animate-pulse" />
            Laporan Analitik Demografi Keluarga
          </h2>
          <p className="text-xs text-slate-400 mt-1">Audit populasi, sebaran generasi per silsilah, rasio gender, statistik pekerjaan, dan peta sebaran domisili</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleDownloadReportText}
            className="bg-slate-500 hover:bg-slate-600 hover:scale-101 transition-all text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
          >
            <Download size={14} />
            UNDUH LAPORAN (TXT)
          </button>
          <button
            onClick={() => setIsPrintPreviewOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 hover:scale-102 transition-all text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
          >
            <Printer size={14} />
            CETAK LAPORAN LENGKAP (PDF)
          </button>
        </div>
      </div>

      {/* Grid statistics metrics charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Generational bar chart (Kiri/Tengah 2 columns) */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-150 shadow-3xs space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase text-slate-405 tracking-wider flex items-center gap-2 border-b border-slate-50 pb-2">
            <TrendingUp size={14} className="text-blue-500" />
            Sebaran Populasi Berdasarkan Generasi
          </h3>
          <div className="h-64 sm:h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={generationData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="Jumlah" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ratio circle charts (Kanan 1 column) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-150 shadow-3xs space-y-6">
          
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-405 tracking-wider flex items-center gap-2 border-b border-slate-50 pb-2">
              <Percent size={14} className="text-pink-500" />
              Komposisi Rasio Gender
            </h3>
            <div className="h-32 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center leading-none mt-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Total</span>
                <span className="text-lg font-extrabold text-slate-800">{members.length}</span>
              </div>
            </div>
            {/* Legend label custom */}
            <div className="flex justify-center gap-6 text-[11px] font-semibold text-slate-600">
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Laki-laki ({genderData[0].value})</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-pink-500" /> Perempuan ({genderData[1].value})</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-405 tracking-wider flex items-center gap-2 border-b border-slate-50 pb-2">
              <BookOpen size={14} className="text-slate-500" />
              BREAKDOWN JANGKAUAN HIDUP
            </h3>
            <div className="h-32 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={lifeStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#94a3b8" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center leading-none mt-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-404">Hidup</span>
                <span className="text-lg font-extrabold text-emerald-600">{lifeStatusData[0].value}</span>
              </div>
            </div>
            {/* Legend label custom status */}
            <div className="flex justify-center gap-6 text-[11px] font-semibold text-slate-605">
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Hidup ({lifeStatusData[0].value})</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Wafat ({lifeStatusData[1].value})</span>
            </div>
          </div>

        </div>

      </div>

      {/* Row breakdown Tables metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Occupations stats tables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2">
            <Briefcase size={14} className="text-blue-500" />
            Top 5 Klasifikasi Pekerjaan Terbanyak
          </h3>
          <div className="divide-y divide-slate-100">
            {jobsStats.map((item, index) => (
              <div key={item.name} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-500 font-mono">
                    {index + 1}
                  </div>
                  <span className="font-bold text-slate-700">{item.name}</span>
                </div>
                <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">
                  {item.count} Anggota
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cities stats table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2">
            <MapPin size={14} className="text-indigo-500" />
            Top 5 Kota Tinggal & Domisili Terpadat
          </h3>
          <div className="divide-y divide-slate-100">
            {domisiliStats.map((item, index) => (
              <div key={item.name} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-500 font-mono">
                    {index + 1}
                  </div>
                  <span className="font-bold text-slate-700">{item.name}</span>
                </div>
                <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg">
                  {item.count} Anggota
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* PDF Print Preview Overlay */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 md:p-10 no-print font-sans select-none animate-fade-in text-slate-800">
          <div className="bg-slate-100 dark:bg-slate-950 w-full max-w-4xl rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-4">
            
            {/* Overlay controls */}
            <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
                  <Printer className="text-blue-600 animate-pulse" size={18} />
                  Pratinjau Dokumen Cetak Laporan Resmi (PDF)
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Peta kepadatan, statistik demografi lengkap, & lembar verifikasi resmi silsilah</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Printer size={13} />
                  Mulai Cetak / Simpan PDF
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-700 dark:text-slate-305 text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Tutup Pratinjau
                </button>
              </div>
            </div>

            {/* Styled A4 Paper Preview */}
            <div className="p-8 max-h-[70vh] overflow-y-auto flex justify-center bg-slate-200/50 dark:bg-slate-950/20">
              <div 
                id="printable-report-area" 
                className="bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] p-12 shadow-md border border-slate-200 rounded-xs flex flex-col justify-between font-serif relative"
              >
                {/* Watermark/Emblem in background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.015] pointer-events-none select-none">
                  <svg className="w-96 h-96" viewBox="0 0 100 100" fill="currentColor">
                    <path d="M50 15 L80 45 L50 75 L20 45 Z" />
                    <circle cx="50" cy="45" r="25" />
                  </svg>
                </div>

                <div className="space-y-8 relative z-10 text-slate-900">
                  {/* Header / Kop Laporan */}
                  <div className="border-b-4 border-double border-slate-800 pb-4 text-center space-y-1">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-slate-800 flex items-center justify-center font-bold font-sans text-xs shrink-0">
                        SILS
                      </div>
                      <div className="text-left font-sans">
                        <h1 className="text-sm font-black tracking-widest text-slate-900 uppercase">PAGUYUBAN SILSILAH KELUARGA ALUMNI</h1>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider leading-none">Sistem Digitalisasi Dokumentasi Silsilah Dinasti Keluarga besar</p>
                      </div>
                    </div>
                    <p className="text-[8px] text-slate-400 font-mono pt-1">Website: silsilah-portal.local / Surel: sekretariat@joyosutiko.id / Dokumen ID: LPK/DEM/001/06-2026</p>
                  </div>

                  {/* Document Title */}
                  <div className="text-center space-y-1 font-sans">
                    <h2 className="text-md font-black tracking-tight text-slate-900 uppercase">LAPORAN DEMOGRAFI & KEPADATAN PENDUDUK KELUARGA</h2>
                    <p className="text-xs font-semibold text-slate-650 bg-slate-50 py-1.5 px-3 rounded-md max-w-sm mx-auto uppercase">
                      Silsilah: Keluarga Besar {familyTitle || 'Joyo Sutiko'}
                    </p>
                  </div>

                  {/* Metadatas Box */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200 font-sans text-[11px] text-slate-600">
                    <div className="space-y-1.5">
                      <p><strong>Ref. No:</strong> REG-DEM-00126</p>
                      <p><strong>Tanggal Terbit:</strong> 10 Juni 2026</p>
                      <p><strong>Metode Sinkronisasi:</strong> Google Sheets Cloud / CSV</p>
                    </div>
                    <div className="space-y-1.5 text-right">
                      <p><strong>Petugas Pengolah:</strong> Admin Portal Silsilah</p>
                      <p><strong>Total Sensus Profil:</strong> {members.length} Keturunan</p>
                      <p><strong>Status Berkas:</strong> Terverifikasi Komite</p>
                    </div>
                  </div>

                  {/* Part 1: Executive Summary */}
                  <div className="space-y-3">
                    <h3 className="text-[11px] font-sans font-black uppercase text-slate-800 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                      <span>📌</span> I. RINGKASAN DATA KELUARGA (FAMILY SUMMARY)
                    </h3>
                    <p className="text-xs text-slate-600 leading-normal font-sans">
                      Laporan sensus ini memuat sebaran persebaran wilayah, kemapanan profesi, status hidup, dan dinamika regenerasi dari seluruh keturunan dalam silsilah keluarga. Tercatat sebanyak <strong>{members.length} anggota</strong> terintegrasi secara aktif pada portal database.
                    </p>
                    
                    <div className="grid grid-cols-4 gap-3 font-sans text-center">
                      <div className="p-2 border border-slate-200 bg-slate-50/30 rounded-xl">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Total Silsilah</p>
                        <p className="text-lg font-extrabold text-slate-800">{members.length}</p>
                        <p className="text-[8px] text-slate-400">Anggota</p>
                      </div>
                      <div className="p-2 border border-slate-200 bg-slate-50/30 rounded-xl">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Rasio L / P</p>
                        <p className="text-lg font-extrabold text-slate-800">
                          {genderData[0]?.value || 0} / {genderData[1]?.value || 0}
                        </p>
                        <p className="text-[8px] text-slate-400">Jiwa</p>
                      </div>
                      <div className="p-2 border border-slate-200 bg-slate-50/30 rounded-xl">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Hidup / Wafat</p>
                        <p className="text-lg font-extrabold text-slate-800">
                          {lifeStatusData[0]?.value || 0} / {lifeStatusData[1]?.value || 0}
                        </p>
                        <p className="text-[8px] text-slate-400">Kondisi</p>
                      </div>
                      <div className="p-2 border border-slate-200 bg-slate-50/30 rounded-xl">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Hub Kepadatan</p>
                        <p className="text-xs font-bold text-blue-700 truncate pt-1 uppercase">
                          {domisiliStats[0]?.name || 'Tidak Ada'}
                        </p>
                        <p className="text-[8px] text-slate-400">{domisiliStats[0]?.count || 0} Anggota</p>
                      </div>
                    </div>
                  </div>

                  {/* Part 2: Demographic Stats */}
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-sans font-black uppercase text-slate-800 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                      <span>📊</span> II. ANALISIS DEMOGRAFI ANGGOTA KELUARGA
                    </h3>
                    
                    <div className="space-y-3">
                      <p className="text-[11px] font-sans font-bold text-slate-700 leading-none uppercase tracking-wide">Penyebaran Berdasarkan Kelompok Generasi:</p>
                      <div className="space-y-2.5 font-sans text-xs">
                        {generationData.map(g => {
                          const percentage = Math.round((g.Jumlah / members.length) * 100) || 0;
                          return (
                            <div key={g.name} className="space-y-1">
                              <div className="flex justify-between font-bold text-slate-700 text-[10px]">
                                <span>{g.name}</span>
                                <span>{g.Jumlah} Jiwa ({percentage}%)</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-600 rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Part 3: Heatmap Population Density */}
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-sans font-black uppercase text-slate-800 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                      <span>🔥</span> III. GRAFIK KEPADATAN PENDUDUK KELUARGA (HEATMAP)
                    </h3>
                    
                    <p className="text-xs text-slate-600 leading-normal font-sans">
                      Berikut adalah grafik visualisasi konsentrasi wilayah tempat tinggal (kepadatan domisili) anggota keluarga. Daerah dengan intensitas warna merah melambangkan tingkat kepadatan tinggi (Hub Silsilah), sementara warna kuning melambangkan kepadatan sedang, dan biru/cyan melambangkan sebaran rendah.
                    </p>

                    {/* Vector Heatmap Visual inside printed page */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/20 space-y-4 font-sans">
                      
                      {/* Visual density spectrum indicators bar */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase">
                          <span>Daftar Domisili Tertinggi (Kepadatan)</span>
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Spectrum Panas Kepadatan</span>
                        </div>

                        <div className="space-y-2.5 text-xs">
                          {domisiliStats.map((item, index) => {
                            const maxCount = domisiliStats[0]?.count || 1;
                            const ratio = item.count / maxCount;
                            
                            // Calculate custom heat color for the printed spectrum bar
                            let colorClass = 'bg-cyan-500'; // low
                            let heatLabel = 'RENDAH';
                            let colorHex = '#06b6d4';
                            if (ratio > 0.7) {
                              colorClass = 'bg-red-500'; // high
                              heatLabel = 'TINGGI (HUB UTAMA)';
                              colorHex = '#ef4444';
                            } else if (ratio > 0.3) {
                              colorClass = 'bg-yellow-500'; // medium
                              heatLabel = 'SEDANG';
                              colorHex = '#eab308';
                            }

                            return (
                              <div key={item.name} className="flex items-center gap-3">
                                <span className="w-20 font-bold text-slate-700 truncate">{item.name}</span>
                                <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden flex p-[1px]">
                                  <div 
                                    className={`h-full rounded-full ${colorClass}`} 
                                    style={{ width: `${ratio * 100}%` }}
                                  />
                                </div>
                                <span className="w-16 text-right font-mono font-bold text-slate-500 text-[10px]">{item.count} Anggota</span>
                                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm shrink-0" style={{ color: colorHex, backgroundColor: `${colorHex}10` }}>
                                  {heatLabel}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Color gradation bar map guide legend */}
                      <div className="space-y-1 pt-2 border-t border-slate-100">
                        <div className="h-1.5 w-full rounded-md bg-gradient-to-r from-cyan-400 via-yellow-400 to-red-500" />
                        <div className="flex justify-between text-[8px] text-slate-400 font-mono font-bold">
                          <span>Low (1 Anggota)</span>
                          <span>Medium (2-3 Keturunan)</span>
                          <span>Hub Padat (4-5+ Keturunan)</span>
                        </div>
                      </div>

                      {/* Simulated geographic locator cards with coordinates inside PDF */}
                      <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-500 font-mono pt-1">
                        <div>• Solo Hub: Lat -7.56, Lng 110.83 ({domisiliStats.find(d => d.name === 'Solo')?.count || 0} Jiwa)</div>
                        <div>• Semarang: Lat -6.96, Lng 110.41 ({domisiliStats.find(d => d.name === 'Semarang')?.count || 0} Jiwa)</div>
                        <div>• Jakarta: Lat -6.17, Lng 106.82 ({domisiliStats.find(d => d.name.includes('Jakarta'))?.count || 0} Jiwa)</div>
                        <div>• Bandung: Lat -6.91, Lng 107.61 ({domisiliStats.find(d => d.name === 'Bandung')?.count || 0} Jiwa)</div>
                      </div>

                    </div>
                  </div>

                  {/* Validation & Legality stamp section */}
                  <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 font-sans text-xs">
                    <div className="space-y-10">
                      <div className="leading-normal text-slate-600">
                        <p>Dilaporkan Oleh,</p>
                        <p className="font-bold text-slate-800">Administrasi Portal Silsilah</p>
                      </div>
                      <div className="border-b border-dashed border-slate-400 w-40" />
                      <p className="text-[9px] text-slate-400 uppercase font-mono tracking-widest leading-none">NIP: ADM-SIL-2026</p>
                    </div>
                    <div className="space-y-10 text-right flex flex-col items-end">
                      <div className="leading-normal text-slate-600">
                        <p>Mengesahkan,</p>
                        <p className="font-bold text-slate-850 font-sans">Ketua Komite Paguyuban</p>
                      </div>
                      <div className="border-b border-dashed border-slate-400 w-40" />
                      <p className="text-[9px] text-slate-400 uppercase font-mono tracking-widest leading-none">TANDA TANGAN & STEMPEL RESMI</p>
                    </div>
                  </div>

                </div>

                {/* Footer of the PDF page */}
                <div className="border-t border-slate-200 pt-3 text-center text-[8px] text-slate-400 tracking-wider font-sans uppercase">
                  Halaman 1 dari 1 — Laporan Resmi ini diterbitkan secara otomatis dan terakreditasi oleh Portal Silsilah Keluarga 2026
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
