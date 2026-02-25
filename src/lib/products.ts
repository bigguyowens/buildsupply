import { query } from "./db";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  subcategory: string;
  tags: string[];
  image: string;
  gallery: string[];
  rating: number;
  ratingCount: number;
  inventory: number;
  featured: boolean;
  brand: string;
  sku: string;
  unit: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount?: number;
};

type ProductRow = Omit<Product, "tags" | "gallery" | "ratingCount"> & {
  tags: string[] | string;
  gallery: string[] | string;
  rating_count: number;
};

function mapRow(row: ProductRow): Product {
  return {
    ...row,
    price:       Number(row.price),
    rating:      Number(row.rating),
    ratingCount: Number(row.rating_count),
    inventory:   Number(row.inventory),
    tags:    Array.isArray(row.tags)    ? row.tags    : JSON.parse(row.tags    as string ?? "[]"),
    gallery: Array.isArray(row.gallery) ? row.gallery : JSON.parse(row.gallery as string ?? "[]"),
  };
}

const SELECT = `
  SELECT id, name, slug, description, price, currency, category, subcategory,
         tags, image, gallery, rating, rating_count, inventory, featured, brand, sku, unit
  FROM products
`;

export async function getProducts(): Promise<Product[]> {
  const rows = await query<ProductRow>(`${SELECT} ORDER BY featured DESC, name ASC`);
  return rows.map(mapRow);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const rows = await query<ProductRow>(`${SELECT} WHERE featured = true LIMIT 12`);
  return rows.map(mapRow);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const rows = await query<ProductRow>(`${SELECT} WHERE slug = $1 LIMIT 1`, [slug]);
  return rows.length ? mapRow(rows[0]) : null;
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const rows = await query<ProductRow>(
    `${SELECT} WHERE LOWER(category) = LOWER($1) ORDER BY featured DESC, name ASC`,
    [category]
  );
  return rows.map(mapRow);
}

export async function getProductsBySubcategory(category: string, subcategory: string): Promise<Product[]> {
  const rows = await query<ProductRow>(
    `${SELECT} WHERE LOWER(category) = LOWER($1) AND LOWER(subcategory) = LOWER($2) ORDER BY featured DESC, name ASC`,
    [category, subcategory]
  );
  return rows.map(mapRow);
}

export async function getSubcategoriesByCategory(category: string): Promise<string[]> {
  const rows = await query<{ subcategory: string }>(
    `SELECT DISTINCT subcategory FROM products WHERE LOWER(category) = LOWER($1) AND subcategory IS NOT NULL AND subcategory != '' ORDER BY subcategory ASC`,
    [category]
  );
  return rows.map((r) => r.subcategory);
}

export async function searchProducts(term: string): Promise<Product[]> {
  const rows = await query<ProductRow>(
    `${SELECT} WHERE name ILIKE $1 OR category ILIKE $1 OR brand ILIKE $1 OR subcategory ILIKE $1 ORDER BY featured DESC, name ASC LIMIT 40`,
    [`%${term}%`]
  );
  return rows.map(mapRow);
}

export async function searchCategories(term: string): Promise<Category[]> {
  const rows = await query<Category>(
    `SELECT id, name, slug, description, image FROM categories WHERE name ILIKE $1 ORDER BY name ASC`,
    [`%${term}%`]
  );
  return rows;
}

export async function getCategories(): Promise<Category[]> {
  const rows = await query<Category & { product_count: number }>(`
    SELECT c.id, c.name, c.slug, c.description, c.image,
           COUNT(p.id)::int AS product_count
    FROM categories c
    LEFT JOIN products p ON LOWER(p.category) = LOWER(c.name)
    GROUP BY c.id ORDER BY c.name ASC
  `);
  return rows.map((r) => ({ ...r, productCount: r.product_count }));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const rows = await query<Category>(
    `SELECT id, name, slug, description, image FROM categories WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  return rows.length ? rows[0] : null;
}
