import { describe, expect, it } from "vitest";
import {
  buildHeadingNumberingConfig,
  DEFAULT_WORD_STYLE_PROFILE,
  markdownToDocxParagraphs,
  resolveWordStyleProfile,
} from "./documentExport";

describe("documentExport", () => {
  it("maps markdown headings to styled and numbered paragraphs", () => {
    const paragraphs = markdownToDocxParagraphs("# 一级\n## 二级\n### 三级", DEFAULT_WORD_STYLE_PROFILE);

    const [h1, h2, h3] = paragraphs as any[];
    expect(h1.properties.root[0].root[0].root.val).toBe("Heading1");
    expect(h2.properties.root[0].root[0].root.val).toBe("Heading2");
    expect(h3.properties.root[0].root[0].root.val).toBe("Heading3");

    const getLevel = (paragraph: any) => {
      const numPr = paragraph.properties.root.find((item: any) => item.rootKey === "w:numPr");
      const ilvl = numPr.root.find((item: any) => item.rootKey === "w:ilvl");
      return ilvl.root[0].root.val;
    };

    expect(getLevel(h1)).toBe(0);
    expect(getLevel(h2)).toBe(1);
    expect(getLevel(h3)).toBe(2);
  });

  it("builds heading numbering schema 1 / 1.1 / 1.1.1", () => {
    const numbering = buildHeadingNumberingConfig();
    const levels = numbering.config[0].levels;

    expect(levels[0].text).toBe("%1.");
    expect(levels[1].text).toBe("%1.%2");
    expect(levels[2].text).toBe("%1.%2.%3");
  });

  it("splits mixed zh-en runs and keeps bold/italic semantics", () => {
    const paragraphs = markdownToDocxParagraphs("普通中文English混排 **加粗Bold** *斜体Italic*", DEFAULT_WORD_STYLE_PROFILE);
    const body = paragraphs[0] as any;
    const runs = body.root.slice(1);

    expect(runs.length).toBeGreaterThanOrEqual(6);

    const boldRun = runs.find((run: any) => {
      const keys = run.properties.root.map((item: any) => item.rootKey);
      return keys.includes("w:b");
    });

    const italicRun = runs.find((run: any) => {
      const keys = run.properties.root.map((item: any) => item.rootKey);
      return keys.includes("w:i");
    });

    expect(boldRun).toBeTruthy();
    expect(italicRun).toBeTruthy();

    const firstRunFonts = runs[0].properties.root.find((item: any) => item.rootKey === "w:rFonts");
    expect(firstRunFonts.root[0].root.eastAsia).toBe("宋体");
  });

  it("applies custom style profile with exact line spacing", () => {
    const profile = resolveWordStyleProfile({
      lineSpacing: { mode: "exact", value: 24 },
      latinFont: "Arial",
    });

    expect(profile.profileName).toBe("高校通用毕业论文");
    expect(profile.lineSpacing.mode).toBe("exact");
    expect(profile.lineSpacing.value).toBe(24);
    expect(profile.latinFont).toBe("Arial");
  });
});
