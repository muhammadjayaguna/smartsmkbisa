import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithFallback } from '@/lib/ai/fallback-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dataSiswa } = body;

    if (!dataSiswa || !Array.isArray(dataSiswa)) {
      return NextResponse.json({ error: 'Data siswa tidak valid' }, { status: 400 });
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

    // Gunakan fallback router yang baru dibuat
    const aiResponse = await generateContentWithFallback(systemPrompt, userPrompt, 'json');

    if (!aiResponse.success || !aiResponse.content) {
      return NextResponse.json({ error: aiResponse.error }, { status: 503 });
    }

    let cleanContent = aiResponse.content;
    if (cleanContent.includes('\`\`\`json')) {
      cleanContent = cleanContent.split('\`\`\`json')[1].split('\`\`\`')[0].trim();
    } else if (cleanContent.includes('\`\`\`')) {
      cleanContent = cleanContent.split('\`\`\`')[1].split('\`\`\`')[0].trim();
    }
    
    let parsed: any = null;
    try {
      parsed = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI JSON:', cleanContent);
      return NextResponse.json({ error: 'AI mengembalikan format JSON yang tidak valid.' }, { status: 500 });
    }

    // Kembalikan metadata provider yang digunakan (Gemini/Dahl/Grok) untuk indikasi di UI
    return NextResponse.json({ 
      success: true, 
      data: parsed, 
      model: aiResponse.model,
      provider: aiResponse.provider 
    });

  } catch (error: any) {
    console.error('AI SiPoin Insights Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
