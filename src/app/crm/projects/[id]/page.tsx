import { getProject } from "@/app/actions/projects";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ProjectDetailClient } from "./project-detail-client";
import { getCRMTasks } from "@/app/actions/crm";
import { query } from "@/lib/db";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");
  if (!["admin","account_manager","manager"].includes(session.role)) redirect("/account");

  const project = await getProject(Number(id));
  if (!project) notFound();

  // Load available items for linking (scoped to the entity)
  const [availableQuotes, availableOrders, availableTasks] = await Promise.all([
    // Quotes for this entity's customer(s)
    project.entity_type === "customer"
      ? query<{id:number;status:string;total_quoted:number}>(`
          SELECT q.id, q.status,
                 COALESCE(SUM(qi.quantity*qi.quoted_price),0)::numeric AS total_quoted
          FROM quotes q
          LEFT JOIN quote_items qi ON qi.quote_id = q.id
          WHERE q.customer_id = ${project.entity_id} AND q.status != 'draft'
            AND q.id NOT IN (SELECT quote_id FROM project_quotes WHERE project_id = ${project.id})
          GROUP BY q.id ORDER BY q.created_at DESC
        `)
      : query<{id:number;status:string;total_quoted:number}>(`
          SELECT q.id, q.status,
                 COALESCE(SUM(qi.quantity*qi.quoted_price),0)::numeric AS total_quoted
          FROM quotes q
          JOIN users u ON u.id = q.customer_id
          LEFT JOIN quote_items qi ON qi.quote_id = q.id
          WHERE u.company_id = ${project.entity_id} AND q.status != 'draft'
            AND q.id NOT IN (SELECT quote_id FROM project_quotes WHERE project_id = ${project.id})
          GROUP BY q.id ORDER BY q.created_at DESC
        `),

    // Orders for this entity
    project.entity_type === "customer"
      ? query<{id:number;status:string;total:number}>(`
          SELECT id, status, total::numeric AS total
          FROM orders WHERE user_id = ${project.entity_id}
            AND id NOT IN (SELECT order_id FROM project_orders WHERE project_id = ${project.id})
          ORDER BY created_at DESC LIMIT 30
        `)
      : query<{id:number;status:string;total:number}>(`
          SELECT o.id, o.status, o.total::numeric AS total
          FROM orders o JOIN users u ON u.id = o.user_id
          WHERE u.company_id = ${project.entity_id}
            AND o.id NOT IN (SELECT order_id FROM project_orders WHERE project_id = ${project.id})
          ORDER BY o.created_at DESC LIMIT 30
        `),

    // Tasks linked to entity
    query<{id:number;title:string;status:string}>(`
      SELECT id, title, status FROM crm_tasks
      WHERE entity_type = '${project.entity_type}' AND entity_id = ${project.entity_id}
        AND status != 'complete'
        AND id NOT IN (SELECT task_id FROM project_tasks WHERE project_id = ${project.id})
      ORDER BY due_date ASC NULLS LAST LIMIT 30
    `),
  ]);

  return (
    <ProjectDetailClient
      project={project}
      sessionId={session.id}
      sessionRole={session.role}
      availableQuotes={availableQuotes}
      availableOrders={availableOrders}
      availableTasks={availableTasks}
    />
  );
}
