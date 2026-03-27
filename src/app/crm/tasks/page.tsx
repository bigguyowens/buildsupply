import { getCRMTasks, getAccountManagers } from "@/app/actions/crm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TasksClient } from "./tasks-client";

export default async function CRMTasksPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [tasks, accountManagers] = await Promise.all([
    getCRMTasks(),
    getAccountManagers(),
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
      sessionId={session.id}
      isAdmin={session.role === "admin"}
    />
  );
}
