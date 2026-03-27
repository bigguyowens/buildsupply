import { getCRMTasks, getAccountManagers } from "@/app/actions/crm";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import { TasksClient } from "./tasks-client";

export default async function CRMTasksPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.role === "admin";

  const [tasks, accountManagers, customers, companies] = await Promise.all([
    getCRMTasks(),
    getAccountManagers(),
    // AMs only see their assigned customers; admins see all
    query<{ id: number; first_name: string; last_name: string; email: string }>(
      isAdmin
        ? `SELECT id, first_name, last_name, email FROM users
           WHERE role NOT IN ('admin','account_manager')
           ORDER BY first_name, last_name`
        : `SELECT id, first_name, last_name, email FROM users
           WHERE role NOT IN ('admin','account_manager') AND account_manager_id = $1
           ORDER BY first_name, last_name`,
      isAdmin ? [] : [session.id]
    ),
    query<{ id: number; name: string }>(
      isAdmin
        ? `SELECT id, name FROM companies ORDER BY name`
        : `SELECT id, name FROM companies WHERE account_manager_id = $1 ORDER BY name`,
      isAdmin ? [] : [session.id]
    ),
  ]);

  const today = new Date().toISOString().split("T")[0];

  const overdue   = tasks.filter(t => t.status !== "complete" && t.due_date && t.due_date < today);
  const dueToday  = tasks.filter(t => t.status !== "complete" && t.due_date === today);
  const upcoming  = tasks.filter(t => t.status !== "complete" && (!t.due_date || t.due_date > today));
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
      sessionId={session.id}
      isAdmin={isAdmin}
    />
  );
}
