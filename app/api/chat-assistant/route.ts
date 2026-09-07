import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithFallback, ChatMessage } from '@/lib/ai/fallback-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Format pesan tidak valid' }, { status: 400 });
    }

    const systemPrompt = `Kamu adalah SiAjar, Asisten AI cerdas untuk aplikasi "Smart SMK Bisa" (atau SynapseSMK).
Tugas kamu adalah membantu guru, kepala sekolah, atau admin dalam menggunakan aplikasi ini, serta memberikan saran terkait pendidikan SMK.

Konteks Aplikasi:
- SiPoin: Sistem untuk mencatat poin pelanggaran (negatif) dan prestasi (positif) siswa.
- SiMagang: Sistem manajemen magang/PKL siswa.
- SiSarpras: Sistem manajemen sarana dan prasarana.
- Administrasi Guru: Modul untuk membuat Modul Ajar (MA), Capaian Pembelajaran (CP), Alur Tujuan Pembelajaran (ATP), KKTP, Asesmen, dan P5.

Gaya Komunikasi:
- Profesional, ramah, dan sangat membantu.
- Selalu gunakan bahasa Indonesia yang baik dan benar (baku). DILARANG menggunakan bahasa asing (terutama Mandarin/Hanzi) kecuali istilah teknis (seperti coding/IT).
- Jika pengguna bertanya cara membuat Modul Ajar, arahkan mereka untuk menggunakan menu "Bahan Ajar" atau "Modul Ajar" di sidebar Administrasi Guru.
- Jangan memberikan jawaban yang terlalu panjang kecuali diminta. Gunakan poin-poin agar mudah dibaca.
- JANGAN gunakan format Markdown yang terlalu kompleks, gunakan format teks biasa, bold, italic, dan list saja.`;

    const history: ChatMessage[] = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      content: msg.content
    }));
    
    const lastUserMessage = messages[messages.length - 1].content;

    // Gunakan fallback router
    const aiResponse = await generateContentWithFallback(systemPrompt, lastUserMessage, 'text', history);

    if (!aiResponse.success || !aiResponse.content) {
      return NextResponse.json({ error: aiResponse.error }, { status: 503 });
    }

    return NextResponse.json({ 
      success: true, 
      text: aiResponse.content,
      model: aiResponse.model,
      provider: aiResponse.provider 
    });

  } catch (error: any) {
    console.error('Chat Assistant Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
