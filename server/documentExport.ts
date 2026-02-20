import {
  AlignmentType,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import MarkdownIt from "markdown-it";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

const md = new MarkdownIt();

interface ExportOptions {
  title: string;
  type: string;
  outline: string;
  content: string;
  styleProfile?: Partial<WordStyleProfile>;
}

type LineSpacingMode =
  | { mode: "multiple"; value: number }
  | { mode: "exact"; value: number };

export interface WordStyleProfile {
  profileName: string;
  chineseBodyFont: string;
  chineseHeadingFont: string;
  latinFont: string;
  bodyFontSizePt: number;
  paragraphBeforePt: number;
  paragraphAfterPt: number;
  lineSpacing: LineSpacingMode;
}

export const DEFAULT_WORD_STYLE_PROFILE: WordStyleProfile = {
  profileName: "高校通用毕业论文",
  chineseBodyFont: "宋体",
  chineseHeadingFont: "黑体",
  latinFont: "Times New Roman",
  bodyFontSizePt: 12,
  paragraphBeforePt: 0,
  paragraphAfterPt: 8,
  lineSpacing: { mode: "multiple", value: 1.5 },
};

export function resolveWordStyleProfile(styleProfile?: Partial<WordStyleProfile>): WordStyleProfile {
  return {
    ...DEFAULT_WORD_STYLE_PROFILE,
    ...styleProfile,
    lineSpacing: {
      ...DEFAULT_WORD_STYLE_PROFILE.lineSpacing,
      ...(styleProfile?.lineSpacing ?? {}),
    },
  };
}

function toHalfPoints(pt: number): number {
  return Math.round(pt * 2);
}

function toTwip(pt: number): number {
  return Math.round(pt * 20);
}

function toLineSpacing(styleProfile: WordStyleProfile): { line: number; lineRule: "auto" | "exact" } {
  if (styleProfile.lineSpacing.mode === "exact") {
    return {
      line: toTwip(styleProfile.lineSpacing.value),
      lineRule: "exact",
    };
  }

  return {
    line: Math.round(styleProfile.lineSpacing.value * 240),
    lineRule: "auto",
  };
}

function makeRunFontConfig(styleProfile: WordStyleProfile, isChinese: boolean):
  | string
  | {
      ascii: string;
      hAnsi: string;
      eastAsia: string;
      cs: string;
    } {
  const eastAsiaFont = isChinese ? styleProfile.chineseBodyFont : styleProfile.latinFont;
  const latinFont = styleProfile.latinFont;
  return {
    ascii: latinFont,
    hAnsi: latinFont,
    cs: latinFont,
    eastAsia: eastAsiaFont,
  };
}

export const headingNumberingReference = "paper-heading-numbering";

export function buildDocumentStyles(styleProfile: WordStyleProfile) {
  const lineSpacing = toLineSpacing(styleProfile);
  const bodyRun = {
    size: toHalfPoints(styleProfile.bodyFontSizePt),
    font: {
      ascii: styleProfile.latinFont,
      hAnsi: styleProfile.latinFont,
      eastAsia: styleProfile.chineseBodyFont,
      cs: styleProfile.latinFont,
    },
  };

  return {
    default: {
      document: {
        run: bodyRun,
        paragraph: {
          spacing: {
            before: toTwip(styleProfile.paragraphBeforePt),
            after: toTwip(styleProfile.paragraphAfterPt),
            ...lineSpacing,
          },
        },
      },
    },
    paragraphStyles: [
      {
        id: "BodyText",
        name: "Body Text",
        quickFormat: true,
        run: bodyRun,
        paragraph: {
          alignment: AlignmentType.JUSTIFIED,
          spacing: {
            before: toTwip(styleProfile.paragraphBeforePt),
            after: toTwip(styleProfile.paragraphAfterPt),
            ...lineSpacing,
          },
        },
      },
      {
        id: "Heading1",
        name: "Heading 1",
        quickFormat: true,
        basedOn: "BodyText",
        next: "BodyText",
        run: {
          ...bodyRun,
          bold: true,
          font: {
            ...bodyRun.font,
            eastAsia: styleProfile.chineseHeadingFont,
          },
          size: toHalfPoints(styleProfile.bodyFontSizePt + 4),
        },
        paragraph: {
          spacing: { before: toTwip(14), after: toTwip(8) },
        },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        quickFormat: true,
        basedOn: "BodyText",
        next: "BodyText",
        run: {
          ...bodyRun,
          bold: true,
          font: {
            ...bodyRun.font,
            eastAsia: styleProfile.chineseHeadingFont,
          },
          size: toHalfPoints(styleProfile.bodyFontSizePt + 2),
        },
        paragraph: {
          spacing: { before: toTwip(12), after: toTwip(6) },
        },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        quickFormat: true,
        basedOn: "BodyText",
        next: "BodyText",
        run: {
          ...bodyRun,
          bold: true,
          font: {
            ...bodyRun.font,
            eastAsia: styleProfile.chineseHeadingFont,
          },
          size: toHalfPoints(styleProfile.bodyFontSizePt + 1),
        },
        paragraph: {
          spacing: { before: toTwip(10), after: toTwip(4) },
        },
      },
    ],
  };
}

/**
 * Convert markdown content to docx paragraphs
 */
interface InlineToken {
  text: string;
  bold?: boolean;
  italics?: boolean;
}

function parseInlineMarkdown(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const regex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      tokens.push({ text: text.slice(last, match.index) });
    }

    const value = match[0];
    if (value.startsWith("***") && value.endsWith("***")) {
      tokens.push({ text: value.slice(3, -3), bold: true, italics: true });
    } else if (value.startsWith("**") && value.endsWith("**")) {
      tokens.push({ text: value.slice(2, -2), bold: true });
    } else if (value.startsWith("*") && value.endsWith("*")) {
      tokens.push({ text: value.slice(1, -1), italics: true });
    }
    last = regex.lastIndex;
  }

  if (last < text.length) {
    tokens.push({ text: text.slice(last) });
  }

  return tokens.length > 0 ? tokens : [{ text }];
}

const cjkRegex = /[\u3400-\u9FFF\uF900-\uFAFF\u3040-\u30FF\uAC00-\uD7AF]/;

function splitMixedLanguageText(text: string): Array<{ text: string; isCjk: boolean }> {
  if (!text) {
    return [];
  }

  const segments: Array<{ text: string; isCjk: boolean }> = [];
  let buffer = text[0];
  let currentIsCjk = cjkRegex.test(text[0]);

  for (let i = 1; i < text.length; i++) {
    const char = text[i];
    const isCjk = cjkRegex.test(char);
    if (isCjk === currentIsCjk) {
      buffer += char;
      continue;
    }

    segments.push({ text: buffer, isCjk: currentIsCjk });
    buffer = char;
    currentIsCjk = isCjk;
  }

  segments.push({ text: buffer, isCjk: currentIsCjk });
  return segments;
}

function buildRunsForBodyText(text: string, styleProfile: WordStyleProfile): TextRun[] {
  const tokens = parseInlineMarkdown(text);
  const runs: TextRun[] = [];

  tokens.forEach((token) => {
    splitMixedLanguageText(token.text).forEach((segment) => {
      runs.push(
        new TextRun({
          text: segment.text,
          bold: token.bold,
          italics: token.italics,
          font: makeRunFontConfig(styleProfile, segment.isCjk),
          size: toHalfPoints(styleProfile.bodyFontSizePt),
        })
      );
    });
  });

  return runs.length > 0 ? runs : [new TextRun({ text: "" })];
}


export function buildHeadingNumberingConfig() {
  return {
    config: [
      {
        reference: headingNumberingReference,
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.START,
          },
          {
            level: 1,
            format: LevelFormat.DECIMAL,
            text: "%1.%2",
            alignment: AlignmentType.START,
          },
          {
            level: 2,
            format: LevelFormat.DECIMAL,
            text: "%1.%2.%3",
            alignment: AlignmentType.START,
          },
        ],
      },
    ],
  };
}

export function markdownToDocxParagraphs(markdown: string, styleProfile: WordStyleProfile): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = markdown.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) {
      paragraphs.push(new Paragraph({ text: "", style: "BodyText" }));
      continue;
    }

    // Handle headers
    if (line.startsWith("# ")) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(2),
          heading: HeadingLevel.HEADING_1,
          style: "Heading1",
          numbering: { reference: headingNumberingReference, level: 0 },
        })
      );
    } else if (line.startsWith("## ")) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(3),
          heading: HeadingLevel.HEADING_2,
          style: "Heading2",
          numbering: { reference: headingNumberingReference, level: 1 },
        })
      );
    } else if (line.startsWith("### ")) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(4),
          heading: HeadingLevel.HEADING_3,
          style: "Heading3",
          numbering: { reference: headingNumberingReference, level: 2 },
        })
      );
    } else if (line.startsWith("#### ")) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(5),
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 150, after: 80 },
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          children: buildRunsForBodyText(line, styleProfile),
          style: "BodyText",
          spacing: {
            before: toTwip(styleProfile.paragraphBeforePt),
            after: toTwip(styleProfile.paragraphAfterPt),
            ...toLineSpacing(styleProfile),
          },
        })
      );
    }
  }

  return paragraphs;
}

/**
 * Generate Word document from paper content
 */
export async function generateWordDocument(options: ExportOptions): Promise<{ fileKey: string; fileUrl: string }> {
  const { title, outline, content } = options;
  const styleProfile = resolveWordStyleProfile(options.styleProfile);

  const typeNames: Record<string, string> = {
    graduation: "毕业论文",
    journal: "期刊论文",
    proposal: "开题报告",
    professional: "职称论文",
  };

  // Create document sections
  const sections: Paragraph[] = [];

  // Title page
  sections.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 400 },
      style: "BodyText",
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: toHalfPoints(styleProfile.bodyFontSizePt + 8),
          font: {
            ascii: styleProfile.latinFont,
            hAnsi: styleProfile.latinFont,
            cs: styleProfile.latinFont,
            eastAsia: styleProfile.chineseHeadingFont,
          },
        }),
      ],
    })
  );

  sections.push(
    new Paragraph({
      text: typeNames[options.type] || options.type,
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
      style: "BodyText",
    })
  );

  // Outline section
  sections.push(
    new Paragraph({
      text: "论文大纲",
      heading: HeadingLevel.HEADING_1,
      style: "Heading1",
      numbering: { reference: headingNumberingReference, level: 0 },
    })
  );

  sections.push(...markdownToDocxParagraphs(outline, styleProfile));

  // Page break
  sections.push(
    new Paragraph({
      text: "",
      pageBreakBefore: true,
    })
  );

  // Content section
  sections.push(
    new Paragraph({
      text: "论文正文",
      heading: HeadingLevel.HEADING_1,
      style: "Heading1",
      numbering: { reference: headingNumberingReference, level: 0 },
    })
  );

  sections.push(...markdownToDocxParagraphs(content, styleProfile));

  // Create document
  const doc = new Document({
    styles: buildDocumentStyles(styleProfile),
    numbering: buildHeadingNumberingConfig(),
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });

  // Generate buffer
  const buffer = await Packer.toBuffer(doc);

  // Upload to S3
  const fileKey = `papers/${nanoid()}.docx`;
  const { url } = await storagePut(fileKey, buffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

  return { fileKey, fileUrl: url };
}

/**
 * Generate PDF document from paper content (using markdown conversion)
 * Note: This is a placeholder. For production, consider using a proper PDF library or service
 */
export async function generatePdfDocument(options: ExportOptions): Promise<{ fileKey: string; fileUrl: string }> {
  // For now, we'll generate a simple text-based PDF using a markdown to PDF approach
  // In production, you might want to use libraries like puppeteer or a dedicated PDF service
  
  const { title, outline, content } = options;

  const typeNames: Record<string, string> = {
    graduation: "毕业论文",
    journal: "期刊论文",
    proposal: "开题报告",
    professional: "职称论文",
  };

  // Create a simple HTML document
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: "SimSun", serif;
      line-height: 1.8;
      margin: 40px;
      font-size: 14px;
    }
    h1 {
      text-align: center;
      font-size: 24px;
      margin-bottom: 10px;
    }
    .subtitle {
      text-align: center;
      font-size: 16px;
      margin-bottom: 40px;
      color: #666;
    }
    h2 {
      font-size: 18px;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    h3 {
      font-size: 16px;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    p {
      text-indent: 2em;
      margin: 10px 0;
      text-align: justify;
    }
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="subtitle">${typeNames[options.type] || options.type}</div>
  
  <h2>论文大纲</h2>
  ${md.render(outline)}
  
  <div class="page-break"></div>
  
  <h2>论文正文</h2>
  ${md.render(content)}
</body>
</html>
  `;

  // For now, store as HTML (in production, convert to PDF)
  const buffer = Buffer.from(html, "utf-8");
  const fileKey = `papers/${nanoid()}.html`;
  const { url } = await storagePut(fileKey, buffer, "text/html");

  return { fileKey, fileUrl: url };
}
