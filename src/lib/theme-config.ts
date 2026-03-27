// Theme constants — shared between server actions and client components
// This file has NO 'use server' directive so it can export plain objects.

export const HEADING_FONTS = [
  { label: "Geist (Default)",       value: "Geist",             google: null },
  { label: "Inter",                 value: "Inter",             google: "Inter:wght@700;800;900" },
  { label: "Montserrat",            value: "Montserrat",        google: "Montserrat:wght@700;800;900" },
  { label: "Raleway",               value: "Raleway",           google: "Raleway:wght@700;800;900" },
  { label: "Barlow",                value: "Barlow",            google: "Barlow:wght@700;800;900" },
  { label: "Oswald",                value: "Oswald",            google: "Oswald:wght@500;600;700" },
  { label: "Playfair Display",      value: "Playfair Display",  google: "Playfair+Display:wght@700;800;900" },
  { label: "DM Serif Display",      value: "DM Serif Display",  google: "DM+Serif+Display" },
  { label: "Space Grotesk",         value: "Space Grotesk",     google: "Space+Grotesk:wght@600;700" },
  { label: "Outfit",                value: "Outfit",            google: "Outfit:wght@700;800;900" },
  { label: "Bebas Neue",            value: "Bebas Neue",        google: "Bebas+Neue" },
  { label: "Syne",                  value: "Syne",              google: "Syne:wght@700;800" },
] as const;

export const BODY_FONTS = [
  { label: "Geist (Default)",       value: "Geist",             google: null },
  { label: "Inter",                 value: "Inter",             google: "Inter:wght@400;500;600" },
  { label: "Open Sans",             value: "Open Sans",         google: "Open+Sans:wght@400;500;600" },
  { label: "Lato",                  value: "Lato",              google: "Lato:wght@400;700" },
  { label: "Source Sans 3",         value: "Source Sans 3",     google: "Source+Sans+3:wght@400;500;600" },
  { label: "DM Sans",               value: "DM Sans",           google: "DM+Sans:wght@400;500;600" },
  { label: "Nunito",                value: "Nunito",            google: "Nunito:wght@400;600;700" },
  { label: "Roboto",                value: "Roboto",            google: "Roboto:wght@400;500;700" },
  { label: "Work Sans",             value: "Work Sans",         google: "Work+Sans:wght@400;500;600" },
  { label: "Outfit",                value: "Outfit",            google: "Outfit:wght@400;500;600" },
  { label: "Space Grotesk",         value: "Space Grotesk",     google: "Space+Grotesk:wght@400;500;600" },
  { label: "Karla",                 value: "Karla",             google: "Karla:wght@400;500;600;700" },
] as const;

export const COLOR_PRESETS = [
  { label: "White Cap (Default)",   primary: "#0d0d0d", accent: "#f5c700", background: "#f2f2f2", foreground: "#0d0d0d" },
  { label: "BuildSupply Classic",   primary: "#002244", accent: "#e8561c", background: "#f4f5f6", foreground: "#111827" },
  { label: "Midnight Blue",         primary: "#0f172a", accent: "#3b82f6", background: "#f8fafc", foreground: "#0f172a" },
  { label: "Forest Green",          primary: "#14532d", accent: "#22c55e", background: "#f0fdf4", foreground: "#14532d" },
  { label: "Deep Purple",           primary: "#3b0764", accent: "#a855f7", background: "#faf5ff", foreground: "#1e0a3c" },
  { label: "Crimson",               primary: "#7f1d1d", accent: "#ef4444", background: "#fef2f2", foreground: "#1c0404" },
  { label: "Slate Gray",            primary: "#1e293b", accent: "#64748b", background: "#f1f5f9", foreground: "#0f172a" },
  { label: "Amber",                 primary: "#1c1917", accent: "#f59e0b", background: "#fffbeb", foreground: "#1c1917" },
  { label: "Teal",                  primary: "#134e4a", accent: "#14b8a6", background: "#f0fdfa", foreground: "#134e4a" },
] as const;
