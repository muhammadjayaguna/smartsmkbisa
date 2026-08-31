import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest'
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, mataPelajaran, fase, jurusan, jenjang, batch } = body;

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'generate_cp') {
      systemPrompt = `Kamu adalah seorang ahli kurikulum pendidikan Indonesia dengan spesialisasi Kurikulum Merdeka. Tugas kamu adalah membuat dokumen Capaian Pembelajaran (CP) yang lengkap, akurat, dan sesuai dengan standar Kemendikbudristek.

ATURAN PENTING:
- Gunakan bahasa Indonesia baku yang formal dan akademis.
- JAWAB SEPENUHNYA DALAM BAHASA INDONESIA. DILARANG KERAS MENGGUNAKAN BAHASA/AKSARA ASING SEPERTI MANDARIN/HANZI.
- SANGAT PENTING: Kamu WAJIB fokus dan menggunakan nama Mata Pelajaran secara spesifik sesuai yang diminta user. DILARANG KERAS menggantinya menjadi "Informatika" atau mapel lain jika user tidak memintanya.
- Sesuaikan konten dengan mata pelajaran, fase, dan jenjang yang diminta.
- Berikan output HANYA dalam format JSON yang valid.
- JANGAN PERNAH menggunakan tanda elipsis "..." atau mempersingkat JSON. Tuliskan SELURUH datanya secara lengkap.
- Setiap elemen harus memiliki deskripsi yang detail dan bermakna pedagogis.`;

      userPrompt = `Buatkan dokumen Capaian Pembelajaran (CP) untuk:
- Mata Pelajaran: ${mataPelajaran || 'Informatika'}
- Fase: ${fase || 'Fase E (Kelas 10)'}
- Jenjang: ${jenjang || 'SMK'}
- Jurusan/Bidang: ${jurusan || 'Teknologi'}

Berikan output dalam format JSON valid dengan struktur ini:
{
  "deskripsi_umum": "Paragraf panjang (minimal 150 kata) yang menjelaskan...",
  "elemen": [
    {
      "kode": "E1",
      "judul": "Judul Elemen 1",
      "fase": "${fase || 'Fase E (Kelas 10)'}",
      "deskripsi": "Deskripsi lengkap elemen ini"
    },
    {
      "kode": "E2",
      "judul": "Judul Elemen 2",
      "fase": "${fase || 'Fase E (Kelas 10)'}",
      "deskripsi": "Deskripsi lengkap elemen ini"
    }
  ]
}

PENTING: Buatkan minimal 4 elemen CP. Tulis setiap elemen secara penuh. Jangan gunakan tanda "..." di dalam array.`;

    } else if (action === 'generate_atp') {
      systemPrompt = `Kamu adalah seorang ahli kurikulum pendidikan Indonesia dengan spesialisasi Kurikulum Merdeka. Tugas kamu adalah membuat Alur Tujuan Pembelajaran (ATP) yang lengkap dan terstruktur.

ATURAN PENTING:
- Gunakan bahasa Indonesia baku formal dan akademis.
- JAWAB SEPENUHNYA DALAM BAHASA INDONESIA. DILARANG KERAS MENGGUNAKAN BAHASA/AKSARA ASING SEPERTI MANDARIN/HANZI.
- SANGAT PENTING: Kamu WAJIB fokus dan menggunakan nama Mata Pelajaran secara spesifik sesuai yang diminta user. DILARANG KERAS menggantinya menjadi "Informatika" atau mapel lain.
- Sesuaikan konten dengan mata pelajaran, fase, dan jenjang yang diminta.
- Berikan output HANYA dalam format JSON valid.
- JANGAN PERNAH menggunakan tanda elipsis "..." atau mempersingkat JSON. Tuliskan SELURUH datanya secara lengkap dari awal hingga akhir.
- Buat HANYA 4 Tujuan Pembelajaran (TP) untuk meminimalisir waktu komputasi.
- KHUSUS PENTING: Lanjutkan penomoran TP sesuai porsi yang diminta, yaitu: ${batch || 'TP 1-4'}
- Setiap TP harus mencakup alokasi jam pelajaran yang realistis.`;

      userPrompt = `Buatkan Alur Tujuan Pembelajaran (ATP) untuk:
- Mata Pelajaran: ${mataPelajaran || 'Informatika'}
- Fase: ${fase || 'Fase E (Kelas 10)'}
- Jenjang: ${jenjang || 'SMK'}

Berikan output dalam format JSON valid dengan struktur ini:
{
  "ringkasan": "Penjelasan singkat...",
  "total_jp": 258,
  "alur": [
    {
      "kode": "TP1",
      "tujuan": "Tujuan 1...",
      "jp": 20,
      "semester": 1,
      "elemen_terkait": "E1"
    },
    {
      "kode": "TP2",
      "tujuan": "Tujuan 2...",
      "jp": 16,
      "semester": 1,
      "elemen_terkait": "E1"
    }
  ]
}

PENTING: Buatkan tepat 4 objek TP di dalam array 'alur'. Urutkan nomor TP-nya (contoh: jika bagian TP 5-8, mulailah dengan TP5, lalu TP6, dst)! JANGAN LEBIH DARI 4!`;
    } else if (action === 'generate_ma') {
      const { tp_kode, tujuan } = body;
      systemPrompt = `Kamu adalah ahli pembuat Modul Ajar Kurikulum Merdeka. Tugasmu membuat komponen Modul Ajar yang RINGKAS, PRAKTIS, dan TEPAT SASARAN (setara 1-2 halaman).
ATURAN PENTING:
- SANGAT PENTING: Kamu WAJIB menggunakan nama Mata Pelajaran yang diminta secara spesifik. DILARANG menggantinya menjadi "Informatika" atau mapel lain secara sepihak.
- Output HANYA JSON valid.
- JAWAB SEPENUHNYA DALAM BAHASA INDONESIA. DILARANG KERAS MENGGUNAKAN BAHASA/AKSARA ASING SEPERTI MANDARIN/HANZI.
- Buat deskripsi yang JELAS tapi SINGKAT. Jangan terlalu panjang agar proses cepat.
- Bahasa Indonesia baku dan akademis.
- Untuk format yang membutuhkan poin-poin, gunakan format JSON Array of Strings.`;

      userPrompt = `Buatkan Modul Ajar (RPP) yang RINGKAS DAN PRAKTIS untuk Tujuan Pembelajaran berikut:
Kode TP: ${tp_kode}
Tujuan: ${tujuan}
Mata Pelajaran: ${mataPelajaran} (${fase} SMK)

Berikan output dalam JSON valid dengan struktur berikut. Pastikan isinya berbobot namun tidak terlalu panjang (1-2 kalimat per poin sudah cukup):
{
  "judul": "Judul Singkat dan Menarik untuk Modul Ini",
  "pemahaman_bermakna": "Penjelasan pemahaman bermakna yang mendalam terkait dunia kerja industri (minimal 3 kalimat)",
  "pertanyaan_pemantik": ["Pertanyaan kritis 1...", "Pertanyaan HOTS 2...", "Pertanyaan pemantik 3..."],
  "kegiatan_pendahuluan": [
    "Mindful Opening (5 Menit): Guru membuka kelas...", 
    "Apersepsi (5 Menit): Guru menanyakan...", 
    "Tujuan Pembelajaran (5 Menit): Guru menjelaskan..."
  ],
  "kegiatan_inti": [
    "TAHAP 1: MEMAHAMI (Mindful & Meaningful) - 70 Menit: Siswa dibagi dalam...", 
    "TAHAP 2: MENGAPLIKASI (Meaningful & Joyful) - 90 Menit: Setiap kelompok mendapat tugas nyata...", 
    "TAHAP 3: MEREFLEKSI (Mindful) - 40 Menit: Guru memandu sesi refleksi dengan pertanyaan..."
  ],
  "kegiatan_penutup": [
    "Kesimpulan Bersama (5 Menit): Guru mengajak siswa membuat rangkuman...", 
    "Refleksi Perasaan (3 Menit): Siswa menjawab satu pertanyaan di sticky note...",
    "Tugas Lanjutan (2 Menit): Guru menginformasikan..."
  ],
  "asesmen_jenis": "Formatif dan Sumatif",
  "asesmen_deskripsi": [
    "Asesmen Awal (Diagnostik): Pertanyaan lisan mengenai...",
    "Asesmen Proses (Formatif): Pengamatan langsung (observation) terhadap partisipasi...",
    "Asesmen Akhir (Sumatif): Proyek akhir pembelajaran di mana setiap siswa menganalisis..."
  ]
}`;

    } else if (action === 'generate_kktp') {
      const { atpList } = body;
      systemPrompt = `Kamu adalah ahli kurikulum Kurikulum Merdeka. Tugasmu membuat Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) secara detail.
ATURAN PENTING:
- SANGAT PENTING: Kamu WAJIB menggunakan nama Mata Pelajaran yang diminta secara spesifik. DILARANG menggantinya menjadi "Informatika" atau mapel lain secara sepihak.
- Output HANYA JSON valid.
- JAWAB SEPENUHNYA DALAM BAHASA INDONESIA. DILARANG KERAS MENGGUNAKAN BAHASA/AKSARA ASING SEPERTI MANDARIN/HANZI.
- JANGAN PERNAH menyingkat atau memakai "...". Tulis secara lengkap.
- Bahasa Indonesia baku.
- Buatkan 4 kriteria (Tercapai, Berkembang, Mulai Berkembang, Belum Berkembang) untuk SETIAP Tujuan Pembelajaran yang diberikan.`;

      userPrompt = `Buatkan Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) untuk daftar Tujuan Pembelajaran (ATP) berikut:
Mata Pelajaran: ${mataPelajaran} (${fase} SMK)

Daftar ATP:
${JSON.stringify(atpList)}

Berikan output dalam JSON valid dengan struktur array seperti ini:
{
  "kktp": [
    {
      "tp_kode": "Kode TP (misal: TP1)",
      "kriteria_tercapai": "Deskripsi jika siswa sudah mencapai tujuan dengan sangat baik",
      "kriteria_berkembang": "Deskripsi jika siswa sudah berkembang sesuai harapan",
      "kriteria_mulai": "Deskripsi jika siswa baru mulai berkembang",
      "kriteria_belum": "Deskripsi jika siswa belum berkembang sama sekali"
    }
  ]
}

PENTING: Pastikan kamu mengembalikan array "kktp" yang berisi objek kriteria untuk SEMUA Tujuan Pembelajaran yang ada di daftar ATP di atas. Jangan ada yang terlewat!`;

    } else if (action === 'generate_asesmen') {
      const { tp_kode, tujuan } = body;
      systemPrompt = `Kamu adalah ahli evaluasi pembelajaran Kurikulum Merdeka. Buatlah instrumen asesmen dan rubrik penilaian.
ATURAN PENTING:
- SANGAT PENTING: Kamu WAJIB menggunakan nama Mata Pelajaran yang diminta secara spesifik. DILARANG menggantinya menjadi "Informatika" atau mapel lain secara sepihak.
- Output HANYA JSON valid.
- JAWAB SEPENUHNYA DALAM BAHASA INDONESIA. DILARANG KERAS MENGGUNAKAN BAHASA/AKSARA ASING SEPERTI MANDARIN/HANZI.
- JANGAN PERNAH menyingkat atau memakai "...". Tulis secara lengkap.
- Semua nilai di dalam JSON harus berupa String (teks biasa atau teks markdown). Jangan gunakan Array atau Objek di dalam nilai kunci JSON.`;

      userPrompt = `Buatkan Instrumen Asesmen untuk:
Kode TP: ${tp_kode}
Tujuan: ${tujuan}
Mata Pelajaran: ${mataPelajaran} (${fase} SMK)

Berikan output dalam JSON valid dengan struktur:
{
  "jenis": "Penilaian Produk / Tertulis / Praktik",
  "kisi_kisi": "Penjelasan kisi-kisi asesmen",
  "rubrik_4": "Kriteria Sangat Baik (Skor 4)",
  "rubrik_3": "Kriteria Baik (Skor 3)",
  "rubrik_2": "Kriteria Cukup (Skor 2)",
  "rubrik_1": "Kriteria Kurang (Skor 1)",
  "soal_evaluasi": "Tuliskan 3 contoh soal atau instruksi tugas dalam bentuk teks bersusun ke bawah (Gunakan Markdown bullet points atau nomor urut, jangan gunakan format JSON Array '[{...}]' !)"
}`;

    } else if (action === 'generate_p5') {
      const { tema } = body;
      systemPrompt = `Kamu adalah Koordinator Projek Penguatan Profil Pelajar Pancasila (P5) yang kreatif.
ATURAN PENTING:
- Output HANYA JSON valid.
- JAWAB SEPENUHNYA DALAM BAHASA INDONESIA. DILARANG KERAS MENGGUNAKAN BAHASA/AKSARA ASING SEPERTI MANDARIN/HANZI.
- JANGAN PERNAH menyingkat atau memakai "...". Tulis secara lengkap.`;

      userPrompt = `Rancanglah sebuah modul Projek Penguatan Profil Pelajar Pancasila (P5) untuk SMK dengan:
Tema: ${tema || 'Gaya Hidup Berkelanjutan'}

Berikan output dalam JSON valid dengan struktur:
{
  "topik": "Topik spesifik proyek yang menarik",
  "dimensi_1": "Dimensi 1 (misal: Bernalar Kritis)",
  "dimensi_2": "Dimensi 2 (misal: Gotong Royong)",
  "tahap_pengenalan": "Aktivitas pada tahap pengenalan (minimal 3 kalimat)",
  "tahap_kontekstualisasi": "Aktivitas menggali permasalahan di lingkungan sekitar",
  "tahap_aksi": "Aktivitas nyata pembuatan proyek",
  "tahap_refleksi": "Aktivitas evaluasi dan tindak lanjut"
}`;

    } else if (action === 'generate_bahan') {
      const { topik, gayaBahasa } = body;
      systemPrompt = `Kamu adalah guru teladan dan pembuat modul/LKPD handal untuk Kurikulum Merdeka.
ATURAN PENTING:
- SANGAT PENTING: Kamu WAJIB menggunakan nama Mata Pelajaran yang diminta secara spesifik.
- Output HANYA JSON valid.
- JAWAB SEPENUHNYA DALAM BAHASA INDONESIA.
- Susun materi dalam format PRESENTASI SLIDE yang berurut.
- Gunakan Markdown formatting tebal/miring/tabel di dalam teks konten agar menarik.
- Sesuaikan gaya bahasa dengan instruksi user.`;

      userPrompt = `Buatkan materi Bahan Ajar / LKPD berformat presentasi slide untuk:
Mata Pelajaran: ${mataPelajaran}
Topik/Materi: ${topik}
Fase/Kelas: ${fase}
Gaya Bahasa: ${gayaBahasa || 'Baku dan akademis'}

Berikan output dalam JSON valid dengan struktur array of slides:
{
  "slides": [
    {
      "judul_slide": "Judul Slide (Maks 10 kata)",
      "konten_markdown": "Isi slide menggunakan markdown. Bisa berupa teks penjelasan, poin-poin, tabel, atau soal latihan. Maksimal 150 kata per slide."
    }
  ]
}

PANDUAN STRUKTUR SLIDE (Buat minimal 8-10 slide):
- Slide 1: Judul Materi & Pertanyaan Pemantik
- Slide 2: Pendahuluan & Tujuan Pembelajaran
- Slide 3 dst: Isi Materi Inti (gunakan poin-poin/tabel yang mudah dibaca)
- Slide sebelum terakhir: Ringkasan & Kesimpulan
- Slide terakhir: Uji Pemahaman / Latihan Soal / Penugasan`;

    } else if (action === 'generate_promes') {
      const { atpList } = body;
      systemPrompt = `Kamu adalah perancang Program Semester (Promes) yang handal untuk sekolah Indonesia.
ATURAN PENTING:
- SANGAT PENTING: Kamu WAJIB menggunakan nama Mata Pelajaran yang diminta secara spesifik.
- Output HANYA JSON valid berbentuk Array of Objects.
- JAWAB SEPENUHNYA DALAM BAHASA INDONESIA. DILARANG KERAS MENGGUNAKAN BAHASA/AKSARA ASING SEPERTI MANDARIN/HANZI.
- Bagilah beban Jam Pelajaran (JP) ke dalam bulan-bulan yang logis.
- Semester Ganjil umumnya meliputi bulan: Juli, Agustus, September, Oktober, November, Desember.
- Semester Genap umumnya meliputi bulan: Januari, Februari, Maret, April, Mei, Juni.`;

      userPrompt = `Buatkan alokasi bulan pelaksanaan (Program Semester) untuk daftar Tujuan Pembelajaran (ATP) berikut:
Mata Pelajaran: ${mataPelajaran} (${fase} SMK)

Daftar ATP (lengkap dengan JP dan Semester):
${JSON.stringify(atpList)}

Berikan output dalam JSON valid dengan struktur persis seperti ini (return HANYA format array ini):
{
  "promes": [
    {
      "tp_kode": "TP1",
      "bulan_pelaksanaan": ["Agustus", "September"]
    },
    {
      "tp_kode": "TP2",
      "bulan_pelaksanaan": ["Oktober"]
    }
  ]
}

PENTING: Pastikan semua TP_KODE yang ada di daftar ATP masuk ke dalam array hasil. Tentukan bulan_pelaksanaan (array of string bulan) berdasarkan nilai "semester" pada ATP tersebut!`;

    } else if (!systemPrompt || !userPrompt) {
      return NextResponse.json({ error: 'Aksi tidak dikenali' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API Key Gemini tidak ditemukan.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    let parsed: any = null;
    let successfulModel = '';
    let lastError = '';

    for (const currentModel of GEMINI_MODELS) {
      console.log(`Mencoba generate dengan model: ${currentModel}`);
      try {
        const model = genAI.getGenerativeModel({ 
          model: currentModel,
          systemInstruction: systemPrompt,
          generationConfig: {
            responseMimeType: "application/json",
          }
        });

        const result = await model.generateContent(userPrompt);
        const aiContent = result.response.text();

        if (!aiContent) {
          lastError = 'Tidak ada respons dari Gemini API.';
          continue;
        }

        let cleanContent = aiContent;
        if (cleanContent.includes('```json')) {
          cleanContent = cleanContent.split('```json')[1].split('```')[0].trim();
        } else if (cleanContent.includes('```')) {
          cleanContent = cleanContent.split('```')[1].split('```')[0].trim();
        }
        
        // Try parsing directly first
        try {
          parsed = JSON.parse(cleanContent);
        } catch (initialErr) {
          // Fallback: Find the first { and attempt to parse from there.
          const startIdx = cleanContent.indexOf('{');
          if (startIdx !== -1) {
            let currentEndIdx = cleanContent.lastIndexOf('}');
            let success = false;
            
            while (currentEndIdx > startIdx) {
              try {
                const candidate = cleanContent.substring(startIdx, currentEndIdx + 1);
                parsed = JSON.parse(candidate);
                success = true;
                break;
              } catch (e) {
                currentEndIdx = cleanContent.lastIndexOf('}', currentEndIdx - 1);
              }
            }
            if (!success) throw initialErr;
          } else {
            throw initialErr;
          }
        }
        
        // If successful, save the model name and break the loop
        successfulModel = currentModel;
        break;
      } catch (apiError: any) {
        console.warn(`Gemini API Error [${currentModel}]:`, apiError.message);
        lastError = apiError.message;
        
        // If it's a 503, 429, or 404, try the next model
        if (
          apiError.message.includes('503') || 
          apiError.message.includes('429') || 
          apiError.message.includes('404') ||
          apiError.message.includes('not found') ||
          apiError.message.includes('overloaded')
        ) {
          continue;
        }
        
        // For other unrecoverable errors (like 400 Bad Request / 403 Forbidden Key), throw immediately
        return NextResponse.json(
          { error: `Google Gemini Error: ${apiError.message}` },
          { status: 502 }
        );
      }
    }

    if (!parsed) {
      return NextResponse.json(
        { error: `Semua model AI sedang sibuk/gagal. Error terakhir: ${lastError}` },
        { status: 503 }
      );
    }

    if (!parsed) {
      return NextResponse.json(
        { error: `Gagal memparsing output AI menjadi format JSON yang valid.` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: parsed, model: successfulModel });

  } catch (error: any) {
    console.error('Generate AI Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
