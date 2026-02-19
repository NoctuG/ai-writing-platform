import { invokeLLM } from "./_core/llm";

export type PolishType = "expression" | "grammar" | "academic" | "comprehensive";

export interface PolishResult {
  polishedText: string;
  suggestions: PolishSuggestion[];
}

export interface PolishSuggestion {
  text: string;
  explanation: string;
  confidence: number; // 0-1
}

/**
 * AI文本润色
 */
export async function polishText(text: string, type: PolishType): Promise<PolishResult> {
  let systemPrompt = "";

  switch (type) {
    case "expression":
      systemPrompt = "你是一个专业的文字编辑。请优化文本的语言表达，使其更加流畅、准确、易读，同时保持原意不变。";
      break;
    case "grammar":
      systemPrompt = "你是一个专业的语法专家。请修正文本中的语法错误、标点符号错误、拼写错误，使其符合规范。";
      break;
    case "academic":
      systemPrompt = "你是一个学术写作专家。请调整文本的学术用语，使其更加专业、严谨、规范，符合学术论文的写作标准。";
      break;
    case "comprehensive":
      systemPrompt = "你是一个全能的学术编辑。请全面优化文本，包括语言表达、语法规范、学术用语等各个方面，使其达到高质量学术论文的标准。";
      break;
  }

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `${systemPrompt}\n\n请提供3个不同的改写建议，每个建议都应该有不同的侧重点和风格。`,
        },
        {
          role: "user",
          content: `请润色以下文本：\n\n${text}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "polish_result",
          strict: true,
          schema: {
            type: "object",
            properties: {
              polishedText: { type: "string", description: "润色后的文本（推荐版本）" },
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string", description: "改写建议文本" },
                    explanation: { type: "string", description: "改写说明" },
                    confidence: { type: "number", description: "推荐度(0-1)" },
                  },
                  required: ["text", "explanation", "confidence"],
                  additionalProperties: false,
                },
                description: "多个改写建议",
              },
            },
            required: ["polishedText", "suggestions"],
            additionalProperties: false,
          },
        },
      },
    });

    const resultContent = response.choices[0]?.message?.content;
    if (!resultContent || typeof resultContent !== "string") {
      throw new Error("润色结果为空");
    }

    const result: PolishResult = JSON.parse(resultContent);
    return result;
  } catch (error: any) {
    console.error("[Text Polisher] Error:", error);
    throw new Error(`文本润色失败: ${error.message}`);
  }
}

/**
 * 批量润色段落
 */
export async function polishParagraphs(paragraphs: string[], type: PolishType): Promise<string[]> {
  const polishedParagraphs: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.trim().length === 0) {
      polishedParagraphs.push(paragraph);
      continue;
    }

    try {
      const result = await polishText(paragraph, type);
      polishedParagraphs.push(result.polishedText);
    } catch (error) {
      console.error("[Batch Polish] Error polishing paragraph:", error);
      polishedParagraphs.push(paragraph); // 失败时保留原文
    }
  }

  return polishedParagraphs;
}
