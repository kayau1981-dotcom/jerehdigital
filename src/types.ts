export interface Member {
  id: string;
  nama: string;
  gender: 'L' | 'P';
  ayahId?: string;
  ibuId?: string;
  pasanganId?: string; // Spouse
  tanggalLahir?: string; // Format: YYYY-MM-DD or DD-MM-YYYY or DD/MM/YYYY
  tempatLahir?: string;
  statusHidup: 'Hidup' | 'Wafat';
  tanggalWafat?: string;
  pekerjaan?: string;
  telepon?: string;
  email?: string;
  domisili?: string;
  foto?: string;
  generasi?: number; // Calculated or manual
  catatan?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO string
  tipe: 'tambah' | 'edit' | 'hapus' | 'sinkronisasi';
  deskripsi: string;
}

export interface FamilyPhoto {
  id: string;
  url: string;
  caption: string;
  tanggal?: string;
  tagAnggotaIds: string[]; // Member IDs tagged in the photo
}

export interface ColumnMapping {
  id: string;
  nama: string;
  gender: string;
  ayahId: string;
  ibuId: string;
  pasanganId: string;
  tanggalLahir: string;
  tempatLahir: string;
  statusHidup: string;
  tanggalWafat: string;
  pekerjaan: string;
  telepon: string;
  domisili: string;
  foto: string;
  catatan: string;
}

export interface ConnectionConfig {
  sheetUrl: string;
  isLinked: boolean;
  lastSynced?: string;
  mapping: ColumnMapping;
}

export interface PortalUser {
  id: string;
  nama: string;
  email: string;
  role: 'Admin' | 'Anggota';
  status: 'Aktif' | 'Nonaktif';
  tanggalDibuat: string;
}

export interface ResearchTask {
  id: string;
  title: string;
  description: string;
  assignedToId: string;
  assignedToName: string;
  status: 'Pending' | 'In-Progress' | 'Done';
  createdAt: string;
  dueDate?: string;
}

