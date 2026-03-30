import { getAdminReturn } from "@/app/actions/returns";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const STATUS_META: Record<string, { bg: string; color: string; label: string }> = {
  requested: { bg: "#dbeafe", color: "#1e40af", label: "Requested" },
  approved:  { bg: "#ede9fe", color: "#5b21b6", label: "Approved"  },
  received:  { bg: "#fef3c7", color: "#92400e", label: "Received"  },
  refunded:  { bg: "#dcfce7", color: "#15803d", label: "Refunded"  },
  rejected:  { bg: "#fee2e2", color: "#991b1b", label: "Rejected"  },
};

export default async function CRMReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");
  if (!["admin","account_manager","manager"].includes(session.role)) redirect("/account");

  const data = await getAdminReturn(Number(id));
  if (!data) notFound();
  const ret   = data;
  const items = data.items ?? [];

  // AMs: only view returns for their customers
  if (session.role === "account_manager") {
    const { query } = await import("@/lib/db");
    const rows = await query<{ account_manager_id: number | null }>(
      `SELECT account_manager_id FROM users WHERE id = $1`, [ret.user_id]
    );
    if (rows[0]?.account_manager_id !== session.id) redirect("/crm/returns");
  }

  const statusMeta = STATUS_META[ret.status] ?? { bg: "#f1f5f9", color: "#475569", label: ret.status };
  const needsAction = ["requested", "approved"].includes(ret.status);

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13 }}>
        <Link href="/crm/returns" style={{ color: "var(--crm-muted2)", textDecoration: "none" }}>Returns</Link>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ color: "var(--crm-text)", fontWeight: 700 }}>Return #{ret.id}</span>
      </div>

      {/* Header */}
      <div style={{ background: "#0d0d0d", borderRadius: 10, padding: "18px 24px",
        marginBottom: 20, display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "var(--crm-surface)", fontSize: 22, fontWeight: 900, margin: "0 0 4px" }}>
            Return #{ret.id}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {ret.user_id && (
              <Link href={`/crm/customers/${ret.user_id}`}
                style={{ color: "#f5c700", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                {ret.first_name} {ret.last_name}
              </Link>
            )}
            <span style={{ color: "var(--crm-muted)", fontSize: 12 }}>{ret.email}</span>
            <span style={{ color: "var(--crm-muted)", fontSize: 12 }}>·</span>
            <Link href={`/crm/orders/${ret.order_id}`}
              style={{ color: "var(--crm-muted2)", fontSize: 12, textDecoration: "none" }}>
              Order #{ret.order_id} →
            </Link>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {needsAction && (
            <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px",
              borderRadius: 10, background: "#fef3c7", color: "#92400e",
              border: "1px solid #fde68a" }}>
              ⚠ Needs Action
            </span>
          )}
          <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12,
            fontWeight: 800, background: statusMeta.bg, color: statusMeta.color }}>
            {statusMeta.label}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>
        {/* Left: return items */}
        <div>
          <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)",
            overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--crm-border2)", background: "var(--crm-surface2)" }}>
              <h2 style={{ fontSize: 13, fontWeight: 800, margin: 0, color: "var(--crm-text)" }}>
                Return Items ({items.length})
              </h2>
            </div>
            {items.map((item, i) => (
              <div key={item.id} style={{ display: "flex", gap: 14, padding: "14px 18px",
                borderBottom: i < items.length - 1 ? "1px solid var(--crm-border2)" : "none",
                alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 6, background: "var(--crm-surface2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, flexShrink: 0 }}>↩️</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, color: "var(--crm-text)", margin: "0 0 2px" }}>
                    {item.name}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--crm-muted2)", margin: 0 }}>
                    SKU: {item.sku} · Qty: {item.quantity}
                    {item.reason && ` · "${item.reason}"`}
                  </p>
                </div>
                <span style={{ fontWeight: 800, color: "var(--crm-text)", fontSize: 13 }}>
                  {fmt(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Customer notes / reason */}
          {ret.notes && (
            <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)",
              padding: "16px 18px" }}>
              <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "var(--crm-muted2)", margin: "0 0 8px" }}>Customer Note</p>
              <p style={{ fontSize: 13, color: "var(--crm-text2)", margin: 0, lineHeight: 1.6 }}>{ret.notes}</p>
            </div>
          )}
        </div>

        {/* Right: summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Status & details */}
          <div style={{ background: "#0d0d0d", borderRadius: 10, padding: "18px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "var(--crm-muted)", margin: "0 0 14px" }}>Return Details</p>
            {[
              { label: "Return #",    value: `#${ret.id}` },
              { label: "Order #",     value: `#${ret.order_id}` },
              { label: "Reason",      value: ret.reason },
              { label: "Status",      value: statusMeta.label },
              { label: "Submitted",   value: new Date(ret.created_at).toLocaleDateString("en-US",
                  { month: "short", day: "numeric", year: "numeric" }) },
              ...(ret.refund_amount ? [{ label: "Refund",
                value: fmt(Number(ret.refund_amount)) }] : []),
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between",
                padding: "6px 0", fontSize: 12,
                borderBottom: "1px solid #1a1a1a" }}>
                <span style={{ color: "var(--crm-muted)" }}>{r.label}</span>
                <span style={{ fontWeight: 700, color: "#f5c700" }}>{r.value}</span>
              </div>
            ))}
          </div>

          {ret.admin_notes && (
            <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)",
              padding: "14px 16px" }}>
              <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "var(--crm-muted2)", margin: "0 0 8px" }}>Admin Notes</p>
              <p style={{ fontSize: 12, color: "var(--crm-text2)", margin: 0, lineHeight: 1.6 }}>
                {ret.admin_notes}
              </p>
            </div>
          )}

          {session.role === "admin" && (
            <Link href={`/admin/returns`}
              style={{ display: "block", textAlign: "center", padding: "10px 0",
                background: "#0d0d0d", color: "#f5c700", borderRadius: 8,
                fontSize: 13, fontWeight: 700, textDecoration: "none",
                border: "1px solid #1a1a1a" }}>
              Manage in Admin →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
