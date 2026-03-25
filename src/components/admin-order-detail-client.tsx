'use client';

import { useState, useTransition } from "react";
import Image from "next/image";
import { updateOrderStatusAction } from "@/app/actions/admin";
import { OrderStatusTimeline } from "@/components/order-status-timeline";

const STATUSES = ["pending", "processing", "shipped", "completed", "cancelled"];
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:    { bg: "#fef9c3", color: "#854d0e" },
  processing: { bg: "#dbeafe", color: "#1e40af" },
  shipped:    { bg: "#ede9fe", color: "#5b21b6" },
  completed:  { bg: "#dcfce7", color: "#15803d" },
  cancelled:  { bg: "#fee2e2", color: "#991b1b" },
};

type OrderItem = { name: string; sku: string; image: string; price: number; quantity: number; brand: string; };
type Shipping = { firstName: string; lastName: string; email: string; phone: string; address: string; city: string; state: string; zip: string; country: string; };

export function AdminOrderDetailClient({ order }: { order: any }) {
  const [status, setStatus] = useState<string>(order.status);
  const [statusHistory, setStatusHistory] = useState<{ status: string; timestamp: string }[]>(
    Array.isArray(order.status_history) ? order.status_history : []
  );
  const [pending, startTransition] = useTransition();
  const style = STATUS_COLORS[status] ?? STATUS_COLORS.pending;

  const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
  const shipping: Shipping = order.shipping ?? {};
  const subtotal = items.reduce((s: number, i: OrderItem) => s + i.price * i.quantity, 0);
  const shippingCost = subtotal >= 500 ? 0 : 29.99;
  const tax = subtotal * 0.07;

  function handleStatus(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    const newEvent = { status: next, timestamp: new Date().toISOString() };
    setStatus(next);
    setStatusHistory(prev => [...prev, newEvent]);
    startTransition(() => updateOrderStatusAction(order.id, next));
  }

  const field = (label: string, value: string) => (
    <div style={{ padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8", margin: "0 0 3px" }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{value || "—"}</p>
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
      {/* Left */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Status control */}
        <div style={{ background: "white", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", margin: "0 0 4px" }}>Order Status</p>
            <span style={{ padding: "4px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 700, textTransform: "uppercase", background: style.bg, color: style.color }}>
              {status}
            </span>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", margin: "0 0 4px" }}>Change Status</p>
            <select value={status} onChange={handleStatus} disabled={pending} style={{
              padding: "7px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, background: "white", cursor: "pointer", outline: "none"
            }}>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", margin: "0 0 4px" }}>Placed</p>
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
              {new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ background: "white", borderRadius: 10, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8", margin: "0 0 20px" }}>Order Timeline</p>
          <OrderStatusTimeline status={status} statusHistory={statusHistory} compact />
        </div>

        {/* Line items */}
        <div style={{ background: "white", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Items ({items.length})</h2>
          </div>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "14px 20px", borderBottom: "1px solid #f8fafc" }}>
              <div style={{ position: "relative", width: 56, height: 56, borderRadius: 6, overflow: "hidden", border: "1px solid #e2e8f0", flexShrink: 0 }}>
                <Image src={item.image} alt={item.name} fill style={{ objectFit: "cover" }} sizes="56px" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 2px" }}>{item.name}</p>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{item.brand} · SKU: {item.sku}</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>${(item.price * item.quantity).toFixed(2)}</p>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>${item.price.toFixed(2)} × {item.quantity}</p>
              </div>
            </div>
          ))}
          {/* Totals */}
          <div style={{ padding: "14px 20px", background: "#f8fafc" }}>
            {[["Subtotal", subtotal], ["Shipping", shippingCost], ["Tax (7%)", tax]].map(([label, val]) => (
              <div key={label as string} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b", marginBottom: 6 }}>
                <span>{label as string}</span><span>${(val as number).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 15, borderTop: "1px solid #e2e8f0", paddingTop: 10, marginTop: 4 }}>
              <span>Total</span><span>${Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Customer */}
        <div style={{ background: "white", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>Customer</h2>
          {order.first_name ? (
            <>
              {field("Name", `${order.first_name} ${order.last_name}`)}
              {field("Email", order.email)}
            </>
          ) : (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>Guest checkout</p>
          )}
        </div>

        {/* Shipping */}
        <div style={{ background: "white", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>Shipping Address</h2>
          {field("Contact", `${shipping.firstName} ${shipping.lastName}`)}
          {field("Email", shipping.email)}
          {field("Phone", shipping.phone)}
          {field("Address", `${shipping.address}, ${shipping.city}, ${shipping.state} ${shipping.zip}`)}
          {field("Country", shipping.country)}
        </div>
      </div>
    </div>
  );
}
