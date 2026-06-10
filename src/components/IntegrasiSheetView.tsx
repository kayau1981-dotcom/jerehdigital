import React, { useState, useMemo, FormEvent } from 'react';
import { ColumnMapping, Member } from '../types';
import { 
  Settings, 
  HelpCircle, 
  Download, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Database,
  Grid,
  FileSpreadsheet,
  Link2,
  Lock,
  Upload
} from 'lucide-react';
import { parseCSV, mapRowsToMembers, generateTemplateCSV, downloadFile } from '../utils/csv';
import { DEFAULT_MAPPING } from '../data/mockData';

interface IntegrasiSheetViewProps {
  sheetUrl: string;
  isLinked: boolean;
  onLinkSheet: (url: string, mapping: ColumnMapping, parsedMembers: Member[]) => void;
  onUnlinkSheet: () => void;
  mappingConfig: ColumnMapping;
  onAddLog: (tipe: 'tambah' | 'edit' | 'hapus' | 'sinkronisasi', deskripsi: string) => void;
}

export default function IntegrasiSheetView({
  sheetUrl,
  isLinked,
  onLinkSheet,
  onUnlinkSheet,
  mappingConfig,
  onAddLog
}: IntegrasiSheetViewProps) {
  
  const [urlInput, setUrlInput] = useState<string>(sheetUrl === 'local-csv' ? '' : sheetUrl);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>('');
  
  // Staged parsing values
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [localMapping, setLocalMapping] = useState<ColumnMapping>({ ...mappingConfig });
  const [previewMembers, setPreviewMembers] = useState<Member[]>([]);

  // Local/Manual CSV specific states
  const [stagedSource, setStagedSource] = useState<'sheets' | 'local'>(
    sheetUrl === 'local-csv' ? 'local' : 'sheets'
  );
  const [localFileName, setLocalFileName] = useState<string>(
    sheetUrl === 'local-csv' ? 'manual-upload.csv' : ''
  );

  const isFormMappingVisible = parsedHeaders.length > 0;

  // Generate blank template sheet downloader
  const handleDownloadTemplate = () => {
    const csvContent = generateTemplateCSV(DEFAULT_MAPPING);
    downloadFile(csvContent, 'template_silsilah_keluarga.csv', 'text/csv;charset=utf-8;');
    onAddLog('sinkronisasi', 'Mengunduh file template silsilah keluarga format Google Sheets CSV.');
  };

  // Step 1: Fetch and Validate Google Sheet URL
  const handleValidateUrl = async (e: FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setIsLoading(true);
    setParsedHeaders([]);
    setParsedRows([]);
    setPreviewMembers([]);

    if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://')) {
      setErrorText('Format URL tidak valid. Mohon pastikan link diawali dengan https:// atau http://');
      setIsLoading(false);
      return;
    }

    if (!urlInput.includes('/pub?') || !urlInput.includes('output=csv')) {
      if (urlInput.includes('docs.google.com/spreadsheets')) {
        setErrorText('Langkah Salah: Anda memasukkan URL editor spreadsheet biasa. Mohon ikuti instruksi cara mempublikasikan spreadsheet ke web sebagai CSV terlebih dahulu.');
      } else {
        setErrorText('URL tidak terdeteksi sebagai output CSV publik. Pastikan opsi publikasi diatur sebagai Comma Separated Values (.csv).');
      }
      setIsLoading(false);
      return;
    }

    try {
      // In web, browser might block CORS. To avoid CORS, we fetch directly.
      // Google Sheets published-to-web CSV *usually* allows direct CORS! It is fully public.
      const response = await fetch(urlInput);
      if (!response.ok) {
        throw new Error(`Google Sheets mengembalikan status: ${response.status}`);
      }

      const csvText = await response.text();
      if (!csvText.trim()) {
        throw new Error('Spreadsheet kosong atau mengembalikan teks tanpa baris.');
      }

      const rows = parseCSV(csvText);
      if (rows.length === 0) {
        throw new Error('Gagal mengekstrak baris manapun dari file CSV.');
      }

      // Read headers from first row
      const headers = Object.keys(rows[0]);
      setParsedHeaders(headers);
      setParsedRows(rows);

      // Attempt automatic mapping matching if headers are similar
      const updatedMapping = { ...localMapping };
      headers.forEach(header => {
        const lower = header.toLowerCase();
        if (lower.includes('id') && !lower.includes('ayah') && !lower.includes('ibu') && !lower.includes('pasangan') && !lower.includes('foto')) {
          updatedMapping.id = header;
        } else if (lower.includes('nama') || lower.includes('lengkap') || lower.includes('name')) {
          updatedMapping.nama = header;
        } else if (lower.includes('jenis kelamin') || lower.includes('kelamin') || lower.includes('gender') || lower.includes('sex') || lower === 'l/p') {
          updatedMapping.gender = header;
        } else if (lower.includes('ayah') || lower.includes('father')) {
          updatedMapping.ayahId = header;
        } else if (lower.includes('ibu') || lower.includes('mother')) {
          updatedMapping.ibuId = header;
        } else if (lower.includes('pasangan') || lower.includes('spouse') || lower.includes('suami') || lower.includes('istri')) {
          updatedMapping.pasanganId = header;
        } else if (lower.includes('lahir') && lower.includes('tanggal')) {
          updatedMapping.tanggalLahir = header;
        } else if (lower.includes('tempat lahir')) {
          updatedMapping.tempatLahir = header;
        } else if (lower.includes('status') || lower.includes('hidup')) {
          updatedMapping.statusHidup = header;
        } else if (lower.includes('wafat') || lower.includes('meninggal')) {
          updatedMapping.tanggalWafat = header;
        } else if (lower.includes('pekerjaan') || lower.includes('profesi') || lower.includes('kerja') || lower.includes('job')) {
          updatedMapping.pekerjaan = header;
        } else if (lower.includes('telp') || lower.includes('telepon') || lower.includes('phone') || lower.includes('hp') || lower.includes('wa')) {
          updatedMapping.telepon = header;
        } else if (lower.includes('tinggal') || lower.includes('domisili') || lower.includes('kota') || lower.includes('alamat')) {
          updatedMapping.domisili = header;
        } else if (lower.includes('foto') || lower.includes('url foto') || lower.includes('image') || lower.includes('avatar')) {
          updatedMapping.foto = header;
        } else if (lower.includes('catatan') || lower.includes('note') || lower.includes('keterangan')) {
          updatedMapping.catatan = header;
        }
      });

      setLocalMapping(updatedMapping);

      // Pre-map rows with current mapping for preview values
      const preMapped = mapRowsToMembers(rows, updatedMapping);
      setPreviewMembers(preMapped);

    } catch (e: any) {
      console.error(e);
      setErrorText(`Sinkronisasi Gagal: ${e.message || 'CORS block atau URL tidak valid. Mohon pastikan setelan publikasi Google Anda sudah benar-benar dirilis ke publik.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1.2: Parse & Handle Local CSV File Upload
  const handleLocalCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLocalFileName(file.name);
    setErrorText('');
    setIsLoading(true);
    setParsedHeaders([]);
    setParsedRows([]);
    setPreviewMembers([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text || !text.trim()) {
          throw new Error('Berkas CSV kosong atau tidak memiliki data.');
        }

        const rows = parseCSV(text);
        if (rows.length === 0) {
          throw new Error('Gagal mengekstrak baris manapun dari file CSV.');
        }

        // Read headers from first row
        const headers = Object.keys(rows[0]);
        setParsedHeaders(headers);
        setParsedRows(rows);
        setUrlInput('local-csv'); // Mark with identifier for app-level tracking

        // Attempt automatic mapping matching if headers are similar
        const updatedMapping = { ...localMapping };
        headers.forEach(header => {
          const lower = header.toLowerCase();
          if (lower.includes('id') && !lower.includes('ayah') && !lower.includes('ibu') && !lower.includes('pasangan') && !lower.includes('foto')) {
            updatedMapping.id = header;
          } else if (lower.includes('nama') || lower.includes('lengkap') || lower.includes('name')) {
            updatedMapping.nama = header;
          } else if (lower.includes('jenis kelamin') || lower.includes('kelamin') || lower.includes('gender') || lower.includes('sex') || lower === 'l/p') {
            updatedMapping.gender = header;
          } else if (lower.includes('ayah') || lower.includes('father')) {
            updatedMapping.ayahId = header;
          } else if (lower.includes('ibu') || lower.includes('mother')) {
            updatedMapping.ibuId = header;
          } else if (lower.includes('pasangan') || lower.includes('spouse') || lower.includes('suami') || lower.includes('istri')) {
            updatedMapping.pasanganId = header;
          } else if (lower.includes('lahir') && lower.includes('tanggal')) {
            updatedMapping.tanggalLahir = header;
          } else if (lower.includes('tempat lahir')) {
            updatedMapping.tempatLahir = header;
          } else if (lower.includes('status') || lower.includes('hidup')) {
            updatedMapping.statusHidup = header;
          } else if (lower.includes('wafat') || lower.includes('meninggal')) {
            updatedMapping.tanggalWafat = header;
          } else if (lower.includes('pekerjaan') || lower.includes('profesi') || lower.includes('kerja') || lower.includes('job')) {
            updatedMapping.pekerjaan = header;
          } else if (lower.includes('telp') || lower.includes('telepon') || lower.includes('phone') || lower.includes('hp') || lower.includes('wa')) {
            updatedMapping.telepon = header;
          } else if (lower.includes('tinggal') || lower.includes('domisili') || lower.includes('kota') || lower.includes('alamat')) {
            updatedMapping.domisili = header;
          } else if (lower.includes('foto') || lower.includes('url foto') || lower.includes('image') || lower.includes('avatar')) {
            updatedMapping.foto = header;
          } else if (lower.includes('catatan') || lower.includes('note') || lower.includes('keterangan')) {
            updatedMapping.catatan = header;
          }
        });

        setLocalMapping(updatedMapping);

        // Pre-map rows with current mapping for preview values
        const preMapped = mapRowsToMembers(rows, updatedMapping);
        setPreviewMembers(preMapped);

        onAddLog('sinkronisasi', `Berhasil mengekstrak berkas CSV lokal "${file.name}" dengan total ${rows.length} baris data keluarga.`);
      } catch (err: any) {
        console.error(err);
        setErrorText(`Gagal Membaca CSV: ${err.message || 'Format pengetikan salah'}`);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setErrorText('Terjadi error internal saat membaca berkas CSV lokal.');
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  // Step 2: Save and update final integration map
  const handleSaveIntegration = () => {
    if (parsedRows.length === 0) return;
    
    // Process mapping with compiled items
    const finalMembers = mapRowsToMembers(parsedRows, localMapping);
    
    if (urlInput === 'local-csv') {
      onLinkSheet('local-csv', localMapping, finalMembers);
      onAddLog('sinkronisasi', `Sistem berhasil memuat & menyinkronkan ${finalMembers.length} anggota keluarga dari Berkas CSV Lokal secara manual.`);
    } else {
      onLinkSheet(urlInput, localMapping, finalMembers);
      onAddLog('sinkronisasi', `Berhasil mensinkronkan silsilah dengan Google Sheets. Memuat ${finalMembers.length} anggota.`);
    }
    
    // Clear temporary lists
    setParsedHeaders([]);
    setParsedRows([]);
    setPreviewMembers([]);
  };

  // Change individual mapping
  const handleColumnMapChange = (field: keyof ColumnMapping, val: string) => {
    const updated = { ...localMapping, [field]: val };
    setLocalMapping(updated);
    
    // Recalculate preview
    if (parsedRows.length > 0) {
      const preMapped = mapRowsToMembers(parsedRows, updated);
      setPreviewMembers(preMapped);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Title Stats */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight uppercase flex items-center gap-2">
            <Database size={16} className="text-blue-500" />
            Portal Integrasi & Sinkronisasi Database Anggota
          </h2>
          <p className="text-xs text-slate-400 mt-1">Sinkronkan pohon keluarga Anda menggunakan spreadsheet cloud Google Sheets, atau muat file CSV lokal secara offline</p>
        </div>

        <div>
          {isLinked ? (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-150 px-3.5 py-2 rounded-xl text-xs font-semibold">
              <CheckCircle size={15} className="text-emerald-500" />
              <span>STATUS: {sheetUrl === 'local-csv' ? 'TERIMPOR DARI CSV LOKAL' : 'TERHUBUNG LIVE (CLOUD)'}</span>
              <button 
                type="button"
                onClick={() => {
                  onUnlinkSheet();
                  onAddLog('sinkronisasi', 'Memutuskan koneksi database kustom, kembali ke format database bawaan sistem.');
                }}
                className="ml-2 px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-[10px] font-bold cursor-pointer"
              >
                Putus Koneksi
              </button>
            </div>
          ) : (
            <span className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <AlertCircle size={14} className="text-amber-500" />
              STATUS: LOCAL OFFLINE DATA DEMO
            </span>
          )}
        </div>
      </div>

      {/* Main integration card configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* SETUP INSTRUCTIONS & ENTRANCES (Kiri/Tengah) */}
        <div className="lg:col-span-3 space-y-6">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-xs font-mono uppercase tracking-widest pb-2 border-b border-slate-50 flex items-center gap-2">
              <HelpCircle size={15} className="text-blue-500" />
              Petunjuk Penggunaan & Format Berkas CSV
            </h3>

            <div className="space-y-3 font-sans text-xs text-slate-600 leading-normal">
              
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[11px] shrink-0">1</div>
                <div>
                  <p className="font-bold text-slate-800">Unduh Format Kerangka Silsilah (Opsional)</p>
                  <p className="text-slate-500 mt-0.5">Disarankan agar nama tajuk (header) kolom berkas CSV Anda memiliki kecocokan pola agar proses auto-mapping berlangsung dengan instan.</p>
                  <button 
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="mt-2 text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download size={12} />
                    Unduh Struktur Kerangka Silsilah (.CSV)
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[11px] shrink-0">2</div>
                <div>
                  <p className="font-bold text-slate-800">Metode Sinkronisasi Cloud</p>
                  <p className="text-slate-500 mt-0.5">Publikasikan Google Sheet Anda ke web sebagai Comma-Separated Values (.csv). Lalu masukkan kaitan URL-nya dalam panel beralun di bawah ini.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[11px] shrink-0">3</div>
                <div>
                  <p className="font-bold text-slate-800">Metode Unggah Lokal Manual</p>
                  <p className="text-slate-500 mt-0.5">Gunakan tab <strong>Unggah CSV Manual Lokal</strong> jika dokumen silsilah tersimpan lokal dalam laptop, PC, atau HP Anda secara instan tanpa internet.</p>
                </div>
              </div>

            </div>
          </div>

          {/* SINKRONISASI BOX FORM WITH TAB TOGGLES */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            
            {/* Tabs Trigger */}
            <div className="flex border-b border-slate-100 pb-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setErrorText('');
                  setStagedSource('sheets');
                }}
                className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  stagedSource === 'sheets'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Link2 size={13} />
                Hubungkan Google Sheets
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorText('');
                  setStagedSource('local');
                }}
                className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  stagedSource === 'local'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Upload size={13} />
                Unggah CSV Manual Lokal
              </button>
            </div>

            {stagedSource === 'sheets' ? (
              <form onSubmit={handleValidateUrl} className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold tracking-wide text-slate-400 mb-1">URL Hasil Publikasi Google Sheets (output=csv)</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      value={urlInput === 'local-csv' ? '' : urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                      className="flex-1 p-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-mono text-slate-700 bg-white"
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                    >
                      {isLoading ? <RefreshCw size={14} className="animate-spin" /> : null}
                      {isLoading ? 'Memuat...' : 'Muat & Validasi'}
                    </button>
                  </div>
                </div>

                {errorText && (
                  <div className="p-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs flex gap-2 font-sans font-medium">
                    <AlertCircle size={16} className="text-rose-500 shrink-0" />
                    <p>{errorText}</p>
                  </div>
                )}
              </form>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 dark:border-slate-800 rounded-xl p-6 text-center transition-all relative flex flex-col items-center justify-center bg-slate-50/50 hover:bg-blue-50/10">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleLocalCSVUpload}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                  />
                  <div className="space-y-2 pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                      <Upload size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {localFileName ? `Terpilih: ${localFileName}` : 'Klik atau seret berkas CSV untuk memuat manual'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Sistem mendukung pembacaan otomatis schema data kolom dan preview langsung.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-amber-800 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50">
                  <span>ℹ️</span>
                  <p>Butuh berkas silsilah pemicu? <button type="button" onClick={handleDownloadTemplate} className="font-bold text-blue-600 underline hover:text-blue-500 cursor-pointer">Unduh template CSV di sini</button> lalu isi, simpan, dan unggah manual berkas tersebut.</p>
                </div>

                {errorText && (
                  <div className="p-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs flex gap-2 font-sans font-medium">
                    <AlertCircle size={16} className="text-rose-500 shrink-0" />
                    <p>{errorText}</p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* COLUMN MAPPING DIALOG AND PREVIEW ROWS (Kanan) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Mapping settings container if header validation complete */}
          {isFormMappingVisible ? (
            <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xl space-y-4 animate-fade-in">
              <div className="pb-3 border-b border-blue-50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-xs font-mono uppercase tracking-widest flex items-center gap-1.5">
                    <Settings size={15} className="text-blue-600" />
                    Atur Pemetaan Kolom
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Petakan kolom Google Sheet Anda agar pas di struktur web</p>
                </div>
                <div className="text-[10px] bg-blue-50 font-mono font-bold text-blue-600 px-2 py-0.5 rounded leading-none">
                  TERVALIDASI
                </div>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {(Object.keys(localMapping) as Array<keyof ColumnMapping>).map((field) => {
                  return (
                    <div key={field} className="flex items-center justify-between gap-4 text-xs font-medium">
                      <span className="text-slate-500 font-bold uppercase text-[10px] truncate max-w-[130px]">{field}:</span>
                      <select
                        value={localMapping[field]}
                        onChange={(e) => handleColumnMapChange(field, e.target.value)}
                        className="w-48 p-1 text-xs border border-slate-200 rounded-md focus:outline-hidden"
                      >
                        <option value="">-- Abaikan / Kosong --</option>
                        {parsedHeaders.map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSaveIntegration}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md shadow-blue-900/10 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle size={15} />
                  Simpan & Sinkronkan Live!
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center justify-center text-center text-slate-400 h-full">
              <FileSpreadsheet size={32} className="text-slate-300 animate-pulse mb-3" />
              <h4 className="font-bold text-slate-700 text-xs uppercase font-mono tracking-widest">Kolom Konfigurator</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1">Silakan masukkan URL Comma-Separated (.csv) di sebelah kiri, kemudian klik validasi untuk mengeset konfigurasi kolom.</p>
            </div>
          )}

          {/* Quick Preview Table of loaded Google Sheet rows */}
          {previewMembers.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Preview Baris ({previewMembers.length} Baris Terdeteksi)</span>
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">3 Baris Teratas</span>
              </div>

              <div className="space-y-2">
                {previewMembers.slice(0, 3).map((item, index) => {
                  return (
                    <div key={index} className="flex items-center gap-2.5 p-2 bg-slate-50/70 border border-slate-100 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 font-bold font-mono text-[10px] flex items-center justify-center shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate">{item.nama}</p>
                        <p className="text-[9px] text-slate-400 truncate">ID: {item.id} • {item.pekerjaan || 'Ibu Rumah Tangga'} • {item.statusHidup}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
