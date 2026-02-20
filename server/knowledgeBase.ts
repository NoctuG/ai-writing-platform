import { invokeLLM } from "./_core/llm";

/**
 * Extract key information from document text using LLM
 */
export async function analyzeDocument(text: string): Promise<{
  summary: string;
  metadata: {
    title?: string;
    authors?: string[];
    abstract?: string;
    keywords?: string[];
    methodology?: string;
    findings?: string;
  };
}> {
  const truncatedText = text.substring(0, 15000); // Limit text for LLM context

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一位学术文献分析专家。请分析以下学术文献的内容，提取关键信息。返回JSON格式。`,
      },
      {
        role: "user",
        content: `请分析以下文献内容并提取关键信息：\n\n${truncatedText}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "document_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            summary: { type: "string", description: "文献摘要（200-500字）" },
            title: { type: "string", description: "文献标题" },
            authors: { type: "array", items: { type: "string" }, description: "作者列表" },
            abstract: { type: "string", description: "原文摘要" },
            keywords: { type: "array", items: { type: "string" }, description: "关键词" },
            methodology: { type: "string", description: "研究方法" },
            findings: { type: "string", description: "主要发现" },
          },
          required: ["summary", "title", "authors", "abstract", "keywords", "methodology", "findings"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("文献分析失败");
  }

  const result = JSON.parse(content);
  return {
    summary: result.summary,
    metadata: {
      title: result.title,
      authors: result.authors,
      abstract: result.abstract,
      keywords: result.keywords,
      methodology: result.methodology,
      findings: result.findings,
    },
  };
}

/**
 * Chat with document content using RAG approach
 */
export async function chatWithDocument(
  documentText: string,
  question: string,
  chatHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  const truncatedText = documentText.substring(0, 15000);

  const messages = [
    {
      role: "system" as const,
      content: `你是一位学术文献阅读助手。以下是用户上传的文献内容，请基于该文献回答用户的问题。
如果问题超出文献内容范围，请明确告知用户。回答应准确、专业，并引用文献中的具体内容。

文献内容：
${truncatedText}`,
    },
    ...chatHistory.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    {
      role: "user" as const,
      content: question,
    },
  ];

  const response = await invokeLLM({ messages });
  const responseContent = response.choices[0]?.message?.content;
  return typeof responseContent === "string" ? responseContent : "";
}

/**
 * Generate content with RAG context from uploaded documents
 */
export async function generateWithRAG(
  documentTexts: string[],
  prompt: string,
  paperTitle: string
): Promise<string> {
  const contextParts = documentTexts.map((text, i) =>
    `[文献 ${i + 1}]:\n${text.substring(0, 8000)}`
  ).join("\n\n---\n\n");

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一位资深的学术论文写作专家。用户已上传参考文献，请基于这些文献内容生成学术论文内容。
要求：
1. 内容必须基于提供的文献，减少AI幻觉
2. 适当引用文献中的观点和数据
3. 使用学术化的语言风格
4. 保持内容的准确性和可验证性

参考文献内容：
${contextParts}`,
      },
      {
        role: "user",
        content: `论文标题：${paperTitle}\n\n${prompt}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  return typeof content === "string" ? content : "";
}
