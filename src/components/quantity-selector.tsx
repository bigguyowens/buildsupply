type QuantitySelectorProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
};

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
}: QuantitySelectorProps) {
  const isSmall = size === "sm";
  const btnSize  = isSmall ? { width: 28, height: 28, fontSize: 16 } : { width: 36, height: 36, fontSize: 18 };
  const inputW   = isSmall ? 36 : 44;
  const fontSize = isSmall ? 13 : 15;

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    width: btnSize.width,
    height: btnSize.height,
    fontSize: btnSize.fontSize,
    fontWeight: 600,
    lineHeight: 1,
    background: disabled ? "#f8fafc" : "white",
    color: disabled ? "#cbd5e1" : "#374151",
    border: "1px solid #d1d5db",
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "background 0.1s, color 0.1s",
    userSelect: "none" as const,
  });

  return (
    <div style={{ display: "inline-flex", alignItems: "stretch", borderRadius: 6, overflow: "hidden", border: "1px solid #d1d5db", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
      {/* Minus */}
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{ ...btnStyle(value <= min), borderRadius: 0, border: "none", borderRight: "1px solid #d1d5db" }}
        onMouseEnter={e => { if (value > min) (e.currentTarget as HTMLElement).style.background = "#f1f5f9"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = value <= min ? "#f8fafc" : "white"; }}
      >
        −
      </button>

      {/* Input */}
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={e => {
          const v = Number(e.target.value);
          if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
        }}
        style={{
          width: inputW,
          height: btnSize.height,
          textAlign: "center",
          fontSize,
          fontWeight: 700,
          color: "#0f172a",
          border: "none",
          outline: "none",
          background: "white",
          MozAppearance: "textfield" as never,
        }}
      />

      {/* Plus */}
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{ ...btnStyle(value >= max), borderRadius: 0, border: "none", borderLeft: "1px solid #d1d5db" }}
        onMouseEnter={e => { if (value < max) (e.currentTarget as HTMLElement).style.background = "#f1f5f9"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = value >= max ? "#f8fafc" : "white"; }}
      >
        +
      </button>
    </div>
  );
}
