"use client";
import { useState } from "react";
import type { FaqItem } from "@/app/actions/faq";

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div>
      {items.map(item => (
        <div key={item.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
          <button
            onClick={() => setOpen(open === item.id ? null : item.id)}
            style={{
              width: "100%", textAlign: "left", background: "none", border: "none",
              padding: "18px 0", cursor: "pointer", display: "flex", justifyContent: "space-between",
              alignItems: "flex-start", gap: 16,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", lineHeight: 1.4 }}>{item.question}</span>
            <span style={{
              flexShrink: 0, width: 22, height: 22, borderRadius: "50%",
              background: open === item.id ? "#f97316" : "#f1f5f9",
              color: open === item.id ? "white" : "#64748b",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, transition: "all 0.2s", marginTop: 2,
            }}>
              {open === item.id ? "−" : "+"}
            </span>
          </button>
          {open === item.id && (
            <div style={{ paddingBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 15, color: "#374151", lineHeight: 1.75 }}>{item.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
