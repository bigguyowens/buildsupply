import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Footer } from "@/components/footer";
import { ConsentBanner } from "@/components/consent-banner";
import { Header } from "@/components/header";
import { CartProvider } from "@/context/cart-context";
import { CartDrawer } from "@/components/cart-drawer";
import { ErrorBoundary } from "@/components/error-boundary";
import { getSession } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { getSiteTheme } from "@/app/actions/theme";
import { HEADING_FONTS, BODY_FONTS } from "@/lib/theme-config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BuildSupply | Industrial & Construction Supply",
  description: "Professional-grade tools, safety equipment, fasteners and industrial supplies.",
};

function buildGoogleFontsUrl(headingFont: string, bodyFont: string): string | null {
  const families: string[] = [];
  const hf = HEADING_FONTS.find(f => f.value === headingFont);
  const bf = BODY_FONTS.find(f => f.value === bodyFont);
  if (hf?.google) families.push(hf.google);
  if (bf?.google && bf.value !== headingFont) families.push(bf.google);
  if (!families.length) return null;
  return `https://fonts.googleapis.com/css2?${families.map(f => `family=${f}`).join("&")}&display=swap`;
}

function darken(hex: string, amount = 15): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (n >> 16) - amount);
  const g = Math.max(0, ((n >> 8) & 0xff) - amount);
  const b = Math.max(0, (n & 0xff) - amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [session, theme] = await Promise.all([
    getSession(),
    getSiteTheme(),
  ]) as [SessionUser | null, Awaited<ReturnType<typeof getSiteTheme>>];

  const googleFontsUrl = buildGoogleFontsUrl(theme.heading_font, theme.body_font);
  const headingStack  = theme.heading_font === "Geist" ? "var(--font-geist-sans), sans-serif" : `'${theme.heading_font}', sans-serif`;
  const bodyStack     = theme.body_font    === "Geist" ? "var(--font-geist-sans), sans-serif" : `'${theme.body_font}', sans-serif`;

  const themeCSS = `
    :root {
      --color-primary:       ${theme.color_primary};
      --color-primary-hover: ${darken(theme.color_primary)};
      --color-accent:        ${theme.color_accent};
      --color-accent-hover:  ${darken(theme.color_accent)};
      --color-background:    ${theme.color_background};
      --color-foreground:    ${theme.color_foreground};
      --font-heading:        ${headingStack};
      --font-body:           ${bodyStack};
    }
    h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); }
    body { font-family: var(--font-body); }
  `.trim();

  return (
    <html lang="en">
      <head>
        {googleFontsUrl && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="stylesheet" href={googleFontsUrl} />
          </>
        )}
        <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      </head>
      <body className={`${geistSans.variable} antialiased`}>
        <CartProvider isLoggedIn={!!session}>
          <ErrorBoundary>
            <Header session={session} />
            {children}
            <Footer />
            <CartDrawer />
            <ConsentBanner isLoggedIn={!!session} />
          </ErrorBoundary>
        </CartProvider>
      </body>
    </html>
  );
}
