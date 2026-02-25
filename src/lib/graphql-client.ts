import { headers } from "next/headers";

type GraphQLParams = {
  query: string;
  variables?: Record<string, unknown>;
  revalidate?: number;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export async function fetchGraphQL<T>({
  query,
  variables,
  revalidate,
}: GraphQLParams) {
  // On the server, call the GraphQL resolver directly instead of HTTP
  // to avoid URL resolution issues in production
  const { graphqlResolver } = await import("@/lib/graphql-resolver");
  const payload = await graphqlResolver<T>(query, variables);

  if ("errors" in payload && payload.errors?.length) {
    throw new Error((payload.errors as Array<{ message: string }>)[0].message);
  }

  if (!payload.data) {
    throw new Error("GraphQL response missing data");
  }

  return payload.data as T;
}
