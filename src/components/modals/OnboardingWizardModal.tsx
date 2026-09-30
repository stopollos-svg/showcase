import React, { useRef, useState } from 'react';
import {
  Building2,
  Camera,
  Check,
  ChevronRight,
  Compass,
  Sparkles,
  Upload,
  UserCheck,
  UserPlus,
  X,
  ArrowRight,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BUSINESS_CATEGORIES, Profile } from '../../types';
import { compressImage } from '../../lib/media';
import { db } from '../../lib/mockEngine';

export const OnboardingWizardModal: React.FC = () => {
  const {
    currentUser,
    isOnboardingModalOpen,
    setOnboardingModalOpen,
    updateProfile,
    createPost,
    followUser,
    unfollowUser,
    refreshFeed,
    setActiveTab,
    showToast,
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Profile State
  const [businessName, setBusinessName] = useState(currentUser?.business_name || '');
  const [category, setCategory] = useState(currentUser?.category || BUSINESS_CATEGORIES[1].name);
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [contact, setContact] = useState(currentUser?.contact || '');
  const [avatarUrl, setAvatarUrl] = useState(
    currentUser?.avatar_url || '/src/assets/images/coffee_roaster_1790587302699.jpg'
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // Step 2: Post State
  const [postCaption, setPostCaption] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('/src/assets/images/coffee_roaster_1790587302699.jpg');
  const [isUploadingPostImage, setIsUploadingPostImage] = useState(false);
  const postImageInputRef = useRef<HTMLInputElement | null>(null);
  const [isPublishingPost, setIsPublishingPost] = useState(false);

  // Step 3: Follow State
  const [followedIds, setFollowedIds] = useState<string[]>([]);

  if (!isOnboardingModalOpen || !currentUser) return null;

  const sampleAvatars = [
    { name: 'Coffee', url: '/src/assets/images/coffee_roaster_1790587302699.jpg' },
    { name: 'Ceramics', url: '/src/assets/images/ceramic_studio_1790587319737.jpg' },
    { name: 'Bakery', url: '/src/assets/images/bakery_pastry_1790587333429.jpg' },
    { name: 'Leather', url: '/src/assets/images/leather_tailor_1790587348791.jpg' },
  ];

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const { dataUrl } = await compressImage(file, 800, 0.85);
      setAvatarUrl(dataUrl);
      showToast('Profile picture ready!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload photo.', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPostImage(true);
    try {
      const { dataUrl } = await compressImage(file, 1400, 0.82);
      setPostImageUrl(dataUrl);
      showToast('Showcase image compressed and ready!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload image.', 'error');
    } finally {
      setIsUploadingPostImage(false);
    }
  };

  const handleSaveStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      showToast('Please enter your business name.', 'error');
      return;
    }

    try {
      await updateProfile({
        business_name: businessName.trim(),
        category,
        bio: bio.trim(),
        contact: contact.trim(),
        avatar_url: avatarUrl,
      });
      setStep(2);
    } catch (err: any) {
      showToast(err.message || 'Failed to save profile.', 'error');
    }
  };

  const handlePublishFirstPost = async () => {
    if (!postCaption.trim()) {
      showToast('Please add a short caption describing your work.', 'error');
      return;
    }

    setIsPublishingPost(true);
    try {
      await createPost({
        media_type: 'image',
        media_url: postImageUrl,
        caption: postCaption.trim(),
      });
      showToast('First showcase post published!', 'success');
      setStep(3);
    } catch (err: any) {
      showToast(err.message || 'Failed to publish post.', 'error');
    } finally {
      setIsPublishingPost(false);
    }
  };

  const handleToggleFollow = (targetId: string) => {
    if (followedIds.includes(targetId)) {
      unfollowUser(targetId);
      setFollowedIds((prev) => prev.filter((id) => id !== targetId));
    } else {
      followUser(targetId);
      setFollowedIds((prev) => [...prev, targetId]);
    }
  };

  const handleFinishOnboarding = () => {
    setOnboardingModalOpen(false);
    refreshFeed();
    setActiveTab('home');
    showToast('Setup complete! Welcome to Amapati.', 'success');
  };

  const suggestedBusinesses = db.getAllProfiles(currentUser.id).filter((p) => p.id !== currentUser.id);

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={() => setOnboardingModalOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header with Stepper */}
        <header className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-600 animate-pulse" />
              <span className="font-display font-black text-sm text-stone-900 tracking-tight">
                Amapati Business Onboarding
              </span>
            </div>
            <button
              onClick={() => setOnboardingModalOpen(false)}
              className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              title="Close wizard"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-3 gap-2 text-xs font-bold">
            <div
              className={`py-1.5 px-2 rounded-xl text-center flex items-center justify-center gap-1.5 transition ${
                step === 1
                  ? 'bg-orange-600 text-white shadow-2xs'
                  : step > 1
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-stone-200/60 text-stone-500'
              }`}
            >
              {step > 1 ? <Check className="w-3.5 h-3.5" /> : <span>1</span>}
              <span>Profile</span>
            </div>

            <div
              className={`py-1.5 px-2 rounded-xl text-center flex items-center justify-center gap-1.5 transition ${
                step === 2
                  ? 'bg-orange-600 text-white shadow-2xs'
                  : step > 2
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-stone-200/60 text-stone-500'
              }`}
            >
              {step > 2 ? <Check className="w-3.5 h-3.5" /> : <span>2</span>}
              <span>First Post</span>
            </div>

            <div
              className={`py-1.5 px-2 rounded-xl text-center flex items-center justify-center gap-1.5 transition ${
                step === 3
                  ? 'bg-orange-600 text-white shadow-2xs'
                  : 'bg-stone-200/60 text-stone-500'
              }`}
            >
              <span>3</span>
              <span>Discover</span>
            </div>
          </div>
        </header>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* STEP 1: BUSINESS PROFILE */}
          {step === 1 && (
            <form onSubmit={handleSaveStep1} className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-stone-900">Set Up Your Business Profile</h3>
                <p className="text-[11px] text-stone-500">
                  Introduce your craft, trade, and studio to nearby clients and collaborators.
                </p>
              </div>

              {/* Avatar Picker */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1.5">
                  Business Logo / Workshop Picture
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={avatarUrl}
                    alt="Preview"
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-500 shadow-sm shrink-0"
                  />
                  <div className="flex-1 flex gap-1.5 flex-wrap">
                    {sampleAvatars.map((sa) => (
                      <button
                        key={sa.name}
                        type="button"
                        onClick={() => setAvatarUrl(sa.url)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition ${
                          avatarUrl === sa.url
                            ? 'bg-orange-100 border-orange-400 text-orange-800'
                            : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        {sa.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="text-[10px] px-2.5 py-1 rounded-lg border border-dashed border-stone-300 hover:border-orange-500 text-stone-700 flex items-center gap-1"
                    >
                      <Camera className="w-3 h-3 text-orange-600" />
                      <span>{isUploadingAvatar ? '...' : 'Upload File'}</span>
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Copper Hearth Woodwork"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Craft Category */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Artisan / Trade Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {BUSINESS_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Short Studio Bio
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="What makes your process or materials unique?"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>

              {/* Contact */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Public Contact (Phone, WhatsApp or Email)
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="+1 (555) 000-0000 or orders@craft.com"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <span>Save & Continue to First Post</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: FIRST SHOWCASE POST */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-stone-900">Publish Your First Showcase Post</h3>
                <p className="text-[11px] text-stone-500">
                  Showcase a piece of work, a fresh batch, or behind-the-scenes in your workshop.
                </p>
              </div>

              {/* Media Preview & Upload */}
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-stone-900 border border-stone-200">
                <img
                  src={postImageUrl}
                  alt="Post preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => postImageInputRef.current?.click()}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 transition active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5 text-orange-400" />
                  <span>{isUploadingPostImage ? 'Compressing...' : 'Change Photo'}</span>
                </button>
                <input
                  ref={postImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePostImageUpload}
                  className="hidden"
                />
              </div>

              {/* Sample Photo Presets */}
              <div className="flex gap-2 items-center">
                <span className="text-[11px] font-bold text-stone-600 shrink-0">Sample Images:</span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {sampleAvatars.map((sa) => (
                    <button
                      key={sa.name}
                      type="button"
                      onClick={() => setPostImageUrl(sa.url)}
                      className="text-[10px] px-2 py-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-orange-50 font-medium text-stone-700 shrink-0"
                    >
                      {sa.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Caption / Notes on the Process <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={postCaption}
                  onChange={(e) => setPostCaption(e.target.value)}
                  placeholder="Describe your materials, technique, or release date..."
                  maxLength={500}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
                <span className="text-[10px] text-stone-400 font-mono block text-right">
                  {postCaption.length}/500
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-1/3 py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition"
                >
                  Skip for Now
                </button>
                <button
                  type="button"
                  disabled={!postCaption.trim() || isPublishingPost}
                  onClick={handlePublishFirstPost}
                  className="w-2/3 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <span>{isPublishingPost ? 'Publishing...' : 'Publish Showcase'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DISCOVER LOCAL BUSINESSES */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-stone-900">Connect with Artisan Businesses</h3>
                <p className="text-[11px] text-stone-500">
                  Follow local crafters to populate your daily showcase feed with roasters, potters & bakers.
                </p>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {suggestedBusinesses.map((biz) => {
                  const isFollowing = followedIds.includes(biz.id);
                  return (
                    <div
                      key={biz.id}
                      className="p-3 rounded-2xl border border-stone-200 hover:border-stone-300 transition flex items-center justify-between gap-3 bg-white"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={biz.avatar_url}
                          alt={biz.business_name}
                          className="w-10 h-10 rounded-xl object-cover border border-stone-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-stone-900 truncate">
                            {biz.business_name}
                          </p>
                          <p className="text-[11px] text-stone-500 truncate">
                            {biz.category}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleFollow(biz.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 flex items-center gap-1 shrink-0 ${
                          isFollowing
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-orange-600 hover:bg-orange-700 text-white shadow-2xs'
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-orange-600/20 transition active:scale-98 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Enter Amapati Showcase</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
