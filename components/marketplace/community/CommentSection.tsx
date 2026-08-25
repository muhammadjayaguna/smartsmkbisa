"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/marketplace/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Send, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface CommentSectionProps {
  postId: string;
  onCommentAdded: () => void;
}

const CommentSection = ({ postId, onCommentAdded }: CommentSectionProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('community_comments')
      .select('*, profiles:user_id(full_name:nama, role)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setComments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('community_comments').insert({
        post_id: postId,
        user_id: user.db_id || user.id,
        content: newComment.trim()
      });

      if (error) throw error;
      setNewComment('');
      fetchComments();
      onCommentAdded();
    } catch (error) {
      toast.error('Gagal mengirim komentar');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await supabase.from('community_comments').delete().eq('id', commentId);
      fetchComments();
      onCommentAdded();
    } catch (error) {
      toast.error('Gagal menghapus komentar');
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* List */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center font-bold text-[10px] overflow-hidden ${
                comment.profiles?.role === 'mentor' || !comment.user_id 
                ? 'bg-amber-100 text-amber-600 border border-amber-200 shadow-sm' 
                : 'bg-secondary text-muted-foreground'
              }`}>
                {comment.profiles?.avatar_url ? (
                  <img src={comment.profiles.avatar_url} alt={comment.profiles.full_name} className="h-full w-full object-cover" />
                ) : !comment.user_id ? (
                  '🤖'
                ) : (
                  comment.profiles?.full_name?.charAt(0) || '?'
                )}
              </div>
              <div className="flex-1">
                <div className={`rounded-2xl px-3 py-2 border relative ${
                  comment.profiles?.role === 'mentor' || !comment.user_id
                  ? 'bg-amber-50/50 border-amber-100'
                  : 'bg-card border-border/50'
                }`}>
                  <div className="font-semibold text-xs flex items-center gap-1.5 flex-wrap">
                    {!comment.user_id ? '🤖 AI Mentor SMKN 1' : comment.profiles?.full_name}
                    {(comment.profiles?.role === 'mentor' || comment.profiles?.role === 'teacher') && (
                      <span className="text-[8px] bg-amber-500 text-white px-1 py-0.2 rounded-full font-bold">Mentor</span>
                    )}
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: id })}
                    </span>
                  </div>
                  <p className={`text-sm mt-0.5 ${
                    !comment.user_id 
                    ? 'text-amber-900 italic font-medium' 
                    : 'text-foreground/90'
                  }`}>{comment.content}</p>
                  
                  {user?.id === comment.user_id && (
                    <button 
                      onClick={() => deleteComment(comment.id)}
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-destructive p-1 rounded-md hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-center text-muted-foreground py-2 italic font-medium">Belum ada komentar.</p>
        )}
      </div>

      {/* Input */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input 
            type="text" 
            placeholder="Tulis komentar..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={submitting}
            className="flex-1 bg-card border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
          <button 
            type="submit" 
            disabled={submitting || !newComment.trim()}
            className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      ) : (
        <p className="text-xs text-center text-muted-foreground">Silakan masuk untuk berkomentar.</p>
      )}
    </div>
  );
};

export default CommentSection;
