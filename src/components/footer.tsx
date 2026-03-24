import Link from "next/link";

const FOOTER_LINKS = {
  "Products": [
    { label: "Concrete & Masonry", href: "/categories/concrete-masonry" },
    { label: "Safety & PPE",        href: "/categories/safety-ppe"       },
    { label: "Tools & Equipment",   href: "/categories/tools-equipment"  },
    { label: "Fasteners & Hardware",href: "/categories/fasteners-hardware"},
    { label: "Waterproofing",       href: "/categories/waterproofing-sealants"},
  ],
  "Company": [
    { label: "About Us",            href: "/about"     },
    { label: "Contact",             href: "/contact"   },
    { label: "Careers",             href: "/careers"   },
    { label: "News & Updates",      href: "/blog"      },
    { label: "Locations",           href: "/locations" },
    { label: "Privacy & Security",  href: "/privacy"   },
  ],
  "News": [
    { label: "All Posts",          href: "/blog"                             },
    { label: "Press Releases",     href: "/blog?category=press-releases"     },
    { label: "Industry News",      href: "/blog?category=industry-news"      },
    { label: "Internal Wins",      href: "/blog?category=internal-wins"      },
    { label: "Product Spotlight",  href: "/blog?category=product-spotlight"  },
  ],
  "Support": [
    { label: "Order History", href: "/orders"  },
    { label: "Returns",       href: "/returns" },
    { label: "FAQs",          href: "/faq"     },
  ],
};

export function Footer() {
  return (
    <footer style={{ background: "var(--color-primary)", color: "#fff" }}>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="footer-grid grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="footer-brand space-y-3">
            <div className="text-xl font-bold tracking-tight">
              <span style={{ color: "var(--color-accent)" }}>Build</span>Supply
            </div>
            <p className="text-sm text-white/60 max-w-xs">
              Industrial-grade construction supplies for contractors, project managers, and procurement teams.
            </p>
            <p className="text-xs text-white/40 uppercase tracking-widest">Next.js · GraphQL · PostgreSQL</p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/50">{heading}</p>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/70 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <span>© {new Date().getFullYear()} BuildSupply. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white/70">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
