import { getCRMTasks, getTaskStaff } from "@/app/actions/crm";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import { TasksClient } from "./tasks-client";

export default async function CRMTasksPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin   = session.role === "admin";
  const isManager = session.role === "manager";
  const canFilter = isAdmin || isManager;

  const [tasks, accountManagers, customers, companies, staff] = await Promise.all([
    getCRMTasks(),
    // AMs for new task assignment dropdown
    query<{ id: number; first_name: string; last_name: string; email: string }>(
      `SELECT id, first_name, last_name, email FROM users
       WHERE role IN ('admin','manager','account_manager')
       ORDER BY first_name, last_name`
    ),
    // Customers scoped by role
    isAdmin
      ? query<{ id: number; first_name: string; last_name: string; email: string }>(
          `SELECT id, first_name, last_name, email FROM users
           WHERE role NOT IN ('admin','account_manager','manager')
           ORDER BY first_name, last_name`
        )
      : query<{ id: number; first_name: string; last_name: string; email: string }>(
          `SELECT id, first_name, last_name, email FROM users
           WHERE role NOT IN ('admin','account_manager','manager') AND account_manager_id = $1
           ORDER BY first_name, last_name`,
          [session.id]
        ),
    // Companies scoped by role
    isAdmin
      ? query<{ id: number; name: string }>(`SELECT id, name FROM companies ORDER BY name`)
      : query<{ id: number; name: string }>(
          `SELECT id, name FROM companies WHERE account_manager_id = $1 ORDER BY name`,
          [session.id]
        ),
    // Staff for filter bar (admin/manager only)
    canFilter ? getTaskStaff() : Promise.resolve<{ id: number; first_name: string; last_name: string; role: string }[]>([]),
  ]);

  const today = new Date().toISOString().split("T")[0];

  const overdue   = tasks.filter(t => t.status !== "complete" && t.due_date && new Date(t.due_date).toISOString().split("T")[0] < today);
  const dueToday  = tasks.filter(t => t.status !== "complete" && t.due_date && new Date(t.due_date).toISOString().split("T")[0] === today);
  const upcoming  = tasks.filter(t => t.status !== "complete" && (!t.due_date || new Date(t.due_date).toISOString().split("T")[0] > today));
  const completed = tasks.filter(t => t.status === "complete").slice(0, 10);

  return (
    <TasksClient
      overdue={overdue}
      dueToday={dueToday}
      upcoming={upcoming}
      completed={completed}
      accountManagers={accountManagers}
      customers={customers}
      companies={companies}
      staff={staff}
      sessionId={session.id}
      sessionRole={session.role}
      isAdmin={isAdmin}
    />
  );
}
