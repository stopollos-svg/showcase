import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Send,
  Trash2,
  Building2,
  LogOut,
  ArrowRight,
  UserCheck,
  ChevronDown,
  Plus,
  Check,
  Sparkles,
  LogIn,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Post, Comment, Profile } from '../../types';
import { db } from '../../lib/mockEngine';

interface CommentsModalProps {
  post: Post | null;
  onClose: () => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({ post, onClose }) => {
  const {
    currentUser,
    getComments,
    addComment,
    deleteComment,
    switchAccount,
    setAccountSwitcherModalOpen,
    openAuthModal,
    logout,
    viewProfile,
    showToast,
  } = useApp();

  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(currentUser?.id || null);

  if (!post) return null;

  const comments = getComments(post.id);
  const allProfiles = db.getAllProfiles();
  const effectiveAuthorId = selectedAuthorId || currentUser?.id || allProfiles[0]?.id;
  const commentingProfile = allProfiles.find((p) => p.id === effectiveAuthorId) || currentUser;

  const handleSelectProfile = (profile: Profile) => {
    setSelectedAuthorId(profile.id);
    switchAccount(profile.id);
    setShowProfileSelector(false);
    showToast(`Now commenting as ${profile.business_name}`, 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!currentUser && !effectiveAuthorId) {
      openAuthModal();
      showToast('Please sign in or select a business account to comment.', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      await addComment(post.id, commentText.trim(), effectiveAuthorId);
      setCommentText('');
      setShowProfileSelector(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to post comment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment(commentId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-stone-900">Showcase Discussion</h3>
              <p className="text-[11px] text-stone-500">
                {comments.length} {comments.length === 1 ? 'comment' : 'comments'} on {post.user?.business_name || 'Showcase'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Post Preview Snippet */}
        <div className="px-4 py-2.5 bg-stone-50/70 border-b border-stone-100 flex items-center gap-3">
          <img
            src={post.media_type === 'video' ? post.thumbnail_url || post.user?.avatar_url : post.media_url}
            alt="Thumbnail"
            className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-stone-900 truncate">{post.user?.business_name}</p>
            <p className="text-[11px] text-stone-500 line-clamp-1">{post.caption}</p>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {comments.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">No comments yet.</p>
              <p className="text-[11px]">Start the craft discussion below!</p>
            </div>
          ) : (
            comments.map((comment) => {
              const isOwner = currentUser?.id === comment.user_id || currentUser?.id === post.user_id;
              return (
                <div key={comment.id} className="flex items-start gap-2.5 group">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      viewProfile(comment.user_id);
                    }}
                    className="shrink-0 group/avatar"
                  >
                    <img
                      src={comment.user?.avatar_url || '/src/assets/images/coffee_roaster_1790587302699.jpg'}
                      alt={comment.user?.business_name || 'User'}
                      className="w-8 h-8 rounded-full object-cover border border-stone-200 group-hover/avatar:ring-2 group-hover/avatar:ring-orange-300 transition"
                    />
                  </button>

                  <div className="flex-1 min-w-0 bg-stone-50/80 rounded-xl p-2.5 border border-stone-100">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            viewProfile(comment.user_id);
                          }}
                          className="font-bold text-xs text-stone-900 truncate hover:text-orange-600 transition"
                        >
                          {comment.user?.business_name || 'Artisan'}
                        </button>
                        {comment.user?.category && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-orange-50 text-orange-700 border border-orange-200/60 font-semibold truncate hidden sm:inline">
                            {comment.user.category}
                          </span>
                        )}
                        <span className="text-[10px] text-stone-400">
                          {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleDelete(comment.id)}
                          className="p-1 text-stone-400 hover:text-red-600 transition opacity-0 group-hover:opacity-100"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-stone-800 leading-relaxed break-words whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Bar with Multi-Profile Commenter Identity Switcher & Log Out */}
        <div className="p-3 border-t border-stone-100 bg-white">
          {/* Active Profile Bar */}
          <div className="mb-2 flex items-center justify-between text-[11px] px-1 bg-stone-50 p-2 rounded-xl border border-stone-200/80">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={commentingProfile?.avatar_url || '/src/assets/images/coffee_roaster_1790587302699.jpg'}
                alt={commentingProfile?.business_name || 'User'}
                className="w-5 h-5 rounded-full object-cover border border-stone-200 shrink-0"
              />
              <span className="text-stone-500 text-[10px] shrink-0">Commenting as:</span>
              <button
                type="button"
                onClick={() => setShowProfileSelector(!showProfileSelector)}
                className="font-bold text-stone-900 truncate hover:text-orange-600 transition flex items-center gap-1"
                title="Click to switch commenting profile"
              >
                <span>{commentingProfile?.business_name || 'Guest User'}</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowProfileSelector(!showProfileSelector)}
                className="text-orange-600 font-semibold hover:underline flex items-center gap-1 text-[11px]"
              >
                <Building2 className="w-3 h-3" />
                <span>{showProfileSelector ? 'Close' : 'Switch Identity'}</span>
              </button>

              {currentUser && (
                <>
                  <span className="text-stone-300">·</span>
                  <button
                    type="button"
                    onClick={logout}
                    className="text-red-500 font-semibold hover:underline flex items-center gap-0.5 text-[11px]"
                    title="Log out of business session"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Log Out</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Inline Profile Selection Dropdown */}
          {showProfileSelector && (
            <div className="mb-3 p-2.5 bg-white border border-orange-200 rounded-xl shadow-md space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-700 px-1 pb-1 border-b border-stone-100">
                <span>Select profile to comment with:</span>
                <span className="text-[10px] text-stone-400">{allProfiles.length} profiles</span>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1 pr-0.5">
                {allProfiles.map((p) => {
                  const isCurrent = effectiveAuthorId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProfile(p)}
                      className={`w-full p-1.5 rounded-lg flex items-center justify-between gap-2 text-left transition ${
                        isCurrent
                          ? 'bg-orange-50 text-orange-950 font-bold border border-orange-200'
                          : 'hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={p.avatar_url}
                          alt={p.business_name}
                          className="w-6 h-6 rounded-full object-cover border border-stone-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs truncate">{p.business_name}</p>
                          <p className="text-[10px] text-stone-500 truncate">{p.category}</p>
                        </div>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileSelector(false);
                    openAuthModal();
                  }}
                  className="text-stone-600 hover:text-stone-900 flex items-center gap-1 font-semibold text-[11px]"
                >
                  <Plus className="w-3 h-3 text-orange-600" />
                  <span>Create New Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileSelector(false);
                    setAccountSwitcherModalOpen(true);
                  }}
                  className="text-orange-600 hover:underline font-semibold text-[11px]"
                >
                  Manage All Accounts
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={`Add a comment as ${commentingProfile?.business_name || 'Business'}...`}
              className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={isSubmitting || !commentText.trim()}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition active:scale-95 flex items-center gap-1 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

