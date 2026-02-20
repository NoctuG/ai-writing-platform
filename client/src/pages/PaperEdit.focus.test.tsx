import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mockUseQuery = vi.fn();

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: true, loading: false }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      quality: { getHistory: { invalidate: vi.fn() } },
      paper: {
        getById: { invalidate: vi.fn() },
        getVersions: { invalidate: vi.fn() },
      },
    }),
    paper: {
      getById: { useQuery: (...args: unknown[]) => mockUseQuery(...args) },
      getVersions: { useQuery: () => ({ data: [] }) },
      saveEdit: { useMutation: () => ({ mutate: vi.fn() }) },
      restoreVersion: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
      },
      exportWord: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
      },
      exportPdf: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    quality: {
      getHistory: { useQuery: () => ({ data: [] }) },
      check: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    chart: {
      list: { useQuery: () => ({ data: [] }) },
    },
    latex: {
      getTemplates: {
        useQuery: () => ({
          data: [{ id: "generic", name: "Generic", description: "" }],
        }),
      },
      export: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

vi.mock("wouter", () => ({
  useParams: () => ({ id: "1" }),
  useLocation: () => ["/paper/1/edit", vi.fn()],
}));

vi.mock("@/components/MarkdownEditor", () => ({
  default: () => <div>MockEditor</div>,
}));

vi.mock("@/components/ReferenceManager", () => ({ default: () => <div /> }));
vi.mock("@/components/QualityCheckResult", () => ({ default: () => <div /> }));
vi.mock("@/components/PolishToolbar", () => ({ default: () => <div /> }));

import PaperEdit from "./PaperEdit";

describe("PaperEdit focus mode", () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: {
        id: 1,
        title: "测试论文",
        type: "graduation",
        outline: "",
        content: "",
      },
    });

    Object.defineProperty(globalThis, "window", {
      writable: true,
      value: {
        location: { search: "", pathname: "/paper/1/edit", hash: "" },
        history: { replaceState: vi.fn() },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        open: vi.fn(),
        getSelection: vi.fn(() => ({ toString: () => "" })),
      },
    });
  });

  it("hides header when focus query is enabled", () => {
    (globalThis.window as Window & typeof globalThis).location.search =
      "?focus=1";

    const html = renderToStaticMarkup(<PaperEdit />);

    expect(html).not.toContain('data-testid="paper-edit-header"');
    expect(html).toContain("退出专注");
  });
});
