import { ArtisanEvent, GoogleNewsArticle } from '../types';

/**
 * Format ISO date string into UTC string for calendars: YYYYMMDDTHHMMSSZ
 */
export function formatCalendarUtcDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  } catch {
    return '';
  }
}

/**
 * Generates an instant, zero-friction 1-Click "Add to Google Calendar" link
 * Using Google's universal calendar web intent format:
 * https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...&details=...&location=...
 */
export function generateGoogleCalendarUrl(event: ArtisanEvent): string {
  const start = formatCalendarUtcDate(event.start_time);
  const end = formatCalendarUtcDate(event.end_time);
  const dates = start && end ? `${start}/${end}` : start ? `${start}/${start}` : '';

  const fullLocation = `${event.location_name}, ${event.district ? event.district + ', ' : ''}${event.city}, ${event.country}`;
  const details = `${event.description}\n\nHosted by: ${event.host_name}\nRSVP & Event Updates: https://amapati.app?event=${event.id}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: dates,
    details: details,
    location: fullLocation,
    ctz: 'Africa/Kampala',
    sprop: 'website:amapati.app',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates Outlook Calendar web link
 */
export function generateOutlookCalendarUrl(event: ArtisanEvent): string {
  const fullLocation = `${event.location_name}, ${event.city}, ${event.country}`;
  const details = `${event.description}\n\nHosted by: ${event.host_name}\nhttps://amapati.app?event=${event.id}`;

  const params = new URLSearchParams({
    rru: 'addevent',
    startdt: new Date(event.start_time).toISOString(),
    enddt: new Date(event.end_time).toISOString(),
    subject: event.title,
    body: details,
    location: fullLocation,
    path: '/calendar/action/compose',
  });

  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`;
}

/**
 * Generates Yahoo Calendar web link
 */
export function generateYahooCalendarUrl(event: ArtisanEvent): string {
  const start = formatCalendarUtcDate(event.start_time);
  const end = formatCalendarUtcDate(event.end_time);
  const fullLocation = `${event.location_name}, ${event.city}, ${event.country}`;

  const params = new URLSearchParams({
    v: '60',
    view: 'd',
    type: '20',
    title: event.title,
    st: start,
    et: end,
    desc: `${event.description} - Hosted by ${event.host_name}`,
    in_loc: fullLocation,
  });

  return `https://calendar.yahoo.com/?${params.toString()}`;
}

/**
 * Generates and triggers download of standard RFC-5545 iCalendar (.ics) file
 * Compatible with Apple Calendar (iOS/macOS), Outlook Desktop, Google Calendar file import
 */
export function downloadIcsFile(event: ArtisanEvent): void {
  const start = formatCalendarUtcDate(event.start_time);
  const end = formatCalendarUtcDate(event.end_time);
  const fullLocation = `${event.location_name}, ${event.city}, ${event.country}`.replace(/,/g, '\\,');
  const cleanDescription = (event.description + `\\n\\nHosted by: ${event.host_name}\\nEvent link: https://amapati.app?event=${event.id}`).replace(/\n/g, '\\n');
  const now = formatCalendarUtcDate(new Date().toISOString());

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Amapati Artisans//Event Calendar 2.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@amapati.app`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${fullLocation}`,
    'STATUS:CONFIRMED',
    'CLASS:PUBLIC',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${event.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
}

/**
 * Copies the event shareable URL to clipboard
 */
export async function copyEventLink(event: ArtisanEvent): Promise<boolean> {
  const url = `${window.location.origin}?event=${event.id}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      // fallback
    }
  }

  // Fallback for older browsers
  try {
    const tempInput = document.createElement('input');
    tempInput.value = url;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    return true;
  } catch {
    return false;
  }
}

/**
 * Shares event via Web Share API or falls back to copying link
 */
export async function shareEvent(event: ArtisanEvent): Promise<'shared' | 'copied' | 'failed'> {
  const url = `${window.location.origin}?event=${event.id}`;
  const shareData = {
    title: event.title,
    text: `${event.title} • Hosted by ${event.host_name} in ${event.city}`,
    url: url,
  };

  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return 'shared';
    } catch (err: any) {
      if (err.name === 'AbortError') return 'failed';
    }
  }

  const copied = await copyEventLink(event);
  return copied ? 'copied' : 'failed';
}

export const INITIAL_ARTISAN_EVENTS: ArtisanEvent[] = [
  {
    id: 'evt_cupping_endiro',
    title: '☕ Mt. Elgon Specialty Arabica Cupping & Brew Masterclass',
    description:
      'Join our head roaster and women farmer cooperative partners for a guided cupping of 5 rare micro-lots from Mount Elgon. Learn Chemex pour-over mechanics, sensory profiling, and bean degassing.',
    category: 'coffee',
    host_business_id: 'user_endiro',
    host_name: 'Endiro Coffee',
    host_avatar: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&auto=format&fit=crop&q=80',
    start_time: '2026-10-10T07:00:00Z', // 10:00 AM Kampala time
    end_time: '2026-10-10T10:00:00Z',
    location_name: 'Endiro Kololo Leafy Courtyard',
    district: 'ug_kololo',
    city: 'Kampala',
    country: 'Uganda',
    latitude: 0.3276,
    longitude: 32.5936,
    cover_image: '/src/assets/images/coffee_roaster_1790587302699.jpg',
    attendees_count: 48,
    rsvp_user_ids: ['user_coffee', 'user_bakery'],
    featured_post_id: 'post_1',
    created_at: '2026-10-01T08:00:00Z',
  },
  {
    id: 'evt_vinyl_designhub',
    title: '🎪 Bugolobi Vinyl Sundowner & Artisan Maker Market',
    description:
      'Curated acoustic sets, analog vinyl crate digging, craft beer, and 20+ independent Ugandan makers showcasing hand-thrown ceramics, leathercraft, and botanical scents.',
    category: 'events',
    host_business_id: 'user_events_kampala',
    host_name: 'Kampala Arts & Vinyl Pop-up',
    host_avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    start_time: '2026-10-11T12:00:00Z', // 3:00 PM Kampala time
    end_time: '2026-10-11T18:00:00Z',
    location_name: 'Design Hub Bugolobi Industrial Terrace',
    district: 'ug_bugolobi',
    city: 'Kampala',
    country: 'Uganda',
    latitude: 0.3155,
    longitude: 32.6185,
    cover_image: '/src/assets/images/ceramic_studio_1790587319737.jpg',
    attendees_count: 112,
    rsvp_user_ids: ['user_ceramics', 'user_leather', 'user_designhub'],
    featured_post_id: 'post_3',
    created_at: '2026-10-01T09:00:00Z',
  },
  {
    id: 'evt_tilapia_lawns',
    title: '🍽️ Lake Victoria Tilapia & Garden Gastronomy Night',
    description:
      'An evening celebrating Lake Victoria fresh catch under our historic acacia canopy in Kololo. Multi-course tasting with tamarind glaze, roasted cassava gnocchi, and spiced ginger sorbet.',
    category: 'restaurants',
    host_business_id: 'user_thelawns',
    host_name: 'The Lawns Restaurant',
    host_avatar: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=80',
    start_time: '2026-10-16T16:00:00Z', // 7:00 PM Kampala time
    end_time: '2026-10-16T20:00:00Z',
    location_name: 'The Lawns Acacia Garden Deck, Kololo',
    district: 'ug_kololo',
    city: 'Kampala',
    country: 'Uganda',
    latitude: 0.3298,
    longitude: 32.5895,
    cover_image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    attendees_count: 64,
    rsvp_user_ids: ['user_endiro'],
    featured_post_id: 'post_2',
    created_at: '2026-10-02T10:00:00Z',
  },
  {
    id: 'evt_claypot_1000cups',
    title: '🏺 Historic Nakasero Clay Pot Coffee Ceremony & Heritage',
    description:
      'Immerse yourself in authentic 20-year traditional clay pot brewing with fresh mountain ginger, green cardamom pods, and storytellers narrating the heritage of Bugisu coffee farmers.',
    category: 'coffee',
    host_business_id: 'user_1000cups',
    host_name: '1000 Cups Coffee House',
    host_avatar: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&auto=format&fit=crop&q=80',
    start_time: '2026-10-17T08:00:00Z', // 11:00 AM Kampala time
    end_time: '2026-10-17T11:00:00Z',
    location_name: '1000 Cups Shaded Courtyard, Nakasero',
    district: 'ug_nakasero',
    city: 'Kampala',
    country: 'Uganda',
    latitude: 0.3168,
    longitude: 32.5785,
    cover_image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    attendees_count: 37,
    rsvp_user_ids: [],
    created_at: '2026-10-02T11:00:00Z',
  },
  {
    id: 'evt_pottery_nadia',
    title: '🎨 Hand-Thrown Stoneware Ceramics Workshop & Wheel Basics',
    description:
      'Hands-on wheel throwing session with studio clay, natural ash glazes, and trimming fundamentals. All participants produce and fire 2 glazed stoneware vessels.',
    category: 'crafts',
    host_business_id: 'user_ceramics',
    host_name: 'Nadia Studio Ceramics',
    host_avatar: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&auto=format&fit=crop&q=80',
    start_time: '2026-10-18T10:00:00Z', // 1:00 PM Kampala time
    end_time: '2026-10-18T13:30:00Z',
    location_name: 'Nadia Studio, Muyenga Tank Hill Road',
    district: 'ug_muyenga',
    city: 'Kampala',
    country: 'Uganda',
    latitude: 0.2985,
    longitude: 32.612,
    cover_image: '/src/assets/images/ceramic_studio_1790587319737.jpg',
    attendees_count: 18,
    rsvp_user_ids: [],
    created_at: '2026-10-02T14:00:00Z',
  },
];

export const INITIAL_GOOGLE_NEWS: GoogleNewsArticle[] = [
  {
    id: 'news_1',
    title: "Uganda's Specialty Arabica Exports Surge as Women Coffee Cooperatives Gain Global Recognition",
    snippet:
      'High-altitude micro-lots from Mount Elgon and the Rwenzori Mountains command record premiums on specialty auctions, with direct tree-to-cup roasters in Kampala pioneering ethical farmer compensation.',
    source: 'World Coffee Portal / Reuters Africa',
    published_at: '2 hours ago',
    category: 'coffee',
    url: 'https://news.google.com/search?q=Uganda+specialty+coffee+arabica&hl=en-UG&gl=UG&ceid=UG%3Aen',
    image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=80',
    topic_label: 'Specialty Coffee',
  },
  {
    id: 'news_2',
    title: "Kampala's Creative Renaissance: How Bugolobi and Kololo Design Hubs are Redefining Urban Craft",
    snippet:
      'Contemporary Ugandan artisans are revitalizing indigenous materials—from bark cloth textiles to hand-thrown volcanic clay—fostering thriving pop-up markets and cross-border creative exports.',
    source: 'The EastAfrican',
    published_at: '5 hours ago',
    category: 'arts',
    url: 'https://news.google.com/search?q=Kampala+artisan+craft+design+hub&hl=en-UG&gl=UG&ceid=UG%3Aen',
    image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    topic_label: 'Creative Economy',
  },
  {
    id: 'news_3',
    title: 'Lake Victoria Farm-to-Table Gastronomy Takes Center Stage in Kampala Dining Scene',
    snippet:
      'Local restaurateurs and culinary innovators are prioritizing sustainably farmed tilapia, indigenous herbs, and sweet plantains over imported ingredients, creating an authentic East African dining identity.',
    source: 'Daily Monitor Uganda',
    published_at: 'Yesterday',
    category: 'gastronomy',
    url: 'https://news.google.com/search?q=Uganda+culinary+gastronomy+Lake+Victoria&hl=en-UG&gl=UG&ceid=UG%3Aen',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
    topic_label: 'Local Gastronomy',
  },
  {
    id: 'news_4',
    title: 'East African Artisan Bazaars See Surge in Regional Tourism and Direct-to-Consumer Pop-ups',
    snippet:
      'Weekend vinyl markets, acoustic live sessions, and craft workshops across Kampala attract regional visitors and collectors seeking authenticated handcrafted goods with verifiable provenance.',
    source: 'Kampala Post / Business Daily',
    published_at: '2 days ago',
    category: 'economy',
    url: 'https://news.google.com/search?q=East+Africa+artisan+markets+tourism&hl=en-UG&gl=UG&ceid=UG%3Aen',
    image_url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=500&auto=format&fit=crop&q=80',
    topic_label: 'Artisan Tourism',
  },
];
