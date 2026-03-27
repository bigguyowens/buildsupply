"use client";

import { useState } from "react";
import { TaskCard, NewTaskModal, TYPE_META, PRIORITY_META } from "@/app/crm/tasks/tasks-client";
import type { CRMTask } from "@/app/actions/crm";

type AM = { id: number; first_name: string; last_name: string; email: string };

export function CustomerTasksPanel({ tasks: initialTasks, entityType, entityId, entityName, accountManagers, sessionId, isAdmin }: {
  tasks: CRMTask[];
  entityType: "customer" | "company";
  entityId: number;
  entityName: string;
  accountManagers: AM[];
  sessionId: number;
  isAdmin: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const pending   = initialTasks.filter(t => t.status !== "complete");
  const completed = initialTasks.filter(t => t.status === "complete");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.08em", color: "#9ca3af", margin: 0 }}>
          {pending.length} active · {completed.length} completed
        </p>
        <button onClick={() => setShowForm(true)} style={{
          background: "#0d0d0d", color: "#f5c700", border: "none",
          borderRadius: 6, padding: "6px 14px", fontWeight: 700,
          fontSize: 12, cursor: "pointer",
        }}>+ Task</button>
      </div>

      {initialTasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af" }}>
          <p style={{ fontSize: 24, margin: "0 0 8px" }}>📋</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: "0 0 4px" }}>No tasks yet</p>
          <p style={{ fontSize: 13, margin: 0 }}>Create a follow-up, call, or check-in</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pending.map(t => (
            <TaskCard key={t.id} task={t} accountManagers={accountManagers} isAdmin={isAdmin} />
          ))}
          {completed.length > 0 && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #f1f1f1" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af",
                textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
                Completed ({completed.length})
              </p>
              {completed.map(t => (
                <TaskCard key={t.id} task={t} accountManagers={accountManagers} isAdmin={isAdmin} />
              ))}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <NewTaskModal
          accountManagers={accountManagers}
          sessionId={sessionId}
          isAdmin={isAdmin}
          onClose={() => setShowForm(false)}
          entityType={entityType}
          entityId={entityId}
          entityName={entityName}
        />
      )}
    </div>
  );
}
