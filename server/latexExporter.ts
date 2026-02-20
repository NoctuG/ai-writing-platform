/**
 * LaTeX export functionality
 * Converts markdown content to LaTeX format with academic journal templates
 */

export const LATEX_TEMPLATE_IDS = [
  "generic",
  "ieee",
  "nature",
  "elsevier",
  "springer",
  "cn_cjc",
  "cn_jos",
  "thesis_undergrad",
  "thesis_master",
  "thesis_phd",
] as const;

export type JournalTemplate = (typeof LATEX_TEMPLATE_IDS)[number];

interface LaTeXExportOptions {
  title: string;
  type: string;
  content: string;
  outline?: string;
  template: JournalTemplate;
  authors?: string[];
  abstract?: string;
  keywords?: string[];
}

interface TemplateConfig {
  documentClass: string;
  packages: string[];
  frontMatterRules?: string[];
  bibliographyStyle?: string;
}

interface TemplateDescription {
  id: JournalTemplate;
  name: string;
  description: string;
  useCase: string;
}

export interface TemplateDescriptionGroup {
  category: "international_journal" | "domestic_journal" | "thesis";
  categoryName: string;
  description: string;
  templates: TemplateDescription[];
}

const templateConfigs: Record<JournalTemplate, TemplateConfig> = {
  generic: {
    documentClass: "\\documentclass[12pt,a4paper]{article}",
    packages: [
      "\\usepackage[utf8]{inputenc}",
      "\\usepackage[T1]{fontenc}",
      "\\usepackage{ctex}",
      "\\usepackage{amsmath,amssymb}",
      "\\usepackage{graphicx}",
      "\\usepackage{booktabs}",
      "\\usepackage{hyperref}",
      "\\usepackage[margin=2.5cm]{geometry}",
      "\\usepackage{setspace}",
    ],
    frontMatterRules: ["\\onehalfspacing"],
  },
  ieee: {
    documentClass: "\\documentclass[conference]{IEEEtran}",
    packages: [
      "\\usepackage[utf8]{inputenc}",
      "\\usepackage{ctex}",
      "\\usepackage{amsmath,amssymb}",
      "\\usepackage{graphicx}",
      "\\usepackage{booktabs}",
      "\\usepackage{hyperref}",
      "\\usepackage{cite}",
    ],
  },
  nature: {
    documentClass: "\\documentclass[12pt]{article}",
    packages: [
      "\\usepackage[utf8]{inputenc}",
      "\\usepackage[T1]{fontenc}",
      "\\usepackage{ctex}",
      "\\usepackage{amsmath,amssymb}",
      "\\usepackage{graphicx}",
      "\\usepackage{booktabs}",
      "\\usepackage{hyperref}",
      "\\usepackage[margin=2cm]{geometry}",
      "\\usepackage{natbib}",
      "\\usepackage{setspace}",
    ],
    frontMatterRules: ["\\doublespacing"],
    bibliographyStyle: "naturemag",
  },
  elsevier: {
    documentClass: "\\documentclass[preprint,12pt]{elsarticle}",
    packages: [
      "\\usepackage[utf8]{inputenc}",
      "\\usepackage{ctex}",
      "\\usepackage{amsmath,amssymb}",
      "\\usepackage{graphicx}",
      "\\usepackage{booktabs}",
      "\\usepackage{hyperref}",
      "\\usepackage{lineno}",
    ],
    frontMatterRules: ["\\linenumbers"],
  },
  springer: {
    documentClass: "\\documentclass[smallextended]{svjour3}",
    packages: [
      "\\usepackage[utf8]{inputenc}",
      "\\usepackage{ctex}",
      "\\usepackage{amsmath,amssymb}",
      "\\usepackage{graphicx}",
      "\\usepackage{booktabs}",
      "\\usepackage{hyperref}",
    ],
  },
  cn_cjc: {
    documentClass: "\\documentclass[UTF8,zihao=-4]{ctexart}",
    packages: [
      "\\usepackage{amsmath,amssymb}",
      "\\usepackage{graphicx}",
      "\\usepackage{booktabs}",
      "\\usepackage{hyperref}",
      "\\usepackage{geometry}",
      "\\geometry{a4paper,margin=2.5cm}",
      "\\usepackage{setspace}",
    ],
    frontMatterRules: ["\\onehalfspacing"],
    bibliographyStyle: "gbt7714-numerical",
  },
  cn_jos: {
    documentClass: "\\documentclass[UTF8,zihao=-4]{ctexart}",
    packages: [
      "\\usepackage{amsmath,amssymb}",
      "\\usepackage{graphicx}",
      "\\usepackage{booktabs}",
      "\\usepackage{hyperref}",
      "\\usepackage{geometry}",
      "\\geometry{a4paper,margin=2.2cm}",
      "\\usepackage{setspace}",
    ],
    frontMatterRules: ["\\setstretch{1.3}"],
    bibliographyStyle: "gbt7714-numerical",
  },
  thesis_undergrad: {
    documentClass: "\\documentclass[UTF8,zihao=-4,oneside]{ctexrep}",
    packages: [
      "\\usepackage{amsmath,amssymb}",
      "\\usepackage{graphicx}",
      "\\usepackage{booktabs}",
      "\\usepackage{hyperref}",
      "\\usepackage{geometry}",
      "\\geometry{a4paper,margin=2.5cm}",
      "\\usepackage{setspace}",
    ],
    frontMatterRules: ["\\onehalfspacing"],
    bibliographyStyle: "gbt7714-numerical",
  },
  thesis_master: {
    documentClass: "\\documentclass[UTF8,zihao=-4,oneside]{ctexbook}",
    packages: [
      "\\usepackage{amsmath,amssymb}",
      "\\usepackage{graphicx}",
      "\\usepackage{booktabs}",
      "\\usepackage{hyperref}",
      "\\usepackage{geometry}",
      "\\geometry{a4paper,margin=2.5cm}",
      "\\usepackage{setspace}",
    ],
    frontMatterRules: ["\\setstretch{1.5}"],
    bibliographyStyle: "gbt7714-numerical",
  },
  thesis_phd: {
    documentClass: "\\documentclass[UTF8,zihao=-4,oneside]{ctexbook}",
    packages: [
      "\\usepackage{amsmath,amssymb}",
      "\\usepackage{graphicx}",
      "\\usepackage{booktabs}",
      "\\usepackage{hyperref}",
      "\\usepackage{geometry}",
      "\\geometry{a4paper,margin=2.8cm}",
      "\\usepackage{setspace}",
    ],
    frontMatterRules: ["\\setstretch{1.6}"],
    bibliographyStyle: "gbt7714-numerical",
  },
};

function buildTemplatePreamble(template: JournalTemplate): string {
  const config = templateConfigs[template] || templateConfigs.generic;
  const lines = [config.documentClass, ...config.packages];

  if (config.bibliographyStyle) {
    lines.push(`\\bibliographystyle{${config.bibliographyStyle}}`);
  }

  if (config.frontMatterRules && config.frontMatterRules.length > 0) {
    lines.push(...config.frontMatterRules);
  }

  return lines.join("\n");
}

/**
 * Convert Markdown text to LaTeX
 */
function markdownToLatex(markdown: string): string {
  let latex = markdown;

  // Headers
  latex = latex.replace(/^### (.+)$/gm, "\\subsubsection{$1}");
  latex = latex.replace(/^## (.+)$/gm, "\\subsection{$1}");
  latex = latex.replace(/^# (.+)$/gm, "\\section{$1}");

  // Bold and italic
  latex = latex.replace(/\*\*\*(.+?)\*\*\*/g, "\\textbf{\\textit{$1}}");
  latex = latex.replace(/\*\*(.+?)\*\*/g, "\\textbf{$1}");
  latex = latex.replace(/\*(.+?)\*/g, "\\textit{$1}");

  // Inline code
  latex = latex.replace(/`([^`]+)`/g, "\\texttt{$1}");

  // Lists
  latex = latex.replace(/^- (.+)$/gm, "\\item $1");
  latex = latex.replace(/(\\item .+\n)+/g, match => {
    return "\\begin{itemize}\n" + match + "\\end{itemize}\n";
  });

  // Numbered lists
  latex = latex.replace(/^\d+\. (.+)$/gm, "\\item $1");

  // Citations [1] -> \cite{ref1}
  latex = latex.replace(/\[(\d+)\]/g, "\\cite{ref$1}");

  // Tables (basic markdown table conversion)
  latex = latex.replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g, (_, header, body) => {
    const headers = header
      .split("|")
      .map((h: string) => h.trim())
      .filter(Boolean);
    const rows = body
      .trim()
      .split("\n")
      .map((row: string) => row.split("|").map((c: string) => c.trim()).filter(Boolean));
    const colSpec = headers.map(() => "c").join(" ");
    let table = `\\begin{table}[htbp]\n\\centering\n\\begin{tabular}{${colSpec}}\n\\toprule\n`;
    table += headers.join(" & ") + " \\\\\n\\midrule\n";
    rows.forEach((row: string[]) => {
      table += row.join(" & ") + " \\\\\n";
    });
    table += "\\bottomrule\n\\end{tabular}\n\\end{table}\n";
    return table;
  });

  // Special characters
  latex = latex.replace(/&/g, "\\&");
  latex = latex.replace(/%/g, "\\%");
  latex = latex.replace(/#(?!\\)/g, "\\#");

  // Paragraphs
  latex = latex.replace(/\n\n/g, "\n\n");

  return latex;
}

/**
 * Generate a complete LaTeX document
 */
export function generateLatexDocument(options: LaTeXExportOptions): string {
  const { title, content, template, authors, abstract, keywords } = options;
  const preamble = buildTemplatePreamble(template);
  const bodyContent = markdownToLatex(content);

  let authorStr = "";
  if (authors && authors.length > 0) {
    if (template === "elsevier") {
      authorStr = authors.map(a => `\\author{${a}}`).join("\n");
    } else {
      authorStr = `\\author{${authors.join(" \\and ")}}`;
    }
  }

  let abstractSection = "";
  if (abstract) {
    abstractSection = `\\begin{abstract}\n${abstract}\n\\end{abstract}`;
  }

  let keywordsSection = "";
  if (keywords && keywords.length > 0) {
    if (template === "elsevier") {
      keywordsSection = `\\begin{keyword}\n${keywords.join(" \\sep ")}\n\\end{keyword}`;
    } else {
      keywordsSection = `\\noindent\\textbf{关键词：}${keywords.join("；")}\\\\`;
    }
  }

  const doc = `${preamble}

\\title{${title}}
${authorStr}
\\date{\\today}

\\begin{document}

\\maketitle

${abstractSection}

${keywordsSection}

${bodyContent}

\\end{document}
`;

  return doc;
}

/**
 * Get available template descriptions
 */
export function getTemplateDescriptions(): TemplateDescriptionGroup[] {
  return [
    {
      category: "international_journal",
      categoryName: "国际期刊",
      description: "适用于英文投稿或国际出版社模板要求。",
      templates: [
        { id: "generic", name: "通用模板", description: "通用学术论文版式，12pt字号，A4纸张", useCase: "预审稿与跨学科初稿" },
        { id: "ieee", name: "IEEE", description: "IEEE会议/期刊格式，双栏排版", useCase: "计算机与电子信息会议投稿" },
        { id: "nature", name: "Nature", description: "Nature风格，双倍行距", useCase: "生命科学与综合类国际期刊" },
        { id: "elsevier", name: "Elsevier", description: "Elsevier 预印版格式，含行号", useCase: "工程与应用科学期刊投稿" },
        { id: "springer", name: "Springer", description: "Springer 期刊模板风格", useCase: "Springer 系列期刊投稿" },
      ],
    },
    {
      category: "domestic_journal",
      categoryName: "国内期刊",
      description: "适用于中文核心与国内学术期刊常见规范。",
      templates: [
        { id: "cn_cjc", name: "中国通信（CJC）", description: "中文期刊模板（通信方向）", useCase: "通信与信息网络方向中文稿件" },
        { id: "cn_jos", name: "软件学报（JOS）", description: "中文期刊模板（软件与系统方向）", useCase: "计算机软件与理论研究投稿" },
      ],
    },
    {
      category: "thesis",
      categoryName: "学位论文",
      description: "适用于高校毕业论文与研究生学位论文写作。",
      templates: [
        { id: "thesis_undergrad", name: "本科毕业论文", description: "本科毕业设计/论文基础版式", useCase: "本科毕业论文提交与答辩材料" },
        { id: "thesis_master", name: "硕士学位论文", description: "硕士论文常用章节与行距设置", useCase: "硕士学位论文送审与归档" },
        { id: "thesis_phd", name: "博士学位论文", description: "博士论文排版与较宽边距", useCase: "博士学位论文预审与终稿" },
      ],
    },
  ];
}
