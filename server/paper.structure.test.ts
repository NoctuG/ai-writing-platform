import { describe, expect, it } from "vitest";
import {
  PAPER_STRUCTURE_MODULES,
  paperStructureModuleLabels,
} from "@shared/types";
import { enforceGraduationModuleOrder } from "./routers";

const moduleHeadings = PAPER_STRUCTURE_MODULES.map(
  module => `## ${paperStructureModuleLabels[module]}`
);

describe("paper graduation structure regression", () => {
  it("should include all required modules in fixed order for graduation outline", () => {
    const rawOutline = `# 论文大纲\n\n## 正文\n- 第一章\n\n## 参考文献\n- [1]`;

    const normalized = enforceGraduationModuleOrder(rawOutline, "outline");

    for (const heading of moduleHeadings) {
      expect(normalized).toContain(heading);
    }

    const positions = moduleHeadings.map(heading => normalized.indexOf(heading));
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("should keep acknowledgements after references in graduation content", () => {
    const rawContent = `# 论文全文\n\n## 致谢\n感谢导师。\n\n## 中文摘要与关键词\n摘要内容\n关键词：测试\n\n## 参考文献\n[1] 示例文献`; 

    const normalized = enforceGraduationModuleOrder(rawContent, "content");

    expect(normalized.indexOf("## 参考文献")).toBeLessThan(
      normalized.indexOf("## 致谢")
    );

    for (const heading of moduleHeadings) {
      expect(normalized).toContain(heading);
    }
  });
});
