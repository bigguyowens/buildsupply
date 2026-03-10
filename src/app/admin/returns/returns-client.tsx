"use client";

import { useState, useTransition } from "react";
import type { ReturnRow, ReturnStatus } from "@/app/actions/returns";
import { getAdminReturn, updateReturnStatus } from "@/app/actions/returns";
import { ProductImage } from "@/components/product-image";

const STATUS_META: Record<ReturnStatus, { label: string; bg: string; color: string }> = {
  requested: { label: "Requested", bg: "#dbeafe", color: "#1e40af" },
  approved:  { label: "Approved",  bg: "#ede9fe", color: "#5b21b6" },
  received:  { label: "Received",  bg: "#fef9c3", color: "#854d0e" },
  refunded:  { label: "Refunded",  bg: "#dcfce7", color: "#15803d" },
  rejected:  { label: "Rejected",  bg: "#fee2e2", color: "#991b1b" },
};

const PIPELINE: ReturnStatus[] = ["requested", "approved", "received", "refunded"];

const fmt = (n: number | null | undefined) =>
  n != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n) : "—";

type FullReturn = ReturnRow & { first_name: string; last_name: string; email: string; order_total: number };

export function AdminReturnsClient({ initialReturns }: { initialReturns: (ReturnRow & { first_name: string; last_name: string; email: string; item_count: number })[] }) {
  const [returns, setReturns] = useState(initialReturns);
  const [filter, setFilter] = useState<ReturnStatus | "all">("all");
  const [drawer, setDrawer] = useState<FullReturn | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = filter === "all" ? returns : returns.filter(r => r.status === filter);

  async function openDrawer(id: number) {
    const full = await getAdminReturn(id) as FullReturn | null;
    if (!full) return;
    setAdminNotes(full.admin_notes ?? "");
    setRefundAmount(full.refund_amount != null ? String(full.refund_amount) : "");
    setDrawer(full);
  }

  function handleUpdateStatus(status: ReturnStatus) {
    if (!drawer) return;
    startTransition(async () => {
      await updateReturnStatus(drawer.id, status, adminNotes || undefined, refundAmount ? Number(refundAmount) : undefined);
      setDrawer(d => d ? { ...d, status, admin_notes: adminNotes || d.admin_notes, refund_amount: refundAmount ? Number(refundAmount) : d.refund_amount } : null);
      setReturns(rs => rs.map(r => r.id === drawer.id ? { ...r, status } : r));
    });
  }

  const counts = Object.fromEntries(
    (["all", "requested", "approved", "received", "refunded", "rejected"] as const).map(s => [
      s, s === "all" ? returns.length : returns.filter(r => r.status === s).length
    ])
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "var(--ad-text)" }}>Returns</h1>
          <p style={{ fontSize: 13, color: "var(--ad-muted)", margin: "4px 0 0" }}>{returns.length} total return requests</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {(["all", "requested", "approved", "received", "refunded", "rejected"] as const).map(s => {
          const meta = s !== "all" ? STATUS_META[s] : null;
          const active = filter === s;
          return (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer",
              border: `1px solid ${active ? (meta?.color ?? "#f97316") : "var(--ad-border)"}`,
              background: active ? (meta?.bg ?? "rgba(249,115,22,0.1)") : "var(--ad-surface2)",
              color: active ? (meta?.color ?? "#f97316") : "var(--ad-muted)",
            }}>
              {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: "var(--ad-surface)", border: "1px solid var(--ad-border)", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--ad-surface2)", borderBottom: "1px solid var(--ad-border)" }}>
              {["Return #", "Customer", "Order", "Items", "Reason", "Status", "Date", ""].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ad-muted)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: "48px 24px", textAlign: "center", color: "var(--ad-muted)", fontSize: 14 }}>No returns found</td></tr>
            ) : filtered.map((r, i) => {
              const meta = STATUS_META[r.status as ReturnStatus] ?? STATUS_META.requested;
              return (
                <tr key={r.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--ad-border)" : "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--ad-surface2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}>
                  <td style={{ padding: "13px 16px", fontWeight: 700, fontSize: 13, color: "var(--ad-text)" }}>#{r.id}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--ad-text)" }}>{r.first_name} {r.last_name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--ad-muted)" }}>{r.email}</p>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: "var(--ad-text2)" }}>#{r.order_id}</td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: "var(--ad-text2)" }}>{(r as typeof r & { item_count: number }).item_count} item{(r as typeof r & { item_count: number }).item_count !== 1 ? "s" : ""}</td>
                  <td style={{ padding: "13px 16px", fontSize: 12, color: "var(--ad-muted)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.reason}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: meta.bg, color: meta.color }}>{meta.label}</span>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 12, color: "var(--ad-muted)", whiteSpace: "nowrap" }}>
                    {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <button onClick={() => openDrawer(r.id)} style={{ background: "var(--ad-surface2)", border: "1px solid var(--ad-border)", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "var(--ad-text2)", cursor: "pointer" }}>
                      Review
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {drawer && (
        <>
          <div onClick={() => setDrawer(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40 }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "var(--ad-surface)", zIndex: 50, display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.15)" }}>
            {/* Drawer header */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--ad-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--ad-text)" }}>Return #{drawer.id}</h2>
                <p style={{ fontSize: 12, color: "var(--ad-muted)", margin: "3px 0 0" }}>Order #{drawer.order_id} · {drawer.first_name} {drawer.last_name}</p>
              </div>
              <button onClick={() => setDrawer(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--ad-muted)" }}>✕</button>
            </div>

            {/* Drawer body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Pipeline */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ad-muted)", margin: "0 0 10px" }}>Status Pipeline</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {PIPELINE.map(s => {
                    const meta = STATUS_META[s];
                    const isCurrent = drawer.status === s;
                    const isRejected = drawer.status === "rejected";
                    return (
                      <button key={s} onClick={() => handleUpdateStatus(s)}
                        disabled={isPending || drawer.status === s || isRejected}
                        style={{
                          padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: isCurrent || isRejected ? "default" : "pointer",
                          border: `1px solid ${isCurrent ? meta.color : "var(--ad-border)"}`,
                          background: isCurrent ? meta.bg : "var(--ad-surface2)",
                          color: isCurrent ? meta.color : "var(--ad-muted)",
                          opacity: isPending ? 0.6 : 1,
                        }}>
                        {isCurrent ? "● " : ""}{meta.label}
                      </button>
                    );
                  })}
                  <button onClick={() => handleUpdateStatus("rejected")}
                    disabled={isPending || drawer.status === "rejected" || drawer.status === "refunded"}
                    style={{
                      padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                      cursor: drawer.status === "rejected" || drawer.status === "refunded" ? "default" : "pointer",
                      border: `1px solid ${drawer.status === "rejected" ? STATUS_META.rejected.color : "var(--ad-border)"}`,
                      background: drawer.status === "rejected" ? STATUS_META.rejected.bg : "var(--ad-surface2)",
                      color: drawer.status === "rejected" ? STATUS_META.rejected.color : "var(--ad-muted)",
                      opacity: isPending ? 0.6 : 1,
                    }}>
                    {drawer.status === "rejected" ? "● " : ""}Rejected
                  </button>
                </div>
              </div>

              {/* Customer & reason */}
              <div style={{ background: "var(--ad-surface2)", borderRadius: 8, border: "1px solid var(--ad-border)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ad-muted)", fontWeight: 600 }}>Customer</span>
                  <span style={{ color: "var(--ad-text)", fontWeight: 700 }}>{drawer.first_name} {drawer.last_name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ad-muted)", fontWeight: 600 }}>Email</span>
                  <span style={{ color: "var(--ad-text2)" }}>{drawer.email}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ad-muted)", fontWeight: 600 }}>Order Total</span>
                  <span style={{ color: "var(--ad-text)", fontWeight: 700 }}>{fmt(drawer.order_total)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ad-muted)", fontWeight: 600 }}>Reason</span>
                  <span style={{ color: "var(--ad-text2)", textAlign: "right", maxWidth: "60%" }}>{drawer.reason}</span>
                </div>
                {drawer.notes && (
                  <div style={{ borderTop: "1px solid var(--ad-border)", paddingTop: 8, fontSize: 12, color: "var(--ad-muted)", fontStyle: "italic" }}>{drawer.notes}</div>
                )}
              </div>

              {/* Return items */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ad-muted)", margin: "0 0 10px" }}>Items</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(drawer.items ?? []).map(item => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--ad-surface2)", borderRadius: 8, border: "1px solid var(--ad-border)", padding: "10px 12px" }}>
                      {item.image && (
                        <div style={{ position: "relative", width: 44, height: 44, borderRadius: 6, overflow: "hidden", background: "var(--ad-bg)", flexShrink: 0 }}>
                          <ProductImage src={item.image} alt={item.name} fill style={{ objectFit: "contain" }} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: "var(--ad-text)" }}>{item.name}</p>
                        <p style={{ fontSize: 11, color: "var(--ad-muted)", margin: "2px 0 0" }}>SKU: {item.sku} · Qty: {item.quantity}</p>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ad-text)", flexShrink: 0 }}>{fmt(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refund amount */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ad-muted)", marginBottom: 6 }}>Refund Amount</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ad-muted)", fontWeight: 700 }}>$</span>
                    <input type="number" step="0.01" min="0" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} placeholder="0.00"
                      style={{ width: "100%", paddingLeft: 28, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 6, border: "1px solid var(--ad-border)", background: "var(--ad-surface)", color: "var(--ad-text)", fontSize: 14, fontWeight: 700, boxSizing: "border-box", outline: "none" }} />
                  </div>
                  <button onClick={() => setRefundAmount(String((drawer.items ?? []).reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)))}
                    style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid var(--ad-border)", background: "var(--ad-surface2)", color: "var(--ad-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                    Auto-fill
                  </button>
                </div>
              </div>

              {/* Admin notes */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ad-muted)", marginBottom: 6 }}>Admin Notes</label>
                <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3} placeholder="Internal notes visible only to admins..."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 7, border: "1px solid var(--ad-border)", background: "var(--ad-surface)", color: "var(--ad-text)", fontSize: 13, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
              </div>
            </div>

            {/* Drawer footer */}
            <div style={{ padding: "14px 24px", borderTop: "1px solid var(--ad-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--ad-muted)" }}>
                {drawer.refund_amount != null && <span>Refund: <strong style={{ color: "var(--ad-text)" }}>{fmt(drawer.refund_amount)}</strong></span>}
              </span>
              <button onClick={() => handleUpdateStatus(drawer.status)} disabled={isPending}
                style={{ background: "#f97316", border: "none", borderRadius: 7, padding: "9px 22px", fontSize: 13, fontWeight: 700, color: "white", cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.7 : 1 }}>
                {isPending ? "Saving…" : "Save Notes & Amount"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
