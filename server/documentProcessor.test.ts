import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractTextFromPDF, generateDocumentSummary, answerDocumentQuestion, extractDocumentConcepts } from './documentProcessor';
import * as llm from './_core/llm';

// Mock the LLM module
vi.mock('./_core/llm', () => ({
  invokeLLM: vi.fn(),
}));

// Mock pdf-parse
vi.mock('pdf-parse', () => ({
  default: vi.fn(),
}));

describe('Document Processor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateDocumentSummary', () => {
    it('should generate summary with key points', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              summary: '这是一篇关于机器学习的研究论文',
              keyPoints: ['深度学习', '神经网络', '模型训练'],
              methodology: '实验研究法',
              findings: '提出了新的训练方法',
            }),
          },
        }],
      };

      vi.mocked(llm.invokeLLM).mockResolvedValue(mockResponse as any);

      const result = await generateDocumentSummary('这是一段测试文本');

      expect(result.summary).toBe('这是一篇关于机器学习的研究论文');
      expect(result.keyPoints).toHaveLength(3);
      expect(result.methodology).toBe('实验研究法');
      expect(result.findings).toBe('提出了新的训练方法');
    });

    it('should handle LLM errors', async () => {
      vi.mocked(llm.invokeLLM).mockRejectedValue(new Error('LLM error'));

      await expect(generateDocumentSummary('test')).rejects.toThrow('文献摘要生成失败');
    });

    it('should handle empty LLM response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: null,
          },
        }],
      };

      vi.mocked(llm.invokeLLM).mockResolvedValue(mockResponse as any);

      await expect(generateDocumentSummary('test')).rejects.toThrow('文献摘要生成失败');
    });
  });

  describe('answerDocumentQuestion', () => {
    it('should answer questions based on document', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '根据文献内容，这个问题的答案是...',
          },
        }],
      };

      vi.mocked(llm.invokeLLM).mockResolvedValue(mockResponse as any);

      const result = await answerDocumentQuestion(
        '这是文献内容',
        '这是什么研究？',
        []
      );

      expect(result).toBe('根据文献内容，这个问题的答案是...');
      expect(llm.invokeLLM).toHaveBeenCalledTimes(1);
    });

    it('should include conversation history', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '基于之前的对话...',
          },
        }],
      };

      vi.mocked(llm.invokeLLM).mockResolvedValue(mockResponse as any);

      const history = [
        { role: 'user' as const, content: '第一个问题' },
        { role: 'assistant' as const, content: '第一个回答' },
      ];

      await answerDocumentQuestion('文献内容', '第二个问题', history);

      const callArgs = vi.mocked(llm.invokeLLM).mock.calls[0][0];
      expect(callArgs.messages).toHaveLength(4); // system + history + user
    });

    it('should handle LLM errors', async () => {
      vi.mocked(llm.invokeLLM).mockRejectedValue(new Error('LLM error'));

      await expect(
        answerDocumentQuestion('content', 'question', [])
      ).rejects.toThrow('文献问答失败');
    });
  });

  describe('extractDocumentConcepts', () => {
    it('should extract concepts, entities and keywords', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              concepts: ['机器学习', '深度学习', '神经网络'],
              entities: [
                { type: '人名', name: '张三' },
                { type: '机构', name: '清华大学' },
              ],
              keywords: ['AI', '算法', '模型'],
            }),
          },
        }],
      };

      vi.mocked(llm.invokeLLM).mockResolvedValue(mockResponse as any);

      const result = await extractDocumentConcepts('这是一段测试文本');

      expect(result.concepts).toHaveLength(3);
      expect(result.entities).toHaveLength(2);
      expect(result.keywords).toHaveLength(3);
      expect(result.entities[0].type).toBe('人名');
      expect(result.entities[0].name).toBe('张三');
    });

    it('should handle LLM errors', async () => {
      vi.mocked(llm.invokeLLM).mockRejectedValue(new Error('LLM error'));

      await expect(extractDocumentConcepts('test')).rejects.toThrow('概念提取失败');
    });

    it('should truncate long text', async () => {
      const longText = 'a'.repeat(10000);
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              concepts: ['test'],
              entities: [],
              keywords: ['test'],
            }),
          },
        }],
      };

      vi.mocked(llm.invokeLLM).mockResolvedValue(mockResponse as any);

      await extractDocumentConcepts(longText);

      const callArgs = vi.mocked(llm.invokeLLM).mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: any) => m.role === 'user');
      expect(userMessage.content.length).toBeLessThan(longText.length + 1000);
    });
  });
});
