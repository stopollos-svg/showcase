import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, Lock, Unlock, Check, Upload, Sparkles, Building2, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BUSINESS_CATEGORIES } from '../../types';
import { compressImage } from '../../lib/media';

export const EditProfileModal: React.FC = () => {
  const { currentUser, isEditProfileModalOpen, setEditProfileModalOpen, updateProfile, showToast } = useApp();

  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('Coffee & Roasting');
  const [contact, setContact] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize state whenever modal opens or currentUser changes
  useEffect(() => {
    if (currentUser) {
      setBusinessName(currentUser.business_name || '');
      setBio(currentUser.bio || '');
      setCategory(currentUser.category || 'Coffee & Roasting');
      setContact(currentUser.contact || '');
      setAvatarUrl(currentUser.avatar_url || '');
      setIsPrivate(currentUser.is_private || false);
    }
  }, [currentUser, isEditProfileModalOpen]);

  if (!isEditProfileModalOpen || !currentUser) return null;

  const sampleAvatars = [
    { name: 'Coffee Roastery', url: '/src/assets/images/coffee_roaster_1790587302699.jpg' },
    { name: 'Ceramic Studio', url: '/src/assets/images/ceramic_studio_1790587319737.jpg' },
    { name: 'Artisan Bakery', url: '/src/assets/images/bakery_pastry_1790587333429.jpg' },
    { name: 'Leather Workshop', url: '/src/assets/images/leather_tailor_1790587348791.jpg' },
  ];

  // Quick preset business identity templates for fast testing and editing to other business names
  const presetBusinesses = [
    {
      name: 'Copper Hill Roastery',
      category: 'Coffee & Roasting',
      bio: 'Artisan micro-batch roasts over antique iron drums. Direct-trade Ethiopian and Guatemalan beans.',
      avatar: '/src/assets/images/coffee_roaster_1790587302699.jpg',
      contact: 'orders@copperhill.coffee',
    },
    {
      name: 'Terra Cotta & Clay Studio',
      category: 'Ceramics & Pottery',
      bio: 'Hand-thrown stoneware mugs, bespoke fluted vases, and earthen table goods fired with natural glaze.',
      avatar: '/src/assets/images/ceramic_studio_1790587319737.jpg',
      contact: '+1 (555) 392-8810',
    },
    {
      name: 'Golden Hearth Bakehouse',
      category: 'Bakery & Pastry',
      bio: 'Naturally leavened sourdough, pain au chocolat, and laminated morning pastries fresh every dawn.',
      avatar: '/src/assets/images/bakery_pastry_1790587333429.jpg',
      contact: 'hello@goldenhearth.com',
    },
    {
      name: 'Atelier Iron & Stitch Goods',
      category: 'Leather & Tailoring',
      bio: 'Full-grain vegetable-tanned leather totes, briefcases, and wallets hand-stitched with waxed Irish thread.',
      avatar: '/src/assets/images/leather_tailor_1790587348791.jpg',
      contact: '+1 (555) 774-0199',
    },
  ];

  const handleApplyPreset = (preset: typeof presetBusinesses[0]) => {
    setBusinessName(preset.name);
    setCategory(preset.category);
    setBio(preset.bio);
    setAvatarUrl(preset.avatar);
    setContact(preset.contact);
    showToast(`Loaded preset info for "${preset.name}". Tap Save to apply.`, 'info');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const { dataUrl, sizeReductionPercent } = await compressImage(file, 800, 0.85);
      setAvatarUrl(dataUrl);
      showToast(`Profile picture updated (${sizeReductionPercent}% compressed on device)!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload photo.', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      showToast('Please enter a business name.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        business_name: businessName.trim(),
        bio: bio.trim(),
        category,
        contact: contact.trim(),
        avatar_url: avatarUrl,
        is_private: isPrivate,
      });
      setEditProfileModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-stone-900">Edit Business Account</h3>
              <p className="text-[11px] text-stone-500">Update business name, profile photo, and craft details</p>
            </div>
          </div>
          <button
            onClick={() => setEditProfileModalOpen(false)}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Avatar selection & custom photo upload */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
            <label className="block font-bold text-stone-900 mb-2">Profile Picture / Logo</label>
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <img
                  src={avatarUrl || sampleAvatars[0].url}
                  alt={businessName}
                  referrerPolicy="no-referrer"
                  className="w-18 h-18 rounded-2xl object-cover border-2 border-orange-500 shadow-md"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Upload from device"
                >
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px] font-semibold">Change</span>
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold transition active:scale-95 flex items-center gap-1.5 shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingPhoto ? 'Processing...' : 'Upload Photo'}</span>
                  </button>
                  <span className="text-[10px] text-stone-500">Max 5MB (PNG/JPG)</span>
                </div>

                <p className="text-[10px] text-stone-500 mb-1">Or choose a craft studio photo:</p>
                <div className="flex items-center gap-2">
                  {sampleAvatars.map((item, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setAvatarUrl(item.url)}
                      title={item.name}
                      className={`relative w-8 h-8 rounded-xl overflow-hidden border-2 transition active:scale-90 ${
                        avatarUrl === item.url
                          ? 'border-orange-600 scale-105 ring-2 ring-orange-200'
                          : 'border-stone-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={item.url} alt={item.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick preset business identities helper */}
          <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-stone-900 text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                <span>Switch to other business identities:</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {presetBusinesses.map((preset, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => handleApplyPreset(preset)}
                  className="p-1.5 rounded-lg bg-white border border-stone-200 hover:border-orange-300 text-left transition hover:bg-stone-50 flex items-center gap-2"
                >
                  <img src={preset.avatar} alt={preset.name} referrerPolicy="no-referrer" className="w-6 h-6 rounded-md object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-[10px] text-stone-900 truncate">{preset.name}</p>
                    <p className="text-[9px] text-stone-500 truncate">{preset.category}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Business Name Field */}
          <div>
            <label className="block font-semibold text-stone-800 mb-1">
              Business Name *
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder="e.g. Copper Hill Roastery, Bella Terra Breads"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-semibold text-stone-800 mb-1">Category / Craft</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              {BUSINESS_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bio */}
          <div>
            <label className="block font-semibold text-stone-800 mb-1">Business Bio & Story</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none leading-relaxed"
              placeholder="Tell customers about your craftsmanship, ingredients, workshops, or hours..."
              maxLength={240}
            />
            <span className="text-[10px] text-stone-400 block text-right">{bio.length}/240</span>
          </div>

          {/* Contact link / phone */}
          <div>
            <label className="block font-semibold text-stone-800 mb-1">Contact Link or Phone Number</label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder="+1 (555) 000-0000 or https://yourshop.com"
            />
          </div>

          {/* Private Account toggle */}
          <div className="pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                  {isPrivate ? <Lock className="w-3.5 h-3.5 text-orange-600" /> : <Unlock className="w-3.5 h-3.5 text-stone-500" />}
                  <span>Private Account</span>
                </p>
                <p className="text-[11px] text-stone-500">
                  When enabled, only people you approve can see your business showcases.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  isPrivate ? 'bg-orange-600' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    isPrivate ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setEditProfileModalOpen(false)}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold transition active:scale-95 flex items-center gap-1.5 shadow-sm"
            >
              {isSaving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
