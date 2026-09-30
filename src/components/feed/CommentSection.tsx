/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Heart,
  MessageSquare,
  MoreVertical,
  Pin,
  Reply,
  Send,
  ShieldCheck,
  Trash2,
  Edit2,
  Flag,
  X,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock,
  LogIn,
  SlidersHorizontal,
} from 'lucide-react';
import { Comment, Post, Profile } from '../../types';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/mockEngine';

export interface CommentSectionProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onCommentsCountChange?: (count: number) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  post,
  isOpen,
  onClose,
  onCommentsCountChange,
}) => {
  const {
    currentUser,
    getComments,
    addComment,
    toggleCommentLike,
    togglePinComment,
    editComment,
    deleteComment,
    reportTarget,
    viewProfile,
    setActiveTab,
    showToast,
  } = useApp();

  const [sortBy, setSortBy] = useState<'top' | 'newest'>('top');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form input state
  const [inputText, setInputText] = useState('');
  const [replyingToComment, setReplyingToComment] = useState<Comment | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // @Mentions autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<Profile[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  // Expand replies state (parent comment IDs whose replies are expanded)
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  // Active menu dropdown ID
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const commentsContainerRef = useRef<HTMLDivElement | null>(null);

  const isPostOwner = currentUser?.id === post.user_id;

  // Load comments
  const loadData = () => {
    const list = getComments(post.id, sortBy);
    setComments(list);
    if (onCommentsCountChange) {
      const totalCount = list.reduce(
        (acc, c) => acc + (c.deleted_at ? 0 : 1) + (c.replies?.filter((r) => !r.deleted_at).length || 0),
        0
      );
      onCommentsCountChange(totalCount);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        loadData();
        setIsLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, post.id, sortBy]);

  // Handle typing & @mention trigger
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    const cursor = e.target.selectionStart || val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const query = textBeforeCursor.slice(lastAtIndex + 1);
      if (!query.includes(' ') && query.length >= 0) {
        setMentionQuery(query);
        const allProfiles = db.getAllProfiles();
        const matches = allProfiles.filter((p) =>
          p.business_name.toLowerCase().includes(query.toLowerCase())
        );
        setMentionSuggestions(matches.slice(0, 5));
        setSelectedMentionIndex(0);
        return;
      }
    }
    setMentionQuery(null);
  };

  const insertMention = (profile: Profile) => {
    if (!mentionQuery && mentionQuery !== '') return;
    const lastAtIndex = inputText.lastIndexOf('@' + mentionQuery);
    if (lastAtIndex !== -1) {
      const before = inputText.slice(0, lastAtIndex);
      const after = inputText.slice(lastAtIndex + mentionQuery.length + 1);
      const newText = `${before}@${profile.business_name} ${after}`;
      setInputText(newText);
      setMentionQuery(null);
      inputRef.current?.focus();
    }
  };

  // Submit comment or reply with Optimistic UI
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onClose();
      setActiveTab('auth');
      showToast('Please sign in or create an account to join the conversation.', 'info');
      return;
    }

    const text = inputText.trim();
    if (!text) return;

    if (text.length > 500) {
      showToast('Comments cannot exceed 500 characters.', 'error');
      return;
    }

    const tempId = 'temp_' + Date.now();
    const parentId = replyingToComment ? replyingToComment.id : undefined;

    // 1. OPTIMISTIC UPDATE: add immediately to state
    const optimisticComment: Comment = {
      id: tempId,
      post_id: post.id,
      user_id: currentUser.id,
      parent_comment_id: parentId || null,
      body: text,
      created_at: new Date().toISOString(),
      user: currentUser,
      likes_count: 0,
      is_liked: false,
      replies: [],
    };

    setComments((prev) => {
      if (parentId) {
        return prev.map((p) => {
          if (p.id === parentId) {
            return {
              ...p,
              replies: [...(p.replies || []), optimisticComment],
            };
          }
          return p;
        });
      }
      return [optimisticComment, ...prev];
    });

    // Auto expand parent replies so user sees their new reply
    if (parentId) {
      setExpandedReplies((prev) => ({ ...prev, [parentId]: true }));
    }

    setInputText('');
    setReplyingToComment(null);
    setIsSubmitting(true);

    try {
      await addComment(post.id, text, parentId);
      loadData();
    } catch (err: any) {
      // ROLLBACK OPTIMISTIC UPDATE ON FAILURE
      showToast(err.message || 'Failed to post comment', 'error');
      loadData();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Like comment with Optimistic UI
  const handleLike = async (comment: Comment) => {
    if (!currentUser) {
      onClose();
      setActiveTab('auth');
      showToast('Please sign in to like comments.', 'info');
      return;
    }

    // Optimistic toggle
    const currentlyLiked = !!comment.is_liked;
    const newLikesCount = Math.max(0, (comment.likes_count || 0) + (currentlyLiked ? -1 : 1));

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === comment.id) {
          return { ...c, is_liked: !currentlyLiked, likes_count: newLikesCount };
        }
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === comment.id
                ? { ...r, is_liked: !currentlyLiked, likes_count: newLikesCount }
                : r
            ),
          };
        }
        return c;
      })
    );

    try {
      await toggleCommentLike(comment.id);
    } catch (err: any) {
      showToast(err.message || 'Error updating like', 'error');
      loadData(); // rollback
    }
  };

  // Pin comment (Post owner only)
  const handlePin = async (commentId: string) => {
    try {
      const isPinned = await togglePinComment(post.id, commentId);
      showToast(isPinned ? 'Comment pinned to top of thread!' : 'Comment unpinned.', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Cannot pin comment', 'error');
    }
  };

  // Start editing comment
  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.body);
    setOpenMenuId(null);
  };

  // Save edited comment
  const handleSaveEdit = async (commentId: string) => {
    const text = editingText.trim();
    if (!text) return;
    try {
      await editComment(commentId, text);
      setEditingCommentId(null);
      loadData();
      showToast('Comment updated.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to edit comment', 'error');
    }
  };

  // Delete comment (Author or Post Owner)
  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    setOpenMenuId(null);
    try {
      await deleteComment(commentId, post.id);
      loadData();
      showToast('Comment deleted.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete comment', 'error');
    }
  };

  // Report comment
  const handleReport = (commentId: string) => {
    setOpenMenuId(null);
    reportTarget('comment', commentId, 'Inappropriate or harmful business comment');
  };

  // Check if comment can still be edited (within 5 minutes)
  const canEdit = (comment: Comment): boolean => {
    if (!currentUser || currentUser.id !== comment.user_id || comment.deleted_at) return false;
    const ageMs = Date.now() - new Date(comment.created_at).getTime();
    return ageMs < 5 * 60 * 1000;
  };

  const getRemainingEditMinutes = (comment: Comment): number => {
    const ageMs = Date.now() - new Date(comment.created_at).getTime();
    const remainingMs = 5 * 60 * 1000 - ageMs;
    return Math.max(1, Math.ceil(remainingMs / 60000));
  };

  const formatRelativeTime = (isoString: string) => {
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/*
        Responsive UI Container:
        - Mobile: Bottom Sheet (slide up, rounded-t-3xl, max-h-[88vh])
        - Desktop / Tablet (sm:): Slide-over Side Panel (w-full sm:w-[440px] md:w-[480px], h-full, border-l)
      */}
      <div
        className="relative z-10 w-full sm:w-[440px] md:w-[480px] bg-white max-h-[88vh] sm:max-h-full h-full sm:h-screen flex flex-col rounded-t-3xl sm:rounded-none sm:border-l border-stone-200 shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-right duration-300"
      >
        {/* Mobile Pull Handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-stone-300" />
        </div>

        {/* 1. Header with Sort Controls & Close */}
        <header className="px-4 py-3 border-b border-stone-100 flex items-center justify-between gap-3 bg-stone-50/80">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-orange-600" />
            <h2 className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <span>Comments</span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-700">
                {comments.reduce(
                  (acc, c) => acc + (c.deleted_at ? 0 : 1) + (c.replies?.filter((r) => !r.deleted_at).length || 0),
                  0
                )}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Toggle: Top / Newest */}
            <div className="flex items-center bg-stone-200/80 p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setSortBy('top')}
                className={`px-2.5 py-1 rounded-md transition ${
                  sortBy === 'top' ? 'bg-white text-stone-950 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Top
              </button>
              <button
                type="button"
                onClick={() => setSortBy('newest')}
                className={`px-2.5 py-1 rounded-md transition ${
                  sortBy === 'newest' ? 'bg-white text-stone-950 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Newest
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition"
              aria-label="Close comment panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 2. Scrollable Comments Thread */}
        <div
          ref={commentsContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-stone-100 scrollbar-thin"
        >
          {isLoading ? (
            <div className="py-16 text-center text-stone-400 space-y-2">
              <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Loading artisan discussions...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-16 text-center text-stone-400">
              <MessageSquare className="w-9 h-9 mx-auto mb-2 opacity-30 text-orange-600" />
              <p className="text-xs font-semibold text-stone-700">No comments yet</p>
              <p className="text-[11px] text-stone-400 max-w-xs mx-auto mt-0.5">
                Be the first to share feedback or ask questions about this craft showcase.
              </p>
            </div>
          ) : (
            comments.map((comment) => {
              const author = comment.user;
              const hasReplies = comment.replies && comment.replies.length > 0;
              const isReplyingHere = replyingToComment?.id === comment.id;
              const isEditingThis = editingCommentId === comment.id;
              const canEditThis = canEdit(comment);
              const isOwnerOrAuthor = currentUser && (currentUser.id === comment.user_id || isPostOwner);
              const repliesExpanded = expandedReplies[comment.id] || false;
              const displayedReplies = repliesExpanded
                ? comment.replies || []
                : (comment.replies || []).slice(0, 3);
              const hiddenRepliesCount = Math.max(0, (comment.replies || []).length - 3);

              return (
                <div key={comment.id} className="pt-3.5 first:pt-0">
                  {/* Top-level Comment Card */}
                  <div className={`relative flex items-start gap-3 group ${comment.is_pinned ? 'bg-orange-50/50 p-2.5 rounded-2xl border border-orange-200/60' : ''}`}>
                    {/* Author Avatar */}
                    <button
                      type="button"
                      onClick={() => author && viewProfile(author.id)}
                      className="shrink-0 mt-0.5"
                    >
                      <img
                        src={author?.avatar_url || '/src/assets/images/coffee_roaster_1790587302699.jpg'}
                        alt={author?.business_name || 'Artisan'}
                        className="w-8 h-8 rounded-full object-cover border border-stone-200"
                      />
                    </button>

                    {/* Content & Details */}
                    <div className="flex-1 min-w-0">
                      {/* Pinned Pill Header */}
                      {comment.is_pinned && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-orange-700 mb-1">
                          <Pin className="w-3 h-3 fill-orange-600 text-orange-600" />
                          <span>Pinned by post author</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => author && viewProfile(author.id)}
                            className="font-bold text-xs text-stone-900 hover:text-orange-600 transition flex items-center gap-1"
                          >
                            <span>{author?.business_name || 'Community Member'}</span>
                            {author?.is_verified && (
                              <ShieldCheck className="w-3 h-3 text-blue-600 fill-blue-100" />
                            )}
                          </button>

                          {author?.id === post.user_id && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-stone-900 text-white">
                              Author
                            </span>
                          )}

                          <span className="text-[10px] text-stone-400">
                            {formatRelativeTime(comment.created_at)}
                          </span>

                          {comment.is_edited && (
                            <span className="text-[10px] text-stone-400 italic">
                              (edited)
                            </span>
                          )}
                        </div>

                        {/* More Action Menu Button */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenMenuId(openMenuId === comment.id ? null : comment.id)}
                            className="p-1 rounded-md text-stone-300 hover:text-stone-700 opacity-60 group-hover:opacity-100 transition"
                            aria-label="Comment options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {openMenuId === comment.id && (
                            <div
                              className="absolute right-0 top-full mt-1 w-36 bg-white border border-stone-200 shadow-xl rounded-xl py-1 z-30 text-xs"
                              onClick={() => setOpenMenuId(null)}
                            >
                              {isPostOwner && (
                                <button
                                  onClick={() => handlePin(comment.id)}
                                  className="w-full px-3 py-1.5 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                                >
                                  <Pin className="w-3 h-3 text-orange-600" />
                                  <span>{comment.is_pinned ? 'Unpin' : 'Pin to top'}</span>
                                </button>
                              )}

                              {canEditThis && (
                                <button
                                  onClick={() => startEditing(comment)}
                                  className="w-full px-3 py-1.5 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                                >
                                  <Edit2 className="w-3 h-3 text-stone-600" />
                                  <span>Edit ({getRemainingEditMinutes(comment)}m left)</span>
                                </button>
                              )}

                              {isOwnerOrAuthor && (
                                <button
                                  onClick={() => handleDelete(comment.id)}
                                  className="w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleReport(comment.id)}
                                className="w-full px-3 py-1.5 text-left text-stone-600 hover:bg-stone-50 flex items-center gap-2"
                              >
                                <Flag className="w-3 h-3 text-amber-500" />
                                <span>Report</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Comment Body or Deleted Placeholder */}
                      {comment.deleted_at ? (
                        <p className="text-xs text-stone-400 italic py-1 bg-stone-100/60 px-2 rounded-lg mt-1 inline-block">
                          Comment removed by author or post owner
                        </p>
                      ) : isEditingThis ? (
                        <div className="mt-1.5 space-y-2">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            maxLength={500}
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-orange-500 focus:outline-none"
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(comment.id)}
                              className="px-2.5 py-1 bg-orange-600 text-white text-[11px] font-bold rounded-lg"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCommentId(null)}
                              className="px-2.5 py-1 bg-stone-200 text-stone-700 text-[11px] rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-stone-800 mt-1 leading-relaxed break-words whitespace-pre-wrap">
                          {comment.body}
                        </p>
                      )}

                      {/* Comment Action Bar: Reply, Like Counter */}
                      {!comment.deleted_at && (
                        <div className="flex items-center gap-4 mt-2 text-[11px] font-semibold text-stone-500">
                          {/* Reply Trigger */}
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingToComment(comment);
                              inputRef.current?.focus();
                            }}
                            className="hover:text-stone-900 transition flex items-center gap-1 active:scale-95"
                          >
                            <Reply className="w-3 h-3" />
                            <span>Reply</span>
                          </button>

                          {/* Like Toggle */}
                          <button
                            type="button"
                            onClick={() => handleLike(comment)}
                            className="hover:text-stone-900 transition flex items-center gap-1 active:scale-95"
                          >
                            <Heart
                              className={`w-3.5 h-3.5 transition-colors ${
                                comment.is_liked
                                  ? 'text-red-500 fill-red-500 stroke-red-500'
                                  : 'text-stone-400 hover:text-red-500'
                              }`}
                            />
                            <span className="font-mono tabular-nums text-[10px]">
                              {comment.likes_count || 0}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 1-Level Deep Nested Replies */}
                  {hasReplies && (
                    <div className="pl-6 sm:pl-8 mt-2.5 space-y-2.5 border-l-2 border-stone-200 ml-4">
                      {displayedReplies.map((reply) => {
                        const replyAuthor = reply.user;
                        const canEditReply = canEdit(reply);
                        const isReplyOwner = currentUser && (currentUser.id === reply.user_id || isPostOwner);

                        return (
                          <div key={reply.id} className="flex items-start gap-2.5 group relative">
                            <CornerDownRight className="w-3 h-3 text-stone-300 mt-1 shrink-0" />
                            <button
                              type="button"
                              onClick={() => replyAuthor && viewProfile(replyAuthor.id)}
                              className="shrink-0 mt-0.5"
                            >
                              <img
                                src={replyAuthor?.avatar_url || '/src/assets/images/coffee_roaster_1790587302699.jpg'}
                                alt={replyAuthor?.business_name || 'Artisan'}
                                className="w-6 h-6 rounded-full object-cover border border-stone-200"
                              />
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => replyAuthor && viewProfile(replyAuthor.id)}
                                    className="font-bold text-[11px] text-stone-900 hover:text-orange-600 transition flex items-center gap-1"
                                  >
                                    <span>{replyAuthor?.business_name}</span>
                                    {replyAuthor?.is_verified && (
                                      <ShieldCheck className="w-2.5 h-2.5 text-blue-600 fill-blue-100" />
                                    )}
                                  </button>

                                  {replyAuthor?.id === post.user_id && (
                                    <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-stone-900 text-white">
                                      Author
                                    </span>
                                  )}

                                  <span className="text-[9px] text-stone-400">
                                    {formatRelativeTime(reply.created_at)}
                                  </span>

                                  {reply.is_edited && (
                                    <span className="text-[9px] text-stone-400 italic">
                                      (edited)
                                    </span>
                                  )}
                                </div>

                                {/* Reply Menu */}
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setOpenMenuId(openMenuId === reply.id ? null : reply.id)}
                                    className="p-0.5 text-stone-300 hover:text-stone-700 opacity-60 group-hover:opacity-100 transition"
                                  >
                                    <MoreVertical className="w-3 h-3" />
                                  </button>

                                  {openMenuId === reply.id && (
                                    <div
                                      className="absolute right-0 top-full mt-1 w-32 bg-white border border-stone-200 shadow-xl rounded-xl py-1 z-30 text-xs"
                                      onClick={() => setOpenMenuId(null)}
                                    >
                                      {canEditReply && (
                                        <button
                                          onClick={() => startEditing(reply)}
                                          className="w-full px-3 py-1 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 text-[11px]"
                                        >
                                          <Edit2 className="w-3 h-3 text-stone-500" />
                                          <span>Edit</span>
                                        </button>
                                      )}
                                      {isReplyOwner && (
                                        <button
                                          onClick={() => handleDelete(reply.id)}
                                          className="w-full px-3 py-1 text-left text-red-600 hover:bg-red-50 flex items-center gap-1.5 text-[11px]"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          <span>Delete</span>
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleReport(reply.id)}
                                        className="w-full px-3 py-1 text-left text-stone-600 hover:bg-stone-50 flex items-center gap-1.5 text-[11px]"
                                      >
                                        <Flag className="w-3 h-3 text-amber-500" />
                                        <span>Report</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Body */}
                              {reply.deleted_at ? (
                                <p className="text-[11px] text-stone-400 italic py-0.5 bg-stone-100/60 px-1.5 rounded mt-0.5 inline-block">
                                  Reply removed
                                </p>
                              ) : (
                                <p className="text-[11px] text-stone-800 mt-0.5 leading-relaxed break-words whitespace-pre-wrap">
                                  {reply.body}
                                </p>
                              )}

                              {/* Like Action */}
                              {!reply.deleted_at && (
                                <div className="flex items-center gap-3 mt-1 text-[10px] text-stone-400 font-semibold">
                                  <button
                                    type="button"
                                    onClick={() => handleLike(reply)}
                                    className="hover:text-stone-700 transition flex items-center gap-1 active:scale-95"
                                  >
                                    <Heart
                                      className={`w-3 h-3 transition-colors ${
                                        reply.is_liked
                                          ? 'text-red-500 fill-red-500 stroke-red-500'
                                          : 'text-stone-400 hover:text-red-500'
                                      }`}
                                    />
                                    <span className="font-mono tabular-nums">{reply.likes_count || 0}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Expand / Collapse Replies Button */}
                      {(comment.replies || []).length > 3 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedReplies((prev) => ({
                              ...prev,
                              [comment.id]: !prev[comment.id],
                            }))
                          }
                          className="text-[11px] font-bold text-orange-600 hover:text-orange-700 transition flex items-center gap-1 pt-1"
                        >
                          {repliesExpanded ? (
                            <>
                              <ChevronUp className="w-3 h-3" />
                              <span>Hide replies</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" />
                              <span>View {hiddenRepliesCount} more replies</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 3. Input Footer & Autocomplete Dropdown */}
        <footer className="relative border-t border-stone-200/90 bg-white p-3">
          {/* Active Reply Banner */}
          {replyingToComment && (
            <div className="mb-2 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-between text-xs text-orange-950">
              <span className="truncate">
                Replying to <strong>{replyingToComment.user?.business_name || 'artisan'}</strong>
              </span>
              <button
                type="button"
                onClick={() => setReplyingToComment(null)}
                className="text-stone-400 hover:text-stone-700 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Mentions Autocomplete Suggestion Dropdown */}
          {mentionQuery !== null && mentionSuggestions.length > 0 && (
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden z-40 max-h-48 overflow-y-auto">
              <div className="px-3 py-1.5 bg-stone-50 border-b border-stone-100 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                Mention artisan business:
              </div>
              {mentionSuggestions.map((suggestion, idx) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => insertMention(suggestion)}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-orange-50 transition text-xs ${
                    idx === selectedMentionIndex ? 'bg-orange-50/70' : ''
                  }`}
                >
                  <img
                    src={suggestion.avatar_url}
                    alt={suggestion.business_name}
                    className="w-5 h-5 rounded-full object-cover border border-stone-200"
                  />
                  <span className="font-bold text-stone-900 truncate">
                    {suggestion.business_name}
                  </span>
                  <span className="text-[10px] text-stone-400 truncate">
                    {suggestion.category}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder={
                  replyingToComment
                    ? `Reply to @${replyingToComment.user?.business_name}...`
                    : 'Add a comment (type @ to mention a business)...'
                }
                maxLength={500}
                disabled={isSubmitting}
                className="w-full pl-3.5 pr-14 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-stone-50 text-stone-900 placeholder:text-stone-400"
              />
              {/* Live Character Counter */}
              <span
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono tabular-nums ${
                  inputText.length > 450 ? 'text-amber-600 font-bold' : 'text-stone-400'
                }`}
              >
                {500 - inputText.length}
              </span>
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || isSubmitting}
              className="p-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-40 transition active:scale-95 shrink-0 shadow-sm"
              title="Post comment"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};
