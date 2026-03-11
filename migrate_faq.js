const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS faq_categories (
        id          SERIAL PRIMARY KEY,
        name        TEXT NOT NULL,
        slug        TEXT NOT NULL UNIQUE,
        sort_order  INT NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS faq_items (
        id           SERIAL PRIMARY KEY,
        category_id  INT REFERENCES faq_categories(id) ON DELETE CASCADE,
        question     TEXT NOT NULL,
        answer       TEXT NOT NULL,
        sort_order   INT NOT NULL DEFAULT 0,
        published    BOOLEAN NOT NULL DEFAULT TRUE,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Tables created.");

    // Seed categories
    const cats = await client.query(`
      INSERT INTO faq_categories (name, slug, sort_order) VALUES
        ('Orders & Shipping', 'orders-shipping', 0),
        ('Returns & Refunds',  'returns-refunds',  1),
        ('Products & Pricing', 'products-pricing', 2),
        ('Account & Billing',  'account-billing',  3)
      ON CONFLICT (slug) DO NOTHING
      RETURNING id, slug;
    `);
    console.log("Categories seeded:", cats.rows.map(r => r.slug));

    // Map slugs to ids
    const allCats = await client.query(`SELECT id, slug FROM faq_categories ORDER BY sort_order`);
    const catMap = Object.fromEntries(allCats.rows.map(r => [r.slug, r.id]));

    await client.query(`
      INSERT INTO faq_items (category_id, question, answer, sort_order) VALUES
        ($1, 'How long does shipping take?',
          'Standard shipping typically takes 3–7 business days. Expedited options (2-day, overnight) are available at checkout. Orders over $500 qualify for free standard shipping.',
          0),
        ($1, 'Do you ship to all US states?',
          'Yes, we ship to all 50 US states. Freight orders for heavy equipment may have longer lead times in remote areas. International shipping is not currently available.',
          1),
        ($1, 'Can I track my order?',
          'Yes. Once your order ships you will receive a tracking number via email. You can also view real-time order status in your account under Order History.',
          2),
        ($1, 'Can I change or cancel my order?',
          'Orders can be modified or cancelled within 1 hour of placement. After that, the order may already be in processing. Contact our team as soon as possible and we will do our best to help.',
          3),

        ($2, 'What is your return policy?',
          'We accept returns within 30 days of delivery on most items. Products must be unused, in original packaging, and accompanied by your order number. Some heavy equipment and special-order items are non-returnable.',
          0),
        ($2, 'How do I start a return?',
          'Logged-in customers can initiate a return from their Order History page. Guest orders can submit a return request at buildsupply.dev/returns using your order number and email address.',
          1),
        ($2, 'How long does a refund take?',
          'Once we receive and inspect your return, refunds are processed within 3–5 business days. The funds typically appear in your account within 1–3 additional business days depending on your bank.',
          2),
        ($2, 'Are return shipping costs covered?',
          'We cover return shipping costs for defective or incorrectly shipped items. For standard returns, a prepaid label is provided and the cost ($9.99 flat rate) is deducted from your refund.',
          3),

        ($3, 'Are your products covered by a warranty?',
          'Most products carry the manufacturer''s standard warranty. Warranty terms vary by brand and product category and are listed on the product detail page. BuildSupply also offers an extended protection plan on select items.',
          0),
        ($3, 'Do you offer bulk or volume pricing?',
          'Yes. We offer custom pricing for bulk orders and B2B accounts. Contact our sales team or request a quote directly through your account to receive a tailored price.',
          1),
        ($3, 'Are your product specifications accurate?',
          'We work closely with manufacturers to keep all specs current. However, manufacturers may update specifications without notice. For critical applications, we recommend verifying specs directly with the manufacturer.',
          2),
        ($3, 'Can I request a product that isn''t listed?',
          'Absolutely. If you need a specific product or brand we don''t currently carry, contact us and we''ll do our best to source it for you.',
          3),

        ($4, 'Do I need an account to place an order?',
          'No — you can check out as a guest. However, creating an account lets you track orders, save wishlists, view quote history, and manage returns more easily.',
          0),
        ($4, 'What payment methods do you accept?',
          'We accept all major credit and debit cards (Visa, Mastercard, Amex, Discover). Purchase orders and net terms are available for approved B2B accounts.',
          1),
        ($4, 'Is my payment information secure?',
          'Yes. All transactions are encrypted with TLS and processed through PCI-compliant payment systems. BuildSupply never stores your full card number.',
          2),
        ($4, 'How do I reset my password?',
          'Click "Sign In" on the top navigation, then "Forgot Password." Enter your email address and we''ll send you a secure reset link valid for 24 hours.',
          3)
      ON CONFLICT DO NOTHING;
    `, [catMap['orders-shipping'], catMap['returns-refunds'], catMap['products-pricing'], catMap['account-billing']]);

    console.log("FAQ items seeded.");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
