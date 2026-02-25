CREATE TABLE IF NOT EXISTS homepage_content (
  id      SERIAL PRIMARY KEY,
  section VARCHAR(50) UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT true,
  content JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO homepage_content (section, enabled, content) VALUES
('promo_bar', true, '{"text": "Free shipping on orders over $500 — Shop our full catalog today!", "bg": "#1e3a5f", "color": "#ffffff"}'),
('hero', true, '{"headline": "Everything Your Job Site Needs", "subtext": "Top-quality tools, safety gear, fasteners and more — built for pros and tradespeople.", "cta_text": "Shop Now", "cta_link": "/products", "bg": "#0f172a", "accent": "#f97316"}'),
('featured_deals', true, '{"title": "Today'\''s Deals", "deals": [{"label": "Power Tools", "badge": "Up to 30% Off", "link": "/categories/power-tools", "bg": "#1e3a8a", "color": "#ffffff"}, {"label": "Safety and PPE", "badge": "From $9.99", "link": "/categories/safety-ppe", "bg": "#14532d", "color": "#ffffff"}, {"label": "Fasteners", "badge": "Bulk Savings", "link": "/categories/fasteners", "bg": "#7c2d12", "color": "#ffffff"}, {"label": "Abrasives", "badge": "New Arrivals", "link": "/categories/abrasives", "bg": "#4c1d95", "color": "#ffffff"}]}'),
('value_props', true, '{"props": [{"icon": "🚚", "title": "Free Shipping", "text": "On all orders over $500"}, {"icon": "↩", "title": "Easy Returns", "text": "30-day hassle-free returns"}, {"icon": "🔒", "title": "Secure Checkout", "text": "256-bit SSL encryption"}, {"icon": "📞", "title": "Expert Support", "text": "Mon-Fri, 7am-6pm CT"}]}')
ON CONFLICT (section) DO NOTHING;
