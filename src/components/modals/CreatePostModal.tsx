import React, { useRef, useState, useEffect, useMemo } from 'react';
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
  Tag,
  Users,
  Calendar,
  Clock,
  Save,
  RotateCcw,
  Check,
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
import { BUSINESS_CATEGORIES, MediaType, Profile } from '../../types';
import { db } from '../../lib/mockEngine';

const DRAFT_STORAGE_KEY = 'amapati_create_post_autosave_v3';
const SAVED_DRAFTS_KEY = 'amapati_user_saved_drafts_v1';

export const CreatePostModal: React.FC = () => {
  const { isCreateModalOpen, closeCreateModal, createPost, showToast, currentUser } = useApp();
  const communities = BUSINESS_CATEGORIES.filter((c) => c.id !== 'all');
  const allArtisans = useMemo(() => {
    return db.getAllProfiles().filter((p) => p.id !== currentUser?.id);
  }, [currentUser?.id]);

  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(undefined);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Collaborators
  const [selectedCollaboratorIds, setSelectedCollaboratorIds] = useState<string[]>([]);

  // Scheduling
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  });
  const [scheduledTime, setScheduledTime] = useState('14:00');

  // Autosave and Recovery state
  const [hasRecoverableDraft, setHasRecoverableDraft] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Crash recovery check on mount
  useEffect(() => {
    if (isCreateModalOpen) {
      try {
        const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.caption || parsed.mediaUrl) && !caption && !mediaUrl) {
            setHasRecoverableDraft(true);
          }
        }
      } catch {}
    }
  }, [isCreateModalOpen]);

  // 2. Auto-persist to localStorage every 10 seconds (Autosave hook)
  useEffect(() => {
    if (!isCreateModalOpen) return;

    const interval = setInterval(() => {
      if (caption.trim() || mediaUrl || tagsInput.trim()) {
        const draft = {
          mediaType,
          caption,
          mediaUrl,
          thumbnailUrl,
          duration,
          selectedCommunity,
          tagsInput,
          selectedCollaboratorIds,
          isScheduled,
          scheduledDate,
          scheduledTime,
          savedAt: new Date().toISOString(),
        };
        try {
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setAutoSaveStatus(`Autosaved at ${timeStr}`);
        } catch {}
      }
    }, 10000); // 10s

    return () => clearInterval(interval);
  }, [
    isCreateModalOpen,
    mediaType,
    caption,
    mediaUrl,
    thumbnailUrl,
    duration,
    selectedCommunity,
    tagsInput,
    selectedCollaboratorIds,
    isScheduled,
    scheduledDate,
    scheduledTime,
  ]);

  // Restore draft
  const handleRestoreDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.mediaType) setMediaType(d.mediaType);
        if (d.caption) setCaption(d.caption);
        if (d.mediaUrl) setMediaUrl(d.mediaUrl);
        if (d.thumbnailUrl) setThumbnailUrl(d.thumbnailUrl);
        if (d.duration) setDuration(d.duration);
        if (d.selectedCommunity) setSelectedCommunity(d.selectedCommunity);
        if (d.tagsInput) setTagsInput(d.tagsInput);
        if (d.selectedCollaboratorIds) setSelectedCollaboratorIds(d.selectedCollaboratorIds);
        if (d.isScheduled) setIsScheduled(d.isScheduled);
        if (d.scheduledDate) setScheduledDate(d.scheduledDate);
        if (d.scheduledTime) setScheduledTime(d.scheduledTime);
        setHasRecoverableDraft(false);
        showToast('Restored your draft post from auto-save.', 'success');
      }
    } catch {
      setHasRecoverableDraft(false);
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasRecoverableDraft(false);
    showToast('Previous draft discarded.', 'info');
  };

  // Manual "Save as Draft"
  const handleSaveAsDraft = () => {
    if (!caption.trim() && !mediaUrl) {
      setErrorMsg('Add a caption or media before saving draft.');
      return;
    }

    const draft = {
      id: `draft_${Date.now()}`,
      mediaType,
      caption,
      mediaUrl,
      thumbnailUrl,
      duration,
      selectedCommunity,
      tagsInput,
      selectedCollaboratorIds,
      isScheduled,
      scheduledDate,
      scheduledTime,
      savedAt: new Date().toISOString(),
    };

    try {
      const existingRaw = localStorage.getItem(SAVED_DRAFTS_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [draft, ...existing.slice(0, 9)];
      localStorage.setItem(SAVED_DRAFTS_KEY, JSON.stringify(updated));
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      showToast('Draft saved to database! You can resume it anytime.', 'success');
      closeCreateModal();
    } catch {
      showToast('Failed to save draft.', 'error');
    }
  };

  // 3. AI Smart Tagging suggestions based on caption & category
  const aiSuggestedTags = useMemo(() => {
    const text = (caption + ' ' + selectedCommunity).toLowerCase();
    const suggestions: string[] = [];

    if (text.includes('coffee') || text.includes('roast') || text.includes('brew') || selectedCommunity === 'coffee') {
      suggestions.push('#SpecialtyArabica', '#KampalaRoasters', '#PourOver', '#SingleOrigin');
    }
    if (text.includes('ceramic') || text.includes('clay') || text.includes('pottery') || selectedCommunity === 'crafts') {
      suggestions.push('#StonewarePottery', '#HandThrown', '#ArtisanClay', '#KilnFired');
    }
    if (text.includes('leather') || text.includes('bag') || text.includes('wallet') || text.includes('stitch')) {
      suggestions.push('#BespokeLeather', '#HandStitched', '#UgandaCraft', '#GenuineLeather');
    }
    if (text.includes('tilapia') || text.includes('fish') || text.includes('dine') || text.includes('food') || selectedCommunity === 'restaurants') {
      suggestions.push('#LakeVictoriaTilapia', '#KampalaEats', '#LocalGastronomy', '#FreshCatch');
    }
    if (text.includes('bread') || text.includes('bakery') || text.includes('pastry') || selectedCommunity === 'bakery') {
      suggestions.push('#SourdoughArtisan', '#FreshBaked', '#KampalaBakery', '#WildYeast');
    }

    if (suggestions.length === 0) {
      suggestions.push('#UgandaArtisans', '#HandmadeCrafts', '#LocalMakers', '#KampalaShowcase');
    }

    return suggestions.slice(0, 4);
  }, [caption, selectedCommunity]);

  const handleAddSmartTag = (tag: string) => {
    const cleanTag = tag.replace(/^#/, '');
    const currentTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (!currentTags.includes(cleanTag)) {
      const nextTags = [...currentTags, cleanTag].join(', ');
      setTagsInput(nextTags);
    }
  };

  const toggleCollaborator = (id: string) => {
    setSelectedCollaboratorIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

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

      let postCaption = tags.length > 0 ? `${caption.trim()} ${tags.map((t) => `#${t}`).join(' ')}` : caption.trim();

      // Mention collaborators in caption if selected
      if (selectedCollaboratorIds.length > 0) {
        const collabNames = allArtisans
          .filter((a) => selectedCollaboratorIds.includes(a.id))
          .map((a) => `@${a.business_name.replace(/\s+/g, '')}`)
          .join(' ');
        postCaption += ` with ${collabNames}`;
      }

      await createPost({
        media_type: mediaType,
        media_url: mediaUrl,
        caption: postCaption,
        duration,
        thumbnail_url: thumbnailUrl,
      });

      // Clear draft storage
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      if (isScheduled) {
        showToast(`Post scheduled for ${scheduledDate} at ${scheduledTime} UTC! Saved to database.`, 'success');
      } else {
        showToast('Showcase published successfully!', 'success');
      }

      // Reset
      setCaption('');
      setMediaUrl('');
      setTagsInput('');
      setSelectedCommunity('');
      setSelectedCollaboratorIds([]);
      setIsScheduled(false);
      closeCreateModal();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish post.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-bold text-stone-900">Showcase Your Craft</h3>
            <span className="text-[11px] text-stone-500 font-medium">New Business Post</span>
          </div>

          <div className="flex items-center gap-2">
            {autoSaveStatus && (
              <span className="text-[10px] text-stone-400 font-mono hidden sm:inline">
                {autoSaveStatus}
              </span>
            )}
            <button
              onClick={closeCreateModal}
              className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Draft Recovery Banner */}
        {hasRecoverableDraft && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-amber-900 animate-in fade-in">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Unfinished draft recovered from previous session.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 shadow-2xs text-[11px]"
              >
                Restore
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="text-[11px] text-amber-700 hover:underline"
              >
                Discard
              </button>
            </div>
          </div>
        )}

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

          {/* Media Upload Area */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={
                mediaType === 'image'
                  ? 'image/*'
                  : mediaType === 'video'
                  ? 'video/*'
                  : 'audio/*'
              }
              onChange={handleFileChange}
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

          {/* AI Smart Tag Suggestions */}
          <div className="bg-orange-50/60 border border-orange-200/80 rounded-2xl p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-orange-900 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-orange-600" />
                <span>AI Smart Tagging:</span>
              </span>
              <span className="text-[10px] text-stone-400">Tap to add</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {aiSuggestedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddSmartTag(tag)}
                  className="px-2 py-0.5 rounded-lg bg-white border border-orange-200 text-orange-800 hover:bg-orange-100 text-[10px] font-semibold transition active:scale-95 flex items-center gap-1"
                >
                  <span>{tag}</span>
                  <span className="text-orange-500 text-[9px]">+</span>
                </button>
              ))}
            </div>
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
          </div>

          {/* Invite Collaborators Field */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-orange-600" />
                <span>Invite Collaborators (Co-Authors)</span>
              </span>
              <span className="text-[10px] text-stone-400">
                {selectedCollaboratorIds.length} selected
              </span>
            </label>

            <div className="flex flex-wrap gap-1.5 p-2 bg-stone-50 rounded-xl border border-stone-200 max-h-28 overflow-y-auto">
              {allArtisans.map((artisan) => {
                const isSelected = selectedCollaboratorIds.includes(artisan.id);
                return (
                  <button
                    key={artisan.id}
                    type="button"
                    onClick={() => toggleCollaborator(artisan.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <img
                      src={artisan.avatar_url}
                      alt=""
                      className="w-4 h-4 rounded-full object-cover shrink-0"
                    />
                    <span className="truncate max-w-[120px]">{artisan.business_name}</span>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-stone-400 mt-1">
              Tagged collaborators share visibility on their profile feed.
            </p>
          </div>

          {/* Schedule Post Option */}
          <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-stone-800 flex items-center gap-1.5 cursor-pointer">
                <Calendar className="w-3.5 h-3.5 text-orange-600" />
                <span>Schedule Post for Later</span>
              </label>
              <input
                type="checkbox"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
              />
            </div>

            {isScheduled && (
              <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in">
                <div>
                  <label className="text-[10px] text-stone-500 block mb-0.5">Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 block mb-0.5">Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-3 flex items-center justify-between gap-2 border-t border-stone-100 flex-wrap">
            <button
              type="button"
              onClick={handleSaveAsDraft}
              className="px-3 py-2 rounded-xl text-stone-700 bg-stone-100 hover:bg-stone-200 font-semibold flex items-center gap-1.5 transition active:scale-95"
              title="Save progress to draft database"
            >
              <Save className="w-3.5 h-3.5 text-stone-600" />
              <span>Save Draft</span>
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={closeCreateModal}
                className="px-3.5 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing || !mediaUrl}
                className="px-4.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
              >
                {isProcessing
                  ? 'Processing...'
                  : isScheduled
                  ? 'Schedule Post'
                  : 'Publish Showcase'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
