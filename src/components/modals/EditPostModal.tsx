import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Trash2,
  Check,
  Upload,
  Video,
  Image as ImageIcon,
  Mic,
  RefreshCw,
  AlertCircle,
  Play,
} from 'lucide-react';
import { Post, MediaType } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  compressImage,
  validateAndProcessVideo,
  validateAndProcessAudio,
  MEDIA_LIMITS,
  fileToDataUrl,
} from '../../lib/media';
import { VideoPlayer } from '../feed/VideoPlayer';
import { AudioPlayer } from '../feed/AudioPlayer';

interface EditPostModalProps {
  post: Post | null;
  onClose: () => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({ post, onClose }) => {
  const { updatePost, deletePost, showToast } = useApp();

  const [caption, setCaption] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(undefined);
  const [duration, setDuration] = useState<number | undefined>(undefined);

  const [isReplacingMedia, setIsReplacingMedia] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (post) {
      setCaption(post.caption || '');
      setMediaType(post.media_type || 'image');
      setMediaUrl(post.media_url || '');
      setThumbnailUrl(post.thumbnail_url);
      setDuration(post.duration);
      setIsReplacingMedia(false);
      setCompressionInfo(null);
      setErrorMsg(null);
    }
  }, [post]);

  if (!post) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setCompressionInfo(null);
    setIsProcessing(true);

    try {
      if (mediaType === 'image') {
        if (file.size > MEDIA_LIMITS.IMAGE_MAX_SIZE_BYTES) {
          throw new Error('Image exceeds 5 MB. Please choose a smaller photo.');
        }
        const { dataUrl, sizeReductionPercent } = await compressImage(file);
        setMediaUrl(dataUrl);
        setCompressionInfo(`New photo compressed on-device (${sizeReductionPercent}% smaller).`);
      } else if (mediaType === 'video') {
        const result = await validateAndProcessVideo(file);
        if (!result.valid) {
          throw new Error(result.error || 'Video validation failed.');
        }
        if (file.size <= 15 * 1024 * 1024) {
          const dataUrl = await fileToDataUrl(file);
          setMediaUrl(dataUrl);
        } else {
          const objUrl = URL.createObjectURL(file);
          setMediaUrl(objUrl);
        }
        setDuration(result.duration);
        if (result.thumbnailUrl) setThumbnailUrl(result.thumbnailUrl);
        setCompressionInfo(`New video verified (${result.duration}s length).`);
      } else if (mediaType === 'audio') {
        const result = await validateAndProcessAudio(file);
        if (!result.valid) {
          throw new Error(result.error || 'Audio validation failed.');
        }
        const objUrl = URL.createObjectURL(file);
        setMediaUrl(objUrl);
        setDuration(result.duration);
        setCompressionInfo(`New audio verified (${result.duration}s length).`);
      }
      setIsReplacingMedia(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'File processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl) {
      setErrorMsg('Media cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      await updatePost(post.id, {
        caption: caption.trim(),
        media_type: mediaType,
        media_url: mediaUrl,
        thumbnail_url: thumbnailUrl,
        duration: duration,
      });
      showToast('Showcase updated successfully!', 'success');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      confirm(
        'Delete this craft showcase? It will be removed from feeds and retained for 30 days in your Activity Log for recovery.'
      )
    ) {
      await deletePost(post.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
          <div>
            <h3 className="font-display text-base font-bold text-stone-900">Edit Craft Showcase</h3>
            <p className="text-[11px] text-stone-500">Update caption, replace media, or manage post</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {compressionInfo && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{compressionInfo}</span>
            </div>
          )}

          {/* Media Preview & Replace Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-stone-700">Showcase Media</label>
              <button
                type="button"
                onClick={() => setIsReplacingMedia(!isReplacingMedia)}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{isReplacingMedia ? 'Keep Current Media' : 'Replace Image / Video'}</span>
              </button>
            </div>

            {/* If replacing media, show format selector and upload dropzone */}
            {isReplacingMedia ? (
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMediaType('image')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition ${
                      mediaType === 'image'
                        ? 'bg-orange-600 text-white shadow-2xs'
                        : 'bg-white text-stone-700 border border-stone-200'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType('video')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition ${
                      mediaType === 'video'
                        ? 'bg-orange-600 text-white shadow-2xs'
                        : 'bg-white text-stone-700 border border-stone-200'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType('audio')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition ${
                      mediaType === 'audio'
                        ? 'bg-orange-600 text-white shadow-2xs'
                        : 'bg-white text-stone-700 border border-stone-200'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Audio</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept={
                    mediaType === 'image'
                      ? 'image/*'
                      : mediaType === 'video'
                      ? 'video/mp4,video/webm,video/quicktime'
                      : 'audio/*'
                  }
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-300 hover:border-orange-500 rounded-xl p-5 text-center cursor-pointer bg-white transition group"
                >
                  <Upload className="w-6 h-6 text-stone-400 group-hover:text-orange-600 mx-auto mb-1 transition" />
                  <p className="font-semibold text-stone-800">
                    Tap to upload new {mediaType === 'image' ? 'photo' : mediaType === 'video' ? 'video' : 'audio file'}
                  </p>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    {mediaType === 'image' && 'Max 5 MB · JPEG, PNG, WebP'}
                    {mediaType === 'video' && 'Max 60 seconds · MP4, WebM'}
                    {mediaType === 'audio' && 'Max 10 minutes'}
                  </p>
                </div>
              </div>
            ) : (
              /* Current Media Preview with Controls */
              <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-950 shadow-xs">
                {mediaType === 'image' && (
                  <img
                    src={mediaUrl}
                    alt={caption || 'Showcase preview'}
                    referrerPolicy="no-referrer"
                    className="w-full aspect-video object-cover"
                  />
                )}

                {mediaType === 'video' && (
                  <VideoPlayer
                    src={mediaUrl}
                    poster={thumbnailUrl}
                    autoPlayInView={false}
                  />
                )}

                {mediaType === 'audio' && (
                  <div className="p-3">
                    <AudioPlayer
                      src={mediaUrl}
                      duration={duration}
                      thumbnailUrl={thumbnailUrl}
                      businessName="Audio Preview"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Caption Input */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">Showcase Caption & Story</label>
            <textarea
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe your craft, materials, or origin notes..."
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none text-xs leading-relaxed"
              maxLength={400}
            />
            <div className="flex justify-end text-[10px] text-stone-400 mt-1">
              <span>{caption.length} / 400</span>
            </div>
          </div>

          {/* Footer Actions: Delete on left, Cancel & Save on right */}
          <div className="pt-3 flex items-center justify-between border-t border-stone-100">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Post</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isProcessing}
                className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
