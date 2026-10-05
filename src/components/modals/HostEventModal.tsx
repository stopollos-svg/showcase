import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Building2,
  CalendarPlus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ArtisanEvent } from '../../types';

interface HostEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEvent: (eventData: Omit<ArtisanEvent, 'id' | 'attendees_count' | 'rsvp_user_ids' | 'created_at'>) => void;
}

export const HostEventModal: React.FC<HostEventModalProps> = ({ isOpen, onClose, onSaveEvent }) => {
  const { currentUser } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'coffee' | 'events' | 'restaurants' | 'crafts' | 'workshop' | 'music'>('coffee');
  const [date, setDate] = useState('2026-10-24');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('14:00');
  const [locationName, setLocationName] = useState(currentUser?.location || 'Kololo, Kampala');
  const [district, setDistrict] = useState(currentUser?.district || 'ug_kololo');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const startIso = `${date}T${startTime}:00Z`;
    const endIso = `${date}T${endTime}:00Z`;

    onSaveEvent({
      title: title.trim(),
      description: description.trim(),
      category,
      host_business_id: currentUser?.id || 'guest_host',
      host_name: currentUser?.business_name || 'Artisan Host',
      host_avatar: currentUser?.avatar_url,
      start_time: startIso,
      end_time: endIso,
      location_name: locationName.trim(),
      district,
      city: 'Kampala',
      country: 'Uganda',
      cover_image: currentUser?.avatar_url || '/src/assets/images/coffee_roaster_1790587302699.jpg',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <CalendarPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">Host an Artisan Event</h2>
              <p className="text-[11px] text-stone-500">
                Organize cuppings, pop-ups, and workshops with Google Calendar sync
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-3.5 text-xs">
          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1">
              Event Title <span className="text-orange-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bugisu Specialty Arabica Cupping & Roaster Q&A"
              className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-orange-500"
              >
                <option value="coffee">☕ Specialty Coffee</option>
                <option value="events">🎪 Pop-up & Market</option>
                <option value="restaurants">🍽️ Dining & Tasting</option>
                <option value="crafts">🎨 Workshop & Studio</option>
                <option value="music">🎵 Live Music & Vinyl</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">District</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-orange-500"
              >
                <option value="ug_kololo">Kololo, Kampala</option>
                <option value="ug_bugolobi">Bugolobi, Kampala</option>
                <option value="ug_nakasero">Nakasero, Kampala</option>
                <option value="ug_muyenga">Muyenga, Kampala</option>
                <option value="ug_kampala_central">Kampala Central</option>
                <option value="ug_entebbe">Entebbe Waterfront</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-stone-800 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-800 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-800 mb-1">End Time</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1">Venue Location</label>
            <input
              type="text"
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Endiro Courtyard, Plot 23B Cooper Road, Kololo"
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1">
              Event Description & Schedule <span className="text-orange-600">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what attendees will experience, cupping lots, guest artisans, parking, etc..."
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 text-[11px] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
            <span>Automatic Google Calendar 1-Click integration will be generated for all attendees.</span>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Publish Event</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
