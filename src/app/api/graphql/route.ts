import { createSchema, createYoga } from "graphql-yoga";
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

const { handleRequest } = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Product {
        id: ID!
        name: String!
        slug: String!
        description: String!
        price: Float!
        currency: String!
        category: String!
        subcategory: String!
        tags: [String!]!
        image: String!
        gallery: [String!]!
        rating: Float!
        ratingCount: Int!
        inventory: Int!
        featured: Boolean!
        brand: String!
        sku: String!
        unit: String!
      }

      type Category {
        id: ID!
        name: String!
        slug: String!
        description: String!
        image: String!
        productCount: Int
      }

      type Query {
        products: [Product!]!
        featuredProducts: [Product!]!
        product(slug: String!): Product
        productsByCategory(category: String!): [Product!]!
        productsBySubcategory(category: String!, subcategory: String!): [Product!]!
        subcategoriesByCategory(category: String!): [String!]!
        searchProducts(term: String!): [Product!]!
        searchCategories(term: String!): [Category!]!
        categories: [Category!]!
        category(slug: String!): Category
      }
    `,
    resolvers: {
      Query: {
        products: () => getProducts(),
        featuredProducts: () => getFeaturedProducts(),
        product: (_: unknown, args: { slug: string }) => getProductBySlug(args.slug),
        productsByCategory: (_: unknown, args: { category: string }) => getProductsByCategory(args.category),
        productsBySubcategory: (_: unknown, args: { category: string; subcategory: string }) => getProductsBySubcategory(args.category, args.subcategory),
        subcategoriesByCategory: (_: unknown, args: { category: string }) => getSubcategoriesByCategory(args.category),
        searchProducts: (_: unknown, args: { term: string }) => searchProducts(args.term),
        searchCategories: (_: unknown, args: { term: string }) => searchCategories(args.term),
        categories: () => getCategories(),
        category: (_: unknown, args: { slug: string }) => getCategoryBySlug(args.slug),
      },
    },
  }),
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response, Request, Headers },
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  return handleRequest(request, {});
}

export async function POST(request: Request) {
  return handleRequest(request, {});
}
