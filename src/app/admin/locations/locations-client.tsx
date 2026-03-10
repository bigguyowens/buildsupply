"use client";

import { useState, useTransition } from "react";
import type { LocationRow } from "@/app/actions/locations";
import {
  createLocation, updateLocation, deleteLocation, toggleLocationActive,
} from "@/app/actions/locations";

const SERVICES_OPTIONS = [
  "Will Call", "Bulk Freight", "Forklift Loading",
  "Returns", "Same-Day Metro", "Port Pickup", "Overnight",
];

const BLANK: Omit<LocationRow, "id" | "created_at" | "updated_at"> = {
  name: "", city: "", state: "", zip: "", address: "",
  phone: "", lat: 0, lon: 0, hours: "", services: [], active: true, sort_order: 0,
};

type DrawerMode = "create" | "edit";

interface DrawerProps {
  mode: DrawerMode;
  form: typeof BLANK;
  saving: boolean;
  onChange: (k: string, v: unknown) => void;
  onSave: () => void;
  onClose: () => void;
  onDelete?: () => void;
}

function Field({ label, name, value, onChange, type = "text", placeholder = "" }: {
  label: string; name: string; value: string | number;
  onChange: (k: string, v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ad-muted)", marginBottom: 5 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(name, e.target.value)}
        style={{
          width: "100%", padding: "8px 12px", borderRadius: 6, fontSize: 13, boxSizing: "border-box",
          border: "1px solid var(--ad-border)", background: "var(--ad-surface)", color: "var(--ad-text)", outline: "none",
        }}
      />
    </div>
  );
}

function Drawer({ mode, form, saving, onChange, onSave, onClose, onDelete }: DrawerProps) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40 }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 480,
        background: "var(--ad-surface)", zIndex: 50, display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--ad-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--ad-text)" }}>
            {mode === "create" ? "New Distribution Center" : "Edit Distribution Center"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--ad-muted)", lineHeight: 1 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Hub Name" name="name" value={form.name} onChange={onChange} placeholder="Southeast Hub" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="City" name="city" value={form.city} onChange={onChange} placeholder="Atlanta" />
            <Field label="State" name="state" value={form.state} onChange={onChange} placeholder="GA" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="ZIP Code" name="zip" value={form.zip} onChange={onChange} placeholder="30301" />
            <Field label="Phone" name="phone" value={form.phone} onChange={onChange} placeholder="(404) 555-0100" />
          </div>

          <Field label="Street Address" name="address" value={form.address} onChange={onChange} placeholder="1200 Industrial Pkwy NW" />
          <Field label="Hours" name="hours" value={form.hours} onChange={onChange} placeholder="Mon–Fri 7am–6pm · Sat 8am–4pm" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Latitude" name="lat" type="number" value={form.lat} onChange={onChange} placeholder="33.7490" />
            <Field label="Longitude" name="lon" type="number" value={form.lon} onChange={onChange} placeholder="-84.3880" />
          </div>
          <p style={{ fontSize: 11, color: "var(--ad-muted)", margin: "-8px 0 0", fontStyle: "italic" }}>
            Tip: Copy coords from Google Maps (right-click → copy coordinates)
          </p>

          {/* Services checkboxes */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ad-muted)", marginBottom: 8 }}>
              Services
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SERVICES_OPTIONS.map(s => {
                const checked = form.services.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      const next = checked ? form.services.filter(x => x !== s) : [...form.services, s];
                      onChange("services", next);
                    }}
                    style={{
                      padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      border: `1px solid ${checked ? "#f97316" : "var(--ad-border)"}`,
                      background: checked ? "rgba(249,115,22,0.1)" : "var(--ad-surface2)",
                      color: checked ? "#f97316" : "var(--ad-muted)",
                      transition: "all 0.15s",
                    }}
                  >
                    {checked ? "✓ " : ""}{s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active + Sort */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ad-muted)", marginBottom: 8 }}>
                Status
              </label>
              <button
                type="button"
                onClick={() => onChange("active", !form.active)}
                style={{
                  padding: "7px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  border: `1px solid ${form.active ? "#bbf7d0" : "var(--ad-border)"}`,
                  background: form.active ? "#dcfce7" : "var(--ad-surface2)",
                  color: form.active ? "#15803d" : "var(--ad-muted)",
                }}
              >
                {form.active ? "● Active" : "○ Inactive"}
              </button>
            </div>
            <Field label="Sort Order" name="sort_order" type="number" value={form.sort_order} onChange={onChange} placeholder="0" />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--ad-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {mode === "edit" && onDelete ? (
            <button onClick={onDelete} style={{ background: "none", border: "1px solid #fca5a5", borderRadius: 6, padding: "8px 14px", fontSize: 12, fontWeight: 700, color: "#dc2626", cursor: "pointer" }}>
              Delete
            </button>
          ) : <div />}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ background: "var(--ad-surface2)", border: "1px solid var(--ad-border)", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "var(--ad-muted)", cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={onSave} disabled={saving} style={{ background: "#f97316", border: "none", borderRadius: 6, padding: "8px 20px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : mode === "create" ? "Create" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function AdminLocationsClient({ initialLocations }: { initialLocations: LocationRow[] }) {
  const [locations, setLocations] = useState<LocationRow[]>(initialLocations);
  const [drawer, setDrawer] = useState<{ open: boolean; mode: DrawerMode; row: LocationRow | null }>({
    open: false, mode: "create", row: null,
  });
  const [form, setForm] = useState<typeof BLANK>({ ...BLANK });
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  function openCreate() {
    setForm({ ...BLANK, sort_order: locations.length });
    setDrawer({ open: true, mode: "create", row: null });
  }

  function openEdit(row: LocationRow) {
    setForm({
      name: row.name, city: row.city, state: row.state, zip: row.zip,
      address: row.address, phone: row.phone, lat: row.lat, lon: row.lon,
      hours: row.hours, services: row.services, active: row.active, sort_order: row.sort_order,
    });
    setDrawer({ open: true, mode: "edit", row });
  }

  function closeDrawer() {
    setDrawer(d => ({ ...d, open: false }));
    setDeleteConfirm(null);
  }

  function handleChange(k: string, v: unknown) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (drawer.mode === "create") {
        await createLocation(form);
      } else if (drawer.row) {
        await updateLocation(drawer.row.id, form);
      }
      // Refresh list
      const updated = await import("@/app/actions/locations").then(m => m.getLocations());
      setLocations(updated);
      closeDrawer();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!drawer.row) return;
    setSaving(true);
    try {
      await deleteLocation(drawer.row.id);
      setLocations(l => l.filter(x => x.id !== drawer.row!.id));
      closeDrawer();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: number, active: boolean) {
    startTransition(async () => {
      await toggleLocationActive(id, active);
      setLocations(l => l.map(x => x.id === id ? { ...x, active } : x));
    });
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "var(--ad-text)" }}>Distribution Centers</h1>
          <p style={{ fontSize: 13, color: "var(--ad-muted)", margin: "4px 0 0" }}>
            {locations.length} location{locations.length !== 1 ? "s" : ""} · Manage warehouse and fulfillment hubs
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{ background: "#f97316", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}
        >
          + Add Location
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "var(--ad-surface)", border: "1px solid var(--ad-border)", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--ad-surface2)", borderBottom: "1px solid var(--ad-border)" }}>
              {["Hub Name", "Location", "Phone", "Hours", "Services", "Status", ""].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ad-muted)", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {locations.map((loc, i) => (
              <tr
                key={loc.id}
                style={{ borderBottom: i < locations.length - 1 ? "1px solid var(--ad-border)" : "none", transition: "background 0.1s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--ad-surface2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}
              >
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ad-text)" }}>{loc.name}</div>
                  <div style={{ fontSize: 11, color: "var(--ad-muted)", marginTop: 2 }}>#{loc.sort_order} · {loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}</div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 13, color: "var(--ad-text)" }}>{loc.city}, {loc.state} {loc.zip}</div>
                  <div style={{ fontSize: 11, color: "var(--ad-muted)", marginTop: 2 }}>{loc.address}</div>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--ad-text2)", whiteSpace: "nowrap" }}>{loc.phone}</td>
                <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--ad-muted)", maxWidth: 180 }}>{loc.hours}</td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {loc.services.slice(0, 3).map(s => (
                      <span key={s} style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: "var(--ad-surface2)", border: "1px solid var(--ad-border)", color: "var(--ad-muted)" }}>{s}</span>
                    ))}
                    {loc.services.length > 3 && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: "var(--ad-surface2)", border: "1px solid var(--ad-border)", color: "var(--ad-muted)" }}>+{loc.services.length - 3}</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <button
                    onClick={() => handleToggle(loc.id, !loc.active)}
                    style={{
                      fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 5, cursor: "pointer", border: "none",
                      background: loc.active ? "#dcfce7" : "#fee2e2",
                      color: loc.active ? "#15803d" : "#dc2626",
                    }}
                  >
                    {loc.active ? "● Active" : "○ Inactive"}
                  </button>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <button
                    onClick={() => openEdit(loc)}
                    style={{ background: "var(--ad-surface2)", border: "1px solid var(--ad-border)", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "var(--ad-text2)", cursor: "pointer" }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {drawer.open && (
        <Drawer
          mode={drawer.mode}
          form={form}
          saving={saving}
          onChange={handleChange}
          onSave={handleSave}
          onClose={closeDrawer}
          onDelete={drawer.mode === "edit" ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
