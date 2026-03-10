# BuildSupply — Design Tokens & Conventions

## Brand Colors
- **Primary:** `#f97316` (orange — used for CTAs, active nav, brand accents)
- **Brand name split:** `<span style={{ color: "#f97316" }}>Build</span>Supply`

## Admin Theme System
CSS variables defined in `src/app/globals.css` under `[data-admin-theme]`.

### Light Mode (default)
```
--ad-bg:       #f1f5f9
--ad-surface:  #ffffff
--ad-surface2: #f8fafc
--ad-border:   #e2e8f0
--ad-border2:  #f1f5f9
--ad-text:     #0f172a
--ad-text2:    #374151
--ad-muted:    #64748b
--ad-muted2:   #94a3b8
--ad-shadow:   rgba(0,0,0,0.05)
```

### Dark Mode (`[data-admin-theme="dark"]`)
```
--ad-bg:       #0d1117
--ad-surface:  #161b22
--ad-surface2: #1c2128
--ad-border:   #30363d
--ad-border2:  #21262d
--ad-text:     #e6edf3
--ad-text2:    #c9d1d9
--ad-muted:    #8b949e
--ad-muted2:   #6e7681
--ad-shadow:   rgba(0,0,0,0.3)
```

### Theme Toggle
- Persisted in `localStorage` key `"admin-theme"`
- Managed by `AdminThemeWrapper` context (`src/components/admin-theme-wrapper.tsx`)
- Toggle button in admin sidebar footer (`admin-theme-toggle.tsx`)

## Admin Sidebar
- Fixed dark background: `#0f172a` (does NOT use CSS vars — intentionally always dark)
- Active nav item: orange tint background + `#f97316` text
- Inactive nav: `#94a3b8`
- Layout: `position: sticky; top: 0; height: 100vh` inside a flex row

## Styling Approach
- **All styles are inline** — no CSS classes, no Tailwind, no CSS modules
- Exception: CSS variables for admin theme and globals.css for base resets
- Admin pages use `--ad-*` variables for all surfaces, text, and borders
- Status/badge colors are hardcoded (intentionally not themed)

## Typography
- Admin UI: 12–14px base, fontWeight 600 for labels
- PDP description: 15px, lineHeight 1.75
- Section labels (nav separators): 10px, uppercase, letterSpacing 0.12em

## Common UI Patterns
- Card/surface: `background: var(--ad-surface), border: 1px solid var(--ad-border), borderRadius: 8px`
- Muted label: `color: var(--ad-muted), fontSize: 11px, fontWeight: 600, textTransform: uppercase`
- Page wrapper padding: `24px`
