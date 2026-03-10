"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProductImage } from "@/components/product-image";
import { submitReturn } from "@/app/actions/returns";

const RETURN_REASONS = [
  "Wrong item received",
  "Item damaged or defective",
  "Item not as described",
  "Changed my mind",
  "Ordered by mistake",
  "Better price found elsewhere",
  "Missing parts or accessories",
  "Other",
];

type OrderItem = { id: string; name: string; image: string; price: number; quantity: number; brand: string; sku: string; slug: string };

type Props = { orderId: number; items: OrderItem[] };

export function ReturnRequestForm({ orderId, items }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"items" | "reason" | "confirm" | "done">("items");
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [itemReasons, setItemReasons] = useState<Record<string, string>>({});
  const [overallReason, setOverallReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const selectedCount = Object.values(selectedItems).filter(q => q > 0).length;
  const refundEstimate = items
    .filter(i => selectedItems[i.id] > 0)
    .reduce((s, i) => s + i.price * (selectedItems[i.id] || 0), 0);

  function toggleItem(id: string, maxQty: number) {
    setSelectedItems(prev => ({
      ...prev,
      [id]: prev[id] > 0 ? 0 : maxQty,
    }));
  }

  function setQty(id: string, qty: number, maxQty: number) {
    setSelectedItems(prev => ({ ...prev, [id]: Math.min(Math.max(0, qty), maxQty) }));
  }

  async function handleSubmit() {
    if (!overallReason) { setError("Please select a return reason."); return; }
    const returnItems = items
      .filter(i => selectedItems[i.id] > 0)
      .map(i => ({
        product_id: i.id, name: i.name, sku: i.sku, image: i.image,
        price: i.price, quantity: selectedItems[i.id], reason: itemReasons[i.id] || undefined,
      }));
    if (!returnItems.length) { setError("Please select at least one item."); return; }

    startTransition(async () => {
      const res = await submitReturn({ orderId, reason: overallReason, notes: notes || undefined, items: returnItems });
      if (res.error) { setError(res.error); return; }
      setStep("done");
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ padding: "9px 20px", borderRadius: 7, border: "1px solid #e2e8f0", background: "white", fontSize: 13, fontWeight: 700, color: "#374151", cursor: "pointer" }}
      >
        ↩ Request Return
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 400 }} />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "5vh", left: "50%", transform: "translateX(-50%)",
        width: "min(640px, 96vw)", maxHeight: "88vh", background: "white",
        borderRadius: 14, zIndex: 401, display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,0.25)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ color: "white", fontSize: 17, fontWeight: 900, margin: 0 }}>Request a Return</h2>
            <p style={{ color: "#64748b", fontSize: 12, margin: "3px 0 0" }}>Order #{orderId}</p>
          </div>
          <button onClick={() => setOpen(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 7, width: 32, height: 32, cursor: "pointer", color: "white", fontSize: 18 }}>✕</button>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0" }}>
          {[["items", "1. Select Items"], ["reason", "2. Reason"], ["confirm", "3. Confirm"]].map(([s, label]) => {
            const steps = ["items", "reason", "confirm"];
            const active = step === s;
            const done = step === "done" || steps.indexOf(step) > steps.indexOf(s as string);
            return (
              <div key={s} style={{ flex: 1, padding: "10px 0", textAlign: "center", fontSize: 12, fontWeight: 700,
                color: active ? "#f97316" : done ? "#22c55e" : "#94a3b8",
                borderBottom: active ? "2px solid #f97316" : "2px solid transparent",
              }}>
                {done && step !== "done" ? "✓ " : ""}{label}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {error && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 7, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 16 }}>{error}</div>}

          {/* ── Step 1: Item selection ── */}
          {step === "items" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 4px" }}>Select the items you want to return and the quantity.</p>
              {items.map(item => {
                const checked = (selectedItems[item.id] || 0) > 0;
                return (
                  <div key={item.id} onClick={() => toggleItem(item.id, item.quantity)} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 8,
                    border: `1px solid ${checked ? "#f97316" : "#e2e8f0"}`,
                    background: checked ? "#fff7ed" : "white", cursor: "pointer",
                    boxShadow: checked ? "0 0 0 2px rgba(249,115,22,0.15)" : "none",
                    transition: "all 0.15s",
                  }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${checked ? "#f97316" : "#d1d5db"}`, background: checked ? "#f97316" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {checked && <span style={{ color: "white", fontSize: 13, fontWeight: 900 }}>✓</span>}
                    </div>
                    <div style={{ position: "relative", width: 48, height: 48, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "#f8fafc" }}>
                      <ProductImage src={item.image} alt={item.name} fill style={{ objectFit: "contain" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 13, margin: 0, color: "#0f172a" }}>{item.name}</p>
                      <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>SKU: {item.sku} · {fmt(item.price)} each</p>
                    </div>
                    {checked && (
                      <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <button onClick={() => setQty(item.id, (selectedItems[item.id] || 1) - 1, item.quantity)}
                          style={{ width: 26, height: 26, borderRadius: 5, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontWeight: 700 }}>−</button>
                        <span style={{ fontWeight: 700, fontSize: 14, minWidth: 20, textAlign: "center" }}>{selectedItems[item.id]}</span>
                        <button onClick={() => setQty(item.id, (selectedItems[item.id] || 1) + 1, item.quantity)}
                          style={{ width: 26, height: 26, borderRadius: 5, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontWeight: 700 }}>+</button>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>of {item.quantity}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Step 2: Reason ── */}
          {step === "reason" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: 10 }}>
                  Primary return reason *
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {RETURN_REASONS.map(r => (
                    <button key={r} type="button" onClick={() => setOverallReason(r)} style={{
                      padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      border: `1px solid ${overallReason === r ? "#f97316" : "#e2e8f0"}`,
                      background: overallReason === r ? "rgba(249,115,22,0.08)" : "white",
                      color: overallReason === r ? "#f97316" : "#374151", transition: "all 0.15s",
                    }}>{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: 6 }}>
                  Additional notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Describe the issue in more detail..."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 13, resize: "vertical", boxSizing: "border-box", color: "#0f172a", outline: "none" }}
                />
              </div>
            </div>
          )}

          {/* ── Step 3: Confirm ── */}
          {step === "confirm" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", margin: "0 0 10px" }}>Items to Return</p>
                {items.filter(i => (selectedItems[i.id] || 0) > 0).map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: "1px solid #e2e8f0" }}>
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>{item.name} <span style={{ color: "#94a3b8", fontWeight: 400 }}>×{selectedItems[item.id]}</span></span>
                    <span style={{ fontWeight: 700 }}>{fmt(item.price * selectedItems[item.id])}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, marginTop: 10, color: "#0f172a" }}>
                  <span>Estimated Refund</span>
                  <span style={{ color: "#f97316" }}>{fmt(refundEstimate)}</span>
                </div>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", margin: "0 0 6px" }}>Reason</p>
                <p style={{ fontSize: 13, color: "#0f172a", margin: 0 }}>{overallReason}</p>
                {notes && <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0", fontStyle: "italic" }}>{notes}</p>}
              </div>
              <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "#854d0e" }}>
                ⓘ Refunds are processed within 3–5 business days once your return is received and inspected.
              </div>
            </div>
          )}

          {/* ── Done ── */}
          {step === "done" && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", margin: "0 0 8px" }}>Return Requested!</h3>
              <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px" }}>
                We&apos;ve received your request. Our team will review it and get back to you within 1–2 business days.
              </p>
              <button onClick={() => { setOpen(false); router.refresh(); }} style={{ background: "#f97316", border: "none", borderRadius: 8, padding: "11px 28px", fontSize: 14, fontWeight: 700, color: "white", cursor: "pointer" }}>
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer nav */}
        {step !== "done" && (
          <div style={{ padding: "14px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              {step === "items" && selectedCount > 0 && <span><strong style={{ color: "#0f172a" }}>{selectedCount}</strong> item{selectedCount !== 1 ? "s" : ""} · Est. refund: <strong style={{ color: "#f97316" }}>{fmt(refundEstimate)}</strong></span>}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {step !== "items" && (
                <button onClick={() => { setError(""); setStep(step === "confirm" ? "reason" : "items"); }}
                  style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 7, padding: "9px 18px", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
                  Back
                </button>
              )}
              {step === "items" && (
                <button disabled={selectedCount === 0} onClick={() => { setError(""); setStep("reason"); }}
                  style={{ background: selectedCount > 0 ? "#f97316" : "#e2e8f0", border: "none", borderRadius: 7, padding: "9px 22px", fontSize: 13, fontWeight: 700, color: selectedCount > 0 ? "white" : "#94a3b8", cursor: selectedCount > 0 ? "pointer" : "not-allowed" }}>
                  Next: Reason →
                </button>
              )}
              {step === "reason" && (
                <button disabled={!overallReason} onClick={() => { setError(""); setStep("confirm"); }}
                  style={{ background: overallReason ? "#f97316" : "#e2e8f0", border: "none", borderRadius: 7, padding: "9px 22px", fontSize: 13, fontWeight: 700, color: overallReason ? "white" : "#94a3b8", cursor: overallReason ? "pointer" : "not-allowed" }}>
                  Review Return →
                </button>
              )}
              {step === "confirm" && (
                <button onClick={handleSubmit} disabled={isPending}
                  style={{ background: isPending ? "#94a3b8" : "#f97316", border: "none", borderRadius: 7, padding: "9px 22px", fontSize: 13, fontWeight: 700, color: "white", cursor: isPending ? "not-allowed" : "pointer" }}>
                  {isPending ? "Submitting…" : "Submit Return Request"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
