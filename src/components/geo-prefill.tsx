"use client";

import { useEffect } from "react";

interface GeoPrefillProps {
  onGeoReady: (data: { city: string; region: string; zip: string; country: string; taxRate: number }) => void;
}

const CACHE_KEY = "bs_geo_prefill";

export function GeoPrefill({ onGeoReady }: GeoPrefillProps) {
  useEffect(() => {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try { onGeoReady(JSON.parse(cached)); return; } catch {}
    }

    fetch("/api/geo")
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.geo) {
          const result = {
            city:     data.geo.city,
            region:   data.geo.regionCode,
            zip:      data.geo.zip,
            country:  data.geo.country,
            taxRate:  data.taxRate,
          };
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(result));
          onGeoReady(result);
        }
      })
      .catch(() => {});
  }, [onGeoReady]);

  return null; // headless
}
