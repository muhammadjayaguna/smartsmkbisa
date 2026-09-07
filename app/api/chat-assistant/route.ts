import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithFallback, ChatMessage } from '@/lib/ai/fallback-client';
import { supabase } from '@/lib/supabase/client';

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

    let history: ChatMessage[] = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      content: msg.content
    }));
    
    // Pastikan history untuk Gemini (dan model lain) selalu diawali oleh 'user'
    while (history.length > 0 && history[0].role !== 'user') {
      history.shift();
    }
    
    const lastUserMessage = messages[messages.length - 1].content;
    const userMessageLower = lastUserMessage.toLowerCase();
    
    // ==========================================
    // AGENTIC BEHAVIOR: SMART CONTEXT INJECTION
    // ==========================================
    let dbContext = "";

    try {
      if (userMessageLower.includes('poin') || userMessageLower.includes('siswa') || userMessageLower.includes('pelanggaran') || userMessageLower.includes('prestasi') || userMessageLower.includes('nakal') || userMessageLower.includes('bermasalah')) {
        // Fetch 5 recent violation records
        const { data: siswaBermasalah } = await supabase
            .from('poin_siswa')
            .select(`poin, keterangan, jenis, siswa_id`)
            .lt('poin', 0)
            .order('poin', { ascending: true })
            .limit(5);
            
        const { count: totalPelanggaran } = await supabase.from('poin_siswa').select('*', { count: 'exact', head: true }).lt('poin', 0);
        
        dbContext += `\n\n[DATA REAL-TIME DATABASE: SIPOIN]
- Total pelanggaran siswa tercatat: ${totalPelanggaran || 0}
- Data 5 riwayat poin terendah (Paling Bermasalah): ${JSON.stringify(siswaBermasalah)}
(Jika ditanya siapa yang paling bermasalah, sebutkan data di atas. Jika data JSON mencantumkan ID siswa, Anda bisa menyamarkan ID tersebut atau merujuknya sebagai 'Siswa dengan ID tersebut').`;
      }

      if (userMessageLower.includes('magang') || userMessageLower.includes('pkl') || userMessageLower.includes('dudi')) {
        const { count: totalMagang } = await supabase.from('pengajuan_magang').select('*', { count: 'exact', head: true });
        const { count: magangDisetujui } = await supabase.from('pengajuan_magang').select('*', { count: 'exact', head: true }).eq('status', 'disetujui');
        
        dbContext += `\n\n[DATA REAL-TIME DATABASE: SIMAGANG]
- Total pengajuan magang/PKL: ${totalMagang || 0}
- Total magang yang sudah disetujui: ${magangDisetujui || 0}`;
      }

      if (userMessageLower.includes('rusak') || userMessageLower.includes('sarpras') || userMessageLower.includes('pinjam') || userMessageLower.includes('barang')) {
        const { count: totalPinjam } = await supabase.from('peminjaman_barang').select('*', { count: 'exact', head: true });
        
        dbContext += `\n\n[DATA REAL-TIME DATABASE: SISARPRAS]
- Total transaksi peminjaman barang: ${totalPinjam || 0}`;
      }
    } catch (dbErr) {
      console.warn("Gagal mengambil konteks DB:", dbErr);
      // Lanjut saja tanpa context DB jika gagal
    }

    const finalSystemPrompt = systemPrompt + dbContext;

    // Gunakan fallback router
    const aiResponse = await generateContentWithFallback(finalSystemPrompt, lastUserMessage, 'text', history);

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
