"use client";

import { useState, useTransition } from "react";
import { lookupGuestOrder, submitGuestReturn } from "@/app/actions/returns";
import { ProductImage } from "@/components/product-image";

const RETURN_REASONS = [
  "Wrong item received", "Item damaged or defective", "Item not as described",
  "Changed my mind", "Ordered by mistake", "Better price found elsewhere",
  "Missing parts or accessories", "Other",
];

type OrderItem = { id: string; name: string; image: string; price: number; quantity: number; sku: string };
type Step = "lookup" | "items" | "reason" | "confirm" | "done";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export function GuestReturnForm() {
  const [step, setStep] = useState<Step>("lookup");
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [confirmedOrderId, setConfirmedOrderId] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [overallReason, setOverallReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [returnId, setReturnId] = useState(0);
  const [isPending, startTransition] = useTransition();

  const selectedCount = Object.values(selectedItems).filter(q => q > 0).length;
  const refundEstimate = orderItems
    .filter(i => selectedItems[i.id] > 0)
    .reduce((s, i) => s + i.price * (selectedItems[i.id] || 0), 0);

  function handleLookup() {
    if (!orderId || !email) { setLookupError("Please enter your order number and email."); return; }
    setLookupError("");
    startTransition(async () => {
      const res = await lookupGuestOrder(Number(orderId), email);
      if ("error" in res) { setLookupError(res.error!); return; }
      setOrderItems(res.order!.items);
      setConfirmedOrderId(res.order!.id);
      setStep("items");
    });
  }

  function toggleItem(id: string, maxQty: number) {
    setSelectedItems(prev => ({ ...prev, [id]: prev[id] > 0 ? 0 : maxQty }));
  }

  function setQty(id: string, qty: number, maxQty: number) {
    setSelectedItems(prev => ({ ...prev, [id]: Math.min(Math.max(0, qty), maxQty) }));
  }

  async function handleSubmit() {
    if (!overallReason) { setSubmitError("Please select a return reason."); return; }
    const returnItems = orderItems
      .filter(i => selectedItems[i.id] > 0)
      .map(i => ({ product_id: i.id, name: i.name, sku: i.sku, image: i.image, price: i.price, quantity: selectedItems[i.id] }));
    if (!returnItems.length) { setSubmitError("Please select at least one item."); return; }

    startTransition(async () => {
      const res = await submitGuestReturn({ orderId: confirmedOrderId, email, reason: overallReason, notes: notes || undefined, items: returnItems });
      if ("error" in res) { setSubmitError(res.error!); return; }
      setReturnId(res.returnId!);
      setStep("done");
    });
  }

  const STEPS = ["lookup", "items", "reason", "confirm"];
  const stepLabels: Record<string, string> = { lookup: "Order Lookup", items: "Select Items", reason: "Reason", confirm: "Confirm" };

  return (
    <div style={{ background: "white", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", overflow: "hidden" }}>
      {/* Step indicator */}
      {step !== "done" && (
        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0" }}>
          {STEPS.map((s, idx) => {
            const activeIdx = STEPS.indexOf(step);
            const active = step === s;
            const done = activeIdx > idx;
            return (
              <div key={s} style={{
                flex: 1, padding: "12px 0", textAlign: "center", fontSize: 12, fontWeight: 700,
                color: active ? "#f97316" : done ? "#22c55e" : "#94a3b8",
                borderBottom: active ? "2px solid #f97316" : "2px solid transparent",
                background: active ? "#fff7ed" : "white",
              }}>
                {done ? "✓ " : `${idx + 1}. `}{stepLabels[s]}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ padding: "28px 32px" }}>

        {/* ── Step: Lookup ── */}
        {step === "lookup" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>Find your order</h2>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Enter the details from your order confirmation email.</p>
            </div>
            {lookupError && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 7, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>{lookupError}</div>}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: 6 }}>Order Number</label>
              <input value={orderId} onChange={e => setOrderId(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 1042" type="text" inputMode="numeric"
                onKeyDown={e => e.key === "Enter" && handleLookup()}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 15, fontWeight: 700, boxSizing: "border-box", outline: "none", color: "#0f172a" }} />
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0" }}>Found in your order confirmation email: "Order #1042"</p>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: 6 }}>Email Address</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                placeholder="email used at checkout" type="email"
                onKeyDown={e => e.key === "Enter" && handleLookup()}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box", outline: "none", color: "#0f172a" }} />
            </div>
            <button onClick={handleLookup} disabled={isPending}
              style={{ background: isPending ? "#94a3b8" : "#f97316", border: "none", borderRadius: 8, padding: "13px", fontSize: 14, fontWeight: 800, color: "white", cursor: isPending ? "not-allowed" : "pointer", width: "100%" }}>
              {isPending ? "Looking up order…" : "Find My Order →"}
            </button>
          </div>
        )}

        {/* ── Step: Select Items ── */}
        {step === "items" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ marginBottom: 4 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>Order #{confirmedOrderId}</h2>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Select the items you'd like to return and adjust the quantity.</p>
            </div>
            {orderItems.map(item => {
              const checked = (selectedItems[item.id] || 0) > 0;
              return (
                <div key={item.id} onClick={() => toggleItem(item.id, item.quantity)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 8,
                  border: `1px solid ${checked ? "#f97316" : "#e2e8f0"}`,
                  background: checked ? "#fff7ed" : "white", cursor: "pointer",
                  boxShadow: checked ? "0 0 0 2px rgba(249,115,22,0.15)" : "none", transition: "all 0.15s",
                }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${checked ? "#f97316" : "#d1d5db"}`, background: checked ? "#f97316" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {checked && <span style={{ color: "white", fontSize: 12, fontWeight: 900 }}>✓</span>}
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

        {/* ── Step: Reason ── */}
        {step === "reason" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: 10 }}>Primary return reason *</label>
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
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: 6 }}>Additional notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Describe the issue in more detail..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 13, resize: "vertical", boxSizing: "border-box", color: "#0f172a", outline: "none" }} />
            </div>
          </div>
        )}

        {/* ── Step: Confirm ── */}
        {step === "confirm" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {submitError && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 7, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>{submitError}</div>}
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", margin: "0 0 10px" }}>Items to Return</p>
              {orderItems.filter(i => (selectedItems[i.id] || 0) > 0).map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: "1px solid #e2e8f0" }}>
                  <span style={{ fontWeight: 600 }}>{item.name} <span style={{ color: "#94a3b8", fontWeight: 400 }}>×{selectedItems[item.id]}</span></span>
                  <span style={{ fontWeight: 700 }}>{fmt(item.price * selectedItems[item.id])}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, marginTop: 10, color: "#0f172a" }}>
                <span>Estimated Refund</span>
                <span style={{ color: "#f97316" }}>{fmt(refundEstimate)}</span>
              </div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0", fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: "#64748b" }}>Reason: </span>{overallReason}
              {notes && <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0", fontStyle: "italic" }}>{notes}</p>}
            </div>
            <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "#854d0e" }}>
              ⓘ A confirmation will be sent to <strong>{email}</strong>. Refunds are processed within 3–5 business days once your return is received and inspected.
            </div>
          </div>
        )}

        {/* ── Step: Done ── */}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: "0 0 8px" }}>Return Requested!</h2>
            <p style={{ fontSize: 15, color: "#64748b", margin: "0 0 6px" }}>Your return request <strong style={{ color: "#0f172a" }}>#{returnId}</strong> has been submitted.</p>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 28px" }}>Our team will review it and contact you at <strong>{email}</strong> within 1–2 business days.</p>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "16px 20px", display: "inline-block", marginBottom: 28, textAlign: "left" }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8", margin: "0 0 6px" }}>Your Return ID</p>
              <p style={{ fontSize: 28, fontWeight: 900, color: "#f97316", margin: 0, letterSpacing: "0.05em" }}>#{returnId}</p>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0" }}>Save this for your records</p>
            </div>
            <div>
              <a href="/" style={{ display: "inline-block", background: "#f97316", color: "white", borderRadius: 8, padding: "11px 28px", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                Back to Shop
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer nav */}
      {!["lookup", "done"].includes(step) && (
        <div style={{ padding: "14px 32px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            {step === "items" && selectedCount > 0 && <span><strong style={{ color: "#0f172a" }}>{selectedCount}</strong> item{selectedCount !== 1 ? "s" : ""} · Est. refund: <strong style={{ color: "#f97316" }}>{fmt(refundEstimate)}</strong></span>}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setSubmitError(""); setStep(step === "confirm" ? "reason" : step === "reason" ? "items" : "lookup"); }}
              style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 7, padding: "9px 18px", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
              Back
            </button>
            {step === "items" && (
              <button disabled={selectedCount === 0} onClick={() => setStep("reason")}
                style={{ background: selectedCount > 0 ? "#f97316" : "#e2e8f0", border: "none", borderRadius: 7, padding: "9px 22px", fontSize: 13, fontWeight: 700, color: selectedCount > 0 ? "white" : "#94a3b8", cursor: selectedCount > 0 ? "pointer" : "not-allowed" }}>
                Next: Reason →
              </button>
            )}
            {step === "reason" && (
              <button disabled={!overallReason} onClick={() => setStep("confirm")}
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
  );
}
