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
      headers: { origin: "https://test.example.com" },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Dashboard Statistics", () => {
  it("should return dashboard statistics for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.dashboard.getStatistics();

    expect(stats).toBeDefined();
    expect(stats.totalPapers).toBeGreaterThanOrEqual(0);
    expect(stats.completedPapers).toBeGreaterThanOrEqual(0);
    expect(stats.averageQualityScore).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(stats.paperTypeDistribution)).toBe(true);
    expect(Array.isArray(stats.citationFormatDistribution)).toBe(true);
    expect(Array.isArray(stats.qualityTrend)).toBe(true);
    expect(Array.isArray(stats.recentPapers)).toBe(true);
  });
});

describe("Reference Management", () => {
  it("should search for academic references", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test paper first
    const paper = await caller.paper.create({
      type: "journal",
      title: "Test Paper for References",
    });

    const result = await caller.reference.search({
      paperId: paper.id,
      query: "machine learning",
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.references)).toBe(true);
  }, 10000);

  it("should add a reference manually", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test paper
    const paper = await caller.paper.create({
      type: "journal",
      title: "Test Paper for Manual Reference",
    });

    const reference = await caller.reference.add({
      paperId: paper.id,
      title: "Test Reference",
      authors: ["John Doe", "Jane Smith"],
      year: 2023,
      journal: "Test Journal",
      volume: "10",
      issue: "2",
      pages: "123-130",
    });

    expect(reference).toBeDefined();
    expect(reference.id).toBeGreaterThan(0);
  });

  it("should list references for a paper", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test paper
    const paper = await caller.paper.create({
      type: "journal",
      title: "Test Paper for Reference List",
    });

    // Add a reference
    await caller.reference.add({
      paperId: paper.id,
      title: "Test Reference",
      authors: ["John Doe"],
      year: 2023,
    });

    const references = await caller.reference.list({ paperId: paper.id });

    expect(Array.isArray(references)).toBe(true);
    expect(references.length).toBeGreaterThan(0);
  });

  it("should delete a reference", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test paper
    const paper = await caller.paper.create({
      type: "journal",
      title: "Test Paper for Reference Deletion",
    });

    // Add a reference
    const reference = await caller.reference.add({
      paperId: paper.id,
      title: "Test Reference to Delete",
      authors: ["John Doe"],
      year: 2023,
    });

    // Delete the reference
    const result = await caller.reference.delete({ id: reference.id });

    expect(result.success).toBe(true);

    // Verify deletion
    const references = await caller.reference.list({ paperId: paper.id });
    expect(references.find((r) => r.id === reference.id)).toBeUndefined();
  });
});

describe("Quality Check", () => {
  it("should perform quality check on paper content", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test paper
    const paper = await caller.paper.create({
      type: "journal",
      title: "Test Paper for Quality Check",
    });

    // Generate outline and content first
    await caller.paper.generateOutline({ id: paper.id });
    await caller.paper.generateContent({ id: paper.id });

    // Perform quality check
    const result = await caller.quality.check({ paperId: paper.id });

    expect(result).toBeDefined();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  }, 120000);

  it("should retrieve quality check history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test paper
    const paper = await caller.paper.create({
      type: "journal",
      title: "Test Paper for Quality History",
    });

    const history = await caller.quality.getHistory({ paperId: paper.id });

    expect(Array.isArray(history)).toBe(true);
  });
});

describe("AI Polish", () => {
  it("should polish selected text", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.polish.text({
      text: "这是一个需要润色的句子。",
    });

    expect(result).toBeDefined();
  }, 30000); // 30 second timeout for LLM operations

  it("should polish paragraphs in batch", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.polish.paragraphs({
      paragraphs: [
        "第一段需要润色的内容。",
        "第二段需要润色的内容。",
      ],
    });

    expect(result).toBeDefined();
  }, 60000); // 60 second timeout for LLM operations
});
