import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as semanticScholar from "./semanticScholar";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("scholar.searchPapers", () => {
  it("should pass validated parameters to semantic scholar client", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const mock = vi
      .spyOn(semanticScholar, "searchPapers")
      .mockResolvedValue({ total: 0, data: [] });

    await caller.scholar.searchPapers({
      query: "transformer attention",
      limit: 5,
      year: "2020-2024",
      fields_of_study: "Computer Science",
      open_access_only: true,
      offset: 10,
    });

    expect(mock).toHaveBeenCalledWith({
      query: "transformer attention",
      limit: 5,
      year: "2020-2024",
      fields_of_study: "Computer Science",
      open_access_only: true,
      offset: 10,
    });

    mock.mockRestore();
  });

  it("should reject invalid limit", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.scholar.searchPapers({ query: "machine learning", limit: 101 })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});
