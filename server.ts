import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasApiKey: !!apiKey });
});

app.post('/api/generate-book', async (req, res) => {
  const { members, mode, familyTitle } = req.body;

  if (!members || !Array.isArray(members)) {
    return res.status(400).json({ error: 'Data anggota keluarga tidak ditemukan atau tidak valid.' });
  }

  if (!apiKey || !ai) {
    return res.status(500).json({ 
      error: 'API Key Gemini belum dikonfigurasi di server. Silakan hubungkan API Key Anda melalui panel Secrets.' 
    });
  }

  try {
    const memberSummary = members.map(m => {
      return `- Nama: ${m.nama} (${m.gender === 'L' ? 'Laki-laki' : 'Perempuan'}), Status: ${m.statusHidup}${m.tempatLahir ? `, Lahir di ${m.tempatLahir}` : ''}${m.tanggalLahir ? `, Tanggal: ${m.tanggalLahir}` : ''}${m.pekerjaan ? `, Pekerjaan: ${m.pekerjaan}` : ''}${m.domisili ? `, Tinggal di: ${m.domisili}` : ''}${m.catatan ? `, Catatan: ${m.catatan}` : ''}`;
    }).join('\n');

    let instruction = '';
    let title = '';

    if (mode === 'history') {
      title = 'Riwayat Silsilah & Biografi Keluarga';
      instruction = `Buatlah narasi sejarah yang elegan dan biografi kreatif dari tokoh-tokoh leluhur/generasi teratas hingga keturunannya berdasarkan data anggota keluarga berikut. Buat tulisan dalam gaya bahasa Indonesia yang profesional, hangat, sopan, dan mengagumkan. Struktur materi dengan bab-bab kecil untuk penokohan utama dan silsilah mereka.`;
    } else if (mode === 'relationships') {
      title = 'Analisis Hubungan Relasi & Dinamika Pohon Keluarga';
      instruction = `Lakukan analisis mendalam silsilah, struktur generasi, kesenjangan umur perkiraan, sebaran wilayah tempat tinggal (domisili), serta relasi antarkeluarga berdasarkan data terlampir. Berikan ulasan atau rangkuman statistik yang mendidik dalam format laporan sosiologi keluarga yang menarik, positif, dan ramah pembaca dalam bahasa Indonesia yang baik.`;
    } else if (mode === 'trivia') {
      title = 'Trivia & Cerita Lucu AI Keluarga';
      instruction = `Buatlah trivia menarik, fakta-fakta unik menyenangkan, pencapaian menarik (seperti ahli kesehatan, guru, pengusaha, desainer dll berdasarkan pekerjaan mereka), serta tebakan kuis keluarga yang ceria, penuh kasih sayang, dan mengundang senyum berdasarkan data anggota keluarga di bawah ini. Pastikan nadanya ceria, hangat, penuh tawa, dan menghangatkan hati pembaca.`;
    } else {
      title = 'Buku Silsilah Keluarga Utama (Komplet)';
      instruction = `Tulis sebuah buku silsilah keluarga lengkap terstruktur mencakup kata pengantar, ringkasan pohon silsilah generasi demi generasi, biografi singkat masing-masing anggota keluarga, nilai-nilai luhur keluarga yang tercermin, serta petuah harapan masa depan berbasis dari data anggota keluarga ini. Sajikan dalam format Markdown yang sangat estetis, komprehensif, dan rapi dalam bahasa Indonesia bergaya sastra klasik namun modern.`;
    }

    const prompt = `
Anda adalah seorang Sejarahwan Silsilah, Sosiolog, dan AI Penulis Buku Silsilah Keluarga (Genealogist AI).
Nama Keluarga: "${familyTitle || 'Keluarga Besar Joyo Sutiko'}"

Tugas Anda:
${instruction}

Berikut adalah data mentah anggota keluarga yang tersedia:
${memberSummary}

Gunakan gaya pemformatan Markdown yang sangat indah, gunakan heading (#, ##, ###), bullet points, blockquote untuk petuah luhur, dan tabel jika relevan untuk menyusun buku keluarga ini. Jangan sebutkan "berdasarkan data mentah yang diberikan" — tulislah seolah-olah Anda adalah penulis biografi keluarga profesional yang sudah lama mengenal keluarga besar ini secara mendalam. Tulis dalam bahasa Indonesia yang fasih, sopan, mengalir dengan penuh kehangatan keluarga.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const markdownText = response.text;
    res.json({ title, content: markdownText });
  } catch (error: any) {
    console.error('Gemini error:', error);
    res.status(500).json({ error: `Gagal menghasilkan buku AI: ${error.message || error}` });
  }
});

// Setup Vite or Static File serving based on Node environment
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
};

startServer();
