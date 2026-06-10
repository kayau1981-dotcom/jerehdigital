import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  X, 
  BarChart3, 
  GitFork, 
  Users, 
  Image as ImageIcon, 
  PieChart,
  ChevronRight,
  Compass
} from 'lucide-react';

interface QuickJumpFABProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function QuickJumpFAB({ currentView, onViewChange }: QuickJumpFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sections = [
    {
      id: 'dashboard',
      label: 'Beranda & Statistik',
      description: 'Laskar data ringkasan, mutasi terbaru, dan metrik silsilah',
      icon: BarChart3,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/30',
      badge: 'Utama'
    },
    {
      id: 'tree',
      label: 'Pohon Silsilah',
      description: 'Struktur visual interaktif alur keturunan keluarga besar',
      icon: GitFork,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/30',
      badge: 'Interaktif'
    },
    {
      id: 'members',
      label: 'Daftar Anggota',
      description: 'Direktori detail, kependudukan, dan riwayat silsilah',
      icon: Users,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900/30',
    },
    {
      id: 'album',
      label: 'Album Keluarga',
      description: 'Galeri dokumentasi visual dan kenangan foto bersama',
      icon: ImageIcon,
      color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/40 border-pink-100 dark:border-pink-900/30',
    },
    {
      id: 'reports',
      label: 'Laporan & Demografi',
      description: 'Analisis kependudukan, peta sebaran, dan cetak PDF resmi',
      icon: PieChart,
      color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40 border-orange-100 dark:border-orange-900/30',
      badge: 'Cetak PDF'
    }
  ];

  const handleJump = (viewId: string) => {
    onViewChange(viewId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div 
        id="quick-jump-fab-container" 
        className="fixed bottom-6 right-6 z-40 font-sans"
      >
        <motion.button
          id="quick-jump-fab-btn"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-center w-14 h-14 rounded-full border shadow-2xl transition-all duration-300 focus:outline-none cursor-pointer ${
            isOpen 
              ? 'bg-red-500 border-red-400 text-white hover:bg-red-600 rotate-90 scale-105' 
              : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500 hover:scale-110 active:scale-95'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          layoutId="quick-jump-fab-action"
          title="Navigasi Kilat (Quick Jump)"
        >
          {isOpen ? <X size={24} /> : <Zap size={24} className="fill-current animate-pulse animate-duration-2000" />}
        </motion.button>

        {/* Small subtle radar indicator when closed to guide the user */}
        <AnimatePresence>
          {!isOpen && (
            <motion.span 
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 1.4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
              className="absolute inset-0 w-14 h-14 rounded-full bg-blue-500/35 pointer-events-none -z-10"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Simplified Modal List */}
      <AnimatePresence>
        {isOpen && (
          <div 
            id="quick-jump-modal-overlay"
            className="fixed inset-0 z-45 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              id="quick-jump-modal-card"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/55 text-blue-600 rounded-xl">
                    <Compass size={18} className="animate-spin-slow" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-850 dark:text-slate-100 uppercase tracking-tight">Navigasi Silsilah Kilat</h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Lompat seketika ke halaman silsilah keluarga besar</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-450 dark:text-slate-400 cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Simplified Modal Grid / List of sections */}
              <div className="space-y-2.5">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isCurrent = currentView === section.id;
                  return (
                    <motion.button
                      key={section.id}
                      type="button"
                      onClick={() => handleJump(section.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border flex items-center justify-between gap-4 transition-all cursor-pointer group ${
                        isCurrent 
                          ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500/45 text-slate-850 dark:text-slate-100 ring-1 ring-blue-500/25' 
                          : 'bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-950/45 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                      whileHover={{ scale: 1.015, x: 2 }}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Icon Container with semantic colored ring */}
                        <div className={`p-3 rounded-xl border shrink-0 flex items-center justify-center ${section.color}`}>
                          <Icon size={18} className={isCurrent ? 'animate-pulse' : ''} />
                        </div>
                        
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-sans tracking-tight block">
                              {section.label}
                            </span>
                            {section.badge && (
                              <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                                {section.badge}
                              </span>
                            )}
                            {isCurrent && (
                              <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-500">
                                Sedang Dibuka
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5 leading-snug">
                            {section.description}
                          </p>
                        </div>
                      </div>

                      {/* Accent connector arrow */}
                      <div className={`p-1.5 rounded-lg border border-transparent shadow-none group-hover:border-slate-100 dark:group-hover:border-slate-800 bg-transparent group-hover:bg-slate-50 dark:group-hover:bg-slate-950/60 transition-all ${
                        isCurrent ? 'text-blue-500' : 'text-slate-350 dark:text-slate-500 group-hover:text-slate-700 group-hover:dark:text-slate-200'
                      }`}>
                        <ChevronRight size={13} />
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Tips footer */}
              <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 text-center">
                <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                  ⚡ NAVIGASI INSTAN • TEKAN KAPAN SAJA UNTUK BERPINDAH VIEW
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
