import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    loading: false,
    user: { name: "Test", email: "test@example.com" },
    logout: vi.fn(),
  }),
}));

vi.mock("@/hooks/useMobile", () => ({ useIsMobile: () => false }));
vi.mock("wouter", () => ({ useLocation: () => ["/", vi.fn()] }));

vi.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Sidebar: ({ children, ...props }: { children: React.ReactNode }) => (
    <aside {...props}>{children}</aside>
  ),
  SidebarContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SidebarFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SidebarHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SidebarInset: ({ children, ...props }: { children: React.ReactNode }) => (
    <section {...props}>{children}</section>
  ),
  SidebarMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SidebarMenuButton: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
  }) => <button {...props}>{children}</button>,
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SidebarTrigger: () => <button>trigger</button>,
  useSidebar: () => ({ state: "expanded", toggleSidebar: vi.fn() }),
}));

import DashboardLayout from "./DashboardLayout";

describe("DashboardLayout focus mode", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      writable: true,
      value: {
        location: { search: "", pathname: "/paper/1/edit", hash: "" },
      },
    });

    Object.defineProperty(globalThis, "localStorage", {
      writable: true,
      value: { getItem: vi.fn(() => null), setItem: vi.fn() },
    });
  });

  it("hides sidebar in focus mode", () => {
    (globalThis.window as Window & typeof globalThis).location.search =
      "?focus=1";

    const html = renderToStaticMarkup(
      <DashboardLayout>
        <div>content</div>
      </DashboardLayout>
    );

    expect(html).not.toContain('data-testid="dashboard-sidebar"');
  });
});
