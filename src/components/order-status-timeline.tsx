// OrderStatusTimeline — shared component used on CRM & Admin order detail pages
// Accepts: status (current), statusHistory (array of {status, timestamp})

type StatusEvent = { status: string; timestamp: string };

type Props = {
  status: string;
  statusHistory: StatusEvent[];
  compact?: boolean;
};

const PIPELINE = [
  {
    key: "pending",
    label: "Order Placed",
    icon: "📋",
    desc: "Order received and confirmed",
  },
  {
    key: "processing",
    label: "Processing",
    icon: "⚙️",
    desc: "Items picked and prepared for shipment",
  },
  {
    key: "shipped",
    label: "Shipped",
    icon: "🚚",
    desc: "Package handed to carrier",
  },
  {
    key: "completed",
    label: "Delivered",
    icon: "✅",
    desc: "Order delivered successfully",
  },
];

const STATUS_ORDER: Record<string, number> = {
  pending: 0, processing: 1, shipped: 2, completed: 3,
};

function fmtDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}
function fmtTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });
}

export function OrderStatusTimeline({ status, statusHistory, compact = false }: Props) {
  const isCancelled = status === "cancelled";
  const currentStep = STATUS_ORDER[status] ?? (isCancelled ? -1 : 0);
  const dotSize     = compact ? 36 : 44;
  const iconSize    = compact ? 16 : 18;

  // Build a map of status → event for quick lookup
  const eventMap: Record<string, StatusEvent> = {};
  for (const ev of (statusHistory ?? [])) {
    eventMap[ev.status] = ev;
  }

  if (isCancelled) {
    const cancelledAt = eventMap["cancelled"]?.timestamp;
    const placedAt    = eventMap["pending"]?.timestamp;
    return (
      <div style={{ padding: "8px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Placed dot */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%",
              background: "#dcfce7", border: "2px solid #22c55e",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              📋
            </div>
          </div>
          {/* Strikethrough line */}
          <div style={{ flex: 1, height: 3, background: "#fee2e2",
            backgroundImage: "repeating-linear-gradient(90deg, #fca5a5 0, #fca5a5 8px, transparent 8px, transparent 16px)",
            borderRadius: 2 }} />
          {/* Cancelled dot */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%",
              background: "#fee2e2", border: "2px solid #ef4444",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              ✕
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#15803d", margin: 0 }}>Order Placed</p>
            {placedAt && (
              <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>
                {fmtDate(placedAt)} · {fmtTime(placedAt)}
              </p>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#991b1b", margin: 0 }}>Cancelled</p>
            {cancelledAt && (
              <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>
                {fmtDate(cancelledAt)} · {fmtTime(cancelledAt)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Step nodes + connectors */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {PIPELINE.map((step, i) => {
          const isDone    = currentStep > i;
          const isCurrent = currentStep === i;
          const isPending = currentStep < i;
          const event     = eventMap[step.key];

          const dotBg     = isDone ? "#22c55e" : isCurrent ? "#0d0d0d" : "#f1f5f9";
          const dotBorder = isDone ? "#22c55e" : isCurrent ? "#0d0d0d" : "#e2e8f0";
          const iconColor = isDone || isCurrent ? "#fff" : "#9ca3af";

          return (
            <div key={step.key} style={{ display: "flex", alignItems: "center", flex: i < PIPELINE.length - 1 ? 1 : 0 }}>
              {/* Node */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: dotSize, height: dotSize, borderRadius: "50%",
                  background: dotBg, border: `2px solid ${dotBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: iconSize, transition: "all 0.3s",
                  boxShadow: isCurrent ? "0 0 0 4px rgba(0,0,0,0.08)" : "none",
                }}>
                  {isDone
                    ? <span style={{ fontSize: iconSize }}>✓</span>
                    : <span style={{ fontSize: iconSize, filter: isPending ? "grayscale(1) opacity(0.4)" : "none" }}>
                        {step.icon}
                      </span>
                  }
                </div>
                {/* Pulse for current active step */}
                {isCurrent && (
                  <div style={{
                    position: "absolute", width: dotSize, height: dotSize, borderRadius: "50%",
                    border: "2px solid #0d0d0d", animation: "pulse 2s infinite",
                    opacity: 0.3, pointerEvents: "none",
                  }} />
                )}
              </div>

              {/* Connector line */}
              {i < PIPELINE.length - 1 && (
                <div style={{ flex: 1, height: 3, margin: "0 4px",
                  background: isDone ? "#22c55e" : "#e2e8f0",
                  borderRadius: 2, transition: "background 0.3s",
                  position: "relative", overflow: "hidden" }}>
                  {isCurrent && (
                    <div style={{
                      position: "absolute", top: 0, left: 0, bottom: 0, width: "60%",
                      background: "linear-gradient(90deg, #22c55e, transparent)",
                      borderRadius: 2,
                    }} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Labels below each node */}
      <div style={{ display: "flex", marginTop: compact ? 8 : 12 }}>
        {PIPELINE.map((step, i) => {
          const isDone    = currentStep > i;
          const isCurrent = currentStep === i;
          const isPending = currentStep < i;
          const event     = eventMap[step.key];

          return (
            <div key={step.key} style={{
              flex: i < PIPELINE.length - 1 ? 1 : 0,
              minWidth: compact ? 64 : 80,
              paddingRight: i < PIPELINE.length - 1 ? 8 : 0,
            }}>
              <p style={{
                fontSize: compact ? 11 : 12, fontWeight: 800, margin: "0 0 2px",
                color: isDone ? "#15803d" : isCurrent ? "#0d0d0d" : "#9ca3af",
              }}>
                {step.label}
                {isCurrent && !compact && (
                  <span style={{ marginLeft: 5, fontSize: 9, fontWeight: 800,
                    background: "#0d0d0d", color: "#f5c700",
                    padding: "1px 5px", borderRadius: 4,
                    verticalAlign: "middle", textTransform: "uppercase",
                    letterSpacing: "0.06em" }}>
                    Current
                  </span>
                )}
              </p>
              {event ? (
                <>
                  <p style={{ fontSize: compact ? 10 : 11, color: "#6b7280", margin: 0, fontWeight: 600 }}>
                    {fmtDate(event.timestamp)}
                  </p>
                  {!compact && (
                    <p style={{ fontSize: 10, color: "#9ca3af", margin: "1px 0 0" }}>
                      {fmtTime(event.timestamp)}
                    </p>
                  )}
                </>
              ) : (
                <p style={{ fontSize: compact ? 10 : 11, color: "#d1d5db", margin: 0 }}>Pending</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50%       { transform: scale(1.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
