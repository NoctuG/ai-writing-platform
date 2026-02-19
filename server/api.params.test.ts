import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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

describe("API参数名称一致性测试", () => {
  it("generateOutline应接受id参数", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 这个测试验证API接受正确的参数名称
    // 实际调用会失败因为没有真实的数据库记录，但参数验证应该通过
    try {
      await caller.paper.generateOutline({ id: 999 });
    } catch (error: any) {
      // 应该是NOT_FOUND错误，而不是参数验证错误
      expect(error.code).toBe("NOT_FOUND");
      expect(error.message).toBe("论文不存在");
    }
  });

  it("generateContent应接受id参数", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.paper.generateContent({ id: 999 });
    } catch (error: any) {
      // 应该是NOT_FOUND错误，而不是参数验证错误
      expect(error.code).toBe("NOT_FOUND");
      expect(error.message).toBe("论文不存在");
    }
  });
});
