import { getCRMCompanies } from "@/app/actions/crm";
import Link from "next/link";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export default async function CRMCompaniesPage() {
  const companies = await getCRMCompanies();
  const totalRevenue = companies.reduce((s, c) => s + Number(c.total_spent), 0);
  const totalEmployees = companies.reduce((s, c) => s + c.employee_count, 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "var(--crm-text)", letterSpacing: "-0.03em" }}>
          Companies
        </h1>
        <p style={{ color: "var(--crm-muted)", fontSize: 14, margin: "4px 0 0" }}>
          {companies.length} companies · {totalEmployees} employees · {fmt(totalRevenue)} total revenue
        </p>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Companies",      value: companies.length,                                     color: "#f5c700" },
          { label: "Total Employees",value: totalEmployees,                                        color: "#3b82f6" },
          { label: "Total Revenue",  value: fmt(totalRevenue),                                     color: "#22c55e" },
          { label: "Open Quotes",    value: companies.reduce((s,c) => s + c.open_quotes, 0),       color: "#f97316" },
        ].map(k => (
          <div key={k.label} style={{ background: "var(--crm-surface)", borderRadius: 10, padding: "16px 20px",
            border: "1px solid var(--crm-border)", borderTop: `3px solid ${k.color}` }}>
            <p style={{ fontSize: 22, fontWeight: 900, color: "var(--crm-text)", margin: "0 0 4px" }}>{k.value}</p>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "var(--crm-muted2)", margin: 0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Companies table */}
      <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#0d0d0d" }}>
              {["Company", "Industry", "Employees", "Revenue", "Open Quotes", "Account Manager", ""].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 10,
                  fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#f5c700" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--crm-border2)",
                background: i % 2 === 0 ? "var(--crm-surface)" : "var(--crm-surface2)" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 6, background: "#0d0d0d",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 900, color: "#f5c700", flexShrink: 0 }}>
                      {c.name[0]}
                    </div>
                    <div>
                      <Link href={`/crm/companies/${c.id}`} style={{ fontWeight: 700, color: "var(--crm-text)",
                        textDecoration: "none", fontSize: 13 }}>{c.name}</Link>
                      {c.domain && <p style={{ fontSize: 11, color: "var(--crm-muted2)", margin: 0 }}>{c.domain}</p>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", color: "var(--crm-muted)", fontSize: 12 }}>{c.industry ?? "—"}</td>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--crm-text)" }}>{c.employee_count}</td>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: "#22c55e" }}>{fmt(Number(c.total_spent))}</td>
                <td style={{ padding: "12px 16px" }}>
                  {c.open_quotes > 0 ? (
                    <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 11,
                      fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                      {c.open_quotes} open
                    </span>
                  ) : <span style={{ color: "#d1d5db" }}>—</span>}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  {c.account_manager_name ? (
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--crm-text2)",
                      background: "#fef9c3", padding: "2px 8px", borderRadius: 4 }}>
                      {c.account_manager_name}
                    </span>
                  ) : <span style={{ color: "#d1d5db", fontSize: 12 }}>Unassigned</span>}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <Link href={`/crm/companies/${c.id}`} style={{ fontSize: 12, color: "#f5c700",
                    fontWeight: 700, textDecoration: "none" }}>View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
