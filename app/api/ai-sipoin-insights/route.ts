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
    const { dataSiswa } = body;

    if (!dataSiswa || !Array.isArray(dataSiswa)) {
      return NextResponse.json({ error: 'Data siswa tidak valid' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API Key Gemini tidak ditemukan.' }, { status: 500 });
    }

    const systemPrompt = `Kamu adalah AI Konselor Sekolah (Guru BK) yang ahli menganalisis perilaku siswa SMK.
Tugas kamu adalah menganalisis data rekap poin siswa (positif = prestasi/baik, negatif = pelanggaran) dan memberikan *Early Warning* (Deteksi Dini) atau *Pujian*.

ATURAN PENTING:
- Berikan output HANYA dalam format JSON valid.
- JAWAB DALAM BAHASA INDONESIA BAKU DAN PROFESIONAL.
- JANGAN PERNAH MENGGUNAKAN BAHASA/AKSARA ASING SEPERTI MANDARIN/HANZI.
- Analisis dengan cermat siapa saja siswa yang butuh intervensi segera (misal saldo poin sangat negatif).
- Berikan pujian untuk siswa berprestasi (poin positif tinggi).
- Batasi analisa pada top 3 siswa bermasalah dan top 3 siswa berprestasi (jika ada).
- Berikan saran nyata kepada pihak sekolah.`;

    const userPrompt = `Ini adalah data rekap poin seluruh siswa (atau hasil filter saat ini):
${JSON.stringify(dataSiswa.slice(0, 50))}

Tolong berikan analisis mendalam. Format output JSON yang diminta:
{
  "ringkasan": "Ringkasan singkat dari kondisi kedisiplinan siswa (2-3 kalimat)",
  "siswa_perhatian_khusus": [
    {
      "nama": "Nama Siswa",
      "alasan": "Alasan butuh perhatian (misal: poin negatif sangat tinggi)",
      "saran_tindakan": "Saran konkrit untuk Guru/BK (misal: panggil orang tua)"
    }
  ],
  "siswa_apresiasi": [
    {
      "nama": "Nama Siswa",
      "alasan": "Alasan layak diapresiasi",
      "saran_tindakan": "Saran apresiasi (misal: berikan sertifikat penghargaan)"
    }
  ],
  "rekomendasi_umum": "Rekomendasi umum untuk sekolah/kepala sekolah berdasarkan tren data ini"
}`;

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    let parsed: any = null;
    let successfulModel = '';
    let lastError = '';

    for (const currentModel of GEMINI_MODELS) {
      console.log(`Mencoba generate SiPoin Insights dengan model: ${currentModel}`);
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
        if (cleanContent.includes('\`\`\`json')) {
          cleanContent = cleanContent.split('\`\`\`json')[1].split('\`\`\`')[0].trim();
        } else if (cleanContent.includes('\`\`\`')) {
          cleanContent = cleanContent.split('\`\`\`')[1].split('\`\`\`')[0].trim();
        }
        
        parsed = JSON.parse(cleanContent);
        successfulModel = currentModel;
        break;
      } catch (apiError: any) {
        console.warn(`Gemini API Error [${currentModel}]:`, apiError.message);
        lastError = apiError.message;
        if (
          apiError.message.includes('503') || 
          apiError.message.includes('429') || 
          apiError.message.includes('404') ||
          apiError.message.includes('not found') ||
          apiError.message.includes('overloaded')
        ) {
          continue;
        }
        return NextResponse.json({ error: `Google Gemini Error: ${apiError.message}` }, { status: 502 });
      }
    }

    if (!parsed) {
      return NextResponse.json({ error: `Semua model AI sedang sibuk/gagal. Error terakhir: ${lastError}` }, { status: 503 });
    }

    return NextResponse.json({ success: true, data: parsed, model: successfulModel });

  } catch (error: any) {
    console.error('AI SiPoin Insights Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
