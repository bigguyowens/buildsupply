import { getCRMCustomer, getAccountManagers, getOnboarding } from "@/app/actions/crm";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { NotesPanel, ActivityFeed, EmailSender, RoleManager, AMAssigner } from "./crm-customer-client";
import { OnboardingTracker } from "@/components/onboarding-tracker";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:    { bg: "#fef9c3", color: "#854d0e" },
  processing: { bg: "#dbeafe", color: "#1e40af" },
  shipped:    { bg: "#ede9fe", color: "#5b21b6" },
  completed:  { bg: "#dcfce7", color: "#15803d" },
  cancelled:  { bg: "#fee2e2", color: "#991b1b" },
  sent:       { bg: "#dbeafe", color: "#1e40af" },
  accepted:   { bg: "#dcfce7", color: "#15803d" },
  declined:   { bg: "#fee2e2", color: "#991b1b" },
};

export default async function CRMCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, session, accountManagers, onboarding] = await Promise.all([
    getCRMCustomer(Number(id)),
    getSession(),
    getAccountManagers(),
    getOnboarding("customer", Number(id)),
  ]);
  if (!data) notFound();

  const { customer, orders, quotes, notes, activities, contacts } = data;
  const totalSpent = orders.reduce((s, o) => s + Number(o.total), 0);
  const fullName = `${customer.first_name} ${customer.last_name}`;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13 }}>
        <Link href="/crm/customers" style={{ color: "#9ca3af", textDecoration: "none" }}>Customers</Link>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ color: "#0d0d0d", fontWeight: 700 }}>{fullName}</span>
      </div>

      {/* Customer header */}
      <div style={{ background: "#0d0d0d", borderRadius: 10, padding: "20px 24px",
        marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#f5c700",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 900, color: "#000", flexShrink: 0 }}>
            {customer.first_name[0]}{customer.last_name[0]}
          </div>
          <div>
            <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 900, margin: "0 0 2px",
              letterSpacing: "-0.02em" }}>{fullName}</h1>
            <p style={{ color: "#6b6b6b", fontSize: 13, margin: 0 }}>{customer.email}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[
            { label: "Orders",     value: orders.length },
            { label: "Total Spent",value: fmt(totalSpent) },
            { label: "Quotes",     value: quotes.length },
            { label: "Member Since", value: new Date(customer.created_at).getFullYear() },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <p style={{ color: "#f5c700", fontSize: 20, fontWeight: 900, margin: 0 }}>{s.value}</p>
              <p style={{ color: "#6b6b6b", fontSize: 11, margin: 0, textTransform: "uppercase",
                letterSpacing: "0.06em" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Three-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 320px", gap: 20, alignItems: "start" }}>

        {/* Col 1: Orders + Contact Forms */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Orders */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f1f1",
              display: "flex", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "#0d0d0d", margin: 0 }}>Orders ({orders.length})</h2>
              <Link href={`/admin/orders?customer=${customer.id}`}
                style={{ fontSize: 11, color: "#f5c700", textDecoration: "none", fontWeight: 700 }}>
                Admin View →
              </Link>
            </div>
            <div>
              {orders.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: 13, padding: "20px 18px" }}>No orders yet</p>
              ) : orders.slice(0, 8).map((o, i) => {
                const s = STATUS_COLORS[o.status] ?? STATUS_COLORS.pending;
                const items = Array.isArray(o.items) ? o.items : JSON.parse(o.items as unknown as string ?? "[]");
                return (
                  <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 18px", borderBottom: i < orders.length - 1 ? "1px solid #f9f9f9" : "none" }}>
                    <div>
                      <Link href={`/admin/orders/${o.id}`}
                        style={{ fontWeight: 700, fontSize: 13, color: "#0d0d0d", textDecoration: "none" }}>
                        #{o.id}
                      </Link>
                      <span style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 4,
                        fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: s.bg, color: s.color }}>
                        {o.status}
                      </span>
                      <p style={{ color: "#9ca3af", fontSize: 11, margin: "2px 0 0" }}>
                        {items.length} item{items.length !== 1 ? "s" : ""} ·{" "}
                        {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <span style={{ fontWeight: 800, color: "#22c55e", fontSize: 14 }}>{fmt(Number(o.total))}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact Forms */}
          {contacts.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f1f1" }}>
                <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "#0d0d0d", margin: 0 }}>Contact Forms ({contacts.length})</h2>
              </div>
              {contacts.map((c, i) => (
                <div key={c.id} style={{ padding: "12px 18px",
                  borderBottom: i < contacts.length - 1 ? "1px solid #f9f9f9" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#0d0d0d" }}>{c.reason ?? "General Inquiry"}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                      background: c.status === "new" ? "#fee2e2" : "#dcfce7",
                      color: c.status === "new" ? "#991b1b" : "#15803d" }}>
                      {c.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                    {c.message.slice(0, 100)}{c.message.length > 100 ? "…" : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Col 2: Quotes + Activity */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Quotes */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f1f1",
              display: "flex", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "#0d0d0d", margin: 0 }}>Quotes ({quotes.length})</h2>
              <Link href={`/admin/quotes?customer=${customer.id}`}
                style={{ fontSize: 11, color: "#f5c700", textDecoration: "none", fontWeight: 700 }}>
                Create Quote →
              </Link>
            </div>
            {quotes.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: 13, padding: "20px 18px" }}>No quotes yet</p>
            ) : quotes.map((q, i) => {
              const s = STATUS_COLORS[q.status] ?? STATUS_COLORS.pending;
              return (
                <div key={q.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 18px", borderBottom: i < quotes.length - 1 ? "1px solid #f9f9f9" : "none" }}>
                  <div>
                    <Link href={`/admin/quotes/${q.id}`}
                      style={{ fontWeight: 700, fontSize: 13, color: "#0d0d0d", textDecoration: "none" }}>
                      Quote #{q.id}
                    </Link>
                    <span style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 4,
                      fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: s.bg, color: s.color }}>
                      {q.status}
                    </span>
                    <p style={{ color: "#9ca3af", fontSize: 11, margin: "2px 0 0" }}>
                      {new Date(q.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <span style={{ fontWeight: 800, color: "#f5c700", fontSize: 14 }}>{fmt(Number(q.total_quoted))}</span>
                </div>
              );
            })}
          </div>

          {/* Activity timeline */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f1f1" }}>
              <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "#0d0d0d", margin: 0 }}>Activity Timeline</h2>
            </div>
            <div style={{ padding: "16px 18px" }}>
              <ActivityFeed activities={activities} />
            </div>
          </div>
        </div>

        {/* Col 3: Role + Email + Notes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Role manager */}
          <RoleManager
            customerId={customer.id}
            currentRole={customer.role}
            sessionRole={session?.role ?? "account_manager"}
          />
          {/* AM assigner */}
          <AMAssigner
            customerId={customer.id}
            currentAMId={(customer as any).account_manager_id ?? null}
            accountManagers={accountManagers}
          />

          {/* Onboarding tracker */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "#0d0d0d",
              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "#f5c700", margin: 0 }}>Onboarding</h2>
              <span style={{ fontSize: 11, color: "#6b6b6b", fontWeight: 600 }}>
                {onboarding.complete}/{onboarding.total} steps
              </span>
            </div>
            <div style={{ padding: 14 }}>
              <OnboardingTracker
                entityType="customer"
                entityId={customer.id}
                initialData={onboarding}
              />
            </div>
          </div>
          {/* Email sender */}
          <EmailSender customerId={customer.id} customerEmail={customer.email} customerName={fullName} />

          {/* Notes */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f1f1",
              background: "#0d0d0d" }}>
              <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "#f5c700", margin: 0 }}>Notes & Logs</h2>
            </div>
            <div style={{ padding: 16 }}>
              <NotesPanel customerId={customer.id} initialNotes={notes} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
