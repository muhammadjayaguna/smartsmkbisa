"use client";

import { useState, useRef } from 'react';
import { supabase } from '@/lib/marketplace/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImagePlus, X, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreatePostProps {
  onPostCreated: () => void;
}

const CreatePost = ({ onPostCreated }: CreatePostProps) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Umum');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const categories = [
    { id: 'Umum', label: '📢 Umum', desc: 'Berbagi kabar umum' },
    { id: 'Tips Bisnis', label: '💡 Tips Bisnis', desc: 'Berbagi ilmu kewirausahaan' },
    { id: 'Tanya Mentor', label: '🙋 Tanya Mentor', desc: 'Tanya saran ke AI/Guru' },
    { id: 'Showcase', label: '🚀 Showcase', desc: 'Pamerkan produk/jasamu' },
  ];

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => resolve(blob || file), 'image/webp', 0.8);
        };
      };
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !image) return;
    if (!user) return;

    setLoading(true);
    let imageUrl = null;

    try {
      if (image) {
        const compressedBlob = await compressImage(image);
        const path = `posts/${user.id}/${Date.now()}.webp`;
        const { error: uploadError } = await supabase.storage.from('community').upload(path, compressedBlob, {
          contentType: 'image/webp'
        });
        
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('community').getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const { data: postData, error } = await supabase.from('community_posts').insert({
        user_id: user.db_id || user.id,
        content: content.trim(),
        image_url: imageUrl,
        category: category
      }).select().single();

      if (error) throw error;

      // Trigger AI Mentor Response for specific categories
      if (category === 'Tanya Mentor' || category === 'Showcase') {
        toast.info('AI Mentor sedang merespon...', { duration: 2000 });
        handleAIMentorResponse(postData.id, content.trim(), category);
      }

      toast.success('Postingan berhasil dikirim!');
      setContent('');
      setImage(null);
      setImagePreview(null);
      onPostCreated();
    } catch (error: any) {
      toast.error('Gagal mengirim postingan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAIMentorResponse = async (postId: string, postContent: string, postCategory: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const prompt = `Interpretasikan diri Anda sebagai Mentor Kewirausahaan SMKN 1 Banjarmasin. 
      Seorang siswa baru saja memposting di komunitas dengan kategori "${postCategory}".
      Konten postingan: "${postContent}"
      Berikan tanggapan yang sangat edukatif, memotivasi, dan berikan 1 saran praktis bisnis.
      Response harus dalam Bahasa Indonesia, ramah, dan profesional. Maksimal 3 kalimat.`;

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'tutor',
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) throw new Error('AI Function failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') break;
              try {
                const json = JSON.parse(dataStr);
                const content = json.choices?.[0]?.delta?.content;
                if (content) fullText += content;
              } catch (e) { /* ignore parse errors for partial chunks */ }
            }
          }
        }
      }

      const responseContent = fullText.trim() || "Bagus sekali kreasinya! Teruslah berinovasi dan jangan takut gagal. Kunci sukses adalah konsistensi dan terus belajar.";

      await supabase.from('community_comments').insert({
        post_id: postId,
        user_id: null,
        content: responseContent
      });
      
      onPostCreated();
    } catch (err) {
      console.error('AI Mentor Error:', err);
      // Fallback in case of absolute failure
      await supabase.from('community_comments').insert({
        post_id: postId,
        user_id: null,
        content: "Bagus sekali kreasinya! Teruslah berinovasi dan jangan takut gagal. Tetap semangat belajar kewirausahaan!"
      });
      onPostCreated();
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary border border-primary/20">
          {user?.user_metadata?.full_name?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                  category === cat.id 
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                    : 'bg-secondary/50 text-muted-foreground border-border hover:border-primary/50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          
          <Textarea
            placeholder={categories.find(c => c.id === category)?.desc || "Apa yang ingin kamu bagikan?"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] border-none bg-transparent p-0 focus-visible:ring-0 text-base resize-none"
          />
          
          {imagePreview && (
            <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
              <img src={imagePreview} alt="Preview" className="max-h-[300px] w-full object-contain" />
              <button 
                onClick={() => { setImage(null); setImagePreview(null); }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                disabled={loading}
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              disabled={loading}
            >
              <div className="p-2 rounded-lg bg-primary/5">
                <ImagePlus size={18} className="text-primary" />
              </div>
              <span className="hidden sm:inline">Foto</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              accept="image/*" 
              className="hidden" 
            />
            
            <Button 
              onClick={handleSubmit} 
              disabled={loading || (!content.trim() && !image)}
              className="gap-2 rounded-full px-6"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              <span>Kirim</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
