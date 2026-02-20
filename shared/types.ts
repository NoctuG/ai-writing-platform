/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

export const PAPER_STRUCTURE_MODULES = [
  "cover",
  "integrityStatement",
  "authorizationLetter",
  "chineseAbstractKeywords",
  "englishAbstractKeywords",
  "body",
  "references",
  "acknowledgements",
] as const;

export type PaperStructureModule = (typeof PAPER_STRUCTURE_MODULES)[number];

export type PaperStructureConfig = {
  module: PaperStructureModule;
  label: string;
  enabled: boolean;
  order: number;
  required: boolean;
};

const createStructureConfig = (
  enabledModules: PaperStructureModule[]
): PaperStructureConfig[] =>
  PAPER_STRUCTURE_MODULES.map((module, index) => ({
    module,
    label: paperStructureModuleLabels[module],
    enabled: enabledModules.includes(module),
    order: index + 1,
    required: true,
  }));

export const paperStructureModuleLabels: Record<PaperStructureModule, string> = {
  cover: "封面",
  integrityStatement: "诚信声明",
  authorizationLetter: "授权书",
  chineseAbstractKeywords: "中文摘要与关键词",
  englishAbstractKeywords: "英文摘要与关键词",
  body: "正文",
  references: "参考文献",
  acknowledgements: "致谢",
};

export const defaultPaperStructureByType = {
  graduation: createStructureConfig(PAPER_STRUCTURE_MODULES.slice()),
  journal: createStructureConfig([
    "chineseAbstractKeywords",
    "englishAbstractKeywords",
    "body",
    "references",
  ]),
  proposal: createStructureConfig([
    "cover",
    "body",
    "references",
  ]),
  professional: createStructureConfig([
    "cover",
    "chineseAbstractKeywords",
    "body",
    "references",
  ]),
} as const;

export const graduationStructureOrderText = PAPER_STRUCTURE_MODULES.map(
  module => paperStructureModuleLabels[module]
).join(" → ");
