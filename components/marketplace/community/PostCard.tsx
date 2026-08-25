"use client";

import { useState } from 'react';
import { supabase } from '@/lib/marketplace/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Heart, MessageCircle, MoreVertical, Trash2, Edit2, Share2, CornerDownRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import CommentSection from './CommentSection';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface PostCardProps {
  post: any;
  onUpdate: () => void;
}

const PostCard = ({ post, onUpdate }: PostCardProps) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);

  const isLiked = post.community_likes?.some((l: any) => l.user_id === user?.id);
  const likeCount = post.community_likes?.length || 0;
  const commentCount = post.community_comments?.length || 0;

  const handleLike = async () => {
    if (!user) {
      toast.error('Gagal', { description: 'Silakan masuk untuk menyukai postingan' });
      return;
    }
    setLoadingLike(true);
    try {
      if (isLiked) {
        await supabase.from('community_likes').delete().match({ user_id: user.db_id || user.id, post_id: post.id });
      } else {
        await supabase.from('community_likes').insert({ user_id: user.db_id || user.id, post_id: post.id });
      }
      onUpdate();
    } catch (error) {
      toast.error('Gagal memproses like');
    } finally {
      setLoadingLike(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Hapus postingan ini?')) {
      try {
        const { error } = await supabase.from('community_posts').delete().eq('id', post.id);
        if (error) throw error;
        toast.success('Postingan dihapus');
        onUpdate();
      } catch (error) {
        toast.error('Gagal menghapus postingan');
      }
    }
  };

  const author = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-2">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-secondary flex items-center justify-center font-bold text-muted-foreground overflow-hidden">
            {author?.avatar_url ? (
              <img src={author.avatar_url} alt={author.full_name} className="h-full w-full object-cover" />
            ) : (
              author?.full_name?.charAt(0) || '?'
            )}
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight flex items-center gap-1.5 flex-wrap">
              {author?.full_name}
              {author?.role && (author.role === 'mentor' || author.role === 'teacher') && (
                <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                  ⭐ Mentor
                </span>
              )}
              {author?.major && (
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-normal">
                  {author.major}
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-2">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: id })}
              {post.category && (
                <span className="inline-flex items-center text-[9px] font-medium text-primary uppercase tracking-wider">
                  • {post.category}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {user?.id === post.user_id && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-all">
                <MoreVertical size={16} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-36 p-1">
              <button 
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              >
                <Trash2 size={14} /> Hapus Post
              </button>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{post.content}</p>
      </div>

      {post.image_url && (
        <div className="bg-muted aspect-video w-full overflow-hidden border-y border-border/50">
          <img 
            src={post.image_url} 
            alt="Post content" 
            className="h-full w-full object-contain" 
            loading="lazy"
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-2 border-t border-border/50 flex items-center justify-between bg-card/50">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLike}
            disabled={loadingLike}
            className={`flex items-center gap-1.5 text-sm transition-all hover:scale-105 ${
              isLiked ? 'text-destructive font-bold' : 'text-muted-foreground hover:text-destructive'
            }`}
          >
            <Heart size={18} className={isLiked ? 'fill-current' : ''} />
            <span>{likeCount || ''}</span>
          </button>
          
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 text-sm transition-all hover:scale-105 ${
              showComments ? 'text-primary font-bold' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <MessageCircle size={18} className={showComments ? 'fill-current' : ''} />
            <span>{commentCount || ''}</span>
          </button>
        </div>
        
        <button className="text-muted-foreground hover:text-primary transition-colors p-1.5">
          <Share2 size={16} />
        </button>
      </div>

      {/* Comment Section */}
      {showComments && (
        <div className="border-t border-border/50 bg-secondary/30 animate-in slide-in-from-top-2">
          <CommentSection 
            postId={post.id} 
            onCommentAdded={onUpdate}
          />
        </div>
      )}
    </div>
  );
};

export default PostCard;
