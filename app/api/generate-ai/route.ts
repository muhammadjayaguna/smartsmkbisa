import { NextRequest, NextResponse } from 'next/server';

const DAHL_API_KEY = process.env.DAHL_API_KEY || 'dahl_NkdUvWMdHxCAs1aYHzoNu8SQGfe1EXd53';
const DAHL_API_URL = 'https://inference.dahl.global/v1/chat/completions';
const DAHL_MODEL = 'MiniMaxAI/MiniMax-M2.7';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, mataPelajaran, fase, jurusan, jenjang } = body;

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'generate_cp') {
      systemPrompt = `Kamu adalah seorang ahli kurikulum pendidikan Indonesia dengan spesialisasi Kurikulum Merdeka. Tugas kamu adalah membuat dokumen Capaian Pembelajaran (CP) yang lengkap, akurat, dan sesuai dengan standar Kemendikbudristek.

ATURAN PENTING:
- Gunakan bahasa Indonesia baku yang formal dan akademis.
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
- SANGAT PENTING: Kamu WAJIB fokus dan menggunakan nama Mata Pelajaran secara spesifik sesuai yang diminta user. DILARANG KERAS menggantinya menjadi "Informatika" atau mapel lain.
- Sesuaikan konten dengan mata pelajaran, fase, dan jenjang yang diminta.
- Berikan output HANYA dalam format JSON valid.
- JANGAN PERNAH menggunakan tanda elipsis "..." atau mempersingkat JSON. Tuliskan SELURUH datanya secara lengkap dari awal hingga akhir.
- Buat minimal 10-13 Tujuan Pembelajaran (TP) untuk 1 tahun ajaran (2 semester).
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

PENTING: Buatkan minimal 10 objek TP di dalam array 'alur'. Tulis semua TP satu per satu secara lengkap. Jangan menggunakan tanda "..." untuk menyingkat.`;
    } else if (action === 'generate_ma') {
      const { tp_kode, tujuan } = body;
      systemPrompt = `Kamu adalah ahli pembuat Modul Ajar Kurikulum Merdeka. Tugasmu membuat komponen Modul Ajar secara detail.
ATURAN PENTING:
- SANGAT PENTING: Kamu WAJIB menggunakan nama Mata Pelajaran yang diminta secara spesifik. DILARANG menggantinya menjadi "Informatika" atau mapel lain secara sepihak.
- Output HANYA JSON valid.
- JANGAN PERNAH menyingkat atau memakai "...". Tulis secara lengkap.
- Bahasa Indonesia baku.`;

      userPrompt = `Buatkan Modul Ajar (RPP) untuk Tujuan Pembelajaran berikut:
Kode TP: ${tp_kode}
Tujuan: ${tujuan}
Mata Pelajaran: ${mataPelajaran} (${fase} SMK)

Berikan output dalam JSON valid dengan struktur:
{
  "judul": "Judul Menarik untuk Modul Ini",
  "pemahaman_bermakna": "Penjelasan pemahaman bermakna",
  "pertanyaan_pemantik": "3 pertanyaan pemantik",
  "kegiatan_pendahuluan": "Langkah-langkah pendahuluan (contoh: 15 Menit)",
  "kegiatan_inti": "Langkah-langkah kegiatan inti dengan model pembelajaran (contoh: 60 Menit)",
  "kegiatan_penutup": "Langkah-langkah penutup (contoh: 15 Menit)",
  "asesmen_jenis": "Formatif / Sumatif (Pilih salah satu)",
  "asesmen_deskripsi": "Deskripsi bentuk asesmen"
}`;

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
      systemPrompt = `Kamu adalah guru teladan dan ahli materi pelajaran Kurikulum Merdeka.
ATURAN PENTING:
- SANGAT PENTING: Kamu WAJIB menggunakan nama Mata Pelajaran yang diminta secara spesifik. DILARANG menggantinya menjadi "Informatika" atau mapel lain secara sepihak.
- Output HANYA JSON valid.
- JANGAN PERNAH menyingkat atau memakai "...". Tulis secara lengkap.
- Gunakan Markdown formatting tebal/miring di dalam teks konten agar lebih menarik.
- Sesuaikan gaya bahasa dengan instruksi user.`;

      userPrompt = `Buatkan materi Bahan Ajar lengkap untuk:
Mata Pelajaran: ${mataPelajaran}
Topik/Materi: ${topik}
Fase/Kelas: ${fase}
Gaya Bahasa: ${gayaBahasa || 'Baku dan akademis'}

Berikan output dalam JSON valid dengan struktur:
{
  "judul_materi": "Judul Menarik untuk Materi Ini",
  "peta_konsep": "Ringkasan poin-poin penting dalam bentuk bullet points (gunakan markdown)",
  "konten_materi": "Penjabaran isi materi secara lengkap dan detail (minimal 300 kata, gunakan markdown untuk subjudul, huruf tebal, dll)",
  "latihan_soal": "5 soal latihan pilihan ganda atau esai ringkas untuk menguji pemahaman siswa"
}`;

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const response = await fetch(DAHL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAHL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DAHL_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dahl API Error:', response.status, errorText);
      return NextResponse.json(
        { error: `AI API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Try to parse JSON from AI response (handle markdown code blocks)
    let parsed;
    try {
      let cleanContent = aiContent;
      
      // If it's wrapped in a markdown code block, extract it
      const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
      const match = cleanContent.match(jsonBlockRegex);
      if (match) {
        cleanContent = match[1];
      }
      
      // Try to parse directly first
      try {
        parsed = JSON.parse(cleanContent);
      } catch (initialErr) {
        // Fallback: Find the first { and attempt to parse from there.
        // Try parsing substrings from the first '{' to each '}' from the end.
        const startIdx = cleanContent.indexOf('{');
        if (startIdx !== -1) {
          let currentEndIdx = cleanContent.lastIndexOf('}');
          let success = false;
          
          while (currentEndIdx > startIdx) {
            try {
              const candidate = cleanContent.substring(startIdx, currentEndIdx + 1);
              parsed = JSON.parse(candidate);
              success = true;
              break; // Successfully parsed!
            } catch (e) {
              // If failed, try the next '}' backwards
              currentEndIdx = cleanContent.lastIndexOf('}', currentEndIdx - 1);
            }
          }
          
          if (!success) {
            throw initialErr; // Throw original error if backtrack fails
          }
        } else {
          throw initialErr;
        }
      }
    } catch (parseErr: any) {
      console.error('Failed to parse AI JSON:', aiContent);
      // Write to debug log so the agent can read it
      try {
        require('fs').writeFileSync('.gemini/failed_json.log', aiContent);
      } catch(e) {}
      
      return NextResponse.json(
        { error: `AI response was not valid JSON: ${parseErr.message}`, raw: aiContent },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: parsed, model: DAHL_MODEL });

  } catch (error: any) {
    console.error('Generate AI Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
