import { getProductBySlug } from "./src/lib/products.js";

const slug = "walter-zip-wheel-cutting-25pk";
try {
  const product = await getProductBySlug(slug);
  console.log("Product:", JSON.stringify(product, null, 2));
} catch (err) {
  console.error("ERROR:", err);
}
process.exit(0);
