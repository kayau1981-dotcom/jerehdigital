import React, { useState, useMemo } from 'react';
import { Member, ResearchTask } from '../types';
import { 
  ClipboardList, 
  Plus, 
  Trash2, 
  User, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Check,
  ToggleLeft,
  ChevronsRight
} from 'lucide-react';

interface TaskDelegationCardProps {
  members: Member[];
  currentUser?: { role: 'Admin' | 'Anggota'; name: string } | null;
  onAddLog?: (tipe: 'tambah' | 'edit' | 'hapus' | 'sinkronisasi', deskripsi: string) => void;
}

export default function TaskDelegationCard({
  members,
  currentUser,
  onAddLog
}: TaskDelegationCardProps) {
  
  const isAdmin = currentUser?.role === 'Admin';

  // Seed / Initial data
  const initialTasks: ResearchTask[] = useMemo(() => {
    // Find some members to seed to, if members are available
    const member1 = members[0];
    const member2 = members[1] || members[0];
    const member3 = members[2] || members[1] || members[0];

    return [
      {
        id: 'task-1',
        title: 'Verifikasi Tanggal Baptis Mbah Joyo Sutiko',
        description: 'Mencari dokumen baptis resmi di Gereja Santo Antonius Solo untuk mencatat tanggal otentik.',
        assignedToId: member1?.id || 'm-1',
        assignedToName: member1?.nama || 'Ahmad Joyo',
        status: 'In-Progress',
        createdAt: '2026-06-01T08:00:00.000Z',
        dueDate: '2026-06-25'
      },
      {
        id: 'task-2',
        title: 'Cari Akta Wafat Buyut JoyoSutiko 1982',
        description: 'Koordinasi dengan Dinas Kependudukan Solo atau perwakilan kelurahan untuk salinan akta wafat.',
        assignedToId: member2?.id || 'm-2',
        assignedToName: member2?.nama || 'Siti Aminah',
        status: 'Pending',
        createdAt: '2026-06-05T09:30:00.000Z',
        dueDate: '2026-07-10'
      },
      {
        id: 'task-3',
        title: ' डिजिटल Kumpulkan Foto Lama Pernikahan 1955',
        description: 'Melakukan scan resolusi tinggi pada album foto fisik lawas keluarga saat pernikahan emas di Klaten.',
        assignedToId: member3?.id || 'm-3',
        assignedToName: member3?.nama || 'Budi Joyo',
        status: 'Done',
        createdAt: '2026-05-15T10:00:00.000Z',
        dueDate: '2026-06-01'
      }
    ];
  }, [members]);

  // Load from LocalStorage
  const [tasks, setTasks] = useState<ResearchTask[]>(() => {
    try {
      const stored = localStorage.getItem('silsilah_research_tasks_db');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return initialTasks;
  });

  // State to save
  const saveTasks = (newTasks: ResearchTask[]) => {
    setTasks(newTasks);
    localStorage.setItem('silsilah_research_tasks_db', JSON.stringify(newTasks));
  };

  // New task form state
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [assignedId, setAssignedId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [validationError, setValidationError] = useState('');

  // Handle create task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!newTitle.trim()) {
      setValidationError('Judul tugas harus diisi');
      return;
    }
    if (!assignedId) {
      setValidationError('Silakan pilih anggota keluarga yang didelegasikan');
      return;
    }

    const assignedMember = members.find(m => m.id === assignedId);
    if (!assignedMember) {
      setValidationError('Anggota keluarga tidak ditemukan');
      return;
    }

    const newTask: ResearchTask = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      assignedToId: assignedId,
      assignedToName: assignedMember.nama,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      dueDate: dueDate || undefined
    };

    const updated = [newTask, ...tasks];
    saveTasks(updated);

    if (onAddLog) {
      onAddLog(
        'tambah',
        `Mendelegasikan tugas penelitian silsilah baru kepada "${assignedMember.nama}": "${newTitle}"`
      );
    }

    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setAssignedId('');
    setDueDate('');
    setIsAdding(false);
  };

  // Adjust status
  const handleUpdateStatus = (taskId: string, nextStatus: 'Pending' | 'In-Progress' | 'Done') => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        if (onAddLog && t.status !== nextStatus) {
          onAddLog(
            'edit',
            `Mengubah status tugas "${t.title}" (Ditugaskan ke: ${t.assignedToName}) dari [${t.status}] menjadi [${nextStatus}]`
          );
        }
        return { ...t, status: nextStatus };
      }
      return t;
    });
    saveTasks(updated);
  };

  // Delete task
  const handleDeleteTask = (taskId: string, title: string) => {
    const updated = tasks.filter(t => t.id !== taskId);
    saveTasks(updated);
    if (onAddLog) {
      onAddLog('hapus', `Menghapus tugas delegasi penelitian: "${title}"`);
    }
  };

  // Helper values for filter metrics
  const pendingCount = tasks.filter(t => t.status === 'Pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'In-Progress').length;
  const doneCount = tasks.filter(t => t.status === 'Done').length;

  return (
    <div id="task-delegation-card" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs font-sans">
      
      {/* Header element */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-50 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
            <ClipboardList className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs sm:text-sm uppercase tracking-wider leading-none">Delegasi Tugas Penelitian Silsilah</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              {isAdmin ? 'Panel Super Admin: Berikan instruksi & verifikasi data kepada keluarga besar' : 'Pantau penugasan pencarian arsip, makam, dan berkas silsilah oleh Admin'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Counter badging */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800 text-[10px] font-mono font-bold">
            <span className="text-amber-600 dark:text-amber-400">{pendingCount} Pending</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-blue-600 dark:text-blue-400">{inProgressCount} In-Progress</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-emerald-600 dark:text-emerald-400">{doneCount} Done</span>
          </div>

          {isAdmin && (
            <button
              id="create-task-trigger-btn"
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-md shadow-blue-500/10 cursor-pointer transition-all"
            >
              {isAdding ? 'Sembunyikan Form' : 'Tambah Tugas'}
              {!isAdding && <Plus size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Adding Form Section */}
      {isAdding && isAdmin && (
        <form onSubmit={handleCreateTask} className="mb-5 p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-800 animate-fade-in space-y-3.5">
          <h4 className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-widest leading-none">Form Delegasi Tugas Baru</h4>
          
          {validationError && (
            <div className="flex items-center gap-1.5 p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-semibold border border-rose-100/40 dark:border-rose-950/40">
              <AlertCircle size={12} className="shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-35">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-wider block">Judul Tugas (Sederhana & Spesifik) *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Contoh: Cari salinan akta nikah Mbah Rejo Sastro"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-850 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-wider block">Delegasikan Kepada (Pilih Anggota) *</label>
              <select
                required
                value={assignedId}
                onChange={(e) => setAssignedId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-850 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="">-- Pilih Anggota Keluarga --</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nama} {m.generasi ? `(Gen ${m.generasi})` : ''} - {m.domisili || 'Lokasi tidak diketahui'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-wider block">Detail & Instruksi Tugas (Informasi Tambahan)</label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Berikan petunjuk lokasi makam, nomor kontak kerabat, atau link arsip jika ada..."
              rows={2}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-850 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pb-1">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-wider block">Batas Waktu Penuntasan (Due Date)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-850 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-end gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-md shadow-emerald-600/10"
              >
                Kirim Tugas Delegasi
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Task Grid & List */}
      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-950/10 rounded-xl border border-slate-100 dark:border-slate-800/60 text-slate-450 dark:text-slate-550 flex flex-col items-center gap-2">
          <span className="text-2xl">🌱</span>
          <p className="text-xs font-bold text-slate-750 dark:text-slate-350">Semua Klir! Belum Ada Tugas Terdaftar</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-sm mt-0.5 leading-normal">
            Gunakan tombol tambah tugas di pojok kanan atas untuk menugaskan riset kependudukan keturunan kepada anggota keluarga.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {tasks.map((task) => {
            // Setup status styles
            let statusColor = 'bg-amber-100 text-amber-800 border-amber-200/50 dark:bg-amber-950/45 dark:text-amber-400 dark:border-amber-900/40';
            let StatusIcon = Clock;
            if (task.status === 'In-Progress') {
              statusColor = 'bg-blue-100 text-blue-800 border-blue-200/50 dark:bg-blue-950/45 dark:text-blue-400 dark:border-blue-900/40';
              StatusIcon = ChevronsRight;
            } else if (task.status === 'Done') {
              statusColor = 'bg-emerald-100 text-emerald-800 border-emerald-200/50 dark:bg-emerald-950/45 dark:text-emerald-400 dark:border-emerald-900/40';
              StatusIcon = CheckCircle2;
            }

            return (
              <div 
                key={task.id} 
                className={`p-4 border rounded-xl flex flex-col justify-between transition-all hover:scale-[1.01] hover:shadow-xs relative ${
                  task.status === 'Done' 
                    ? 'bg-slate-50/30 dark:bg-slate-950/10 border-slate-150 dark:border-slate-800/80 grayscale-[35%]' 
                    : 'bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/80 shadow-2xs'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Title and Badging */}
                  <div className="flex items-start justify-between gap-2.5">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold border ${statusColor}`}>
                      <StatusIcon size={11} className={task.status === 'In-Progress' ? 'animate-pulse' : ''} />
                      {task.status.toUpperCase()}
                    </span>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all"
                        title="Hapus tugas"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h5 className="text-[11.5px] font-extrabold text-slate-850 dark:text-slate-100 leading-tight">
                      {task.title}
                    </h5>
                    {task.description && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-3 leading-relaxed font-medium">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-50 dark:border-slate-800 space-y-3.5">
                  {/* Assignee & Dates Column */}
                  <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 gap-2">
                    <div className="flex items-center gap-1.5 text-slate-705 dark:text-slate-350 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-md border border-slate-100/50 dark:border-slate-800/40">
                      <User size={11} className="text-blue-500 shrink-0" />
                      <span className="font-bold truncate max-w-[100px]">{task.assignedToName}</span>
                    </div>

                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold font-mono bg-rose-50/50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded">
                        <Calendar size={11} />
                        <span>Max: {task.dueDate}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Toggle control for both Members and Admins */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Status:</span>
                    
                    <div className="flex gap-1">
                      {(['Pending', 'In-Progress', 'Done'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleUpdateStatus(task.id, st)}
                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer transition-all border ${
                            task.status === st
                              ? st === 'Pending'
                                ? 'bg-amber-500 text-white border-amber-500 scale-102 font-extrabold'
                                : st === 'In-Progress'
                                ? 'bg-blue-600 text-white border-blue-600 scale-102 font-extrabold'
                                : 'bg-emerald-600 text-white border-emerald-600 scale-102 font-extrabold'
                              : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          {st === 'In-Progress' ? 'Progress' : st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
