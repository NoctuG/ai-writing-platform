import { describe, expect, it } from "vitest";
import { formatReference, type ReferenceData } from "./referenceFormatter";
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
    res: {} as TrpcContext["res"],
  };
}

describe("Reference Formatter", () => {
  const sampleRef: ReferenceData = {
    title: "人工智能在学术写作中的应用研究",
    authors: ["张三", "李四", "王五"],
    year: 2023,
    journal: "计算机科学",
    volume: "50",
    issue: "3",
    pages: "123-130",
    doi: "10.1234/cs.2023.03.001",
  };

  it("should format reference in GB/T 7714 style", () => {
    const formatted = formatReference(sampleRef, "gbt7714");
    expect(formatted).toContain("张三, 李四, 王五");
    expect(formatted).toContain("人工智能在学术写作中的应用研究[J]");
    expect(formatted).toContain("计算机科学");
    expect(formatted).toContain("2023");
    expect(formatted).toContain("50(3)");
    expect(formatted).toContain("123-130");
  });

  it("should format reference in APA style", () => {
    const formatted = formatReference(sampleRef, "apa");
    expect(formatted).toContain("张三, 李四, 王五");
    expect(formatted).toContain("(2023)");
    expect(formatted).toContain("人工智能在学术写作中的应用研究");
    expect(formatted).toContain("计算机科学, 50(3), 123-130");
  });

  it("should format reference in MLA style", () => {
    const formatted = formatReference(sampleRef, "mla");
    expect(formatted).toContain("张三, et al");
    expect(formatted).toContain('"人工智能在学术写作中的应用研究."');
    expect(formatted).toContain("vol. 50");
    expect(formatted).toContain("no. 3");
    expect(formatted).toContain("2023");
  });

  it("should format reference in Chicago style", () => {
    const formatted = formatReference(sampleRef, "chicago");
    expect(formatted).toContain("张三, 李四, 王五");
    expect(formatted).toContain('"人工智能在学术写作中的应用研究."');
    expect(formatted).toContain("计算机科学 50");
    expect(formatted).toContain("no. 3");
    expect(formatted).toContain("(2023)");
    expect(formatted).toContain(": 123-130");
  });

  it("should handle references with many authors", () => {
    const manyAuthorsRef: ReferenceData = {
      ...sampleRef,
      authors: ["作者1", "作者2", "作者3", "作者4", "作者5"],
    };
    const formatted = formatReference(manyAuthorsRef, "gbt7714");
    expect(formatted).toContain("作者1, 作者2, 作者3, 等");
  });

  it("should handle references without optional fields", () => {
    const minimalRef: ReferenceData = {
      title: "简单论文标题",
      authors: ["单一作者"],
      year: 2024,
    };
    const formatted = formatReference(minimalRef, "gbt7714");
    expect(formatted).toContain("单一作者");
    expect(formatted).toContain("简单论文标题[J]");
    expect(formatted).toContain("2024");
  });
});

describe("Advanced Features Integration", () => {
  it("should create auth context successfully", () => {
    const ctx = createAuthContext();
    expect(ctx.user).toBeDefined();
    expect(ctx.user?.email).toBe("test@example.com");
    expect(ctx.user?.role).toBe("user");
  });

  it("should validate reference data structure", () => {
    const ref: ReferenceData = {
      title: "测试标题",
      authors: ["测试作者"],
      year: 2024,
      journal: "测试期刊",
    };

    expect(ref.title).toBeTruthy();
    expect(ref.authors.length).toBeGreaterThan(0);
    expect(ref.year).toBeGreaterThan(2000);
  });
});
