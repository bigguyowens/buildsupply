// lib/geo.ts — Geo constants, tax rates, distribution centers, shipping estimates

export interface GeoData {
  city:        string;
  region:      string;
  regionCode:  string;
  country:     string;
  countryCode: string;
  zip:         string;
  lat:         number;
  lon:         number;
}

// ── US State Sales Tax Rates (base rate, 2024) ──────────────────────────────
export const STATE_TAX_RATES: Record<string, number> = {
  AL: 0.04,   AK: 0.00,   AZ: 0.056,  AR: 0.065,  CA: 0.0725,
  CO: 0.029,  CT: 0.0635, DE: 0.00,   FL: 0.06,   GA: 0.04,
  HI: 0.04,   ID: 0.06,   IL: 0.0625, IN: 0.07,   IA: 0.06,
  KS: 0.065,  KY: 0.06,   LA: 0.0445, ME: 0.055,  MD: 0.06,
  MA: 0.0625, MI: 0.06,   MN: 0.06875,MS: 0.07,   MO: 0.04225,
  MT: 0.00,   NE: 0.055,  NV: 0.0685, NH: 0.00,   NJ: 0.06625,
  NM: 0.05125,NY: 0.04,   NC: 0.0475, ND: 0.05,   OH: 0.0575,
  OK: 0.045,  OR: 0.00,   PA: 0.06,   RI: 0.07,   SC: 0.06,
  SD: 0.045,  TN: 0.07,   TX: 0.0625, UT: 0.061,  VT: 0.06,
  VA: 0.053,  WA: 0.065,  WV: 0.06,   WI: 0.05,   WY: 0.04,
  DC: 0.06,
};

export const DEFAULT_TAX_RATE = 0.07;

export function getTaxRate(stateCode: string): number {
  return STATE_TAX_RATES[stateCode.toUpperCase()] ?? DEFAULT_TAX_RATE;
}

// ── Distribution Centers ────────────────────────────────────────────────────
export interface DistributionCenter {
  id:      number;
  name:    string;
  city:    string;
  state:   string;
  zip:     string;
  address: string;
  phone:   string;
  lat:     number;
  lon:     number;
  hours:   string;
  services: string[];
}

export const DISTRIBUTION_CENTERS: DistributionCenter[] = [
  {
    id: 1, name: "Southeast Hub", city: "Atlanta", state: "GA", zip: "30301",
    address: "1200 Industrial Pkwy NW", phone: "(404) 555-0100",
    lat: 33.7490, lon: -84.3880,
    hours: "Mon–Fri 7am–6pm · Sat 8am–4pm",
    services: ["Will Call", "Bulk Freight", "Forklift Loading", "Returns"],
  },
  {
    id: 2, name: "Midwest Hub", city: "Chicago", state: "IL", zip: "60638",
    address: "400 Commerce Dr", phone: "(312) 555-0200",
    lat: 41.8781, lon: -87.6298,
    hours: "Mon–Fri 7am–6pm · Sat 8am–4pm",
    services: ["Will Call", "Bulk Freight", "Forklift Loading", "Same-Day Metro"],
  },
  {
    id: 3, name: "South Central Hub", city: "Dallas", state: "TX", zip: "75207",
    address: "900 Supply Blvd", phone: "(214) 555-0300",
    lat: 32.7767, lon: -96.7970,
    hours: "Mon–Fri 7am–6pm · Sat 8am–4pm",
    services: ["Will Call", "Bulk Freight", "Forklift Loading"],
  },
  {
    id: 4, name: "West Coast Hub", city: "Los Angeles", state: "CA", zip: "90058",
    address: "2500 Harbor Ave", phone: "(213) 555-0400",
    lat: 34.0522, lon: -118.2437,
    hours: "Mon–Fri 6am–7pm · Sat 7am–5pm",
    services: ["Will Call", "Bulk Freight", "Forklift Loading", "Port Pickup"],
  },
  {
    id: 5, name: "Northeast Hub", city: "Philadelphia", state: "PA", zip: "19112",
    address: "750 Warehouse Row", phone: "(215) 555-0500",
    lat: 39.9526, lon: -75.1652,
    hours: "Mon–Fri 7am–6pm · Sat 8am–4pm",
    services: ["Will Call", "Bulk Freight", "Forklift Loading", "Returns"],
  },
  {
    id: 6, name: "Southwest Hub", city: "Phoenix", state: "AZ", zip: "85043",
    address: "1800 Desert Industrial Dr", phone: "(602) 555-0600",
    lat: 33.4484, lon: -112.0740,
    hours: "Mon–Fri 7am–6pm · Sat 8am–2pm",
    services: ["Will Call", "Bulk Freight", "Forklift Loading"],
  },
];

// ── Shipping Estimates by State ─────────────────────────────────────────────
// Based on proximity to nearest distribution center
const SHIPPING_DAYS: Record<string, [number, number]> = {
  // Southeast — Atlanta hub
  GA: [1,2], FL: [1,2], SC: [1,2], NC: [2,3], TN: [1,2], AL: [1,2], MS: [2,3],
  // Midwest — Chicago hub
  IL: [1,2], IN: [1,2], OH: [1,2], MI: [1,2], WI: [1,2], MN: [2,3], IA: [2,3], MO: [2,3],
  // South Central — Dallas hub
  TX: [1,2], OK: [1,2], AR: [1,2], LA: [1,2], KS: [2,3], NE: [2,3],
  // West Coast — LA hub
  CA: [1,2], NV: [2,3], AZ: [1,2], OR: [2,3], WA: [2,3], HI: [3,5],
  // Northeast — Philadelphia hub
  PA: [1,2], NY: [1,2], NJ: [1,2], CT: [1,2], MA: [1,2], MD: [1,2],
  DC: [1,2], VA: [1,2], DE: [1,2], RI: [1,2], NH: [2,3], VT: [2,3], ME: [2,3],
  WV: [2,3],
  // Mountain / remote
  CO: [2,3], UT: [2,3], ID: [3,4], MT: [3,5], WY: [3,5], ND: [3,5], SD: [3,5],
  NM: [2,3], AK: [4,7],
};

export function getShippingEstimate(stateCode: string): { min: number; max: number; label: string } {
  const [min, max] = SHIPPING_DAYS[stateCode.toUpperCase()] ?? [3, 5];
  const label = min === max ? `${min} business days` : `${min}–${max} business days`;
  return { min, max, label };
}

// ── Haversine distance (km) ─────────────────────────────────────────────────
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getNearestCenter(lat: number, lon: number): DistributionCenter {
  return DISTRIBUTION_CENTERS.reduce((nearest, center) => {
    const d = distanceKm(lat, lon, center.lat, center.lon);
    const dNearest = distanceKm(lat, lon, nearest.lat, nearest.lon);
    return d < dNearest ? center : nearest;
  });
}
