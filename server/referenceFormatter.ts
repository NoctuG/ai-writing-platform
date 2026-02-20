/**
 * 参考文献格式化工具
 * 支持多种引用格式：GB/T 7714、APA、MLA、Chicago
 */

export interface ReferenceData {
  title: string;
  authors: string[]; // 作者列表
  documentType?:
    | "journal"
    | "book"
    | "thesis"
    | "conference"
    | "report"
    | "standard"
    | "patent"
    | "web";
  year?: number;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
}

/**
 * GB/T 7714格式（中国国家标准）
 * 格式：作者. 文献题名[J]. 刊名, 出版年份, 卷号(期号): 页码.
 */
const gbt7714DocumentTypeCodeMap = {
  journal: "J",
  book: "M",
  thesis: "D",
  conference: "C",
  report: "R",
  standard: "S",
  patent: "P",
  web: "EB/OL",
} as const;

type Gbt7714DocumentCode =
  (typeof gbt7714DocumentTypeCodeMap)[keyof typeof gbt7714DocumentTypeCodeMap];

interface FormatGBT7714Options {
  fallbackDocumentTypeCode?: Gbt7714DocumentCode;
}

export function formatGBT7714(
  ref: ReferenceData,
  options: FormatGBT7714Options = {}
): string {
  const parts: string[] = [];
  const fallbackDocumentTypeCode = options.fallbackDocumentTypeCode ?? "J";
  const documentTypeCode = ref.documentType
    ? gbt7714DocumentTypeCodeMap[ref.documentType]
    : fallbackDocumentTypeCode;

  // 作者
  if (ref.authors.length > 0) {
    if (ref.authors.length <= 3) {
      parts.push(ref.authors.join(", "));
    } else {
      parts.push(`${ref.authors.slice(0, 3).join(", ")}, 等`);
    }
  }

  // 标题
  parts.push(`${ref.title}[${documentTypeCode}]`);

  // 期刊、年份、卷期、页码
  const journalParts: string[] = [];
  if (ref.journal) {
    journalParts.push(ref.journal);
  }
  if (ref.year) {
    journalParts.push(ref.year.toString());
  }
  if (ref.volume) {
    let volumeIssue = ref.volume;
    if (ref.issue) {
      volumeIssue += `(${ref.issue})`;
    }
    journalParts.push(volumeIssue);
  }
  if (ref.pages) {
    journalParts.push(ref.pages);
  }

  if (journalParts.length > 0) {
    parts.push(journalParts.join(", "));
  }

  return parts.join(". ") + ".";
}

/**
 * APA格式（美国心理学会）
 * 格式：Authors. (Year). Title. Journal, Volume(Issue), pages. DOI
 */
export function formatAPA(ref: ReferenceData): string {
  const parts: string[] = [];

  // 作者 (姓, 名首字母.)
  if (ref.authors.length > 0) {
    parts.push(ref.authors.join(", "));
  }

  // 年份
  if (ref.year) {
    parts.push(`(${ref.year})`);
  }

  // 标题
  parts.push(ref.title);

  // 期刊、卷期、页码
  if (ref.journal) {
    let journalPart = ref.journal;
    if (ref.volume) {
      journalPart += `, ${ref.volume}`;
      if (ref.issue) {
        journalPart += `(${ref.issue})`;
      }
    }
    if (ref.pages) {
      journalPart += `, ${ref.pages}`;
    }
    parts.push(journalPart);
  }

  // DOI
  if (ref.doi) {
    parts.push(`https://doi.org/${ref.doi}`);
  }

  return parts.join(". ") + ".";
}

/**
 * MLA格式（现代语言协会）
 * 格式：Authors. "Title." Journal, vol. Volume, no. Issue, Year, pages.
 */
export function formatMLA(ref: ReferenceData): string {
  const parts: string[] = [];

  // 作者
  if (ref.authors.length > 0) {
    if (ref.authors.length === 1) {
      parts.push(ref.authors[0]);
    } else if (ref.authors.length === 2) {
      parts.push(`${ref.authors[0]}, and ${ref.authors[1]}`);
    } else {
      parts.push(`${ref.authors[0]}, et al`);
    }
  }

  // 标题（加引号）
  parts.push(`"${ref.title}."`);

  // 期刊、卷期、年份、页码
  if (ref.journal) {
    let journalPart = ref.journal;
    if (ref.volume) {
      journalPart += `, vol. ${ref.volume}`;
    }
    if (ref.issue) {
      journalPart += `, no. ${ref.issue}`;
    }
    if (ref.year) {
      journalPart += `, ${ref.year}`;
    }
    if (ref.pages) {
      journalPart += `, pp. ${ref.pages}`;
    }
    parts.push(journalPart);
  }

  return parts.join(" ") + ".";
}

/**
 * Chicago格式（芝加哥手册）
 * 格式：Authors. "Title." Journal Volume, no. Issue (Year): pages.
 */
export function formatChicago(ref: ReferenceData): string {
  const parts: string[] = [];

  // 作者
  if (ref.authors.length > 0) {
    parts.push(ref.authors.join(", "));
  }

  // 标题（加引号）
  parts.push(`"${ref.title}."`);

  // 期刊、卷期、年份、页码
  if (ref.journal) {
    let journalPart = ref.journal;
    if (ref.volume) {
      journalPart += ` ${ref.volume}`;
    }
    if (ref.issue) {
      journalPart += `, no. ${ref.issue}`;
    }
    if (ref.year) {
      journalPart += ` (${ref.year})`;
    }
    if (ref.pages) {
      journalPart += `: ${ref.pages}`;
    }
    parts.push(journalPart);
  }

  return parts.join(" ") + ".";
}

/**
 * 根据格式类型格式化参考文献
 */
export function formatReference(
  ref: ReferenceData,
  format: "gbt7714" | "apa" | "mla" | "chicago"
): string {
  switch (format) {
    case "gbt7714":
      return formatGBT7714(ref);
    case "apa":
      return formatAPA(ref);
    case "mla":
      return formatMLA(ref);
    case "chicago":
      return formatChicago(ref);
    default:
      return formatGBT7714(ref);
  }
}
