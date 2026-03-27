"use client";

import { useState, useTransition } from "react";
import { updateOnboardingStep } from "@/app/actions/crm";
import type { OnboardingStatus } from "@/app/actions/crm";

const STATUS_META = {
  pending:     { label: "Pending",     color: "#d1d5db", bg: "#f9fafb",  icon: "○" },
  in_progress: { label: "In Progress", color: "#f97316", bg: "#fff7ed",  icon: "◑" },
  complete:    { label: "Complete",    color: "#22c55e", bg: "#f0fdf4",  icon: "✓" },
  skipped:     { label: "Skipped",     color: "#9ca3af", bg: "#f1f5f9",  icon: "—" },
};

export function OnboardingTracker({
  entityType, entityId, initialData,
}: {
  entityType: "customer" | "company";
  entityId: number;
  initialData: OnboardingStatus;
}) {
  const [data, setData] = useState(initialData);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [, startT] = useTransition();

  const { steps, percent, complete, total, required_complete, required_total } = data;

  function update(progressId: number, status: OnboardingStatus["steps"][0]["status"]) {
    const note = notes[progressId] ?? undefined;
    startT(async () => {
      await updateOnboardingStep(progressId, status, note);
      setData(prev => ({
        ...prev,
        steps: prev.steps.map(s =>
          s.id === progressId
            ? { ...s, status, note: note ?? s.note, completed_at: status === "complete" ? new Date().toISOString() : null }
            : s
        ),
        complete: prev.steps.filter(s =>
          s.id === progressId ? status === "complete" : s.status === "complete"
        ).length,
        percent: Math.round(
          prev.steps.filter(s =>
            s.id === progressId ? status === "complete" : s.status === "complete"
          ).length / prev.total * 100
        ),
      }));
      setExpandedId(null);
    });
  }

  const progressColor = percent >= 80 ? "#22c55e" : percent >= 40 ? "#f97316" : "#ef4444";

  return (
    <div>
      {/* Progress bar header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div>
            <span style={{ fontSize: 24, fontWeight: 900, color: progressColor }}>{percent}%</span>
            <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 6 }}>
              {complete}/{total} steps · {required_complete}/{required_total} required
            </span>
          </div>
          {percent === 100 && (
            <span style={{ fontSize: 12, fontWeight: 800, color: "#22c55e",
              background: "#f0fdf4", padding: "3px 10px", borderRadius: 999 }}>
              🎉 Onboarding Complete
            </span>
          )}
        </div>
        <div style={{ height: 6, background: "#f1f1f1", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${percent}%`, background: progressColor,
            borderRadius: 3, transition: "width 0.5s ease" }} />
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {steps.map((step, i) => {
          const meta = STATUS_META[step.status];
          const isExpanded = expandedId === step.id;
          const isComplete = step.status === "complete";

          return (
            <div key={step.id}
              style={{ border: `1px solid ${isExpanded ? "#f5c700" : "#e5e5e5"}`,
                borderRadius: 8, overflow: "hidden",
                background: isComplete ? "#f0fdf4" : "#fff" }}>

              {/* Step header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                cursor: "pointer" }}
                onClick={() => setExpandedId(isExpanded ? null : step.id)}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: meta.bg, border: `2px solid ${meta.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 800, color: meta.color }}>
                  {meta.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: isComplete ? 600 : 700,
                      color: isComplete ? "#6b7280" : "#0d0d0d",
                      textDecoration: isComplete ? "line-through" : "none" }}>
                      {step.title}
                    </span>
                    {!step.required && (
                      <span style={{ fontSize: 10, color: "#9ca3af", fontStyle: "italic" }}>optional</span>
                    )}
                  </div>
                  {step.completed_at && (
                    <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>
                      {step.completed_by_name ? `${step.completed_by_name} · ` : ""}
                      {new Date(step.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  )}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                  background: meta.bg, color: meta.color, flexShrink: 0 }}>
                  {meta.label}
                </span>
                <span style={{ fontSize: 10, color: "#9ca3af", flexShrink: 0 }}>
                  {isExpanded ? "▲" : "▼"}
                </span>
              </div>

              {/* Expanded panel */}
              {isExpanded && (
                <div style={{ padding: "0 12px 12px", borderTop: "1px solid #f5f5f5" }}>
                  {step.description && (
                    <p style={{ fontSize: 12, color: "#6b7280", margin: "8px 0", lineHeight: 1.5 }}>
                      {step.description}
                    </p>
                  )}
                  <textarea
                    value={notes[step.id] ?? step.note ?? ""}
                    onChange={e => setNotes(n => ({ ...n, [step.id]: e.target.value }))}
                    placeholder="Add a note..."
                    rows={2}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: 6, fontSize: 12,
                      border: "1px solid #e5e5e5", outline: "none", resize: "none",
                      fontFamily: "inherit", boxSizing: "border-box" as const, marginBottom: 8 }}
                  />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {step.status !== "complete" && (
                      <button onClick={() => update(step.id, "complete")}
                        style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 6,
                          padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        ✓ Mark Complete
                      </button>
                    )}
                    {step.status !== "in_progress" && step.status !== "complete" && (
                      <button onClick={() => update(step.id, "in_progress")}
                        style={{ background: "#fff7ed", color: "#f97316", border: "1px solid #fed7aa",
                          borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        ◑ In Progress
                      </button>
                    )}
                    {step.status === "complete" && (
                      <button onClick={() => update(step.id, "pending")}
                        style={{ background: "#f9fafb", color: "#6b7280", border: "1px solid #e5e5e5",
                          borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        ↩ Reopen
                      </button>
                    )}
                    {step.status !== "skipped" && !step.required && (
                      <button onClick={() => update(step.id, "skipped")}
                        style={{ background: "transparent", color: "#9ca3af", border: "none",
                          padding: "6px 8px", fontSize: 12, cursor: "pointer" }}>
                        Skip
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
