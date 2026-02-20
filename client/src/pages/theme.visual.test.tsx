import React from "react";
(globalThis as { React?: typeof React }).React = React;
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "@/contexts/ThemeContext";

const locationMock = vi.fn();

const authState = {
  loading: false,
  isAuthenticated: true,
  user: { name: "测试用户", email: "test@example.com" },
};

const trpcState = {
  homeCreateMutation: { mutate: vi.fn(), isPending: false },
  paperList: [
    {
      id: 1,
      title: "机器学习论文",
      type: "graduation",
      status: "completed",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-02T00:00:00.000Z",
    },
  ],
  paperDetail: {
    id: 1,
    title: "机器学习论文",
    type: "graduation",
    outline: "# 大纲",
    content: "正文",
  },
  dashboardStats: {
    totalPapers: 3,
    completedPapers: 2,
    averageQualityScore: 86,
    paperTypeDistribution: [{ type: "graduation", count: 3 }],
    citationFormatDistribution: [{ format: "apa", count: 4 }],
    qualityTrend: [{ date: "2025-01-01", score: 80 }],
    recentPapers: [
      {
        id: 1,
        title: "机器学习论文",
        type: "graduation",
        status: "completed",
        createdAt: "2025-01-02T00:00:00.000Z",
      },
    ],
  },
};

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => authState,
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/", locationMock],
  useParams: () => ({ id: "1" }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      quality: { getHistory: { invalidate: vi.fn() } },
      paper: {
        list: { invalidate: vi.fn() },
        getById: { invalidate: vi.fn() },
        getVersions: { invalidate: vi.fn() },
      },
    }),
    paper: {
      create: { useMutation: () => trpcState.homeCreateMutation },
      list: {
        useQuery: () => ({ data: trpcState.paperList, isLoading: false }),
      },
      getById: {
        useQuery: () => ({ data: trpcState.paperDetail, isLoading: false }),
      },
      getVersions: { useQuery: () => ({ data: [], isLoading: false }) },
      saveEdit: { useMutation: () => ({ mutate: vi.fn() }) },
      restoreVersion: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
      },
      exportWord: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      exportPdf: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      delete: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    quality: {
      getHistory: { useQuery: () => ({ data: [], isLoading: false }) },
      check: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    chart: {
      list: { useQuery: () => ({ data: [], isLoading: false }) },
    },
    latex: {
      getTemplates: {
        useQuery: () => ({
          data: [{ id: "generic", name: "Generic", description: "" }],
        }),
      },
      export: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    dashboard: {
      getStatistics: {
        useQuery: () => ({ data: trpcState.dashboardStats, isLoading: false }),
      },
    },
  },
}));

vi.mock("@/components/MarkdownEditor", () => ({
  default: () => <div>MockEditor</div>,
}));
vi.mock("@/components/ReferenceManager", () => ({ default: () => <div /> }));
vi.mock("@/components/QualityCheckResult", () => ({ default: () => <div /> }));
vi.mock("@/components/PolishToolbar", () => ({ default: () => <div /> }));

import Home from "./Home";
import PaperList from "./PaperList";
import PaperEdit from "./PaperEdit";
import Dashboard from "./Dashboard";

function renderWithTheme(element: React.ReactElement, theme: "light" | "dark") {
  return renderToStaticMarkup(
    <ThemeProvider defaultTheme={theme}>
      {element}
    </ThemeProvider>
  );
}

describe("关键页面在 light/dark 下的视觉类名与语义状态", () => {
  it("Home 在 light/dark 下展示主题切换语义", () => {
    const lightHtml = renderWithTheme(<Home />, "light");
    const darkHtml = renderWithTheme(<Home />, "dark");

    expect(lightHtml).toContain("开始创作您的学术论文");
    expect(darkHtml).toContain("开始创作您的学术论文");
    expect(lightHtml).toContain("工具箱");
  });

  it("PaperList 保留关键容器/状态视觉类名与语义标签", () => {
    const lightHtml = renderWithTheme(<PaperList />, "light");
    const darkHtml = renderWithTheme(<PaperList />, "dark");

    expect(lightHtml).toContain("bg-gradient-to-br from-background via-accent/20 to-background");
    expect(darkHtml).toContain("border border-green-300 bg-green-100 text-green-700");
    expect(lightHtml).toContain("论文状态：已完成，可继续查看详情");
  });

  it("PaperEdit 在 light/dark 下保持专注模式语义状态", () => {
    const lightHtml = renderWithTheme(<PaperEdit />, "light");
    const darkHtml = renderWithTheme(<PaperEdit />, "dark");

    expect(lightHtml).toContain('data-focus-mode="off"');
    expect(lightHtml).toContain('data-testid="paper-edit-header"');
    expect(darkHtml).toContain("专注模式");
  });

  it("Dashboard 在 light/dark 下保留图表与空态语义入口", () => {
    const lightHtml = renderWithTheme(<Dashboard />, "light");
    const darkHtml = renderWithTheme(<Dashboard />, "dark");

    expect(lightHtml).toContain("数据仪表板");
    expect(darkHtml).toContain("论文类型分布");
    expect(lightHtml).toContain("引用格式分布");
  });
});
