import React, { useRef, useState } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Video,
  Mic,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  compressImage,
  generateSyntheticAudioDataUrl,
  MEDIA_LIMITS,
  validateAndProcessAudio,
  validateAndProcessVideo,
  fileToDataUrl,
} from '../../lib/media';
import { VideoPlayer } from '../feed/VideoPlayer';
import { AudioPlayer } from '../feed/AudioPlayer';
import { BUSINESS_CATEGORIES, MediaType } from '../../types';
import { Tag, Users } from 'lucide-react';

export const CreatePostModal: React.FC = () => {
  const { isCreateModalOpen, closeCreateModal, createPost, showToast } = useApp();
  const communities = BUSINESS_CATEGORIES.filter((c) => c.id !== 'all');

  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(undefined);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isCreateModalOpen) return null;

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
        setCompressionInfo(`Compressed on-device (${sizeReductionPercent}% smaller).`);
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
        setCompressionInfo(`Video verified (${result.duration}s length, under 60s limit).`);
      } else if (mediaType === 'audio') {
        const result = await validateAndProcessAudio(file);
        if (!result.valid) {
          throw new Error(result.error || 'Audio validation failed.');
        }
        const objUrl = URL.createObjectURL(file);
        setMediaUrl(objUrl);
        setDuration(result.duration);
        setCompressionInfo(`Audio verified (${result.duration}s length, under 10m limit).`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'File processing failed.');
      setMediaUrl('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUsePresetMedia = (type: MediaType) => {
    setErrorMsg(null);
    if (type === 'image') {
      setMediaType('image');
      setMediaUrl('/src/assets/images/coffee_roaster_1790587302699.jpg');
      setCompressionInfo('Preset artisanal showcase photo loaded.');
    } else if (type === 'video') {
      setMediaType('video');
      setMediaUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
      setThumbnailUrl('/src/assets/images/bakery_pastry_1790587333429.jpg');
      setDuration(15);
      setCompressionInfo('Preset HD craft video loaded (15s duration).');
    } else if (type === 'audio') {
      setMediaType('audio');
      const soundUrl = generateSyntheticAudioDataUrl();
      setMediaUrl(soundUrl);
      setDuration(3);
      setThumbnailUrl('/src/assets/images/leather_tailor_1790587348791.jpg');
      setCompressionInfo('Synthetic studio audio sample generated.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl) {
      setErrorMsg('Please upload or select media to showcase.');
      return;
    }

    setIsProcessing(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((s) => s.trim().replace(/^#/, ''))
        .filter(Boolean);

      const comm = communities.find((c) => c.id === selectedCommunity);
      const postCaption = tags.length > 0 ? `${caption.trim()} ${tags.map((t) => `#${t}`).join(' ')}` : caption.trim();

      await createPost({
        media_type: mediaType,
        media_url: mediaUrl,
        caption: postCaption,
        duration,
        thumbnail_url: thumbnailUrl,
      });
      // reset
      setCaption('');
      setMediaUrl('');
      setTagsInput('');
      setSelectedCommunity('');
      closeCreateModal();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish post.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-bold text-stone-900">Showcase Your Craft</h3>
            <span className="text-[11px] text-stone-500 font-medium">New Business Post</span>
          </div>
          <button
            onClick={closeCreateModal}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Media Format Picker */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1.5">Choose Format</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMediaType('image');
                  setMediaUrl('');
                  setErrorMsg(null);
                }}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition active:scale-95 ${
                  mediaType === 'image'
                    ? 'bg-orange-50 text-orange-800 border-orange-300'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-orange-600" />
                <span>Photo (5MB)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMediaType('video');
                  setMediaUrl('');
                  setErrorMsg(null);
                }}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition active:scale-95 ${
                  mediaType === 'video'
                    ? 'bg-orange-50 text-orange-800 border-orange-300'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Video className="w-4 h-4 text-orange-600" />
                <span>Video (60s)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMediaType('audio');
                  setMediaUrl('');
                  setErrorMsg(null);
                }}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition active:scale-95 ${
                  mediaType === 'audio'
                    ? 'bg-orange-50 text-orange-800 border-orange-300'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Mic className="w-4 h-4 text-orange-600" />
                <span>Audio (10m)</span>
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept={
                mediaType === 'image'
                  ? 'image/*'
                  : mediaType === 'video'
                  ? 'video/mp4,video/webm,video/quicktime'
                  : 'audio/mpeg,audio/wav,audio/ogg,audio/webm,audio/mp4'
              }
              className="hidden"
            />

            {!mediaUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 hover:border-orange-500 rounded-2xl p-6 text-center cursor-pointer bg-stone-50 hover:bg-orange-50/20 transition group"
              >
                <div className="w-12 h-12 rounded-full bg-white text-stone-600 group-hover:text-orange-600 border border-stone-200 flex items-center justify-center mx-auto mb-2 shadow-xs group-hover:scale-105 transition">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="font-semibold text-stone-800">
                  Tap to upload {mediaType === 'image' ? 'photo' : mediaType === 'video' ? 'video' : 'audio file'}
                </p>
                <p className="text-[11px] text-stone-500 mt-1">
                  {mediaType === 'image' && 'Max 5 MB · Client-side image compression'}
                  {mediaType === 'video' && 'Max 60 seconds · Max 50 MB'}
                  {mediaType === 'audio' && 'Max 10 minutes · Max 20 MB'}
                </p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-900">
                {mediaType === 'image' && (
                  <img
                    src={mediaUrl}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-full aspect-[4/3] object-cover"
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

                <button
                  type="button"
                  onClick={() => {
                    setMediaUrl('');
                    setThumbnailUrl(undefined);
                    setCompressionInfo(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition"
                  title="Remove and choose different file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Quick Demo Sample Loader */}
            <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
              <span>Or quick-test with ready sample:</span>
              <button
                type="button"
                onClick={() => handleUsePresetMedia(mediaType)}
                className="text-orange-700 font-semibold hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-orange-500" />
                <span>Load Sample {mediaType}</span>
              </button>
            </div>
          </div>

          {/* Validation & Compression Feedback */}
          {compressionInfo && (
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-[11px] font-medium">{compressionInfo}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 text-red-800 border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="text-[11px] font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Caption Input */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Caption & Craft Story
            </label>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe your process, materials, freshness, or batch availability..."
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none text-xs leading-relaxed"
              maxLength={300}
            />
            <span className="text-[10px] text-stone-400 block text-right">{caption.length}/300</span>
          </div>

          {/* Community Selection */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-orange-600" />
              <span>Publish in Community (Optional)</span>
            </label>
            <select
              value={selectedCommunity}
              onChange={(e) => setSelectedCommunity(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="">No Community (General Showcase)</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Interest Tags */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-orange-600" />
              <span>Interest & Craft Tags (comma separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. specialtycoffee, pourover, singleorigin"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
            <p className="text-[10px] text-stone-400 mt-1">
              Tags help your craft show up in trending interests and searches.
            </p>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={closeCreateModal}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !mediaUrl}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              {isProcessing ? 'Processing...' : 'Publish Showcase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
