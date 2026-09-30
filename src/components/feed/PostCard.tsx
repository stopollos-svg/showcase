import React, { useEffect, useRef, useState } from 'react';
import {
  Heart,
  MoreVertical,
  Phone,
  MessageSquare,
  MessageCircle,
  Share2,
  Trash2,
  Edit2,
  Flag,
  UserX,
  Check,
  UserPlus,
  ShieldCheck,
  Eye,
  Flame,
} from 'lucide-react';
import { Post } from '../../types';
import { useApp } from '../../context/AppContext';
import { VideoPlayer } from './VideoPlayer';
import { AudioPlayer } from './AudioPlayer';
import { CommentSection } from './CommentSection';
import { viewTracker } from '../../lib/viewTracker';

interface PostCardProps {
  post: Post;
  onEdit?: (post: Post) => void;
  onReport?: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onEdit, onReport }) => {
  const {
    currentUser,
    followUser,
    unfollowUser,
    deletePost,
    blockUser,
    viewProfile,
    openChatWithUser,
    showToast,
  } = useApp();

  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.like_count ?? post.likes_count ?? 12);
  const [commentsCount, setCommentsCount] = useState(post.comment_count ?? post.comments_count ?? 0);
  const [viewCount, setViewCount] = useState(post.view_count || 0);
  const [isCommentsSheetOpen, setCommentsSheetOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const cardRef = useRef<HTMLDivElement | null>(null);

  // View tracking: Log view when post is at least 60% visible for 1+ second
  useEffect(() => {
    if (!cardRef.current) return;
    const cleanup = viewTracker.observePost(
      cardRef.current,
      post.id,
      currentUser?.id,
      () => {
        setViewCount((prev) => prev + 1);
      }
    );
    return cleanup;
  }, [post.id, currentUser?.id]);

  const author = post.user;
  const isOwner = currentUser?.id === post.user_id;

  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikesCount((prev) => Math.max(0, prev - 1));
    } else {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
    }
  };

  const handleFollowToggle = () => {
    if (!author) return;
    if (author.is_following) {
      unfollowUser(author.id);
    } else {
      followUser(author.id);
    }
  };

  const handleDelete = async () => {
    if (confirm('Delete this showcase post? (It will be hidden from the feed and preserved in activity log).')) {
      await deletePost(post.id);
    }
    setIsMenuOpen(false);
  };

  const handleBlock = async () => {
    if (!author) return;
    if (confirm(`Block ${author.business_name}? Neither of you will see each other's content.`)) {
      await blockUser(author.id);
    }
    setIsMenuOpen(false);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setIsCopied(true);
      showToast('Showcase link copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <article
      ref={cardRef}
      className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden mb-6 transition-all hover:border-stone-300"
    >
      {/* 1. Header Zone: Business Author & Affordances */}
      <header className="p-4 flex items-center justify-between gap-3 border-b border-stone-100">
        <button
          onClick={() => author && viewProfile(author.id)}
          className="flex items-center gap-3 text-left min-w-0 group"
        >
          {author?.avatar_url ? (
            <img
              src={author.avatar_url}
              alt={author.business_name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-stone-200 group-hover:ring-2 group-hover:ring-orange-200 transition shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm shrink-0">
              {author?.business_name ? author.business_name[0] : 'B'}
            </div>
          )}

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-stone-900 truncate group-hover:text-orange-600 transition-colors flex items-center gap-1">
              <span>{author?.business_name || 'Artisan Business'}</span>
              {author?.is_verified && (
                <span title="Verified Business">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 inline fill-blue-100" />
                </span>
              )}
            </h3>
            {/* Metadata with Typographic Separator & Trending Badge */}
            <div className="flex items-center gap-1.5 text-xs text-stone-500 font-normal flex-wrap">
              <span className="truncate">{author?.category || 'Craft'}</span>
              <span aria-hidden="true">·</span>
              <span className="whitespace-nowrap">{formatRelativeTime(post.created_at)}</span>
              {post.trending_score !== undefined && post.trending_score > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                    title={`Trending Velocity Score: ${post.trending_score}`}
                  >
                    <Flame className="w-2.5 h-2.5 text-orange-600 fill-orange-500" />
                    <span>{post.trending_score.toFixed(1)}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </button>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1">
          {/* Quick Follow button if not current owner */}
          {!isOwner && author && (
            <button
              onClick={handleFollowToggle}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition active:scale-95 flex items-center gap-1 ${
                author.is_following
                  ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
              }`}
            >
              {author.is_following ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3 h-3" />
                  <span>Follow</span>
                </>
              )}
            </button>
          )}

          {/* Options Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              aria-label="Post Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white border border-stone-200 shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setIsMenuOpen(false)}
              >
                {isOwner ? (
                  <>
                    <button
                      onClick={() => onEdit?.(post)}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                      <span>Edit Caption</span>
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Post</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => author && openChatWithUser(author.id)}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-orange-600" />
                      <span>Send Direct Message</span>
                    </button>
                    <button
                      onClick={() => onReport?.(post)}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                    >
                      <Flag className="w-3.5 h-3.5 text-amber-500" />
                      <span>Report Post</span>
                    </button>
                    <button
                      onClick={handleBlock}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Block Business</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Media Presentation Zone */}
      <div className="relative bg-stone-100">
        {post.media_type === 'image' && (
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-stone-900">
            <img
              src={post.media_url}
              alt={post.caption || 'Business showcase'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.02]"
            />
          </div>
        )}

        {post.media_type === 'video' && (
          <VideoPlayer
            src={post.media_url}
            poster={post.thumbnail_url}
            caption={post.caption}
          />
        )}

        {post.media_type === 'audio' && (
          <div className="p-3">
            <AudioPlayer
              src={post.media_url}
              duration={post.duration}
              thumbnailUrl={post.thumbnail_url || author?.avatar_url}
              businessName={author?.business_name}
            />
          </div>
        )}
      </div>

      {/* 3. Action Bar: Like, Comments, Share, Direct Contact & Message */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-t border-stone-100">
        <div className="flex items-center gap-4">
          {/* Heart / Like Button */}
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 transition active:scale-95"
            aria-label="Like showcase"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isLiked ? 'text-red-500 fill-red-500 stroke-red-500' : 'text-stone-600 hover:text-red-500'
              }`}
            />
            <span className="tabular-nums font-mono">{likesCount}</span>
          </button>

          {/* Comments Button -> Opens Comments Sheet */}
          <button
            onClick={() => setCommentsSheetOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition active:scale-95"
            aria-label="View comments"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="tabular-nums font-mono">{commentsCount}</span>
          </button>

          {/* Views Counter */}
          <div
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-500"
            title="Post views in rolling 24h"
          >
            <Eye className="w-4 h-4 text-stone-400" />
            <span className="tabular-nums font-mono">{viewCount}</span>
          </div>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition active:scale-95"
            aria-label="Share post"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>

        {/* Direct Action Buttons: Message and Phone */}
        <div className="flex items-center gap-2">
          {!isOwner && author && (
            <button
              onClick={() => openChatWithUser(author.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition active:scale-95"
              title={`Direct message ${author.business_name}`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-orange-600" />
              <span className="hidden sm:inline">Chat</span>
            </button>
          )}

          {author?.contact && (
            <a
              href={
                author.contact.startsWith('http')
                  ? author.contact
                  : author.contact.includes('@')
                  ? `mailto:${author.contact}`
                  : `tel:${author.contact}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Contact</span>
            </a>
          )}
        </div>
      </div>

      {/* 4. Caption Prose */}
      {post.caption && (
        <div className="px-4 pb-2 pt-1">
          <p className="text-xs sm:text-sm text-stone-800 leading-relaxed">
            <strong
              onClick={() => author && viewProfile(author.id)}
              className="cursor-pointer hover:underline mr-1.5 font-bold text-stone-950 inline-flex items-center gap-1"
            >
              <span>{author?.business_name}</span>
              {author?.is_verified && (
                <ShieldCheck className="w-3 h-3 text-blue-600 inline fill-blue-100" />
              )}
            </strong>
            {post.caption}
          </p>
        </div>
      )}

      {/* 5. Subtle "View all comments" prompt */}
      <div className="px-4 pb-3">
        <button
          onClick={() => setCommentsSheetOpen(true)}
          className="text-[11px] font-semibold text-stone-500 hover:text-orange-600 transition flex items-center gap-1"
        >
          <span>{commentsCount > 0 ? `View all ${commentsCount} comments` : 'Add the first comment...'}</span>
        </button>
      </div>

      {/* 6. Comments Slide-up Sheet / Side Panel */}
      <CommentSection
        post={post}
        isOpen={isCommentsSheetOpen}
        onClose={() => setCommentsSheetOpen(false)}
        onCommentsCountChange={(cnt) => setCommentsCount(cnt)}
      />
    </article>
  );
};
