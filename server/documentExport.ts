import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } from "docx";
import MarkdownIt from "markdown-it";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

const md = new MarkdownIt();

interface ExportOptions {
  title: string;
  type: string;
  outline: string;
  content: string;
}

/**
 * Convert markdown content to docx paragraphs
 */
function markdownToDocxParagraphs(markdown: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = markdown.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) {
      paragraphs.push(new Paragraph({ text: "" }));
      continue;
    }

    // Handle headers
    if (line.startsWith("# ")) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(2),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
    } else if (line.startsWith("## ")) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(3),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      );
    } else if (line.startsWith("### ")) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(4),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
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
      // Regular paragraph - handle bold and italic
      const runs: TextRun[] = [];
      let currentText = line;
      
      // Simple bold/italic parsing
      const boldItalicRegex = /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*/g;
      let lastIndex = 0;
      let match;

      while ((match = boldItalicRegex.exec(currentText)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
          runs.push(new TextRun({ text: currentText.substring(lastIndex, match.index) }));
        }

        // Add formatted text
        if (match[1]) {
          // Bold + Italic
          runs.push(new TextRun({ text: match[1], bold: true, italics: true }));
        } else if (match[2]) {
          // Bold
          runs.push(new TextRun({ text: match[2], bold: true }));
        } else if (match[3]) {
          // Italic
          runs.push(new TextRun({ text: match[3], italics: true }));
        }

        lastIndex = boldItalicRegex.lastIndex;
      }

      // Add remaining text
      if (lastIndex < currentText.length) {
        runs.push(new TextRun({ text: currentText.substring(lastIndex) }));
      }

      if (runs.length === 0) {
        runs.push(new TextRun({ text: currentText }));
      }

      paragraphs.push(
        new Paragraph({
          children: runs,
          spacing: { before: 100, after: 100 },
          alignment: AlignmentType.JUSTIFIED,
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
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 400 },
    })
  );

  sections.push(
    new Paragraph({
      text: typeNames[options.type] || options.type,
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    })
  );

  // Outline section
  sections.push(
    new Paragraph({
      text: "论文大纲",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );

  sections.push(...markdownToDocxParagraphs(outline));

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
      spacing: { before: 400, after: 200 },
    })
  );

  sections.push(...markdownToDocxParagraphs(content));

  // Create document
  const doc = new Document({
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
