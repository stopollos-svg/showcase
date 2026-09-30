import React, { useState } from 'react';
import { Send, Trash2, ShieldCheck, MessageSquare, LogIn } from 'lucide-react';
import { Comment, Post } from '../../types';
import { useApp } from '../../context/AppContext';

interface CommentsSectionProps {
  post: Post;
  onCommentsCountChange?: (count: number) => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ post, onCommentsCountChange }) => {
  const { currentUser, getComments, addComment, deleteComment, viewProfile, setActiveTab, showToast } = useApp();
  const [comments, setComments] = useState<Comment[]>(() => getComments(post.id));
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reloadComments = () => {
    const list = getComments(post.id);
    setComments(list);
    if (onCommentsCountChange) {
      onCommentsCountChange(list.length);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setActiveTab('auth');
      showToast('Please sign in to add a comment.', 'info');
      return;
    }

    const text = newComment.trim();
    if (!text) return;

    setIsSubmitting(true);
    try {
      await addComment(post.id, text);
      setNewComment('');
      reloadComments();
    } catch (err: any) {
      showToast(err.message || 'Failed to post comment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await deleteComment(commentId, post.id);
      reloadComments();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete comment', 'error');
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  return (
    <div className="border-t border-stone-100 bg-stone-50/70 p-4 rounded-b-2xl">
      {/* Comments Header */}
      <div className="flex items-center justify-between mb-3 text-xs text-stone-500 font-semibold">
        <span className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
          <span>Comments ({comments.length})</span>
        </span>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1 mb-3 scrollbar-thin">
        {comments.length === 0 ? (
          <p className="text-xs text-stone-400 italic text-center py-2">
            No comments yet. Start the conversation with this artisan!
          </p>
        ) : (
          comments.map((comment) => {
            const author = comment.user;
            const canDelete = currentUser && (currentUser.id === comment.user_id || currentUser.id === post.user_id);

            return (
              <div key={comment.id} className="flex items-start justify-between gap-2.5 text-xs group">
                <div className="flex items-start gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => author && viewProfile(author.id)}
                    className="shrink-0 mt-0.5"
                  >
                    <img
                      src={author?.avatar_url || '/src/assets/images/coffee_roaster_1790587302699.jpg'}
                      alt={author?.business_name || 'User'}
                      className="w-7 h-7 rounded-lg object-cover border border-stone-200"
                    />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => author && viewProfile(author.id)}
                        className="font-bold text-stone-900 hover:underline inline-flex items-center gap-1"
                      >
                        <span>{author?.business_name || 'Artisan'}</span>
                        {author?.is_verified && (
                          <ShieldCheck className="w-3 h-3 text-blue-600 inline fill-blue-100" />
                        )}
                      </button>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {formatRelativeTime(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-stone-700 leading-snug mt-0.5 break-words">
                      {comment.body || comment.content}
                    </p>
                  </div>
                </div>

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(comment.id)}
                    className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-600 p-1 transition"
                    title="Delete comment (Author or Post owner)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Comment Input Form */}
      {currentUser ? (
        <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-2 border-t border-stone-200/60">
          <img
            src={currentUser.avatar_url}
            alt={currentUser.business_name}
            className="w-7 h-7 rounded-lg object-cover border border-stone-200 shrink-0"
          />
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={`Comment as ${currentUser.business_name}...`}
            maxLength={1000}
            className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="p-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-40 transition active:scale-95"
            title="Post comment"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      ) : (
        <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs text-stone-500">
          <span>Sign in to add a comment</span>
          <button
            type="button"
            onClick={() => setActiveTab('auth')}
            className="text-orange-600 font-bold hover:underline flex items-center gap-1"
          >
            <LogIn className="w-3 h-3" />
            <span>Sign In</span>
          </button>
        </div>
      )}
    </div>
  );
};
