import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
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

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("paper.create", () => {
  it("should create a new paper with valid input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.paper.create({
      title: "人工智能在医疗领域的应用研究",
      type: "graduation",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
    expect(result.id).toBeGreaterThan(0);
  });

  it("should reject empty title", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.paper.create({
        title: "",
        type: "journal",
      })
    ).rejects.toThrow();
  });

  it("should accept all paper types", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const types: Array<"graduation" | "journal" | "proposal" | "professional"> = [
      "graduation",
      "journal",
      "proposal",
      "professional",
    ];

    for (const type of types) {
      const result = await caller.paper.create({
        title: `测试论文 - ${type}`,
        type,
      });
      expect(result.id).toBeGreaterThan(0);
    }
  });
});

describe("paper.list", () => {
  it("should return an array of papers for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test paper first
    await caller.paper.create({
      title: "测试论文列表",
      type: "journal",
    });

    const papers = await caller.paper.list();

    expect(Array.isArray(papers)).toBe(true);
    expect(papers.length).toBeGreaterThan(0);
  });
});

describe("paper.getById", () => {
  it("should return paper details for valid id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test paper
    const created = await caller.paper.create({
      title: "测试论文详情",
      type: "proposal",
    });

    const paper = await caller.paper.getById({ id: created.id });

    expect(paper).toBeDefined();
    expect(paper.id).toBe(created.id);
    expect(paper.title).toBe("测试论文详情");
    expect(paper.type).toBe("proposal");
    expect(paper.status).toBe("generating");
  });

  it("should throw error for non-existent paper", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.paper.getById({ id: 999999 })).rejects.toThrow("论文不存在");
  });
});

describe("paper.delete", () => {
  it("should delete paper successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test paper
    const created = await caller.paper.create({
      title: "待删除的测试论文",
      type: "professional",
    });

    const result = await caller.paper.delete({ id: created.id });

    expect(result.success).toBe(true);

    // Verify it's deleted
    await expect(caller.paper.getById({ id: created.id })).rejects.toThrow("论文不存在");
  });

  it("should throw error when deleting non-existent paper", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.paper.delete({ id: 999999 })).rejects.toThrow("论文不存在");
  });
});
