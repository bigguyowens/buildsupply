"use client";

import { useEffect, useState } from "react";

interface ShippingInfo {
  city:    string;
  region:  string;
  label:   string; // "2–4 business days"
}

// Cache in sessionStorage so we only hit the API once per tab
const CACHE_KEY = "bs_geo_shipping";

export function ShippingEstimate() {
  const [info, setInfo]       = useState<ShippingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try { setInfo(JSON.parse(cached)); setLoading(false); return; } catch {}
    }

    fetch("/api/geo")
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.geo) {
          const info: ShippingInfo = {
            city:   data.geo.city,
            region: data.geo.regionCode,
            label:  data.shipping.label,
          };
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(info));
          setInfo(info);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 13 }}>
        <span style={{ fontSize: 15 }}>📦</span>
        <span style={{ color: "#94a3b8" }}>Checking delivery estimate…</span>
      </div>
    );
  }

  if (!info) return null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 14px", borderRadius: 8,
      background: "#f0fdf4", border: "1px solid #bbf7d0",
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>🚚</span>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#15803d" }}>
          Ships to {info.city}, {info.region}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#166534" }}>
          Estimated delivery: <strong>{info.label}</strong>
        </p>
      </div>
    </div>
  );
}
