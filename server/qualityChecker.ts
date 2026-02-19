import { invokeLLM } from "./_core/llm";

export interface QualityCheckResult {
  overallScore: number; // 0-100
  plagiarismScore: number; // 0-100, higher means more plagiarism
  grammarScore: number; // 0-100
  academicStyleScore: number; // 0-100
  structureScore: number; // 0-100
  issues: QualityIssue[];
  suggestions: string[];
}

export interface QualityIssue {
  type: "plagiarism" | "grammar" | "style" | "structure";
  severity: "high" | "medium" | "low";
  description: string;
  location?: string; // 问题位置描述
}

/**
 * 检测论文质量
 */
export async function checkPaperQuality(content: string, outline: string): Promise<QualityCheckResult> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `你是一个专业的学术论文质量评估专家。你需要从以下几个维度评估论文质量：
1. 查重检测：检测是否有明显的抄袭或重复内容
2. 语法检查：检查语法错误、标点符号使用、句式结构
3. 学术风格：评估学术用语的规范性、专业术语使用、表达严谨性
4. 结构完整性：评估论文结构是否完整、逻辑是否清晰、章节安排是否合理

请对论文进行全面评估，并给出具体的问题和改进建议。`,
        },
        {
          role: "user",
          content: `请评估以下论文：

【论文大纲】
${outline}

【论文内容】
${content.substring(0, 8000)}`, // 限制长度避免超出token限制
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "quality_check_result",
          strict: true,
          schema: {
            type: "object",
            properties: {
              overallScore: { type: "number", description: "总体评分(0-100)" },
              plagiarismScore: { type: "number", description: "查重风险评分(0-100,越高风险越大)" },
              grammarScore: { type: "number", description: "语法评分(0-100)" },
              academicStyleScore: { type: "number", description: "学术风格评分(0-100)" },
              structureScore: { type: "number", description: "结构评分(0-100)" },
              issues: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["plagiarism", "grammar", "style", "structure"],
                      description: "问题类型",
                    },
                    severity: {
                      type: "string",
                      enum: ["high", "medium", "low"],
                      description: "严重程度",
                    },
                    description: { type: "string", description: "问题描述" },
                    location: { type: "string", description: "问题位置" },
                  },
                  required: ["type", "severity", "description"],
                  additionalProperties: false,
                },
              },
              suggestions: {
                type: "array",
                items: { type: "string" },
                description: "改进建议列表",
              },
            },
            required: [
              "overallScore",
              "plagiarismScore",
              "grammarScore",
              "academicStyleScore",
              "structureScore",
              "issues",
              "suggestions",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const resultContent = response.choices[0]?.message?.content;
    if (!resultContent || typeof resultContent !== "string") {
      throw new Error("质量检测结果为空");
    }

    const result: QualityCheckResult = JSON.parse(resultContent);
    return result;
  } catch (error: any) {
    console.error("[Quality Checker] Error:", error);
    throw new Error(`质量检测失败: ${error.message}`);
  }
}

/**
 * 检测语法错误
 */
export async function checkGrammar(text: string): Promise<{ errors: Array<{ text: string; suggestion: string; position: number }> }> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "你是一个专业的语法检查工具。请检测文本中的语法错误、标点符号错误、拼写错误等，并给出修正建议。",
        },
        {
          role: "user",
          content: `请检查以下文本的语法错误：\n\n${text.substring(0, 2000)}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "grammar_check_result",
          strict: true,
          schema: {
            type: "object",
            properties: {
              errors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string", description: "错误文本" },
                    suggestion: { type: "string", description: "修正建议" },
                    position: { type: "number", description: "错误位置（字符索引）" },
                  },
                  required: ["text", "suggestion", "position"],
                  additionalProperties: false,
                },
              },
            },
            required: ["errors"],
            additionalProperties: false,
          },
        },
      },
    });

    const resultContent = response.choices[0]?.message?.content;
    if (!resultContent || typeof resultContent !== "string") {
      throw new Error("语法检查结果为空");
    }

    return JSON.parse(resultContent);
  } catch (error: any) {
    console.error("[Grammar Checker] Error:", error);
    throw new Error(`语法检查失败: ${error.message}`);
  }
}
