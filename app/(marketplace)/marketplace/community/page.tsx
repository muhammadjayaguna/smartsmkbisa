"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/marketplace/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import CreatePost from '@/components/marketplace/community/CreatePost';
import PostCard from '@/components/marketplace/community/PostCard';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const Community = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const categories = ['Semua', 'Umum', 'Tips Bisnis', 'Tanya Mentor', 'Showcase'];

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase
      .from('community_posts')
      .select(`
        *,
        profiles:user_id(full_name, avatar_url, major, role),
        community_likes(user_id),
        community_comments(id)
      `);
    
    if (selectedCategory !== 'Semua') {
      query = query.eq('category', selectedCategory);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      toast.error('Gagal memuat postingan');
      console.error(error);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-transparent pb-20">
      <main className="container max-w-2xl pt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-display tracking-tight">Komunitas Belajar</h1>
          <p className="text-sm text-muted-foreground">Berbagi pengalaman dan belajar berwirausaha bersama siswa SMKN 1</p>
          
          <div className="flex flex-wrap gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[11px] font-semibold px-4 py-1.5 rounded-full border whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                    ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105' 
                    : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {user && <CreatePost onPostCreated={fetchPosts} />}

        <div className="mt-8 space-y-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
            ))
          ) : (
            <div className="text-center py-20 bg-card rounded-xl border border-dashed">
              <p className="text-muted-foreground">Belum ada postingan. Jadilah yang pertama!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Community;
