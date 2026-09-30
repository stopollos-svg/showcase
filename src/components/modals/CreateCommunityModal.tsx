import React, { useState } from 'react';
import { X, Users, Sparkles, Building2, Tag, Compass, Plus, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BUSINESS_CATEGORIES } from '../../types';

export const CreateCommunityModal: React.FC = () => {
  const {
    isCreateCommunityModalOpen,
    setCreateCommunityModalOpen,
    createCommunity,
    showToast,
  } = useApp();

  const [name, setName] = useState('');
  const [niche, setNiche] = useState('');
  const [businessType, setBusinessType] = useState('Coffee & Roasting');
  const [interestsInput, setInterestsInput] = useState('specialty, craftsmanship, local');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('/src/assets/images/coffee_roaster_1790587302699.jpg');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCreateCommunityModalOpen) return null;

  const sampleIcons = [
    { name: 'Coffee', url: '/src/assets/images/coffee_roaster_1790587302699.jpg' },
    { name: 'Ceramics', url: '/src/assets/images/ceramic_studio_1790587319737.jpg' },
    { name: 'Bakery', url: '/src/assets/images/bakery_pastry_1790587333429.jpg' },
    { name: 'Leather', url: '/src/assets/images/leather_tailor_1790587348791.jpg' },
  ];

  const communityTemplates = [
    {
      name: 'Third Wave Coffee Guild',
      niche: 'Specialty Single-Origin & Micro-Roasting',
      businessType: 'Coffee & Roasting',
      interests: 'pourover, singleorigin, roastprofile, cupping',
      description: 'Independent roasters sharing cupping scores, roast curves, and green bean sourcing.',
      icon: '/src/assets/images/coffee_roaster_1790587302699.jpg',
    },
    {
      name: 'Studio Potter & Ceramicist League',
      niche: 'Wheel-thrown Stoneware & Natural Ash Glazes',
      businessType: 'Ceramics & Pottery',
      interests: 'stoneware, woodfire, wheelthrowing, glazing',
      description: 'Potters and sculptors collaborating on clay bodies, kiln firings, and tableware craftsmanship.',
      icon: '/src/assets/images/ceramic_studio_1790587319737.jpg',
    },
    {
      name: 'Artisan Hearth & Sourdough Guild',
      niche: 'Wild Yeast Fermentations & Heritage Grains',
      businessType: 'Bakery & Pastry',
      interests: 'sourdough, ancientgrains, crumbshot, wildyeast',
      description: 'Slow-fermented bread makers and laminated pastry artisans sharing techniques.',
      icon: '/src/assets/images/bakery_pastry_1790587333429.jpg',
    },
    {
      name: 'Heirloom Leathercraft Collective',
      niche: 'Hand-Stitched Vegetable Tanned Leather Goods',
      businessType: 'Leather & Tailoring',
      interests: 'vegtan, saddlestitch, edgework, patina',
      description: 'Makers focused on traditional saddle stitching, burnishing, and durable leather goods.',
      icon: '/src/assets/images/leather_tailor_1790587348791.jpg',
    },
  ];

  const handleApplyTemplate = (tpl: typeof communityTemplates[0]) => {
    setName(tpl.name);
    setNiche(tpl.niche);
    setBusinessType(tpl.businessType);
    setInterestsInput(tpl.interests);
    setDescription(tpl.description);
    setIconUrl(tpl.icon);
    showToast(`Template "${tpl.name}" applied.`, 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter a community name.', 'error');
      return;
    }
    if (!niche.trim()) {
      showToast('Please specify your community niche.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const interests = interestsInput
        .split(',')
        .map((s) => s.trim().replace(/^#/, ''))
        .filter(Boolean);

      await createCommunity({
        name: name.trim(),
        niche: niche.trim(),
        business_type: businessType,
        interests,
        description: description.trim(),
        icon_url: iconUrl,
        banner_url: iconUrl,
      });

      setCreateCommunityModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to create community.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-stone-900">Create Artisan Community</h3>
              <p className="text-[11px] text-stone-500">Unite businesses around shared niches, craft types, and interests</p>
            </div>
          </div>
          <button
            onClick={() => setCreateCommunityModalOpen(false)}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Quick niche templates */}
          <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-200/80">
            <span className="font-bold text-stone-900 text-[11px] flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>Or start from a craft niche template:</span>
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {communityTemplates.map((tpl, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => handleApplyTemplate(tpl)}
                  className="p-2 rounded-lg bg-white border border-stone-200 hover:border-orange-400 text-left transition hover:bg-stone-50 flex items-center gap-2"
                >
                  <img src={tpl.icon} alt={tpl.name} className="w-6 h-6 rounded-md object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-[10px] text-stone-900 truncate">{tpl.name}</p>
                    <p className="text-[9px] text-stone-500 truncate">{tpl.niche}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Community Name */}
          <div>
            <label className="block font-semibold text-stone-800 mb-1">
              Community Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Specialty Coffee Roasters Guild, Clay & Kiln Studio"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* Niche & Craft Type Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-800 mb-1 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-orange-600" />
                <span>Specific Niche *</span>
              </label>
              <input
                type="text"
                required
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g. Micro-Roasting, Stoneware Pottery, Wild Sourdough"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-800 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-orange-600" />
                <span>Business Type / Industry</span>
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                {BUSINESS_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interest Tags */}
          <div>
            <label className="block font-semibold text-stone-800 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-orange-600" />
              <span>Interests & Craft Tags (comma separated)</span>
            </label>
            <input
              type="text"
              value={interestsInput}
              onChange={(e) => setInterestsInput(e.target.value)}
              placeholder="e.g. pourover, singleorigin, roastprofile, beans"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
            <p className="text-[10px] text-stone-400 mt-1">
              Showcases with these tags will be highlighted to community members.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-stone-800 mb-1">Community Mission & Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What unites businesses in this community? What knowledge or showcase craft is shared?"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
            />
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block font-semibold text-stone-800 mb-1.5">Community Visual Icon</label>
            <div className="flex items-center gap-3">
              <img
                src={iconUrl}
                alt="Community Icon"
                className="w-12 h-12 rounded-xl object-cover border-2 border-orange-500 shrink-0"
              />
              <div className="flex items-center gap-2">
                {sampleIcons.map((item, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setIconUrl(item.url)}
                    className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition ${
                      iconUrl === item.url ? 'border-orange-600 scale-105' : 'border-stone-200 opacity-60'
                    }`}
                    title={item.name}
                  >
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateCommunityModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !niche.trim()}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? 'Creating...' : 'Create Community'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
