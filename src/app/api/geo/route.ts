import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { getTaxRate, getShippingEstimate, type GeoData } from "@/lib/geo";

const GEO_API = "http://ip-api.com/json";

// Simple in-memory cache — avoids hammering ip-api.com (45 req/min free tier)
const cache = new Map<string, { data: GeoData; ts: number }>();
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 min

export async function GET(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? null;

  // Return graceful fallback for local dev
  const isLocal = !ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.");
  if (isLocal) {
    return NextResponse.json({ ok: false, local: true, message: "Local environment — geo unavailable" });
  }

  const cached = cache.get(ip);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return buildResponse(cached.data);
  }

  try {
    const res  = await fetch(`${GEO_API}/${ip}?fields=status,city,regionName,region,country,countryCode,zip,lat,lon`);
    const json = await res.json();

    if (json.status !== "success") {
      return NextResponse.json({ ok: false, message: "Geo lookup failed" });
    }

    const geo: GeoData = {
      city:        json.city        ?? "",
      region:      json.regionName  ?? "",
      regionCode:  json.region      ?? "",
      country:     json.country     ?? "",
      countryCode: json.countryCode ?? "",
      zip:         json.zip         ?? "",
      lat:         json.lat         ?? 0,
      lon:         json.lon         ?? 0,
    };

    cache.set(ip, { data: geo, ts: Date.now() });
    persistGeoToUser(geo).catch(() => {}); // fire-and-forget

    return buildResponse(geo);
  } catch {
    return NextResponse.json({ ok: false, message: "Geo service unavailable" });
  }
}

function buildResponse(geo: GeoData) {
  return NextResponse.json({
    ok:       true,
    geo,
    taxRate:  getTaxRate(geo.regionCode),
    shipping: getShippingEstimate(geo.regionCode),
  });
}

async function persistGeoToUser(geo: GeoData) {
  const session = await getSession();
  if (!session) return;
  await query(
    `UPDATE users SET
       geo_city = $1, geo_region = $2, geo_region_code = $3,
       geo_country = $4, geo_zip = $5, geo_lat = $6, geo_lon = $7,
       geo_updated_at = NOW()
     WHERE id = $8`,
    [geo.city, geo.region, geo.regionCode, geo.country, geo.zip, geo.lat, geo.lon, session.id]
  );
}
