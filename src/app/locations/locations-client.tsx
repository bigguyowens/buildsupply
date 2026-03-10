"use client";

import { useState, useEffect, useRef } from "react";
import type { DistributionCenter } from "@/lib/geo";
import { distanceKm } from "@/lib/geo";

interface Props { centers: DistributionCenter[]; }

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  return distanceKm(lat1, lon1, lat2, lon2);
}

function distMiles(km: number) { return (km * 0.621371).toFixed(0); }

export function LocationsClient({ centers }: Props) {
  const [selected, setSelected]     = useState<DistributionCenter>(centers[0]);
  const [userGeo, setUserGeo]       = useState<{ lat: number; lon: number; city: string; region: string } | null>(null);
  const [sorted, setSorted]         = useState<DistributionCenter[]>(centers);
  const mapRef                      = useRef<HTMLDivElement>(null);
  const leafletRef                  = useRef<{ map: unknown; markers: unknown[] } | null>(null);

  // Load user geo + sort centers by proximity
  useEffect(() => {
    fetch("/api/geo")
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.geo) {
          const { lat, lon, city, regionCode } = data.geo;
          setUserGeo({ lat, lon, city, region: regionCode });
          const withDist = centers
            .map(c => ({ ...c, _dist: haversineKm(lat, lon, c.lat, c.lon) }))
            .sort((a, b) => a._dist - b._dist);
          setSorted(withDist);
          setSelected(withDist[0]);
        }
      })
      .catch(() => {});
  }, [centers]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    // Dynamically load Leaflet CSS + JS from CDN
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = (window as unknown as { L: unknown }).L as {
        map: (...args: unknown[]) => unknown;
        tileLayer: (...args: unknown[]) => { addTo: (...args: unknown[]) => unknown };
        marker: (...args: unknown[]) => { addTo: (...args: unknown[]) => unknown; bindPopup: (...args: unknown[]) => unknown };
        latLng: (...args: unknown[]) => unknown;
      };

      const map = L.map(mapRef.current!, { scrollWheelZoom: false }) as {
        setView: (latlng: unknown, zoom: number) => void;
        fitBounds: (bounds: unknown, opts: unknown) => void;
      };
      (map as { setView: (v: [number, number], z: number) => void }).setView([39.5, -98.35], 4);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map as never);

      const markers = centers.map(c => {
        const marker = L.marker([c.lat, c.lon] as never).addTo(map as never);
        (marker as { bindPopup: (html: string) => void }).bindPopup(
          `<strong>${c.name}</strong><br/>${c.address}<br/>${c.city}, ${c.state} ${c.zip}<br/>${c.phone}`
        );
        return marker;
      });

      leafletRef.current = { map, markers };
    };
    document.head.appendChild(script);
  }, [centers]);

  // Pan map to selected center
  useEffect(() => {
    if (!leafletRef.current) return;
    const map = leafletRef.current.map as { setView: (v: [number, number], z: number, opts?: unknown) => void };
    map.setView([selected.lat, selected.lon], 8, { animate: true });
  }, [selected]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px 72px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24, alignItems: "start" }} className="locations-grid">

        {/* Left: location cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {userGeo && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: 13, color: "#1e40af", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              📍 Nearest to {userGeo.city}, {userGeo.region}
            </div>
          )}
          {sorted.map((c, i) => {
            const dist = userGeo ? haversineKm(userGeo.lat, userGeo.lon, c.lat, c.lon) : null;
            const isActive = selected.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                style={{
                  all: "unset", cursor: "pointer", display: "block",
                  background: isActive ? "#fff7ed" : "#fff",
                  border: `2px solid ${isActive ? "#f97316" : "#e2e8f0"}`,
                  borderRadius: 10, padding: "16px 18px",
                  textAlign: "left", transition: "all 0.15s",
                  boxShadow: isActive ? "0 2px 12px rgba(249,115,22,0.15)" : "0 1px 4px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    {i === 0 && userGeo && (
                      <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#f97316", display: "block", marginBottom: 3 }}>
                        ★ Nearest
                      </span>
                    )}
                    <p style={{ fontSize: 14, fontWeight: 800, margin: 0, color: "#0f172a" }}>{c.name}</p>
                    <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0", fontWeight: 500 }}>
                      {c.city}, {c.state}
                    </p>
                  </div>
                  {dist !== null && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? "#f97316" : "#94a3b8", flexShrink: 0, marginLeft: 8 }}>
                      {distMiles(dist)} mi
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px" }}>{c.address}</p>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 10px" }}>{c.hours}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {c.services.map(s => (
                    <span key={s} style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 7px", borderRadius: 4, background: isActive ? "rgba(249,115,22,0.1)" : "#f1f5f9", color: isActive ? "#c2410c" : "#64748b" }}>
                      {s}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: map + detail panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 24 }}>
          {/* Leaflet map */}
          <div
            ref={mapRef}
            style={{ width: "100%", height: 420, borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", background: "#f1f5f9" }}
          />

          {/* Selected center detail */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#f97316", margin: "0 0 4px" }}>Selected Location</p>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "#0f172a" }}>{selected.name}</h2>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selected.address}, ${selected.city}, ${selected.state} ${selected.zip}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, fontWeight: 700, color: "#f97316", textDecoration: "none", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "8px 14px", flexShrink: 0 }}
              >
                Get Directions ↗
              </a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { label: "Address",  value: `${selected.address}, ${selected.city}, ${selected.state} ${selected.zip}` },
                { label: "Phone",    value: selected.phone },
                { label: "Hours",    value: selected.hours },
                { label: "Services", value: selected.services.join(" · ") },
              ].map(r => (
                <div key={r.label}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94a3b8", margin: "0 0 4px" }}>{r.label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0, lineHeight: 1.5 }}>{r.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .locations-grid { grid-template-columns: 1fr !important; }
          .locations-grid > div:last-child { position: static !important; }
        }
      `}</style>
    </div>
  );
}
