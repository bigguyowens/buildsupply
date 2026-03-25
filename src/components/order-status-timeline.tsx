type StatusEvent = { status: string; timestamp: string };

type Step = {
  key: string;
  label: string;
  description: string;
  icon: string;
};

const STEPS: Step[] = [
  { key: "pending",    label: "Order Placed",   description: "We've received your order",         icon: "📋" },
  { key: "processing", label: "Processing",      description: "Your order is being prepared",      icon: "⚙️" },
  { key: "shipped",    label: "Shipped",         description: "Your order is on its way",          icon: "🚚" },
  { key: "completed",  label: "Delivered",       description: "Order delivered successfully",      icon: "✅" },
];

function fmt(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export function OrderStatusTimeline({
  status,
  statusHistory,
  compact = false,
}: {
  status: string;
  statusHistory: StatusEvent[];
  compact?: boolean;
}) {
  const isCancelled = status === "cancelled";
  const currentIdx  = STEPS.findIndex(s => s.key === status);

  // Build a map of status → timestamp from history (last occurrence wins)
  const tsMap: Record<string, string> = {};
  for (const e of statusHistory) tsMap[e.status] = e.timestamp;

  if (isCancelled) {
    const cancelledAt = tsMap["cancelled"];
    return (
      <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 10, padding: compact ? "14px 18px" : "20px 24px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
          ✕
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#991b1b" }}>Order Cancelled</p>
          {cancelledAt && <p style={{ margin: "3px 0 0", fontSize: 13, color: "#ef4444" }}>{fmt(cancelledAt)}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Connector track */}
      <div style={{
        position: "absolute",
        top: compact ? 16 : 20,
        left: compact ? "calc(12.5% + 16px)" : "calc(12.5% + 20px)",
        right: compact ? "calc(12.5% + 16px)" : "calc(12.5% + 20px)",
        height: 3,
        background: "#e2e8f0",
        zIndex: 0,
      }}>
        {/* Filled portion */}
        <div style={{
          height: "100%",
          background: "#f97316",
          borderRadius: 2,
          width: currentIdx <= 0 ? "0%" :
                 currentIdx === 1 ? "33%" :
                 currentIdx === 2 ? "66%" : "100%",
          transition: "width 0.6s ease",
        }} />
      </div>

      {/* Steps */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", position: "relative", zIndex: 1 }}>
        {STEPS.map((step, i) => {
          const done    = i < currentIdx;
          const current = i === currentIdx;
          const future  = i > currentIdx;
          const ts      = tsMap[step.key];

          return (
            <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: compact ? 6 : 10 }}>
              {/* Circle */}
              <div style={{
                width: compact ? 32 : 40,
                height: compact ? 32 : 40,
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: compact ? 14 : 18,
                background: done ? "#f97316" : current ? "#fff7ed" : "#f1f5f9",
                border: `3px solid ${done ? "#f97316" : current ? "#f97316" : "#e2e8f0"}`,
                boxShadow: current ? "0 0 0 5px rgba(249,115,22,0.15)" : "none",
                transition: "all 0.3s",
                flexShrink: 0,
              }}>
                {done
                  ? <span style={{ color: "white", fontSize: compact ? 12 : 15, fontWeight: 900 }}>✓</span>
                  : <span style={{ filter: future ? "grayscale(1) opacity(0.4)" : "none" }}>{step.icon}</span>
                }
              </div>

              {/* Label + timestamp */}
              <div style={{ textAlign: "center", padding: "0 4px" }}>
                <p style={{
                  margin: 0,
                  fontSize: compact ? 12 : 13,
                  fontWeight: current || done ? 700 : 500,
                  color: current ? "#f97316" : done ? "#0f172a" : "#94a3b8",
                }}>
                  {step.label}
                </p>
                {!compact && (
                  <p style={{ margin: "3px 0 0", fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>
                    {ts ? fmt(ts) : step.description}
                  </p>
                )}
                {compact && ts && (
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94a3b8" }}>
                    {new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
