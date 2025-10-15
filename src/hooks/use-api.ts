import { useQuery } from "convex/react";
import { FunctionReference, FunctionReturnType } from "convex/server";

type ConvexQueryFunction = FunctionReference<"query">;

export function useApiQuery<
  Query extends ConvexQueryFunction,
  Args = Parameters<Query>[0],
  Result = FunctionReturnType<Query>
>(
  query: Query,
  args?: Args
): Result | undefined {
  return useQuery(query, args) as Result | undefined;
}