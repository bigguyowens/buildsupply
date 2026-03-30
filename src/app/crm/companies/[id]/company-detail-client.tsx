"use client";

import { useState, useTransition } from "react";
import { updateCompany, assignAccountManager } from "@/app/actions/crm";

type AM = { id: number; first_name: string; last_name: string; email: string };
type Company = {
  id: number; name: string; industry: string | null; phone: string | null;
  city: string | null; state: string | null; domain: string | null;
  account_manager_id: number | null; account_manager_name: string | null;
};

export function CompanyDetailClient({ company, accountManagers }: {
  company: Company; accountManagers: AM[];
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(company.name);
  const [industry, setIndustry] = useState(company.industry ?? "");
  const [phone, setPhone]     = useState(company.phone ?? "");
  const [city, setCity]       = useState(company.city ?? "");
  const [state, setState]     = useState(company.state ?? "");
  const [amId, setAmId]       = useState<number | null>(company.account_manager_id);
  const [saved, setSaved]     = useState(false);
  const [, startT]            = useTransition();

  const currentAM = accountManagers.find(a => a.id === amId);
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", borderRadius: 6, fontSize: 13,
    border: "1px solid var(--crm-border)", outline: "none", boxSizing: "border-box",
  };

  function save() {
    startT(async () => {
      await updateCompany(company.id, { name, industry, phone, city, state, account_manager_id: amId });
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <>
      {/* Company info card */}
      <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", background: "#0d0d0d",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.08em", color: "#f5c700", margin: 0 }}>Company Details</h2>
          <button onClick={() => setEditing(e => !e)}
            style={{ background: "none", border: "none", cursor: "pointer",
              color: "var(--crm-muted)", fontSize: 12, fontWeight: 600 }}>
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {editing ? (
            <>
              {[
                { label: "Company Name", val: name, set: setName },
                { label: "Industry",     val: industry, set: setIndustry },
                { label: "Phone",        val: phone, set: setPhone },
                { label: "City",         val: city, set: setCity },
                { label: "State",        val: state, set: setState },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--crm-muted2)",
                    textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
                    {f.label}
                  </label>
                  <input value={f.val} onChange={e => f.set(e.target.value)} style={inputStyle} />
                </div>
              ))}
              <button onClick={save}
                style={{ background: "#f5c700", color: "#000", border: "none", borderRadius: 6,
                  padding: "9px 0", fontWeight: 800, fontSize: 13, cursor: "pointer", marginTop: 4 }}>
                Save Changes
              </button>
            </>
          ) : (
            <>
              {[
                { label: "Industry", value: company.industry },
                { label: "Phone",    value: company.phone },
                { label: "Location", value: company.city && company.state ? `${company.city}, ${company.state}` : null },
                { label: "Domain",   value: company.domain },
              ].map(f => f.value && (
                <div key={f.label}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--crm-muted2)",
                    textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>{f.label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--crm-text)", margin: 0 }}>{f.value}</p>
                </div>
              ))}
            </>
          )}
          {saved && <p style={{ fontSize: 12, color: "#22c55e", fontWeight: 600, margin: 0 }}>✓ Saved</p>}
        </div>
      </div>

      {/* AM Assignment */}
      <div style={{ background: "var(--crm-surface2)", borderRadius: 10, border: "1px solid var(--crm-border)", padding: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.08em", color: "var(--crm-muted)", margin: "0 0 10px" }}>Account Manager</p>
        {currentAM ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
            background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "8px 12px" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f5c700",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800, color: "#000" }}>
              {currentAM.first_name[0]}{currentAM.last_name[0]}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--crm-text)", margin: 0 }}>
                {currentAM.first_name} {currentAM.last_name}
              </p>
              <p style={{ fontSize: 11, color: "#92400e", margin: 0 }}>{currentAM.email}</p>
            </div>
          </div>
        ) : (
          <div style={{ background: "#f1f5f9", borderRadius: 6, padding: "8px 12px", marginBottom: 10 }}>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, fontWeight: 600 }}>Unassigned</p>
          </div>
        )}
        <select value={amId ?? ""} onChange={e => {
          const val = e.target.value ? Number(e.target.value) : null;
          setAmId(val);
          startT(async () => { await updateCompany(company.id, { account_manager_id: val }); });
        }} style={{ ...inputStyle }}>
          <option value="">— Unassigned —</option>
          {accountManagers.map(am => (
            <option key={am.id} value={am.id}>{am.first_name} {am.last_name}</option>
          ))}
        </select>
      </div>
    </>
  );
}
