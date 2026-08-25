"use client";

import { GraduationCap } from 'lucide-react';
import AIChatPanel from './AIChatPanel';

const TOPICS = [
  '📊 Contoh produk sukses di marketplace ini',
  '💰 Cara menghitung modal dan keuntungan',
  '📱 Strategi promosi media sosial untuk pemula',
  '🏪 Tips jualan di marketplace sekolah',
  '💡 Ide bisnis modal kecil untuk siswa SMK',
  '📋 Cara membuat proposal bisnis',
];

const TutorChat = () => (
  <AIChatPanel
    type="tutor"
    icon={<GraduationCap size={18} className="text-primary" />}
    title="Tutor Kewirausahaan AI"
    placeholder="Tanya tentang kewirausahaan..."
    quickPrompts={TOPICS}
    emptyState={
      <div>
        <GraduationCap size={40} className="mx-auto mb-3 text-muted-foreground/40" />
        <p>Hai! Saya tutor kewirausahaan AI kamu 🎓</p>
        <p className="mt-1 text-muted-foreground">Bisa belajar dari data marketplace real!</p>
      </div>
    }
  />
);

export default TutorChat;
