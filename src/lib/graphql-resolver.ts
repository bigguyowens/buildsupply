import {
  getFeaturedProducts,
  getProductBySlug,
  getProducts,
  getProductsByCategory,
  getProductsBySubcategory,
  getSubcategoriesByCategory,
  searchProducts,
  searchCategories,
  getCategories,
  getCategoryBySlug,
} from "@/lib/products";

type Variables = Record<string, unknown>;

// Execute GraphQL-like queries directly without HTTP round-trip
export async function graphqlResolver<T>(
  query: string,
  variables: Variables = {}
): Promise<{ data?: T; errors?: Array<{ message: string }> }> {
  try {
    const result: Record<string, unknown> = {};

    // Parse which fields are requested and resolve them
    if (query.includes("categories") && !query.includes("category(")) {
      result.categories = await getCategories();
    }

    if (query.includes("category(")) {
      const slug = variables.slug as string;
      result.category = slug ? await getCategoryBySlug(slug) : null;
    }

    if (query.includes("productsBySubcategory")) {
      const category = variables.category as string;
      const subcategory = variables.subcategory as string;
      result.productsBySubcategory = await getProductsBySubcategory(category, subcategory);
    } else if (query.includes("productsByCategory")) {
      const category = variables.category as string;
      result.productsByCategory = await getProductsByCategory(category);
    }

    if (query.includes("subcategoriesByCategory")) {
      const category = variables.category as string;
      result.subcategoriesByCategory = await getSubcategoriesByCategory(category);
    }

    if (query.includes("featuredProducts")) {
      result.featuredProducts = await getFeaturedProducts();
    }

    if (query.includes("searchProducts")) {
      const term = variables.term as string;
      result.searchProducts = await searchProducts(term);
    }

    if (query.includes("searchCategories")) {
      const term = variables.term as string;
      result.searchCategories = await searchCategories(term);
    }

    if (query.includes("products") && !query.includes("productsByCategory") && !query.includes("productsBySubcategory") && !query.includes("featuredProducts") && !query.includes("searchProducts")) {
      result.products = await getProducts();
    }

    if (query.includes("product(")) {
      const slug = variables.slug as string;
      result.product = slug ? await getProductBySlug(slug) : null;
    }

    return { data: result as T };
  } catch (err) {
    return { errors: [{ message: (err as Error).message }] };
  }
}
