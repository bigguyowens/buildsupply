# BuildSupply — Feature Map & DB Schema Overview

## Implemented Features (all production-deployed)

### Commerce
- **Product Catalog** — 527 products, 12 categories, SKU/slug, specs (JSONB), images, tags
- **PDP** — Sticky right column, specs table, similar products carousel, recently viewed carousel
- **Listing Page** — Home Depot-style filters, sort, list/grid toggle, filter drawer
- **Cart + Checkout** — Quantity stepper, promo code support
- **Orders** — Full order history, admin order management
- **Quotes** — Admin creates custom-priced quotes → customer accepts/declines → checkout
- **Promotions** — Promo codes, discount applied through cart → checkout → order → confirmation
- **Wishlists** — Per-customer, admin visible

### Customer & Auth
- **Auth** — Custom session-based (cookie), login/logout/register
- **Customer accounts** — Order history, quote history, wishlist, view history

### CMS / Content
- **Homepage CMS** — Hero, featured categories, banners (collapsible section editors)
- **About Us CMS** — Rich content blocks
- **Contact Page CMS** — Hero, quick contacts, hours, locations
- **Blog** — Posts, categories, Markdown rendering, admin CRUD, 12 seeded posts
- **Theme Customizer** — Color presets + font selection, live preview

### Admin
- **Dashboard** — Analytics KPIs + 10+ Recharts chart types
- **Dark/Light theme toggle** — localStorage persisted
- **Products** — Full CRUD, bulk Excel import, inline drawer editing
- **Categories** — Subcategory support, CRUD
- **Careers Pipeline** — 6-stage hiring pipeline with decline reasons, start dates
- **Contact Forms** — Inbox with Resend reply integration
- **Error Logs** — DB-persisted error tracking

### Careers (Public)
- Job listings with department filter
- Job detail + inline application form
- Resume upload (PDF/DOC/DOCX, base64 stored in DB)
- Company culture sidebar (photos, values, stats)

---

## Key DB Tables

| Table | Notes |
|---|---|
| `products` | `specs JSONB`, `slug`, `category_id`, `images TEXT[]` |
| `categories` | `parent_id` for subcategories |
| `orders` / `order_items` | Includes promo discount |
| `quotes` / `quote_items` | Admin-created, customer checkout flow |
| `promotions` | Code, discount type/amount, usage limits |
| `job_postings` | `slug`, `department`, `status` |
| `job_applications` | 6-stage pipeline, `resume_data TEXT`, `resume_mime TEXT`, `decline_reason`, `start_date` |
| `blog_posts` | Markdown body, `category_id`, `published` |
| `contact_submissions` | Inbox, `replied_at` |
| `product_views` | Per-customer view tracking |
| `homepage_content` | JSON blob per section |
| `site_theme` | Colors + fonts |

---

## Admin Nav Order (for reference)
Dashboard → Orders / Quotes / Customers → Products / Categories → Wishlists / Promotions / Contact Forms → **CAREERS:** Job Postings → **CONTENT:** Theme / Homepage / About Us / Contact Page / Blog → Error Logs
