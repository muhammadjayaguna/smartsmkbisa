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
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Format pesan tidak valid' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API Key Gemini tidak ditemukan.' }, { status: 500 });
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

    // Convert OpenAI style messages to Gemini style
    const geminiHistory = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));
    
    const lastUserMessage = messages[messages.length - 1].content;

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    let aiResponseText = '';
    let lastError = '';

    for (const currentModel of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: currentModel,
          systemInstruction: systemPrompt,
        });

        const chat = model.startChat({
          history: geminiHistory,
        });

        const result = await chat.sendMessage(lastUserMessage);
        aiResponseText = result.response.text();
        break; // Success, break the loop
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

    if (!aiResponseText) {
      return NextResponse.json({ error: `Semua model AI sedang sibuk/gagal. Error terakhir: ${lastError}` }, { status: 503 });
    }

    return NextResponse.json({ success: true, text: aiResponseText });

  } catch (error: any) {
    console.error('Chat Assistant Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
