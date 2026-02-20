import { invokeLLM } from "./_core/llm";

export type ChartType = "line" | "bar" | "scatter" | "pie" | "radar" | "area";

export interface ChartDataPoint {
  [key: string]: string | number;
}

export interface GeneratedChartConfig {
  chartType: ChartType;
  title: string;
  data: ChartDataPoint[];
  xAxisKey: string;
  dataKeys: { key: string; color: string; name: string }[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  description?: string;
}

/**
 * Parse CSV text into structured data
 */
export function parseCSV(csvText: string): { headers: string[]; rows: ChartDataPoint[] } {
  const lines = csvText.trim().split("\n").map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) {
    throw new Error("CSV数据至少需要包含标题行和一行数据");
  }

  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const rows: ChartDataPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const row: ChartDataPoint = {};
    headers.forEach((header, j) => {
      const val = values[j] || "";
      const numVal = Number(val);
      row[header] = isNaN(numVal) || val === "" ? val : numVal;
    });
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Generate chart configuration using AI based on data and user description
 */
export async function generateChartConfig(
  data: ChartDataPoint[],
  headers: string[],
  description: string
): Promise<GeneratedChartConfig> {
  const sampleData = data.slice(0, 5);
  const academicColors = [
    "#2563eb", "#dc2626", "#16a34a", "#ca8a04", "#9333ea",
    "#0891b2", "#e11d48", "#65a30d", "#d97706", "#7c3aed"
  ];

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一位学术数据可视化专家。根据用户提供的数据和描述，选择最合适的图表类型并生成配置。
图表应符合学术论文的规范，包含清晰的标题、轴标签和图例。

可用的图表类型：line（折线图）、bar（柱状图）、scatter（散点图）、pie（饼图）、radar（雷达图）、area（面积图）

数据列名：${headers.join(", ")}
数据样例：${JSON.stringify(sampleData)}
总数据行数：${data.length}`,
      },
      {
        role: "user",
        content: `请根据以下描述生成图表配置：${description}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "chart_config",
        strict: true,
        schema: {
          type: "object",
          properties: {
            chartType: { type: "string", enum: ["line", "bar", "scatter", "pie", "radar", "area"] },
            title: { type: "string", description: "图表标题" },
            xAxisKey: { type: "string", description: "X轴对应的数据列名" },
            dataKeys: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  key: { type: "string", description: "数据列名" },
                  name: { type: "string", description: "图例显示名称" },
                  colorIndex: { type: "number", description: "颜色索引（0-9）" },
                },
                required: ["key", "name", "colorIndex"],
                additionalProperties: false,
              },
            },
            xAxisLabel: { type: "string", description: "X轴标签" },
            yAxisLabel: { type: "string", description: "Y轴标签" },
            description: { type: "string", description: "图表描述/注释" },
          },
          required: ["chartType", "title", "xAxisKey", "dataKeys", "xAxisLabel", "yAxisLabel", "description"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("图表配置生成失败");
  }

  const config = JSON.parse(content);
  return {
    chartType: config.chartType as ChartType,
    title: config.title,
    data,
    xAxisKey: config.xAxisKey,
    dataKeys: config.dataKeys.map((dk: { key: string; name: string; colorIndex: number }) => ({
      key: dk.key,
      name: dk.name,
      color: academicColors[dk.colorIndex % academicColors.length],
    })),
    xAxisLabel: config.xAxisLabel,
    yAxisLabel: config.yAxisLabel,
    description: config.description,
  };
}

/**
 * Generate chart from natural language description
 */
export async function generateChartFromDescription(
  description: string
): Promise<GeneratedChartConfig> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一位学术数据可视化专家。根据用户的文字描述，生成示例数据和图表配置。
数据应真实合理，适合学术论文使用。`,
      },
      {
        role: "user",
        content: `请根据以下描述生成图表数据和配置：${description}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "chart_with_data",
        strict: true,
        schema: {
          type: "object",
          properties: {
            chartType: { type: "string", enum: ["line", "bar", "scatter", "pie", "radar", "area"] },
            title: { type: "string" },
            data: {
              type: "array",
              items: { type: "object", additionalProperties: {} },
            },
            xAxisKey: { type: "string" },
            dataKeys: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  key: { type: "string" },
                  name: { type: "string" },
                  color: { type: "string" },
                },
                required: ["key", "name", "color"],
                additionalProperties: false,
              },
            },
            xAxisLabel: { type: "string" },
            yAxisLabel: { type: "string" },
            description: { type: "string" },
          },
          required: ["chartType", "title", "data", "xAxisKey", "dataKeys", "xAxisLabel", "yAxisLabel", "description"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("图表生成失败");
  }

  return JSON.parse(content) as GeneratedChartConfig;
}
