export const PRODUCT_FIELDS = `
  id name slug description price currency category subcategory
  tags image gallery rating ratingCount inventory featured brand sku unit
`;

export const PRODUCTS_QUERY = /* GraphQL */ `
  query Products {
    products {
      ${PRODUCT_FIELDS}
    }
  }
`;

export const FEATURED_QUERY = /* GraphQL */ `
  query FeaturedProducts {
    featuredProducts {
      ${PRODUCT_FIELDS}
    }
  }
`;

export const CATEGORIES_QUERY = /* GraphQL */ `
  query Categories {
    categories {
      id name slug description image productCount
    }
  }
`;
