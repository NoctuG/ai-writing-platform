import { describe, it, expect } from 'vitest';
import {
  LATEX_TEMPLATE_IDS,
  generateLatexDocument,
  getTemplateDescriptions,
  type JournalTemplate,
} from './latexExporter';

describe('LaTeX Exporter', () => {
  describe('generateLatexDocument', () => {
    it('should generate LaTeX document with generic template', () => {
      const result = generateLatexDocument({
        title: '测试论文',
        type: 'journal',
        content: '# 引言\n\n这是引言内容。\n\n## 研究背景\n\n背景描述。',
        template: 'generic',
      });

      expect(result).toContain('\\documentclass[12pt,a4paper]{article}');
      expect(result).toContain('\\title{测试论文}');
      expect(result).toContain('\\section{引言}');
      expect(result).toContain('\\subsection{研究背景}');
    });

    it('should generate LaTeX document with IEEE template', () => {
      const result = generateLatexDocument({
        title: 'Test Paper',
        type: 'journal',
        content: '# Introduction\n\nContent here.',
        template: 'ieee',
      });

      expect(result).toContain('\\documentclass[conference]{IEEEtran}');
      expect(result).toContain('\\title{Test Paper}');
      expect(result).toContain('\\section{Introduction}');
    });

    it('should include authors when provided', () => {
      const result = generateLatexDocument({
        title: '测试论文',
        type: 'journal',
        content: '# 引言',
        template: 'generic',
        authors: ['张三', '李四'],
      });

      expect(result).toContain('\\author{张三 \\and 李四}');
    });

    it('should include abstract when provided', () => {
      const result = generateLatexDocument({
        title: '测试论文',
        type: 'journal',
        content: '# 引言',
        template: 'generic',
        abstract: '这是摘要内容',
      });

      expect(result).toContain('\\begin{abstract}');
      expect(result).toContain('这是摘要内容');
      expect(result).toContain('\\end{abstract}');
    });

    it('should include keywords when provided', () => {
      const result = generateLatexDocument({
        title: '测试论文',
        type: 'journal',
        content: '# 引言',
        template: 'generic',
        keywords: ['机器学习', '深度学习', '神经网络'],
      });

      expect(result).toContain('关键词');
      expect(result).toContain('机器学习');
      expect(result).toContain('深度学习');
      expect(result).toContain('神经网络');
    });

    it('should convert markdown bold to LaTeX textbf', () => {
      const result = generateLatexDocument({
        title: '测试',
        type: 'journal',
        content: '这是**加粗文本**。',
        template: 'generic',
      });

      expect(result).toContain('\\textbf{加粗文本}');
    });

    it('should convert markdown italic to LaTeX textit', () => {
      const result = generateLatexDocument({
        title: '测试',
        type: 'journal',
        content: '这是*斜体文本*。',
        template: 'generic',
      });

      expect(result).toContain('\\textit{斜体文本}');
    });

    it('should convert markdown code to LaTeX texttt', () => {
      const result = generateLatexDocument({
        title: '测试',
        type: 'journal',
        content: '这是`代码`。',
        template: 'generic',
      });

      expect(result).toContain('\\texttt{代码}');
    });

    it('should convert markdown citations to LaTeX cite', () => {
      const result = generateLatexDocument({
        title: '测试',
        type: 'journal',
        content: '根据研究[1]，结果显示[2]。',
        template: 'generic',
      });

      expect(result).toContain('\\cite{ref1}');
      expect(result).toContain('\\cite{ref2}');
    });

    it('should handle Elsevier template with special author format', () => {
      const result = generateLatexDocument({
        title: 'Test',
        type: 'journal',
        content: '# Introduction',
        template: 'elsevier',
        authors: ['Author One', 'Author Two'],
      });

      expect(result).toContain('\\documentclass[preprint,12pt]{elsarticle}');
      expect(result).toContain('\\author{Author One}');
      expect(result).toContain('\\author{Author Two}');
    });

    it('should handle Nature template with double spacing', () => {
      const result = generateLatexDocument({
        title: 'Test',
        type: 'journal',
        content: '# Introduction',
        template: 'nature',
      });

      expect(result).toContain('\\doublespacing');
      expect(result).toContain('naturemag');
    });

    it('should handle Springer template', () => {
      const result = generateLatexDocument({
        title: 'Test',
        type: 'journal',
        content: '# Introduction',
        template: 'springer',
      });

      expect(result).toContain('\\documentclass[smallextended]{svjour3}');
    });

    it.each([
      ['cn_cjc', '\\bibliographystyle{gbt7714-numerical}'],
      ['cn_jos', '\\setstretch{1.3}'],
      ['thesis_undergrad', '\\documentclass[UTF8,zihao=-4,oneside]{ctexrep}'],
      ['thesis_master', '\\documentclass[UTF8,zihao=-4,oneside]{ctexbook}'],
      ['thesis_phd', '\\geometry{a4paper,margin=2.8cm}'],
    ] as const)('should generate LaTeX for new template %s', (template, expected) => {
      const result = generateLatexDocument({
        title: '模板测试',
        type: 'graduation',
        content: '# 正文',
        template: template as JournalTemplate,
      });

      expect(result).toContain(expected);
    });
  });

  describe('getTemplateDescriptions', () => {
    it('should return grouped template descriptions', () => {
      const groups = getTemplateDescriptions();

      expect(groups).toHaveLength(3);
      expect(groups.map(group => group.category)).toEqual([
        'international_journal',
        'domestic_journal',
        'thesis',
      ]);
    });

    it('should include all template ids exactly once', () => {
      const groups = getTemplateDescriptions();
      const ids = groups.flatMap(group => group.templates.map(template => template.id));

      expect(ids).toHaveLength(LATEX_TEMPLATE_IDS.length);
      expect(ids).toEqual(LATEX_TEMPLATE_IDS);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should include name, description and useCase for each template', () => {
      const groups = getTemplateDescriptions();

      groups.forEach(group => {
        expect(group.categoryName).toBeTruthy();
        expect(group.description).toBeTruthy();

        group.templates.forEach(template => {
          expect(template.id).toBeTruthy();
          expect(template.name).toBeTruthy();
          expect(template.description).toBeTruthy();
          expect(template.useCase).toBeTruthy();
        });
      });
    });
  });
});
