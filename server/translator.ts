import { invokeLLM } from "./_core/llm";

export type TranslationDomain =
  | "general"
  | "computer_science"
  | "medicine"
  | "law"
  | "economics"
  | "engineering"
  | "natural_science"
  | "social_science";

export const domainLabels: Record<TranslationDomain, string> = {
  general: "通用",
  computer_science: "计算机科学",
  medicine: "医学",
  law: "法学",
  economics: "经济学",
  engineering: "工程学",
  natural_science: "自然科学",
  social_science: "社会科学",
};

/**
 * Translate text between languages with academic domain awareness
 */
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string,
  domain: TranslationDomain = "general"
): Promise<{
  translatedText: string;
  terminology: { source: string; target: string }[];
}> {
  const langNames: Record<string, string> = {
    zh: "中文",
    en: "英文",
    ja: "日文",
    ko: "韩文",
    fr: "法文",
    de: "德文",
  };

  const sourceLangName = langNames[sourceLang] || sourceLang;
  const targetLangName = langNames[targetLang] || targetLang;
  const domainName = domainLabels[domain];

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一位专业的学术翻译专家，精通${domainName}领域的学术术语。
请将以下${sourceLangName}学术文本翻译为${targetLangName}。

要求：
1. 保持学术语言的专业性和准确性
2. 专业术语翻译要符合${domainName}领域的通用表达
3. 保持原文的逻辑结构和段落划分
4. 翻译应自然流畅，达到母语水平
5. 同时列出翻译中使用的关键术语对照表`,
      },
      {
        role: "user",
        content: `请翻译以下文本：\n\n${text}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "translation_result",
        strict: true,
        schema: {
          type: "object",
          properties: {
            translatedText: { type: "string", description: "翻译后的文本" },
            terminology: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  source: { type: "string", description: "原文术语" },
                  target: { type: "string", description: "译文术语" },
                },
                required: ["source", "target"],
                additionalProperties: false,
              },
              description: "关键术语对照表",
            },
          },
          required: ["translatedText", "terminology"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("翻译失败");
  }

  return JSON.parse(content);
}

/**
 * Polish/proofread translated text to improve naturalness
 */
export async function polishTranslation(
  text: string,
  language: string,
  domain: TranslationDomain = "general"
): Promise<string> {
  const langNames: Record<string, string> = {
    zh: "中文",
    en: "英文",
  };

  const langName = langNames[language] || language;
  const domainName = domainLabels[domain];

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一位${langName}学术写作润色专家，精通${domainName}领域。
请对以下学术文本进行母语级润色，使其更加自然、专业、流畅。
保持原文含义不变，仅改善表达方式。`,
      },
      {
        role: "user",
        content: text,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  return typeof content === "string" ? content : text;
}
