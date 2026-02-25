import { getProductBySlug } from "./src/lib/products";

async function main() {
  const slug = "walter-zip-wheel-cutting-25pk";
  try {
    const product = await getProductBySlug(slug);
    console.log("tags type:", typeof product?.tags, "isArray:", Array.isArray(product?.tags));
    console.log("gallery type:", typeof product?.gallery, "isArray:", Array.isArray(product?.gallery));
    console.log("Product OK:", product?.name);
    console.log("tags value:", product?.tags);
  } catch (err) {
    console.error("ERROR:", err);
  }
}
main().then(() => process.exit(0));
