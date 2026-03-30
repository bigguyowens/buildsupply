import { getProjects } from "@/app/actions/projects";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CRMScopeToggle } from "@/components/crm-scope-toggle";
import { ProjectsClient } from "./projects-client";

export default async function CRMProjectsPage({
  searchParams,
}: { searchParams: Promise<{ scope?: string; status?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!["admin","account_manager","manager"].includes(session.role)) redirect("/account");

  const { scope: scopeParam, status } = await searchParams;
  const scope = scopeParam === "all" ? "all" : "mine";

  const projects = await getProjects({ scope, status: (status ?? "all") as any });

  const statusCounts = projects.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <ProjectsClient
      projects={projects}
      statusCounts={statusCounts}
      sessionRole={session.role}
      sessionId={session.id}
      scope={scope}
      scopeToggle={<CRMScopeToggle sessionRole={session.role} currentScope={scope} />}
    />
  );
}
