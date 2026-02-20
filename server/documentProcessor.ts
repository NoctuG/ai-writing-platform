import pdfParse from 'pdf-parse';
import { invokeLLM } from './_core/llm';

/**
 * Extract text content from PDF buffer
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<{
  text: string;
  pageCount: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
  };
}> {
  try {
    const data = await pdfParse(pdfBuffer);
    
    return {
      text: data.text,
      pageCount: data.numpages,
      metadata: {
        title: data.info?.Title,
        author: data.info?.Author,
        subject: data.info?.Subject,
        keywords: data.info?.Keywords,
        creator: data.info?.Creator,
        producer: data.info?.Producer,
        creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
      },
    };
  } catch (error) {
    console.error('[DocumentProcessor] PDF extraction failed:', error);
    throw new Error('PDF文档解析失败，请确保文件格式正确');
  }
}

/**
 * Generate summary for academic document using LLM
 */
export async function generateDocumentSummary(text: string): Promise<{
  summary: string;
  keyPoints: string[];
  abstract?: string;
  methodology?: string;
  findings?: string;
}> {
  try {
    // Truncate text if too long (keep first 10000 characters for context)
    const truncatedText = text.length > 10000 ? text.substring(0, 10000) + '...' : text;
    
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: '你是一位专业的学术文献分析专家。请仔细阅读提供的学术文献内容，提取关键信息并生成结构化摘要。',
        },
        {
          role: 'user',
          content: `请分析以下学术文献内容，并提供：
1. 整体摘要（200-300字）
2. 3-5个关键要点
3. 研究方法（如果有）
4. 主要发现或结论（如果有）

文献内容：
${truncatedText}

请以JSON格式返回结果。`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'document_summary',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              summary: { type: 'string', description: '文献的整体摘要' },
              keyPoints: {
                type: 'array',
                description: '关键要点列表',
                items: { type: 'string' },
              },
              methodology: { type: 'string', description: '研究方法（可选）' },
              findings: { type: 'string', description: '主要发现或结论（可选）' },
            },
            required: ['summary', 'keyPoints'],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('LLM返回内容为空');
    }

    const result = JSON.parse(content as string);
    return {
      summary: result.summary,
      keyPoints: result.keyPoints,
      methodology: result.methodology,
      findings: result.findings,
    };
  } catch (error) {
    console.error('[DocumentProcessor] Summary generation failed:', error);
    throw new Error('文献摘要生成失败');
  }
}

/**
 * Answer questions about document content using RAG
 */
export async function answerDocumentQuestion(
  documentText: string,
  question: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  try {
    // Truncate document text if too long
    const truncatedText = documentText.length > 8000 ? documentText.substring(0, 8000) + '...' : documentText;
    
    const messages = [
      {
        role: 'system' as const,
        content: `你是一位专业的学术文献分析助手。你的任务是基于提供的文献内容回答用户的问题。

文献内容：
${truncatedText}

请基于上述文献内容回答用户的问题。如果问题无法从文献中找到答案，请明确告知用户。回答要准确、专业，并尽可能引用文献中的具体内容。`,
      },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: question,
      },
    ];

    const response = await invokeLLM({ messages });

    const answer = response.choices[0].message.content;
    if (!answer || typeof answer !== 'string') {
      throw new Error('LLM返回内容为空');
    }

    return answer;
  } catch (error) {
    console.error('[DocumentProcessor] Question answering failed:', error);
    throw new Error('文献问答失败');
  }
}

/**
 * Extract key concepts and entities from document
 */
export async function extractDocumentConcepts(text: string): Promise<{
  concepts: string[];
  entities: { type: string; name: string }[];
  keywords: string[];
}> {
  try {
    const truncatedText = text.length > 8000 ? text.substring(0, 8000) + '...' : text;
    
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: '你是一位专业的学术文献分析专家。请从文献中提取关键概念、实体和关键词。',
        },
        {
          role: 'user',
          content: `请分析以下学术文献，提取：
1. 核心概念（5-10个）
2. 重要实体（人名、机构、理论等，标注类型）
3. 关键词（5-10个）

文献内容：
${truncatedText}

请以JSON格式返回结果。`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'document_concepts',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              concepts: {
                type: 'array',
                description: '核心概念列表',
                items: { type: 'string' },
              },
              entities: {
                type: 'array',
                description: '重要实体列表',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', description: '实体类型（如：人名、机构、理论）' },
                    name: { type: 'string', description: '实体名称' },
                  },
                  required: ['type', 'name'],
                  additionalProperties: false,
                },
              },
              keywords: {
                type: 'array',
                description: '关键词列表',
                items: { type: 'string' },
              },
            },
            required: ['concepts', 'entities', 'keywords'],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content || typeof content !== 'string') {
      throw new Error('LLM返回内容为空');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('[DocumentProcessor] Concept extraction failed:', error);
    throw new Error('概念提取失败');
  }
}
