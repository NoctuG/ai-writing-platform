/**
 * LaTeX export functionality
 * Converts markdown content to LaTeX format with academic journal templates
 */

export type JournalTemplate = "generic" | "ieee" | "nature" | "elsevier" | "springer";

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

const templatePreambles: Record<JournalTemplate, string> = {
  generic: `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{ctex}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{hyperref}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{setspace}
\\onehalfspacing`,

  ieee: `\\documentclass[conference]{IEEEtran}
\\usepackage[utf8]{inputenc}
\\usepackage{ctex}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{hyperref}
\\usepackage{cite}`,

  nature: `\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{ctex}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{hyperref}
\\usepackage[margin=2cm]{geometry}
\\usepackage{natbib}
\\bibliographystyle{naturemag}
\\usepackage{setspace}
\\doublespacing`,

  elsevier: `\\documentclass[preprint,12pt]{elsarticle}
\\usepackage[utf8]{inputenc}
\\usepackage{ctex}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{hyperref}
\\usepackage{lineno}
\\linenumbers`,

  springer: `\\documentclass[smallextended]{svjour3}
\\usepackage[utf8]{inputenc}
\\usepackage{ctex}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{hyperref}`,
};

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
  latex = latex.replace(/(\\item .+\n)+/g, (match) => {
    return "\\begin{itemize}\n" + match + "\\end{itemize}\n";
  });

  // Numbered lists
  latex = latex.replace(/^\d+\. (.+)$/gm, "\\item $1");

  // Citations [1] -> \cite{ref1}
  latex = latex.replace(/\[(\d+)\]/g, "\\cite{ref$1}");

  // Tables (basic markdown table conversion)
  latex = latex.replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g, (_, header, body) => {
    const headers = header.split("|").map((h: string) => h.trim()).filter(Boolean);
    const rows = body.trim().split("\n").map((row: string) =>
      row.split("|").map((c: string) => c.trim()).filter(Boolean)
    );
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
  const preamble = templatePreambles[template] || templatePreambles.generic;
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
export function getTemplateDescriptions(): { id: JournalTemplate; name: string; description: string }[] {
  return [
    { id: "generic", name: "通用模板", description: "适用于一般学术论文，12pt字号，A4纸张" },
    { id: "ieee", name: "IEEE", description: "IEEE会议/期刊论文格式，双栏排版" },
    { id: "nature", name: "Nature", description: "Nature期刊风格，双倍行距" },
    { id: "elsevier", name: "Elsevier", description: "Elsevier出版社期刊格式，含行号" },
    { id: "springer", name: "Springer", description: "Springer出版社期刊格式" },
  ];
}
