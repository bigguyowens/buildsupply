import { getCRMCustomer, getAccountManagers, getOnboarding, getCRMTasks } from "@/app/actions/crm";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { RoleManager, AMAssigner } from "./crm-customer-client";
import { CustomerTabView } from "./customer-tab-view";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default async function CRMCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, session, accountManagers, onboarding, tasks] = await Promise.all([
    getCRMCustomer(Number(id)),
    getSession(),
    getAccountManagers(),
    getOnboarding("customer", Number(id)),
    getCRMTasks({ entityType: "customer", entityId: Number(id) }),
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
            { label: "Orders",       value: orders.length },
            { label: "Total Spent",  value: fmt(totalSpent) },
            { label: "Quotes",       value: quotes.length },
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

      {/* Two-column: tabs + management sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>

        {/* Left: tabbed content */}
        <CustomerTabView
          customerId={customer.id}
          customerEmail={customer.email}
          customerName={fullName}
          orders={orders}
          quotes={quotes}
          notes={notes}
          activities={activities}
          contacts={contacts}
          onboarding={onboarding}
          tasks={tasks}
          taskAMs={accountManagers}
          sessionId={session?.id ?? 0}
          isAdmin={session?.role === "admin"}
        />

        {/* Right: persistent management panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <RoleManager
            customerId={customer.id}
            currentRole={customer.role}
            sessionRole={session?.role ?? "account_manager"}
          />
          <AMAssigner
            customerId={customer.id}
            currentAMId={(customer as any).account_manager_id ?? null}
            accountManagers={accountManagers}
          />
        </div>
      </div>
    </div>
  );
}
