import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Sparkles,
  Share2,
  Check,
  Plus,
  Compass,
  Newspaper,
  Flame,
  Globe,
  Radio,
  ChevronRight,
  Filter,
  CheckCircle2,
  Users,
  Search,
  Copy,
  Download,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ArtisanEvent, GoogleNewsArticle, Post } from '../../types';
import {
  INITIAL_ARTISAN_EVENTS,
  INITIAL_GOOGLE_NEWS,
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  generateYahooCalendarUrl,
  downloadIcsFile,
  copyEventLink,
  shareEvent,
} from '../../lib/googleEventsAndNews';
import { HostEventModal } from '../modals/HostEventModal';
import { formatDistance } from '../../lib/locationData';

interface EventsTrackerViewProps {
  onSelectPost?: (post: Post) => void;
}

export const EventsTrackerView: React.FC<EventsTrackerViewProps> = () => {
  const {
    currentUser,
    viewProfile,
    showToast,
    posts,
    userCoords,
    isGeoActive,
    setActiveTab,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'events' | 'news' | 'showcases'>('events');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newsCategory, setNewsCategory] = useState<string>('all');
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);
  const [calendarMenuOpenId, setCalendarMenuOpenId] = useState<string | null>(null);

  // Stored events state
  const [events, setEvents] = useState<ArtisanEvent[]>(() => {
    try {
      const raw = localStorage.getItem('amapati_artisan_events_v2');
      return raw ? JSON.parse(raw) : INITIAL_ARTISAN_EVENTS;
    } catch {
      return INITIAL_ARTISAN_EVENTS;
    }
  });

  // Stored RSVP user IDs
  const [rsvpdEventIds, setRsvpdEventIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('amapati_user_rsvps');
      return raw ? JSON.parse(raw) : ['evt_cupping_endiro'];
    } catch {
      return ['evt_cupping_endiro'];
    }
  });

  const saveEvents = (updated: ArtisanEvent[]) => {
    setEvents(updated);
    try {
      localStorage.setItem('amapati_artisan_events_v2', JSON.stringify(updated));
    } catch {}
  };

  const handleToggleRsvp = (eventId: string) => {
    const isRsvpd = rsvpdEventIds.includes(eventId);
    const updatedRsvps = isRsvpd
      ? rsvpdEventIds.filter((id) => id !== eventId)
      : [...rsvpdEventIds, eventId];

    setRsvpdEventIds(updatedRsvps);
    try {
      localStorage.setItem('amapati_user_rsvps', JSON.stringify(updatedRsvps));
    } catch {}

    // Update attendee count
    const updatedEvents = events.map((ev) => {
      if (ev.id === eventId) {
        return {
          ...ev,
          attendees_count: isRsvpd ? Math.max(0, ev.attendees_count - 1) : ev.attendees_count + 1,
        };
      }
      return ev;
    });
    saveEvents(updatedEvents);

    if (!isRsvpd) {
      showToast('RSVP Confirmed! Added to your tracked events.', 'success');
    } else {
      showToast('RSVP removed.', 'info');
    }
  };

  const handleCopyLink = async (event: ArtisanEvent) => {
    const ok = await copyEventLink(event);
    if (ok) {
      showToast('Event link copied to clipboard!', 'success');
    } else {
      showToast('Failed to copy link.', 'error');
    }
    setCalendarMenuOpenId(null);
  };

  const handleShareEvent = async (event: ArtisanEvent) => {
    const res = await shareEvent(event);
    if (res === 'copied') {
      showToast('Event link copied to clipboard!', 'success');
    }
    setCalendarMenuOpenId(null);
  };

  const handleCopyNewsLink = async (article: GoogleNewsArticle) => {
    try {
      await navigator.clipboard.writeText(article.url);
      showToast('News story link copied to clipboard!', 'success');
    } catch {
      showToast('Link copied.', 'info');
    }
  };

  const handleCreateEvent = (
    eventData: Omit<ArtisanEvent, 'id' | 'attendees_count' | 'rsvp_user_ids' | 'created_at'>
  ) => {
    const newEvent: ArtisanEvent = {
      ...eventData,
      id: `evt_${Date.now()}`,
      attendees_count: 1,
      rsvp_user_ids: currentUser ? [currentUser.id] : [],
      created_at: new Date().toISOString(),
    };

    const nextEvents = [newEvent, ...events];
    saveEvents(nextEvents);
    setRsvpdEventIds((prev) => [...prev, newEvent.id]);
    showToast('Event published with Google Calendar tracking link!', 'success');
  };

  // Filtered Events
  const filteredEvents = events.filter((ev) => {
    if (selectedCategory === 'all') return true;
    return ev.category === selectedCategory;
  });

  // Filtered News
  const filteredNews = INITIAL_GOOGLE_NEWS.filter((art) => {
    if (newsCategory === 'all') return true;
    return art.category === newsCategory;
  });

  // Latest Showcases tied to events or top artisans
  const showcasePosts = posts.slice(0, 6);

  const formatEventDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return {
        month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
        day: d.getDate(),
        time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        weekday: d.toLocaleString('en-US', { weekday: 'short' }),
      };
    } catch {
      return { month: 'OCT', day: 10, time: '10:00 AM', weekday: 'Sat' };
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-28 space-y-4">
      {/* 1. Header Banner: Google Events Tracker & Updates Radar */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-3xl p-4 sm:p-5 shadow-sm border border-stone-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <Radio className="w-3 h-3 text-orange-400 animate-pulse" />
                Google Events Tracker
              </span>
              <span className="text-xs text-stone-400">Kampala & East Africa</span>
            </div>

            <h1 className="text-base sm:text-lg font-bold text-white mt-1 flex items-center gap-1.5">
              <span>Artisan Events, Google News & Showcases</span>
            </h1>

            <p className="text-xs text-stone-300 mt-1 max-w-md leading-snug">
              Organize and track cuppings, weekend pop-up markets, live acoustic sundowners, and Google News updates across Uganda.
            </p>
          </div>

          <button
            onClick={() => setIsHostModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 flex items-center gap-1.5 shrink-0"
            title="Publish your artisan cupping, workshop or pop-up"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Host Event</span>
          </button>
        </div>

        {/* Navigation Switcher between Events, Google News, and Latest Showcases */}
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-stone-700/70 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('events')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'events'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Events Tracker ({events.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('news')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'news'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>Google News Updates ({INITIAL_GOOGLE_NEWS.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('showcases')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'showcases'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Latest Showcases</span>
          </button>
        </div>
      </div>

      {/* 2. TAB 1: Events Tracker & Google Calendar Organizer */}
      {activeSubTab === 'events' && (
        <div className="space-y-4">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'coffee', label: '☕ Specialty Coffee' },
              { id: 'events', label: '🎪 Pop-ups & Markets' },
              { id: 'restaurants', label: '🍽️ Dining & Tastings' },
              { id: 'crafts', label: '🎨 Workshops & Ceramics' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition active:scale-95 border ${
                  selectedCategory === cat.id
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Events List */}
          <div className="space-y-3.5">
            {filteredEvents.map((event) => {
              const dateMeta = formatEventDate(event.start_time);
              const isRsvpd = rsvpdEventIds.includes(event.id);
              const googleCalUrl = generateGoogleCalendarUrl(event);
              const outlookCalUrl = generateOutlookCalendarUrl(event);
              const yahooCalUrl = generateYahooCalendarUrl(event);
              const isMenuOpen = calendarMenuOpenId === event.id;

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs hover:border-orange-300 transition space-y-3 group relative"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Date Block */}
                    <div className="w-13 sm:w-14 rounded-2xl bg-orange-50 border border-orange-200/80 p-2 text-center shrink-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">
                        {dateMeta.month}
                      </span>
                      <span className="font-mono text-xl sm:text-2xl font-black text-stone-900 leading-none my-0.5">
                        {dateMeta.day}
                      </span>
                      <span className="text-[9px] font-semibold text-stone-500 uppercase">
                        {dateMeta.weekday}
                      </span>
                    </div>

                    {/* Event Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700 uppercase tracking-wider">
                          {event.category}
                        </span>
                        <span className="text-[11px] text-stone-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>{dateMeta.time}</span>
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-stone-900 mt-1 leading-snug group-hover:text-orange-600 transition">
                        {event.title}
                      </h3>

                      <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-stone-500 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-emerald-800 font-medium">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{event.location_name}</span>
                        </span>

                        <span className="flex items-center gap-1 text-stone-500">
                          <Users className="w-3 h-3 text-stone-400" />
                          <span>{event.attendees_count} attending</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Event Actions & Improved Calendar Links */}
                  <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2 flex-wrap">
                    {/* Host Info */}
                    <button
                      onClick={() => viewProfile(event.host_business_id)}
                      className="flex items-center gap-2 text-left group/host"
                    >
                      {event.host_avatar ? (
                        <img
                          src={event.host_avatar}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover border border-stone-200 shrink-0"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center">
                          {event.host_name[0]}
                        </div>
                      )}
                      <span className="text-xs font-semibold text-stone-700 group-hover/host:text-orange-600 truncate max-w-[130px] sm:max-w-[180px]">
                        {event.host_name}
                      </span>
                    </button>

                    {/* Calendar & RSVP Buttons */}
                    <div className="flex items-center gap-1.5 ml-auto relative">
                      {/* Primary 1-Click Google Calendar Intent Link */}
                      <a
                        href={googleCalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition flex items-center gap-1 border border-blue-200/60 shadow-2xs"
                        title="Add this event directly to Google Calendar"
                      >
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden sm:inline">Add to</span>
                        <span>Google Calendar</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                      </a>

                      {/* Dropdown for other calendars & share options */}
                      <div className="relative">
                        <button
                          onClick={() => setCalendarMenuOpenId(isMenuOpen ? null : event.id)}
                          className="p-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 transition"
                          title="More calendar links & share options"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-0 bottom-full mb-1.5 w-52 bg-white rounded-2xl border border-stone-200 shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 text-xs">
                            <div className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                              Calendar Sync
                            </div>

                            <a
                              href={googleCalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setCalendarMenuOpenId(null)}
                              className="w-full px-3 py-2 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                            >
                              <Calendar className="w-3.5 h-3.5 text-blue-600" />
                              <span>Google Calendar Web</span>
                            </a>

                            <button
                              type="button"
                              onClick={() => {
                                downloadIcsFile(event);
                                setCalendarMenuOpenId(null);
                                showToast('Apple Calendar (.ics) file downloaded!', 'success');
                              }}
                              className="w-full px-3 py-2 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                            >
                              <Download className="w-3.5 h-3.5 text-stone-600" />
                              <span>Apple / iCal File (.ics)</span>
                            </button>

                            <a
                              href={outlookCalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setCalendarMenuOpenId(null)}
                              className="w-full px-3 py-2 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                            >
                              <Calendar className="w-3.5 h-3.5 text-sky-600" />
                              <span>Outlook Calendar</span>
                            </a>

                            <a
                              href={yahooCalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setCalendarMenuOpenId(null)}
                              className="w-full px-3 py-2 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                            >
                              <Calendar className="w-3.5 h-3.5 text-purple-600" />
                              <span>Yahoo Calendar</span>
                            </a>

                            <div className="my-1 border-t border-stone-100" />

                            <button
                              type="button"
                              onClick={() => handleCopyLink(event)}
                              className="w-full px-3 py-2 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                            >
                              <Copy className="w-3.5 h-3.5 text-stone-500" />
                              <span>Copy Event Link</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleShareEvent(event)}
                              className="w-full px-3 py-2 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                            >
                              <Share2 className="w-3.5 h-3.5 text-orange-600" />
                              <span>Share Event</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* RSVP Button */}
                      <button
                        onClick={() => handleToggleRsvp(event.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 flex items-center gap-1 ${
                          isRsvpd
                            ? 'bg-emerald-600 text-white'
                            : 'bg-orange-600 hover:bg-orange-700 text-white'
                        }`}
                      >
                        {isRsvpd ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Going</span>
                          </>
                        ) : (
                          <span>RSVP</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. TAB 2: Updates by Google News */}
      {activeSubTab === 'news' && (
        <div className="space-y-4">
          {/* News Topics Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: 'All Topics' },
              { id: 'coffee', label: '☕ Specialty Arabica' },
              { id: 'arts', label: '🎨 Creative Economy' },
              { id: 'gastronomy', label: '🍽️ Local Gastronomy' },
              { id: 'economy', label: '🎪 Artisan Markets' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setNewsCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition active:scale-95 border ${
                  newsCategory === cat.id
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* News Articles Feed */}
          <div className="space-y-3.5">
            {filteredNews.map((article) => (
              <article
                key={article.id}
                className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs hover:border-orange-300 transition space-y-2.5 group"
              >
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span className="font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60 text-[10px] uppercase tracking-wider">
                    {article.topic_label}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="font-medium text-stone-800">{article.source}</span>
                    <span>•</span>
                    <span>{article.published_at}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-stone-900 leading-snug group-hover:text-orange-600 transition">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline flex items-start gap-1"
                      >
                        <span>{article.title}</span>
                      </a>
                    </h3>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      {article.snippet}
                    </p>
                  </div>

                  {article.image_url && (
                    <img
                      src={article.image_url}
                      alt=""
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-stone-200 shrink-0"
                    />
                  )}
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyNewsLink(article)}
                      className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition flex items-center gap-1 text-[11px]"
                      title="Copy article link"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy link</span>
                    </button>
                    <span className="text-[11px] text-stone-400 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-stone-400" />
                      <span>Curated via Google News</span>
                    </span>
                  </div>

                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 hover:underline ml-auto"
                  >
                    <span>Read on Google News</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB 3: Latest Showcases Feed */}
      {activeSubTab === 'showcases' && (
        <div className="space-y-4">
          <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200 flex items-center justify-between text-xs text-stone-600">
            <span className="flex items-center gap-1.5 font-semibold text-stone-800">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span>Latest Showcases from Event Organizers & Artisans</span>
            </span>
            <button
              onClick={() => setActiveTab('discover')}
              className="text-orange-600 hover:underline font-semibold"
            >
              Explore All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {showcasePosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:border-orange-300 transition group flex flex-col"
              >
                <div className="aspect-video relative bg-stone-900 overflow-hidden">
                  <img
                    src={
                      post.media_url ||
                      post.thumbnail_url ||
                      '/src/assets/images/coffee_roaster_1790587302699.jpg'
                    }
                    alt={post.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono">
                    {post.media_type.toUpperCase()}
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-stone-500">
                      <span className="font-bold text-stone-900">{post.user?.business_name}</span>
                      <span>•</span>
                      <span>{post.user?.category}</span>
                    </div>
                    <p className="text-xs text-stone-700 mt-1 line-clamp-2 leading-snug">
                      {post.caption}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                    <span className="flex items-center gap-1 text-emerald-800 font-medium">
                      <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate max-w-[120px]">{post.location || post.user?.location}</span>
                    </span>

                    <button
                      onClick={() => post.user && viewProfile(post.user.id)}
                      className="text-orange-600 hover:underline font-semibold"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Host Event Modal */}
      <HostEventModal
        isOpen={isHostModalOpen}
        onClose={() => setIsHostModalOpen(false)}
        onSaveEvent={handleCreateEvent}
      />
    </div>
  );
};
