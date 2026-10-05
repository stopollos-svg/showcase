import { LocationCountry, LocationDistrict, GeoLocationCoords } from '../types';

export const LOCATION_COUNTRIES: LocationCountry[] = [
  {
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    defaultDistrictId: 'ug_kampala_central',
    districts: [
      {
        id: 'ug_all',
        name: 'All Uganda',
        city: 'All Regions',
        country_code: 'UG',
        latitude: 0.3476,
        longitude: 32.5825,
        highlight: 'Nationwide Artisan & Hospitality Network',
      },
      {
        id: 'ug_kampala_central',
        name: 'Kampala Central',
        city: 'Kampala',
        country_code: 'UG',
        latitude: 0.3136,
        longitude: 32.5811,
        highlight: 'Coffee shrines, historic cafes & urban bistros',
      },
      {
        id: 'ug_kololo',
        name: 'Kololo',
        city: 'Kampala',
        country_code: 'UG',
        latitude: 0.3276,
        longitude: 32.5936,
        highlight: 'Leafy diplomatic hill, specialty roasters & garden restaurants',
      },
      {
        id: 'ug_bugolobi',
        name: 'Bugolobi',
        city: 'Kampala',
        country_code: 'UG',
        latitude: 0.3168,
        longitude: 32.6247,
        highlight: 'Industrial craft hubs, weekend vinyl markets & hangout terraces',
      },
      {
        id: 'ug_nakasero',
        name: 'Nakasero',
        city: 'Kampala',
        country_code: 'UG',
        latitude: 0.3204,
        longitude: 32.5768,
        highlight: 'Single-origin Bugisu coffee houses & fine dining',
      },
      {
        id: 'ug_muyenga',
        name: 'Muyenga & Ggaba',
        city: 'Kampala',
        country_code: 'UG',
        latitude: 0.2974,
        longitude: 32.6148,
        highlight: 'Tank Hill lakeview lounges, pottery ateliers & arts trusts',
      },
      {
        id: 'ug_ntinda',
        name: 'Ntinda & Naguru',
        city: 'Kampala',
        country_code: 'UG',
        latitude: 0.3541,
        longitude: 32.6127,
        highlight: 'Vibrant nightlife, live acoustic sessions & artisanal grills',
      },
      {
        id: 'ug_entebbe',
        name: 'Entebbe Peninsula',
        city: 'Entebbe',
        country_code: 'UG',
        latitude: 0.0512,
        longitude: 32.4637,
        highlight: 'Lake Victoria botanical gardens, beach pop-ups & fresh catch',
      },
      {
        id: 'ug_jinja',
        name: 'Jinja (Source of Nile)',
        city: 'Jinja',
        country_code: 'UG',
        latitude: 0.4244,
        longitude: 33.2041,
        highlight: 'Adventure lodges, fair-trade craft cooperatives & riverside bistros',
      },
    ],
  },
  {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    defaultDistrictId: 'ke_nairobi_central',
    districts: [
      {
        id: 'ke_all',
        name: 'All Kenya',
        city: 'All Regions',
        country_code: 'KE',
        latitude: -1.2921,
        longitude: 36.8219,
        highlight: 'Great Rift & Coastal Artisan Network',
      },
      {
        id: 'ke_nairobi_central',
        name: 'Nairobi Central & Kilimani',
        city: 'Nairobi',
        country_code: 'KE',
        latitude: -1.2921,
        longitude: 36.8219,
        highlight: 'Specialty coffee laboratories & rooftop hangouts',
      },
      {
        id: 'ke_westlands',
        name: 'Westlands & Parklands',
        city: 'Nairobi',
        country_code: 'KE',
        latitude: -1.2674,
        longitude: 36.8048,
        highlight: 'Global fusion bistros, art lounges & pop-up markets',
      },
      {
        id: 'ke_mombasa',
        name: 'Mombasa Old Town',
        city: 'Mombasa',
        country_code: 'KE',
        latitude: -4.0435,
        longitude: 39.6682,
        highlight: 'Swahili spice tea houses, wood carving & coastal seafood',
      },
    ],
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    defaultDistrictId: 'us_portland',
    districts: [
      {
        id: 'us_all',
        name: 'All US Hubs',
        city: 'All Regions',
        country_code: 'US',
        latitude: 37.0902,
        longitude: -95.7129,
        highlight: 'West Coast Artisan Hubs',
      },
      {
        id: 'us_portland',
        name: 'Eastside & Pearl, Portland',
        city: 'Portland, OR',
        country_code: 'US',
        latitude: 45.5152,
        longitude: -122.6784,
        highlight: 'Third-wave micro-roasters & cast iron coffee roasting',
      },
      {
        id: 'us_sf',
        name: 'Mission & SoMa, San Francisco',
        city: 'San Francisco, CA',
        country_code: 'US',
        latitude: 37.7749,
        longitude: -122.4194,
        highlight: 'Maker studios, botanical urban farming & design cooperatives',
      },
    ],
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    defaultDistrictId: 'fr_paris',
    districts: [
      {
        id: 'fr_all',
        name: 'All France',
        city: 'All Regions',
        country_code: 'FR',
        latitude: 48.8566,
        longitude: 2.3522,
        highlight: 'European Artisan Guilds',
      },
      {
        id: 'fr_paris',
        name: '7th Arr. & Le Marais, Paris',
        city: 'Paris',
        country_code: 'FR',
        latitude: 48.8566,
        longitude: 2.3522,
        highlight: 'Wild sourdough hearth bakeries & morning galettes',
      },
    ],
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    defaultDistrictId: 'jp_kyoto',
    districts: [
      {
        id: 'jp_all',
        name: 'All Japan',
        city: 'All Regions',
        country_code: 'JP',
        latitude: 35.0116,
        longitude: 135.7681,
        highlight: 'Kyoto Artisan Traditions',
      },
      {
        id: 'jp_kyoto',
        name: 'Gion & Higashiyama, Kyoto',
        city: 'Kyoto',
        country_code: 'JP',
        latitude: 35.0116,
        longitude: 135.7681,
        highlight: 'Natural wood-ash pottery, tea ceremony ceramics & courtyards',
      },
    ],
  },
];

/**
 * Great-circle distance between two GPS coordinates using the Haversine formula (km)
 */
export function calculateDistanceKm(
  lat1?: number,
  lon1?: number,
  lat2?: number,
  lon2?: number
): number | null {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return null;
  }

  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

/**
 * Format distance in a human-friendly way (e.g. "800 m away", "2.4 km away")
 */
export function formatDistance(km?: number | null): string {
  if (km === null || km === undefined) return '';
  if (km < 1) {
    return `${Math.round(km * 1000)} m away`;
  }
  return `${km.toFixed(1)} km away`;
}

/**
 * Find the closest country and district given user coordinates
 */
export function findNearestDistrict(
  coords: GeoLocationCoords
): { country: LocationCountry; district: LocationDistrict } {
  let minDistance = Infinity;
  let closestCountry = LOCATION_COUNTRIES[0];
  let closestDistrict = LOCATION_COUNTRIES[0].districts[1];

  for (const country of LOCATION_COUNTRIES) {
    for (const district of country.districts) {
      if (district.id.endsWith('_all')) continue;
      const d = calculateDistanceKm(
        coords.latitude,
        coords.longitude,
        district.latitude,
        district.longitude
      );
      if (d !== null && d < minDistance) {
        minDistance = d;
        closestCountry = country;
        closestDistrict = district;
      }
    }
  }

  return { country: closestCountry, district: closestDistrict };
}

export interface GeolocationPreset {
  id: string;
  name: string;
  districtId: string;
  description: string;
  latitude: number;
  longitude: number;
}

export const KAMPALA_PRESETS: GeolocationPreset[] = [
  {
    id: 'kololo_hill',
    name: 'Kololo Hill (Kampala)',
    districtId: 'ug_kololo',
    description: 'Leafy diplomatic ridge, specialty coffee roasters & garden dining',
    latitude: 0.3276,
    longitude: 32.5936,
  },
  {
    id: 'nakasero_center',
    name: 'Nakasero Hill (Kampala)',
    districtId: 'ug_nakasero',
    description: 'City Center, Bugisu Arabica coffee shrines & historical cafes',
    latitude: 0.3204,
    longitude: 32.5768,
  },
  {
    id: 'bugolobi_village',
    name: 'Bugolobi Industrial & Market',
    districtId: 'ug_bugolobi',
    description: 'Design Hub, weekend vinyl sundowners, maker ateliers & open terraces',
    latitude: 0.3168,
    longitude: 32.6247,
  },
  {
    id: 'muyenga_lakeview',
    name: 'Muyenga Tank Hill',
    districtId: 'ug_muyenga',
    description: 'Lake Victoria breeze, pottery studios & contemporary arts trusts',
    latitude: 0.2974,
    longitude: 32.6148,
  },
  {
    id: 'entebbe_waterfront',
    name: 'Entebbe Peninsula Waterfront',
    districtId: 'ug_entebbe',
    description: 'Botanical gardens, sandy shores & lakeview seafood hangouts',
    latitude: 0.0512,
    longitude: 32.4637,
  },
];
