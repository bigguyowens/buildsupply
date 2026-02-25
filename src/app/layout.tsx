import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { CartProvider } from "@/context/cart-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { getSession } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BuildSupply | Industrial & Construction Supply",
  description: "Professional-grade tools, safety equipment, fasteners and industrial supplies.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session: SessionUser | null = await getSession();

  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <CartProvider isLoggedIn={!!session}>
          <ErrorBoundary>
            <Header session={session} />
            {children}
            <Footer />
          </ErrorBoundary>
        </CartProvider>
      </body>
    </html>
  );
}
