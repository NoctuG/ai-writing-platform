import { TRPCError } from "@trpc/server";

const AI4SCHOLAR_BASE_URL = "https://ai4scholar.net";

export type SearchPapersParams = {
  query: string;
  limit?: number;
  year?: string;
  fields_of_study?: string;
  open_access_only?: boolean;
  offset?: number;
};

export type Ai4ScholarSearchResponse = {
  total?: number;
  offset?: number;
  next?: number;
  data?: Array<{
    paperId?: string;
    title?: string;
    year?: number;
    citationCount?: number;
    venue?: string;
    url?: string;
    authors?: Array<{ name?: string }>;
    openAccessPdf?: { url?: string };
  }>;
};

function getApiKey(): string {
  const apiKey = process.env.AI4SCHOLAR_API_KEY?.trim();
  if (!apiKey) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "未配置 AI4SCHOLAR_API_KEY，无法调用 Semantic Scholar 接口",
    });
  }
  return apiKey;
}

export async function searchPapers(
  params: SearchPapersParams
): Promise<Ai4ScholarSearchResponse> {
  const apiKey = getApiKey();

  const searchParams = new URLSearchParams({
    query: params.query,
    limit: String(params.limit ?? 10),
  });

  if (typeof params.offset === "number") {
    searchParams.set("offset", String(params.offset));
  }
  if (params.year) {
    searchParams.set("year", params.year);
  }
  if (params.fields_of_study) {
    searchParams.set("fields_of_study", params.fields_of_study);
  }
  if (typeof params.open_access_only === "boolean") {
    searchParams.set("open_access_only", String(params.open_access_only));
  }

  const endpoint = `${AI4SCHOLAR_BASE_URL}/graph/v1/paper/search?${searchParams.toString()}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: `Semantic Scholar 请求失败（${response.status}）：${body || "未知错误"}`,
    });
  }

  return (await response.json()) as Ai4ScholarSearchResponse;
}
