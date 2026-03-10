import { DISTRIBUTION_CENTERS } from "@/lib/geo";
import { LocationsClient } from "./locations-client";

export const metadata = {
  title: "Distribution Centers | BuildSupply",
  description: "Find the nearest BuildSupply distribution center for will-call pickup, bulk freight, and same-day metro delivery.",
};

export default function LocationsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>

      {/* Hero */}
      <div style={{ background: "#0f172a", padding: "56px 24px 48px", textAlign: "center" }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#f97316", margin: "0 0 12px" }}>
          Nationwide Coverage
        </p>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: "#fff", margin: "0 0 12px" }}>
          Distribution Centers
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 16, margin: "0 auto", maxWidth: 480 }}>
          {DISTRIBUTION_CENTERS.length} hubs across the US. Will-call pickup, bulk freight,
          and fast delivery to your job site.
        </p>
      </div>

      {/* Stats bar */}
      <div style={{ background: "#f97316" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px 24px", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 12 }}>
          {[
            { value: "6",      label: "Distribution Hubs" },
            { value: "48",     label: "States Served" },
            { value: "1–2",    label: "Day Delivery (Most US)" },
            { value: "527+",   label: "Products In Stock" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center", color: "#fff" }}>
              <p style={{ fontSize: 28, fontWeight: 900, margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.85, margin: "4px 0 0" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Map + Cards */}
      <LocationsClient centers={DISTRIBUTION_CENTERS} />

    </div>
  );
}
