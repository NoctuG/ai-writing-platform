import React from "react";
(globalThis as { React?: typeof React }).React = React;
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider, useTheme } from "./ThemeContext";

function ThemeProbe() {
  const { theme } = useTheme();
  return <span data-theme={theme}>theme:{theme}</span>;
}

describe("ThemeProvider 持久化恢复", () => {
  it("从 localStorage 恢复主题（模拟刷新后重建）", () => {
    const store = new Map<string, string>([["theme", "dark"]]);
    Object.assign(globalThis, {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
      },
    });

    const html = renderToStaticMarkup(
      <ThemeProvider defaultTheme="light" switchable>
        <ThemeProbe />
      </ThemeProvider>
    );

    expect(html).toContain('data-theme="dark"');

    store.set("theme", "light");
    const htmlAfterRefresh = renderToStaticMarkup(
      <ThemeProvider defaultTheme="dark" switchable>
        <ThemeProbe />
      </ThemeProvider>
    );
    expect(htmlAfterRefresh).toContain('data-theme="light"');
  });
});
