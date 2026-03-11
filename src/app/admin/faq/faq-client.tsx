"use client";

import { useState, useTransition } from "react";
import type { FaqCategoryWithItems, FaqItem } from "@/app/actions/faq";
import {
  createFaqCategory, updateFaqCategory, deleteFaqCategory,
  createFaqItem, updateFaqItem, deleteFaqItem,
} from "@/app/actions/faq";

type Props = { initialCategories: FaqCategoryWithItems[] };

const surface   = { background: "var(--ad-surface)",  border: "1px solid var(--ad-border)",  borderRadius: 8 };
const surface2  = { background: "var(--ad-surface2)", border: "1px solid var(--ad-border)",  borderRadius: 6 };
const mutedText = { color: "var(--ad-muted)", fontSize: 12, fontWeight: 600 as const, textTransform: "uppercase" as const, letterSpacing: "0.06em" };
const orangeBtn = { background: "#f97316", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" };
const ghostBtn  = { background: "transparent", border: "1px solid var(--ad-border)", color: "var(--ad-text2)", borderRadius: 6, padding: "7px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const dangerBtn = { background: "transparent", border: "1px solid #fca5a5", color: "#ef4444", borderRadius: 6, padding: "5px 10px", fontWeight: 600, fontSize: 12, cursor: "pointer" };
const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 14, border: "1px solid var(--ad-border)", background: "var(--ad-surface)", color: "var(--ad-text)", boxSizing: "border-box" as const, outline: "none" };
const textareaStyle = { ...inputStyle, minHeight: 90, resize: "vertical" as const, fontFamily: "inherit", lineHeight: 1.6 };

function ItemDrawer({ item, categories, onClose }: {
  item: FaqItem | null;
  categories: FaqCategoryWithItems[];
  onClose: () => void;
}) {
  const [question, setQuestion] = useState(item?.question ?? "");
  const [answer, setAnswer]     = useState(item?.answer ?? "");
  const [catId, setCatId]       = useState(item?.category_id ?? categories[0]?.id ?? 0);
  const [published, setPublished] = useState(item?.published ?? true);
  const [, startT] = useTransition();

  function save() {
    startT(async () => {
      if (item) {
        await updateFaqItem(item.id, { question, answer, published, category_id: catId });
      } else {
        await createFaqItem(catId, question, answer);
      }
      onClose();
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", justifyContent: "flex-end" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 520, background: "var(--ad-surface)", height: "100%", overflowY: "auto", padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{item ? "Edit Question" : "New Question"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--ad-muted)" }}>✕</button>
        </div>

        <div>
          <label style={{ ...mutedText, display: "block", marginBottom: 6 }}>Category</label>
          <select value={catId} onChange={e => setCatId(Number(e.target.value))}
            style={{ ...inputStyle }}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label style={{ ...mutedText, display: "block", marginBottom: 6 }}>Question</label>
          <input value={question} onChange={e => setQuestion(e.target.value)} style={inputStyle} placeholder="e.g. How long does shipping take?" />
        </div>

        <div>
          <label style={{ ...mutedText, display: "block", marginBottom: 6 }}>Answer</label>
          <textarea value={answer} onChange={e => setAnswer(e.target.value)} style={textareaStyle} placeholder="Write a clear, helpful answer..." />
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#f97316" }} />
          <span style={{ fontSize: 14, color: "var(--ad-text2)", fontWeight: 600 }}>Published (visible on FAQ page)</span>
        </label>

        <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
          <button onClick={save} style={orangeBtn} disabled={!question.trim() || !answer.trim()}>
            {item ? "Save Changes" : "Create Question"}
          </button>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function CategorySection({ cat, allCategories, onEdit }: {
  cat: FaqCategoryWithItems;
  allCategories: FaqCategoryWithItems[];
  onEdit: (item: FaqItem | null) => void;
}) {
  const [editing, setEditing]   = useState(false);
  const [catName, setCatName]   = useState(cat.name);
  const [expanded, setExpanded] = useState(true);
  const [, startT] = useTransition();

  function saveCategory() {
    startT(async () => { await updateFaqCategory(cat.id, catName); setEditing(false); });
  }
  function removeCategory() {
    if (!confirm(`Delete category "${cat.name}" and all its questions? This cannot be undone.`)) return;
    startT(async () => { await deleteFaqCategory(cat.id); });
  }
  function removeItem(id: number) {
    if (!confirm("Delete this question?")) return;
    startT(async () => { await deleteFaqItem(id); });
  }
  function togglePublished(item: FaqItem) {
    startT(async () => { await updateFaqItem(item.id, { published: !item.published }); });
  }

  return (
    <div style={{ ...surface, marginBottom: 16, overflow: "hidden" }}>
      {/* Category header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: expanded ? "1px solid var(--ad-border)" : "none", background: "var(--ad-surface2)" }}>
        <button onClick={() => setExpanded(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ad-muted)", fontSize: 14, padding: 0, lineHeight: 1 }}>
          {expanded ? "▼" : "▶"}
        </button>
        {editing ? (
          <>
            <input value={catName} onChange={e => setCatName(e.target.value)}
              style={{ ...inputStyle, flex: 1, padding: "6px 10px", fontSize: 14 }} autoFocus />
            <button onClick={saveCategory} style={{ ...orangeBtn, padding: "6px 14px" }}>Save</button>
            <button onClick={() => { setEditing(false); setCatName(cat.name); }} style={{ ...ghostBtn, padding: "5px 12px" }}>Cancel</button>
          </>
        ) : (
          <>
            <span style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>{cat.name}</span>
            <span style={{ ...mutedText }}>{cat.items.length} question{cat.items.length !== 1 ? "s" : ""}</span>
            <button onClick={() => setEditing(true)} style={{ ...ghostBtn, padding: "5px 10px", fontSize: 12 }}>Rename</button>
            <button onClick={removeCategory} style={{ ...dangerBtn }}>Delete</button>
          </>
        )}
      </div>

      {/* Items */}
      {expanded && (
        <div style={{ padding: "8px 20px 16px" }}>
          {cat.items.length === 0 && (
            <p style={{ color: "var(--ad-muted)", fontSize: 13, margin: "12px 0 8px" }}>No questions yet.</p>
          )}
          {cat.items.map(item => (
            <div key={item.id} style={{ ...surface2, padding: "12px 16px", marginTop: 10, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ad-text)" }}>{item.question}</span>
                  {!item.published && (
                    <span style={{ fontSize: 11, fontWeight: 700, background: "#fef3c7", color: "#92400e", borderRadius: 4, padding: "2px 6px" }}>Draft</span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: "var(--ad-muted)", margin: 0, lineHeight: 1.6 }}>{item.answer.length > 120 ? item.answer.slice(0, 120) + "…" : item.answer}</p>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => togglePublished(item)} title={item.published ? "Unpublish" : "Publish"}
                  style={{ ...ghostBtn, padding: "5px 10px", fontSize: 12, color: item.published ? "#16a34a" : "var(--ad-muted)" }}>
                  {item.published ? "✓ Live" : "○ Draft"}
                </button>
                <button onClick={() => onEdit(item)} style={{ ...ghostBtn, padding: "5px 10px", fontSize: 12 }}>Edit</button>
                <button onClick={() => removeItem(item.id)} style={{ ...dangerBtn }}>✕</button>
              </div>
            </div>
          ))}
          <button onClick={() => onEdit(null)} style={{ ...ghostBtn, marginTop: 12, fontSize: 13, padding: "7px 14px" }}>
            + Add Question
          </button>
        </div>
      )}
    </div>
  );
}

export function FaqAdminClient({ initialCategories }: Props) {
  const [drawerItem, setDrawerItem] = useState<FaqItem | null | undefined>(undefined);
  const [newCatName, setNewCatName] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);
  const [, startT] = useTransition();

  // undefined = closed, null = new item, FaqItem = edit item
  const drawerOpen = drawerItem !== undefined;

  function addCategory() {
    if (!newCatName.trim()) return;
    startT(async () => {
      await createFaqCategory(newCatName.trim());
      setNewCatName("");
      setShowNewCat(false);
    });
  }

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <a href="/faq" target="_blank" rel="noopener" style={{ fontSize: 13, color: "#f97316", textDecoration: "none", fontWeight: 600 }}>
          View FAQ Page ↗
        </a>
        <button onClick={() => setShowNewCat(v => !v)} style={orangeBtn}>
          + New Category
        </button>
      </div>

      {/* New category inline form */}
      {showNewCat && (
        <div style={{ ...surface, padding: 16, marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
          <input
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCategory()}
            placeholder="Category name (e.g. Payments & Billing)"
            style={{ ...inputStyle, flex: 1 }}
            autoFocus
          />
          <button onClick={addCategory} style={orangeBtn} disabled={!newCatName.trim()}>Create</button>
          <button onClick={() => { setShowNewCat(false); setNewCatName(""); }} style={ghostBtn}>Cancel</button>
        </div>
      )}

      {/* Categories */}
      {initialCategories.length === 0 ? (
        <div style={{ ...surface, padding: 48, textAlign: "center", color: "var(--ad-muted)" }}>
          <p style={{ fontSize: 15, marginBottom: 8 }}>No categories yet.</p>
          <p style={{ fontSize: 13 }}>Create a category to get started.</p>
        </div>
      ) : (
        initialCategories.map(cat => (
          <CategorySection
            key={cat.id}
            cat={cat}
            allCategories={initialCategories}
            onEdit={item => setDrawerItem(item)}
          />
        ))
      )}

      {/* Item drawer */}
      {drawerOpen && (
        <ItemDrawer
          item={drawerItem ?? null}
          categories={initialCategories}
          onClose={() => setDrawerItem(undefined)}
        />
      )}
    </div>
  );
}
