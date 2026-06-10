import { Member, FamilyPhoto, ActivityLog, ColumnMapping } from '../types';

export const DEFAULT_MAPPING: ColumnMapping = {
  id: 'ID',
  nama: 'Nama Lengkap',
  gender: 'Jenis Kelamin (L/P)',
  ayahId: 'ID Ayah',
  ibuId: 'ID Ibu',
  pasanganId: 'ID Pasangan',
  tanggalLahir: 'Tanggal Lahir (YYYY-MM-DD)',
  tempatLahir: 'Tempat Lahir',
  statusHidup: 'Status (Hidup/Wafat)',
  tanggalWafat: 'Tanggal Wafat',
  pekerjaan: 'Pekerjaan',
  telepon: 'Nomor Telepon',
  domisili: 'Kota Tinggal',
  foto: 'URL Foto',
  catatan: 'Catatan Keluarga',
};

export const MOCK_MEMBERS: Member[] = [
  // Generation 1
  {
    id: 'M01',
    nama: 'Mbah H. Joyo Sutiko',
    gender: 'L',
    tanggalLahir: '1942-08-17',
    tempatLahir: 'Solo, Jawa Tengah',
    statusHidup: 'Wafat',
    tanggalWafat: '2019-11-05',
    pekerjaan: 'Pensiunan PNS & Petani',
    domisili: 'Solo',
    foto: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&auto=format&fit=crop&q=80',
    catatan: 'Sesepuh keluarga besar, pendiri yayasan keluarga Joyo Sutiko, pejuang kemerdekaan lokal.',
    generasi: 1
  },
  {
    id: 'M02',
    nama: 'Nenek Hj. Marsilah',
    gender: 'P',
    pasanganId: 'M01',
    tanggalLahir: '1947-11-12',
    tempatLahir: 'Yogyakarta',
    statusHidup: 'Hidup',
    pekerjaan: 'Ibu Rumah Tangga',
    telepon: '081234567801',
    domisili: 'Solo',
    foto: 'https://images.unsplash.com/photo-1581579438747-1dc8d1e0ca96?w=400&auto=format&fit=crop&q=80',
    catatan: 'Ibu besar keluarga, ahli kuliner tradisional Jawa, saat ini tinggal di rumah induk Solo.',
    generasi: 1
  },

  // Generation 2 - Anak Mbah Joyo & Marsilah
  {
    id: 'M03',
    nama: 'Ir. H. Bambang Joyo',
    gender: 'L',
    ayahId: 'M01',
    ibuId: 'M02',
    tanggalLahir: '1968-05-24',
    tempatLahir: 'Solo',
    statusHidup: 'Hidup',
    pekerjaan: 'Dosen & Arsitek',
    telepon: '081234567803',
    email: 'bambang.joyo@mail.com',
    domisili: 'Semarang',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    catatan: 'Anak sulung Mbah Joyo. Aktif mengelola silsilah keluarga digital.',
    generasi: 2
  },
  {
    id: 'M04',
    nama: 'Hj. Endang Sri Lestari, M.Pd.',
    gender: 'P',
    pasanganId: 'M03',
    tanggalLahir: '1972-09-18',
    tempatLahir: 'Klaten',
    statusHidup: 'Hidup',
    pekerjaan: 'Kepala Sekolah SMA',
    telepon: '081345678904',
    domisili: 'Semarang',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    catatan: 'Istri dari Bambang Joyo, sangat disiplin dan menyukai kegiatan sosial anak-anak.',
    generasi: 2
  },
  {
    id: 'M05',
    nama: 'Dr. Sri Wahyuni',
    gender: 'P',
    ayahId: 'M01',
    ibuId: 'M02',
    tanggalLahir: '1973-12-05',
    tempatLahir: 'Solo',
    statusHidup: 'Hidup',
    pekerjaan: 'Dokter Spesialis Anak',
    telepon: '081298765405',
    email: 'yuni.wahyuni@clinic.com',
    domisili: 'Jakarta Selatan',
    foto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
    catatan: 'Anak kedua Mbah Joyo. Selalu mendonasikan konsultasi kesehatan gratis bagi anggota keluarga.',
    generasi: 2
  },
  {
    id: 'M06',
    nama: 'M. Ridwan Hakim, M.B.A.',
    gender: 'L',
    pasanganId: 'M05',
    tanggalLahir: '1970-02-15',
    tempatLahir: 'Surabaya',
    statusHidup: 'Hidup',
    pekerjaan: 'Wirausaha / CEO Tech Startup',
    telepon: '081199887706',
    domisili: 'Jakarta Selatan',
    foto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
    catatan: 'Suami Sri Wahyuni. Gemar bermain golf dan pendonor dana utama untuk acara halal-bihalal keluarga.',
    generasi: 2
  },
  {
    id: 'M07',
    nama: 'Joko Susilo, S.T.',
    gender: 'L',
    ayahId: 'M01',
    ibuId: 'M02',
    tanggalLahir: '1979-07-30',
    tempatLahir: 'Solo',
    statusHidup: 'Hidup',
    pekerjaan: 'Software Engineer Principal',
    telepon: '085677889907',
    email: 'joko.susilo@dev.com',
    domisili: 'Bandung',
    foto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    catatan: 'Anak ketiga (bungsu) Mbah Joyo. Sang pencipta spreadsheet silsilah orisinal.',
    generasi: 2
  },
  {
    id: 'M08',
    nama: 'Rina Astuti, S.E.',
    gender: 'P',
    pasanganId: 'M07',
    tanggalLahir: '1982-10-10',
    tempatLahir: 'Bandung',
    statusHidup: 'Hidup',
    pekerjaan: 'Manajer Bank BUMN',
    telepon: '087855443308',
    domisili: 'Bandung',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    catatan: 'Istri Joko Susilo, menyukai kesenian angklung tradisional.',
    generasi: 2
  },

  // Generation 3 - Cucu Mbah Joyo
  // Anak dari Bambang Joyo & Endang
  {
    id: 'M09',
    nama: 'Aditya Joyo Pratama',
    gender: 'L',
    ayahId: 'M03',
    ibuId: 'M04',
    tanggalLahir: '1998-06-15',
    tempatLahir: 'Semarang',
    statusHidup: 'Hidup',
    pekerjaan: 'UI/UX Designer',
    telepon: '082133445509',
    email: 'adityajoyo@design.com',
    domisili: 'Semarang',
    foto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    catatan: 'Cucu pertama Mbah Joyo. Penggemar otomotif dan hobi fotografi silsilah keluarga.',
    generasi: 3
  },
  {
    id: 'M10',
    nama: 'Sarah Kartika Joyo',
    gender: 'P',
    ayahId: 'M03',
    ibuId: 'M04',
    tanggalLahir: '2001-09-09',
    tempatLahir: 'Semarang',
    statusHidup: 'Hidup',
    pekerjaan: 'Mahasiswa Kedokteran',
    telepon: '082211223310',
    email: 'sarah.joyo@student.ac.id',
    domisili: 'Semarang',
    foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    catatan: 'Mengikuti jejak tantenya, Sri Wahyuni, menempuh jalur kedokteran.',
    generasi: 3
  },

  // Anak dari Sri Wahyuni & Ridwan Hakim
  {
    id: 'M11',
    nama: 'Farhan Ridwan Hakim',
    gender: 'L',
    ayahId: 'M06',
    ibuId: 'M05',
    tanggalLahir: '2006-03-24',
    tempatLahir: 'Jakarta',
    statusHidup: 'Hidup',
    pekerjaan: 'Siswa SMA',
    telepon: '089988771111',
    domisili: 'Jakarta Selatan',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    catatan: 'Hobi basket, aktif di organisasi OSIS sekolah internasional.',
    generasi: 3
  },
  {
    id: 'M12',
    nama: 'Amelia Ridwan Hakim',
    gender: 'P',
    ayahId: 'M06',
    ibuId: 'M05',
    tanggalLahir: '2010-06-25',
    tempatLahir: 'Jakarta',
    statusHidup: 'Hidup',
    pekerjaan: 'Siswa SMP',
    domisili: 'Jakarta Selatan',
    foto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=80',
    catatan: 'Menyukai lukisan cat air, pandai bermain biola dan piano.',
    generasi: 3
  },

  // Anak dari Joko Susilo & Rina Astuti
  {
    id: 'M13',
    nama: 'Dimas Susilo Putra',
    gender: 'L',
    ayahId: 'M07',
    ibuId: 'M08',
    tanggalLahir: '2015-01-14',
    tempatLahir: 'Bandung',
    statusHidup: 'Hidup',
    pekerjaan: 'Siswa SD',
    domisili: 'Bandung',
    foto: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&auto=format&fit=crop&q=80',
    catatan: 'Cucu bungsu, sangat menyukai game edukasi sains dan lego.',
    generasi: 3
  },
];

export const MOCK_PHOTOS: FamilyPhoto[] = [
  {
    id: 'P01',
    url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80',
    caption: 'Foto Bersama Halal Bihalal Idul Fitri Keluarga Besar Joyo Sutiko',
    tanggal: '2025-04-12',
    tagAnggotaIds: ['M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09', 'M10', 'M11', 'M12', 'M13'],
  },
  {
    id: 'P02',
    url: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800&auto=format&fit=crop&q=80',
    caption: 'Makan Malam Ulang Tahun Nenek Marsilah yang ke-78',
    tanggal: '2025-11-12',
    tagAnggotaIds: ['M02', 'M03', 'M05', 'M07'],
  },
  {
    id: 'P03',
    url: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=800&auto=format&fit=crop&q=80',
    caption: 'Momen Wisuda Kedokteran Kak Sarah Joyo',
    tanggal: '2024-03-18',
    tagAnggotaIds: ['M03', 'M04', 'M10'],
  }
];

export const MOCK_LOGS: ActivityLog[] = [
  {
    id: 'L01',
    timestamp: '2026-06-09T08:30:00Z',
    tipe: 'sinkronisasi',
    deskripsi: 'Berhasil memuat silsilah awal (Sistem bawaan).'
  },
  {
    id: 'L02',
    timestamp: '2026-06-09T10:15:00Z',
    tipe: 'edit',
    deskripsi: 'Memperbarui profil Mbah H. Joyo Sutiko: Menambahkan catatan pendiri yayasan.'
  },
  {
    id: 'L03',
    timestamp: '2026-06-09T14:45:00Z',
    tipe: 'tambah',
    deskripsi: 'Menambahkan anggota baru Dimas Susilo Putra.'
  }
];
