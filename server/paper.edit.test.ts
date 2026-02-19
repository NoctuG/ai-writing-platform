import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-edit",
    email: "test-edit@example.com",
    name: "Test User Edit",
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

describe("paper.saveEdit", () => {
  it("should save edited outline and create version", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a paper first with initial outline
    const created = await caller.paper.create({
      title: "测试编辑功能论文",
      type: "journal",
    });

    // Manually set outline to avoid LLM call
    const { updatePaper } = await import("./db");
    await updatePaper(created.id, {
      outline: "# 初始大纲\n\n## 第一章",
    });

    // Edit the outline
    const result = await caller.paper.saveEdit({
      id: created.id,
      outline: "# 修改后的大纲\n\n## 第一章\n内容...",
      changeDescription: "修改大纲结构",
    });

    expect(result.success).toBe(true);
    expect(result.versionNumber).toBe(1);

    // Verify the paper was updated
    const paper = await caller.paper.getById({ id: created.id });
    expect(paper.outline).toContain("修改后的大纲");
  });

  it("should save edited content and create version", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a paper
    const created = await caller.paper.create({
      title: "测试内容编辑论文",
      type: "proposal",
    });

    // Manually set outline and content to avoid LLM calls
    const { updatePaper } = await import("./db");
    await updatePaper(created.id, {
      outline: "# 初始大纲",
      content: "# 初始内容",
    });

    // Edit the content
    const result = await caller.paper.saveEdit({
      id: created.id,
      content: "# 修改后的内容\n\n这是编辑后的论文全文内容。",
      changeDescription: "修改论文内容",
    });

    expect(result.success).toBe(true);
    expect(result.versionNumber).toBeGreaterThan(0);
  });
});

describe("paper.getVersions", () => {
  it("should return version history for a paper", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a paper
    const created = await caller.paper.create({
      title: "测试版本历史论文",
      type: "graduation",
    });

    // Manually set outline to avoid LLM call
    const { updatePaper } = await import("./db");
    await updatePaper(created.id, {
      outline: "# 初始大纲",
    });

    // Make multiple edits
    await caller.paper.saveEdit({
      id: created.id,
      outline: "# 第一次修改",
      changeDescription: "第一次编辑",
    });

    await caller.paper.saveEdit({
      id: created.id,
      outline: "# 第二次修改",
      changeDescription: "第二次编辑",
    });

    // Get versions
    const versions = await caller.paper.getVersions({ paperId: created.id });

    expect(Array.isArray(versions)).toBe(true);
    expect(versions.length).toBeGreaterThanOrEqual(2);
    expect(versions[0].versionNumber).toBeGreaterThan(versions[1].versionNumber); // Descending order
  });
});

describe("paper.restoreVersion", () => {
  it("should restore a previous version", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a paper
    const created = await caller.paper.create({
      title: "测试版本恢复论文",
      type: "professional",
    });

    // Manually set outline to avoid LLM call
    const { updatePaper } = await import("./db");
    await updatePaper(created.id, {
      outline: "# 初始大纲",
    });

    // First edit
    await caller.paper.saveEdit({
      id: created.id,
      outline: "# 原始版本",
      changeDescription: "原始编辑",
    });

    // Get the first version
    const versions1 = await caller.paper.getVersions({ paperId: created.id });
    const firstVersionId = versions1[0].id;

    // Second edit
    await caller.paper.saveEdit({
      id: created.id,
      outline: "# 修改后版本",
      changeDescription: "修改编辑",
    });

    // Restore to first version
    const restoreResult = await caller.paper.restoreVersion({ versionId: firstVersionId });
    expect(restoreResult.success).toBe(true);

    // Verify the paper was restored
    const paper = await caller.paper.getById({ id: created.id });
    expect(paper.outline).toContain("原始版本");
  });
});
