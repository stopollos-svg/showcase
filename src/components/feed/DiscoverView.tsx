import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Grid,
  List,
  Sparkles,
  Flame,
  RefreshCw,
  ShieldCheck,
  MapPin,
  Navigation,
  Compass,
  Globe,
  SlidersHorizontal,
  ChevronDown,
  Phone,
  MessageSquare,
  ExternalLink,
  Map,
  ArrowUpDown,
  Check,
  Star,
  Clock,
  Tag,
  ChevronRight,
  ThumbsUp,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PostCard } from './PostCard';
import { BUSINESS_CATEGORIES, Post, Profile, SearchAutoSuggestion } from '../../types';
import {
  LOCATION_COUNTRIES,
  KAMPALA_PRESETS,
  formatDistance,
} from '../../lib/locationData';
import { db } from '../../lib/mockEngine';

interface DiscoverViewProps {
  onEditPost: (post: Post) => void;
  onReportPost: (post: Post) => void;
}

const QUICK_SEARCH_CHIPS = [
  { label: '☕ Kololo Specialty Coffee', category: 'coffee', district: 'ug_kololo', query: 'coffee' },
  { label: '🎪 Bugolobi Live Pop-ups', category: 'events', district: 'ug_bugolobi', query: 'events' },
  { label: '🌿 Creative Hangouts', category: 'hangouts', query: 'hangouts' },
  { label: '🍽️ Lake Victoria Tilapia Dining', category: 'restaurants', query: 'restaurants' },
  { label: '🥐 Sourdough Bakeries', category: 'bakery', query: 'bakery' },
  { label: '📍 Kololo', district: 'ug_kololo', query: 'Kololo' },
  { label: '📍 Bugolobi', district: 'ug_bugolobi', query: 'Bugolobi' },
  { label: '📍 Nakasero', district: 'ug_nakasero', query: 'Nakasero' },
];

export const DiscoverView: React.FC<DiscoverViewProps> = ({ onEditPost, onReportPost }) => {
  const {
    posts,
    businesses,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedCountry,
    setSelectedCountry,
    selectedDistrict,
    setSelectedDistrict,
    userCoords,
    isGeoActive,
    geoError,
    locationRadiusKm,
    setLocationRadiusKm,
    discoverSort,
    setDiscoverSort,
    discoverMode,
    setDiscoverMode,
    requestUserLocation,
    simulateLocationPreset,
    clearLocationFilter,
    viewProfile,
    openChatWithUser,
    openWriteReviewModal,
    getSearchAutoSuggestions,
    currentUser,
    recomputeTrending,
    setActiveTab,
  } = useApp();

  const [viewLayout, setViewLayout] = useState<'stream' | 'grid'>('stream');
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showSimulateMenu, setShowSimulateMenu] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState<number>(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Recent Searches stored in localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('amapati_recent_searches');
      return raw ? JSON.parse(raw) : ['coffee', 'Kololo', 'tilapia', 'events'];
    } catch {
      return ['coffee', 'Kololo', 'tilapia', 'events'];
    }
  });

  // AI-Powered Trending Now analysis from recent popular posts and hashtags
  const aiTrendingTags = useMemo(() => {
    const counts: Record<string, { count: number; category?: string; emoji: string }> = {};
    const defaultTrending = [
      { tag: '#SpecialtyCoffee', emoji: '☕', category: 'coffee', count: 48 },
      { tag: '#BugolobiPopups', emoji: '🎪', category: 'events', count: 32 },
      { tag: '#HandThrownPottery', emoji: '🏺', category: 'crafts', count: 27 },
      { tag: '#KampalaBites', emoji: '🍽️', category: 'restaurants', count: 21 },
      { tag: '#ArtisanLeather', emoji: '👜', category: 'crafts', count: 18 },
      { tag: '#SourdoughKampala', emoji: '🥐', category: 'bakery', count: 15 },
      { tag: '#TilapiaSundowner', emoji: '🐟', category: 'restaurants', count: 14 },
    ];

    posts.forEach((p) => {
      if (!p.caption) return;
      const matches = p.caption.match(/#[a-zA-Z0-9_\u0080-\uFFFF]+/g);
      if (matches) {
        matches.forEach((m) => {
          const lower = m.toLowerCase();
          const clean = m;
          const weight = (p.like_count || p.likes_count || 1) + (p.view_count ? Math.round(p.view_count / 10) : 1);
          if (!counts[clean]) {
            let emoji = '🔥';
            if (lower.includes('coffee') || lower.includes('roast')) emoji = '☕';
            else if (lower.includes('clay') || lower.includes('pottery') || lower.includes('ceramic')) emoji = '🏺';
            else if (lower.includes('food') || lower.includes('tilapia') || lower.includes('dine')) emoji = '🍽️';
            else if (lower.includes('event') || lower.includes('popup') || lower.includes('market')) emoji = '🎪';
            else if (lower.includes('leather') || lower.includes('bag')) emoji = '👜';
            counts[clean] = { count: weight, emoji, category: p.user?.category?.toLowerCase() };
          } else {
            counts[clean].count += weight;
          }
        });
      }
    });

    const parsed = Object.entries(counts)
      .map(([tag, meta]) => ({
        tag,
        cleanQuery: tag.replace(/^#/, ''),
        emoji: meta.emoji,
        category: meta.category,
        count: meta.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    if (parsed.length >= 4) {
      return parsed;
    }

    return defaultTrending.map((t) => ({
      tag: t.tag,
      cleanQuery: t.tag.replace(/^#/, ''),
      emoji: t.emoji,
      category: t.category,
      count: t.count,
    }));
  }, [posts]);

  const saveRecentSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setRecentSearches((prev) => {
      const next = [clean, ...prev.filter((p) => p.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
      try {
        localStorage.setItem('amapati_recent_searches', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const removeRecentSearch = (term: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((p) => p !== term);
      try {
        localStorage.setItem('amapati_recent_searches', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('amapati_recent_searches');
    } catch {}
  };

  // Auto-suggestions list
  const autoSuggestions = getSearchAutoSuggestions(searchQuery);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
        setFocusedSuggestionIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isSearchFocused) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedSuggestionIndex((prev) => Math.min(prev + 1, autoSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedSuggestionIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      if (focusedSuggestionIndex >= 0 && autoSuggestions[focusedSuggestionIndex]) {
        e.preventDefault();
        handleSelectSuggestion(autoSuggestions[focusedSuggestionIndex]);
      } else if (searchQuery.trim()) {
        saveRecentSearch(searchQuery.trim());
        setIsSearchFocused(false);
      }
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
      setFocusedSuggestionIndex(-1);
    }
  };

  const handleSelectSuggestion = (sug: SearchAutoSuggestion) => {
    saveRecentSearch(sug.query || sug.title);
    if (sug.type === 'category' && sug.category) {
      setSelectedCategory(sug.category);
      setSearchQuery('');
    } else if (sug.type === 'district' && sug.district) {
      setSelectedDistrict(sug.district);
      setSearchQuery('');
    } else if (sug.type === 'business') {
      setSearchQuery(sug.title);
    } else {
      setSearchQuery(sug.query);
    }
    setIsSearchFocused(false);
    setFocusedSuggestionIndex(-1);
  };

  // Current active country object
  const activeCountryObj = LOCATION_COUNTRIES.find(
    (c) => c.code.toLowerCase() === selectedCountry.toLowerCase()
  );

  // Available districts based on selected country
  const availableDistricts = activeCountryObj ? activeCountryObj.districts : [];

  // Active district object
  const activeDistrictObj = availableDistricts.find((d) => d.id === selectedDistrict);

  const handleLocateMe = async () => {
    setIsLocating(true);
    try {
      await requestUserLocation();
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 pb-28">
      {/* 1. Primary Location & Geolocation Radar Banner */}
      <div className="mb-4 bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-stone-800">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-base sm:text-lg">
                {activeCountryObj?.flag || '🌍'}
              </span>
              <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <span>
                  {activeCountryObj ? activeCountryObj.name : 'Global Discoveries'}
                </span>
                {activeDistrictObj && !activeDistrictObj.id.endsWith('_all') && (
                  <span className="text-orange-400 font-semibold">
                    • {activeDistrictObj.name}
                  </span>
                )}
              </h1>
              {isGeoActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  GPS Active
                </span>
              )}
            </div>

            <p className="text-xs text-stone-300 mt-1 leading-snug">
              Discover artisan venues, roasters, events, and authentic craft in your region.
            </p>
          </div>

          {/* Quick Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleLocateMe}
              disabled={isLocating}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm ${
                isGeoActive
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
              title="Use your current device GPS location"
            >
              <Navigation
                className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">
                {isLocating ? 'Locating...' : isGeoActive ? 'Near Me' : 'Use GPS'}
              </span>
            </button>

            <button
              onClick={() => setShowSimulateMenu(!showSimulateMenu)}
              className="px-2.5 py-2 rounded-xl bg-stone-700/80 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1 transition"
              title="Simulate GPS in Kampala for testing"
            >
              <Compass className="w-3.5 h-3.5 text-orange-400" />
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>
          </div>
        </div>

        {/* GPS Kampala Presets Dropdown */}
        {showSimulateMenu && (
          <div className="mt-3 pt-3 border-t border-stone-700/80">
            <p className="text-[11px] font-bold text-stone-300 mb-1.5 uppercase tracking-wider">
              Simulate Uganda / Kampala Location (Instant Testing):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {KAMPALA_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    simulateLocationPreset(preset.id);
                    setShowSimulateMenu(false);
                  }}
                  className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700/90 text-left border border-stone-700 text-xs transition flex flex-col group"
                >
                  <span className="font-bold text-orange-300 group-hover:text-orange-200">
                    📍 {preset.name}
                  </span>
                  <span className="text-[10px] text-stone-400 truncate">
                    {preset.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Geolocation Coordinates & Radius bar */}
        {isGeoActive && userCoords && (
          <div className="mt-3 pt-2.5 border-t border-stone-700/70 flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-stone-300">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px]">
                Coordinates: {userCoords.latitude.toFixed(4)}°, {userCoords.longitude.toFixed(4)}°
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-stone-400">Radius:</span>
              <div className="flex items-center gap-1">
                {[5, 15, 30, 0].map((radius) => (
                  <button
                    key={radius}
                    onClick={() => setLocationRadiusKm(radius)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                      locationRadiusKm === radius
                        ? 'bg-orange-500 text-white'
                        : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                    }`}
                  >
                    {radius === 0 ? 'Any' : `${radius}km`}
                  </button>
                ))}
              </div>

              <button
                onClick={clearLocationFilter}
                className="text-[11px] text-stone-400 hover:text-white underline ml-1"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {geoError && (
          <div className="mt-2 p-2 rounded-lg bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center justify-between">
            <span>{geoError}</span>
            <button
              onClick={() => simulateLocationPreset('kololo_hill')}
              className="text-orange-300 font-bold underline ml-2"
            >
              Test with Kololo
            </button>
          </div>
        )}
      </div>

      {/* Google Events Tracker & Updates Radar Banner */}
      <div className="mb-3.5 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/90 rounded-2xl p-3 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-stone-900 truncate">
                Google Events Tracker & News
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-orange-200/80 text-orange-950 uppercase">
                Active Radar
              </span>
            </div>
            <p className="text-[11px] text-stone-600 truncate">
              5 upcoming cuppings, vinyl markets & workshops • 1-Click Google Calendar sync
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('events')}
          className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shrink-0 transition active:scale-95 flex items-center gap-1 shadow-2xs"
        >
          <span>Organize</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Hierarchical Location Navigation: Country -> District */}
      <div className="mb-3 space-y-2">
        {/* Country Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setSelectedCountry('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition active:scale-95 flex items-center gap-1.5 border ${
              selectedCountry === 'all'
                ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            <span>🌍</span>
            <span>All Regions</span>
          </button>

          {LOCATION_COUNTRIES.map((c) => {
            const isSelected = selectedCountry.toLowerCase() === c.code.toLowerCase();
            return (
              <button
                key={c.code}
                onClick={() => setSelectedCountry(c.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition active:scale-95 flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.name}</span>
                {c.code === 'UG' && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-400 text-stone-950">
                    Featured
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* District Selector Pills (Cascading from Selected Country) */}
        {availableDistricts.length > 0 && selectedCountry !== 'all' && (
          <div className="bg-stone-100/90 p-1.5 rounded-2xl border border-stone-200">
            <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-orange-600" />
                <span>Districts & Neighborhoods in {activeCountryObj?.name}:</span>
              </span>
              <span className="text-[10px] text-stone-400">
                {availableDistricts.length} areas
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {availableDistricts.map((dist) => {
                const isSelected = selectedDistrict === dist.id;
                return (
                  <button
                    key={dist.id}
                    onClick={() => setSelectedDistrict(dist.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition active:scale-95 border ${
                      isSelected
                        ? 'bg-orange-600 text-white border-orange-600 font-semibold shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-orange-50 hover:text-orange-800'
                    }`}
                  >
                    <span>{dist.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Search Bar with Instant Auto-Suggestions & Quick Search Chips */}
      <div ref={searchContainerRef} className="relative mb-3 z-30">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchFocused(true);
              setFocusedSuggestionIndex(-1);
            }}
            placeholder="Search coffee, events, hangouts, restaurants, Kampala..."
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs transition"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchFocused(false);
                setFocusedSuggestionIndex(-1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Auto-Suggest Dropdown Panel with Recent Searches and Live Suggestions */}
        {isSearchFocused && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-stone-200/90 overflow-hidden z-50 animate-in fade-in duration-150">
            {/* Header */}
            <div className="p-2.5 bg-stone-50 border-b border-stone-100 flex items-center justify-between text-[11px] font-bold text-stone-600">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                <span>{searchQuery.trim() ? 'Auto-Suggested Discoveries' : 'Recommended & Recent Searches'}</span>
              </span>
              <button
                onClick={() => setIsSearchFocused(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-stone-100/80">
              {/* If query is empty: Show Recent Searches */}
              {!searchQuery.trim() && recentSearches.length > 0 && (
                <div className="p-2.5 bg-stone-50/50">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-stone-400 mb-1.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>Recent Searches</span>
                    </span>
                    <button
                      onClick={clearAllRecentSearches}
                      className="text-stone-400 hover:text-orange-600 font-semibold lowercase"
                    >
                      clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((term) => (
                      <span
                        key={term}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-xs text-stone-700 hover:border-orange-300 hover:bg-orange-50/60 transition group cursor-pointer"
                      >
                        <span
                          onClick={() => {
                            setSearchQuery(term);
                            setIsSearchFocused(false);
                            saveRecentSearch(term);
                          }}
                          className="font-medium group-hover:text-orange-600"
                        >
                          {term}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(term);
                          }}
                          className="text-stone-300 hover:text-stone-600 p-0.5"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions List */}
              {autoSuggestions.map((sug, idx) => {
                const isSelected = focusedSuggestionIndex === idx;
                return (
                  <button
                    key={sug.id}
                    onClick={() => handleSelectSuggestion(sug)}
                    className={`w-full px-3.5 py-2.5 text-left transition flex items-center justify-between gap-2.5 group ${
                      isSelected ? 'bg-orange-50/90' : 'hover:bg-orange-50/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {sug.avatar_url ? (
                        <img
                          src={sug.avatar_url}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover border border-stone-200 shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 text-xs">
                          {sug.type === 'category' ? '🏷️' : sug.type === 'district' ? '📍' : '💡'}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-900 truncate group-hover:text-orange-600">
                          {sug.title}
                        </p>
                        {sug.subtitle && (
                          <p className="text-[10px] text-stone-500 truncate">
                            {sug.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {sug.rating && (
                        <span className="font-mono text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60 flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                          <span>{sug.rating.toFixed(1)}</span>
                        </span>
                      )}
                      <span className="text-[9px] uppercase font-bold text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                        {sug.type}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Search Chips Bar (One-Tap Suggestions) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2">
          {QUICK_SEARCH_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (chip.category) setSelectedCategory(chip.category);
                if (chip.district) setSelectedDistrict(chip.district);
                if (chip.query) {
                  setSearchQuery(chip.query);
                  saveRecentSearch(chip.query);
                }
              }}
              className="px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap bg-stone-100 hover:bg-orange-50 text-stone-700 hover:text-orange-700 border border-stone-200/80 transition active:scale-95"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Category Filter Bar (Featuring Coffee, Events, Hangouts, Restaurants) */}
      <div className="mb-4 overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center gap-1.5 min-w-max">
          {BUSINESS_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition active:scale-95 whitespace-nowrap border ${
                  isSelected
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Trending Now Pill Section */}
      <div className="mb-4 bg-gradient-to-r from-orange-50/90 via-amber-50/60 to-orange-50/90 border border-orange-200/80 rounded-2xl p-3 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded-lg bg-orange-600 text-white shadow-2xs">
              <Flame className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <span>Trending Now</span>
              <span className="text-[10px] font-bold text-orange-700 bg-orange-100/80 px-1.5 py-0.2 rounded-md border border-orange-200/60 inline-flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                AI Analyzed
              </span>
            </span>
          </div>
          <span className="text-[10px] text-stone-400 font-mono">Popularity Ranking</span>
        </div>

        {/* Clickable pill-shaped buttons to filter the feed */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {aiTrendingTags.map((trend, idx) => {
            const isFilterActive =
              searchQuery.toLowerCase().includes(trend.cleanQuery.toLowerCase()) ||
              (trend.category && selectedCategory === trend.category);

            return (
              <button
                key={idx}
                onClick={() => {
                  if (isFilterActive) {
                    setSearchQuery('');
                  } else {
                    setSearchQuery(trend.cleanQuery);
                    if (trend.category) setSelectedCategory(trend.category);
                    saveRecentSearch(trend.cleanQuery);
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition active:scale-95 flex items-center gap-1.5 border shadow-2xs ${
                  isFilterActive
                    ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                    : 'bg-white text-stone-800 border-orange-200/90 hover:bg-orange-100/60 hover:text-orange-950'
                }`}
              >
                <span>{trend.emoji}</span>
                <span>{trend.tag}</span>
                <span className={`text-[10px] font-mono ${isFilterActive ? 'text-orange-200' : 'text-stone-400'}`}>
                  ({trend.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. View Mode Switch & Result Controls Header */}
      <div className="flex items-center justify-between mb-3 text-xs text-stone-600 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          {/* Toggle between Showcases Feed and Venues Directory */}
          <div className="flex items-center bg-stone-200/70 p-0.5 rounded-xl border border-stone-200">
            <button
              onClick={() => setDiscoverMode('posts')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition text-xs flex items-center gap-1.5 ${
                discoverMode === 'posts'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Showcases</span>
              <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1 rounded">
                {posts.length}
              </span>
            </button>
            <button
              onClick={() => setDiscoverMode('businesses')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition text-xs flex items-center gap-1.5 ${
                discoverMode === 'businesses'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Venues & Spots</span>
              <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1 rounded">
                {businesses.length}
              </span>
            </button>
          </div>

          {/* Sort Selector Dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={discoverSort}
              onChange={(e) => setDiscoverSort(e.target.value as any)}
              className="bg-white border border-stone-200 text-stone-800 text-xs rounded-xl px-2.5 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-orange-500 shadow-2xs font-medium cursor-pointer"
            >
              <option value="trending">🔥 Trending Velocity</option>
              {isGeoActive && <option value="distance">📍 Closest Distance</option>}
              <option value="latest">⏱️ Most Recent</option>
            </select>
          </div>
        </div>

        {/* Layout Switch (For Showcase Posts view) */}
        {discoverMode === 'posts' && (
          <div className="flex items-center gap-1 bg-stone-200/60 p-0.5 rounded-lg">
            <button
              onClick={() => setViewLayout('stream')}
              className={`p-1.5 rounded-md transition ${
                viewLayout === 'stream'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
              title="Stream View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewLayout('grid')}
              className={`p-1.5 rounded-md transition ${
                viewLayout === 'grid'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 6. Active Region Radar / District Spotlight Card */}
      {activeDistrictObj && !activeDistrictObj.id.endsWith('_all') && (
        <div className="mb-4 bg-orange-50/80 border border-orange-200/90 rounded-2xl p-3 sm:p-3.5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-orange-600 text-white shadow-xs shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs font-bold text-stone-900">
                    {activeDistrictObj.name}, {activeDistrictObj.city}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-200/80 text-orange-950 font-bold">
                    GPS: {activeDistrictObj.latitude.toFixed(4)}° N, {activeDistrictObj.longitude.toFixed(4)}° E
                  </span>
                </div>
                <p className="text-[11px] text-stone-700 mt-0.5 leading-snug">
                  {activeDistrictObj.highlight}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedDistrict(activeCountryObj?.defaultDistrictId || 'all')}
              className="text-[11px] text-stone-500 hover:text-stone-800 underline shrink-0 font-medium"
            >
              Show all
            </button>
          </div>
        </div>
      )}

      {/* 7. Presentation: Posts vs Venues Directory */}
      {discoverMode === 'posts' ? (
        posts.length > 0 ? (
          viewLayout === 'stream' ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onEdit={onEditPost}
                  onReport={onReportPost}
                />
              ))}
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setViewLayout('stream')}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-stone-900 cursor-pointer border border-stone-200"
                >
                  {post.media_type === 'image' && (
                    <img
                      src={post.media_url}
                      alt={post.caption}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  {post.media_type === 'video' && (
                    <div className="w-full h-full relative">
                      <img
                        src={
                          post.thumbnail_url ||
                          '/src/assets/images/coffee_roaster_1790587302699.jpg'
                        }
                        alt="video thumbnail"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono">
                        VIDEO
                      </div>
                    </div>
                  )}
                  {post.media_type === 'audio' && (
                    <div className="w-full h-full bg-stone-900 p-3 flex flex-col justify-between text-white">
                      <span className="text-[10px] text-orange-400 font-mono">
                        AUDIO
                      </span>
                      <p className="text-xs font-semibold line-clamp-3">
                        {post.caption || 'Audio Story'}
                      </p>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {post.duration || 60}s
                      </span>
                    </div>
                  )}

                  {/* Hover overlay with location & distance */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end text-white">
                    <p className="text-xs font-bold truncate">
                      {post.user?.business_name}
                    </p>
                    <p className="text-[11px] text-stone-200 line-clamp-1">
                      {post.caption}
                    </p>
                    {(post.location || post.distance_km !== undefined) && (
                      <p className="text-[10px] text-emerald-300 flex items-center gap-1 mt-1 font-semibold truncate">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{post.location}</span>
                        {post.distance_km !== undefined && (
                          <span>• {formatDistance(post.distance_km)}</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="rounded-2xl bg-white border border-stone-200 p-8 text-center text-stone-500 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-stone-800">
              No showcases found in this location
            </p>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Try selecting another district or widening the search radius to discover artisan venues.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setSelectedCountry('UG');
                  setSelectedDistrict('ug_all');
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition"
              >
                Explore All Uganda
              </button>
              <button
                onClick={clearLocationFilter}
                className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold hover:bg-stone-200 transition"
              >
                Clear Location
              </button>
            </div>
          </div>
        )
      ) : (
        /* Venues & Spots Directory View */
        businesses.length > 0 ? (
          <div className="space-y-3.5">
            {businesses.map((business) => {
              const bReviews = db.getBusinessReviews(business.id);
              const reviewCount = bReviews.length > 0 ? bReviews.length : (business.review_count || 0);
              const avgRating = bReviews.length > 0
                ? (bReviews.reduce((sum, r) => sum + r.rating, 0) / bReviews.length)
                : (business.rating || 5.0);
              const topTags = Array.from(new Set(bReviews.flatMap((r) => r.tags || []))).slice(0, 3);

              return (
                <div
                  key={business.id}
                  className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs hover:border-orange-300 transition group space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <img
                        src={business.avatar_url}
                        alt={business.business_name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover border border-stone-200 group-hover:ring-2 group-hover:ring-orange-200 transition shrink-0 cursor-pointer"
                        onClick={() => viewProfile(business.id)}
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => viewProfile(business.id)}
                            className="text-sm font-bold text-stone-900 group-hover:text-orange-600 transition text-left"
                          >
                            {business.business_name}
                          </button>
                          {business.is_verified && (
                            <span title="Verified Artisan Business">
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 inline fill-blue-100" />
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700 uppercase tracking-wide">
                            {business.category}
                          </span>
                        </div>

                        <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                          {business.bio}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-stone-500 mt-1.5 flex-wrap">
                          {business.location && (
                            <span className="flex items-center gap-1 text-emerald-800 font-medium">
                              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{business.location}</span>
                            </span>
                          )}

                          {business.distance_km !== undefined && (
                            <span className="px-1.5 py-0.2 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-800">
                              {formatDistance(business.distance_km)}
                            </span>
                          )}

                          {business.contact && (
                            <span className="flex items-center gap-1 text-stone-500">
                              <Phone className="w-3 h-3 text-stone-400" />
                              <span>{business.contact}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions for Business Card */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => viewProfile(business.id)}
                        className="px-3 py-1.5 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-semibold transition active:scale-95"
                      >
                        Showcase
                      </button>
                      <button
                        onClick={() => openChatWithUser(business.id)}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition flex items-center justify-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Chat</span>
                      </button>
                    </div>
                  </div>

                  {/* Customer Review & Rating Summary with Action to Write a Review */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pt-2.5 border-t border-stone-100 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1 font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/80">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{avgRating.toFixed(1)}</span>
                        <span className="text-[10px] text-amber-700 font-normal">
                          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>

                      {topTags.map((tag) => (
                        <span
                          key={tag}
                          className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-medium border border-stone-200"
                        >
                          <Tag className="w-2.5 h-2.5 text-orange-500" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openWriteReviewModal(business.id)}
                        className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-[11px] font-bold border border-orange-200 flex items-center gap-1 transition active:scale-95"
                        title={`Write a review for ${business.business_name}`}
                      >
                        <Star className="w-3 h-3 fill-orange-500 text-orange-600" />
                        <span>Review</span>
                      </button>

                      <button
                        onClick={() => viewProfile(business.id)}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold flex items-center gap-1 transition"
                      >
                        <span>Reviews</span>
                        <ChevronRight className="w-3 h-3 text-stone-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-stone-200 p-8 text-center text-stone-500 shadow-2xs">
            <p className="text-sm font-semibold text-stone-800">
              No venues found in this area
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Try switching your country or district filter.
            </p>
            <button
              onClick={() => {
                setSelectedCountry('UG');
                setSelectedDistrict('ug_all');
              }}
              className="mt-4 px-3.5 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition"
            >
              Show All Uganda Venues
            </button>
          </div>
        )
      )}
    </div>
  );
};
