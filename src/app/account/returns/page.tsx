import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getMyReturns } from "@/app/actions/returns";
import type { ReturnStatus } from "@/app/actions/returns";

const STATUS_META: Record<ReturnStatus, { label: string; bg: string; color: string }> = {
  requested: { label: "Requested", bg: "#dbeafe", color: "#1e40af" },
  approved:  { label: "Approved",  bg: "#ede9fe", color: "#5b21b6" },
  received:  { label: "Received",  bg: "#fef9c3", color: "#854d0e" },
  refunded:  { label: "Refunded",  bg: "#dcfce7", color: "#15803d" },
  rejected:  { label: "Rejected",  bg: "#fee2e2", color: "#991b1b" },
};

const fmt = (n: number | null) => n != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n) : null;

export default async function ReturnsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const returns = await getMyReturns();

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)" }}>
      <div style={{ background: "var(--color-primary)", borderBottom: "3px solid var(--color-accent)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 16px", display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/account" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 13 }}>← Account</Link>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
          <h1 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: 0 }}>My Returns</h1>
        </div>
      </div>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 16px" }}>
        {returns.length === 0 ? (
          <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", padding: "64px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No returns yet</p>
            <p style={{ color: "var(--color-muted)", marginBottom: 20 }}>
              You can request a return from any completed or shipped order.
            </p>
            <Link href="/account/orders" style={{ padding: "9px 20px", borderRadius: 6, background: "var(--color-accent)", color: "white", textDecoration: "none", fontWeight: 700 }}>
              View Orders
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {returns.map(ret => {
              const meta = STATUS_META[ret.status as ReturnStatus] ?? STATUS_META.requested;
              return (
                <div key={ret.id} style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>Return #{ret.id}</span>
                      <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </div>
                    <p style={{ color: "var(--color-muted)", fontSize: 13, margin: 0 }}>
                      Order #{ret.order_id} · {ret.reason} ·{" "}
                      {new Date(ret.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {ret.refund_amount != null && (
                      <p style={{ fontWeight: 700, fontSize: 15, margin: 0, color: "#15803d" }}>
                        {fmt(ret.refund_amount)} refund
                      </p>
                    )}
                    <Link href={`/account/orders/${ret.order_id}`} style={{ fontSize: 12, color: "var(--color-accent)", fontWeight: 600, textDecoration: "none" }}>
                      View Order →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
