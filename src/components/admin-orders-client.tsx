'use client';

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateOrderStatusAction } from "@/app/actions/admin";

const STATUSES = ["pending", "processing", "shipped", "completed", "cancelled"];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:    { bg: "#fef9c3", color: "#854d0e" },
  processing: { bg: "#dbeafe", color: "#1e40af" },
  shipped:    { bg: "#ede9fe", color: "#5b21b6" },
  completed:  { bg: "#dcfce7", color: "#15803d" },
  cancelled:  { bg: "#fee2e2", color: "#991b1b" },
};

type OrderRow = {
  id: number; status: string; total: number; created_at: string;
  first_name: string | null; last_name: string | null; email: string | null;
  item_count: number;
};

function StatusSelect({ orderId, status }: { orderId: number; status: string }) {
  const [current, setCurrent] = useState(status);
  const [pending, startTransition] = useTransition();
  const style = STATUS_COLORS[current] ?? STATUS_COLORS.pending;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setCurrent(next);
    startTransition(() => updateOrderStatusAction(orderId, next));
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <select
        value={current}
        onChange={handleChange}
        disabled={pending}
        style={{
          padding: "3px 28px 3px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700,
          textTransform: "uppercase", border: "none", cursor: "pointer", appearance: "none",
          background: style.bg, color: style.color, opacity: pending ? 0.6 : 1,
        }}
      >
        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 8, color: style.color }}>▼</span>
    </div>
  );
}

export function AdminOrdersClient({ orders }: { orders: OrderRow[] }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = orders.filter(o => {
    const matchStatus = filter === "all" || o.status === filter;
    const matchSearch = !search || `${o.id} ${o.first_name} ${o.last_name} ${o.email}`.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div style={{ background: "white", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
      {/* Filters */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by order #, name, email..."
          style={{ padding: "7px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, width: 260, outline: "none" }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {["all", ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: "5px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
              background: filter === s ? "#0f172a" : "#f1f5f9",
              color: filter === s ? "white" : "#64748b",
            }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#94a3b8" }}>{filtered.length} order{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {["Order", "Customer", "Date", "Items", "Total", "Status", ""].map(h => (
              <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={7} style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8" }}>No orders found</td></tr>
          ) : filtered.map(o => (
            <tr key={o.id} style={{ borderTop: "1px solid #f1f5f9" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700 }}>#{o.id}</td>
              <td style={{ padding: "12px 16px" }}>
                {o.first_name ? (
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: "#0f172a" }}>{o.first_name} {o.last_name}</p>
                    <p style={{ margin: "1px 0 0", fontSize: 11, color: "#94a3b8" }}>{o.email}</p>
                  </div>
                ) : <span style={{ color: "#94a3b8" }}>Guest</span>}
              </td>
              <td style={{ padding: "12px 16px", color: "#64748b" }}>
                {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </td>
              <td style={{ padding: "12px 16px", color: "#64748b" }}>{o.item_count}</td>
              <td style={{ padding: "12px 16px", fontWeight: 700 }}>${Number(o.total).toFixed(2)}</td>
              <td style={{ padding: "12px 16px" }}><StatusSelect orderId={o.id} status={o.status} /></td>
              <td style={{ padding: "12px 16px" }}>
                <Link href={`/admin/orders/${o.id}`} style={{ color: "#f97316", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>View →</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
