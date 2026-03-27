import { query } from "@/lib/db";
import { AdminCustomersClient } from "./admin-customers-client";

export default async function AdminCustomersPage() {
  const users = await query<{
    id: number; first_name: string; last_name: string; email: string;
    role: string; created_at: string;
    order_count: number; total_spent: number;
    geo_city: string | null; geo_region_code: string | null;
    company_name: string | null; assigned_customers: number;
  }>(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.created_at,
            COUNT(DISTINCT o.id)::int AS order_count,
            COALESCE(SUM(o.total),0) AS total_spent,
            u.geo_city, u.geo_region_code,
            c.name AS company_name,
            COUNT(DISTINCT a.id)::int AS assigned_customers
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id
     LEFT JOIN companies c ON c.id = u.company_id
     LEFT JOIN users a ON a.account_manager_id = u.id
     GROUP BY u.id, c.name
     ORDER BY u.role ASC, u.created_at DESC`
  );

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Users & Staff</h1>
        <p style={{ color: "var(--ad-muted)", fontSize: 14, margin: "4px 0 0" }}>
          {users.length} total users
        </p>
      </div>
      <AdminCustomersClient users={users} />
    </div>
  );
}
