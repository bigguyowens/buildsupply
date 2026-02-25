import type { Product } from "@/lib/products";

export const PRICE_OPTIONS = [
  { label: "All Prices",     value: ""           },
  { label: "Under $25",      value: "under-25",   max: 25             },
  { label: "$25 – $100",     value: "25-100",     min: 25,  max: 100  },
  { label: "$100 – $500",    value: "100-500",    min: 100, max: 500  },
  { label: "Over $500",      value: "over-500",   min: 500            },
];

export function filterProductsByParams(
  products: Product[],
  category?: string | null,
  priceValue?: string | null,
) {
  return products.filter((product) => {
    const categoryMatch = !category || product.category === category;
    const priceOption = PRICE_OPTIONS.find((o) => o.value === priceValue);
    const priceMatch =
      !priceOption || priceOption.value === "" ||
      ((priceOption.min === undefined || product.price >= priceOption.min) &&
       (priceOption.max === undefined || product.price <= priceOption.max));
    return categoryMatch && priceMatch;
  });
}
