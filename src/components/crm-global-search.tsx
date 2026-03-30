"use client";

import React, { useState, useRef, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { globalCRMSearch, type SearchResult } from "@/app/actions/crm-search";

const TYPE_META: Record<SearchResult["type"], { icon: string; label: string; color: string }> = {
  customer: { icon: "👤", label: "Customer", color: "#f5c700" },
  company:  { icon: "🏢", label: "Company",  color: "#3b82f6" },
  quote:    { icon: "📋", label: "Quote",    color: "#f97316" },
  task:     { icon: "✅", label: "Task",     color: "#22c55e" },
  order:    { icon: "🛒", label: "Order",    color: "#8b5cf6" },
  return:   { icon: "↩️",  label: "Return",   color: "#ef4444" },
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#9ca3af", sent: "#3b82f6", accepted: "#22c55e",
  declined: "#ef4444", expired: "#f59e0b",
};

export function CRMGlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  const search = useCallback((val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const res = await globalCRMSearch(val);
        setResults(res);
        setOpen(res.length > 0);
        setActiveIdx(-1);
      });
    }, 280);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    search(val);
  }

  function handleSelect(result: SearchResult) {
    setQuery("");
    setResults([]);
    setOpen(false);
    router.push(result.href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(results[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();
    }
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Group results by type
  const grouped: Record<string, SearchResult[]> = {};
  for (const r of results) {
    if (!grouped[r.type]) grouped[r.type] = [];
    grouped[r.type].push(r);
  }
  const typeOrder: SearchResult["type"][] = ["customer", "company", "order", "return", "quote", "task"];

  return (
    <div ref={containerRef} style={{ position: "relative", flex: 1, maxWidth: 440 }}>
      {/* Input */}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <span style={{ position: "absolute", left: 12, color: "var(--crm-muted2)", fontSize: 14,
          pointerEvents: "none", display: "flex", alignItems: "center" }}>
          {isPending ? "⌛" : "🔍"}
        </span>
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder="Search customers, companies, quotes, tasks…"
          style={{
            width: "100%", padding: "8px 12px 8px 36px",
            borderRadius: 8, fontSize: 13, fontWeight: 500,
            border: `1.5px solid ${open ? "#f5c700" : "#e5e5e5"}`,
            background: "var(--crm-surface2)", color: "var(--crm-text)",
            outline: "none", transition: "border-color 0.15s",
            boxSizing: "border-box" as const,
          }}
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
            style={{ position: "absolute", right: 10, background: "none", border: "none",
              cursor: "pointer", color: "var(--crm-muted2)", fontSize: 16, lineHeight: 1,
              display: "flex", alignItems: "center", padding: 2 }}>
            ✕
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
          background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.14)", zIndex: 500,
          overflow: "hidden", maxHeight: 420, overflowY: "auto",
        }}>
          {typeOrder.filter(t => grouped[t]?.length).map((type, ti) => {
            const meta = TYPE_META[type];
            const group = grouped[type];
            return (
              <div key={type}>
                {/* Section header */}
                <div style={{ padding: "8px 14px 4px",
                  background: "var(--crm-surface2)", borderBottom: "1px solid var(--crm-border2)",
                  display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11 }}>{meta.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                    letterSpacing: "0.1em", color: "var(--crm-muted2)" }}>{meta.label}s</span>
                </div>

                {/* Results */}
                {group.map(result => {
                  const globalIdx = results.indexOf(result);
                  const isActive = globalIdx === activeIdx;
                  return (
                    <div
                      key={`${result.type}-${result.id}`}
                      onMouseEnter={() => setActiveIdx(globalIdx)}
                      onMouseLeave={() => setActiveIdx(-1)}
                      onClick={() => handleSelect(result)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 14px", cursor: "pointer",
                        background: isActive ? "#fffbeb" : "var(--crm-surface)",
                        borderBottom: "1px solid var(--crm-border2)",
                        transition: "background 0.1s",
                      }}
                    >
                      {/* Type dot */}
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                        background: `${meta.color}18`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, border: `1.5px solid ${meta.color}30`,
                      }}>
                        {meta.icon}
                      </div>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--crm-text)",
                          margin: "0 0 1px", overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {result.title}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--crm-muted2)", margin: 0,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {result.subtitle}
                        </p>
                      </div>

                      {/* Meta badge */}
                      {result.meta && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 7px",
                          borderRadius: 10, flexShrink: 0,
                          background: result.type === "quote"
                            ? `${STATUS_COLORS[result.meta] ?? "#9ca3af"}18`
                            : "#f1f1f1",
                          color: result.type === "quote"
                            ? (STATUS_COLORS[result.meta] ?? "#9ca3af")
                            : "#6b7280",
                          textTransform: "capitalize",
                        }}>
                          {result.meta}
                        </span>
                      )}

                      {/* Arrow */}
                      <span style={{ color: isActive ? "#f5c700" : "#d1d5db",
                        fontSize: 14, flexShrink: 0 }}>→</span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Footer hint */}
          <div style={{ padding: "7px 14px", background: "var(--crm-surface2)",
            borderTop: "1px solid var(--crm-border2)", display: "flex",
            alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 10, color: "#d1d5db" }}>↑↓ navigate</span>
            <span style={{ fontSize: 10, color: "#d1d5db" }}>↵ select</span>
            <span style={{ fontSize: 10, color: "#d1d5db" }}>esc close</span>
            <span style={{ marginLeft: "auto", fontSize: 10, color: "#d1d5db" }}>
              {results.length} result{results.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}

      {/* No results */}
      {open && query.length >= 2 && results.length === 0 && !isPending && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
          background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.14)", zIndex: 500,
          padding: "20px 16px", textAlign: "center",
        }}>
          <p style={{ fontSize: 13, color: "var(--crm-muted2)", margin: 0 }}>
            No results for <strong style={{ color: "var(--crm-text)" }}>"{query}"</strong>
          </p>
        </div>
      )}
    </div>
  );
}
