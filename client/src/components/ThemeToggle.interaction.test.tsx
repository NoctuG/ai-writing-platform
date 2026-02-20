import React from "react";
(globalThis as { React?: typeof React }).React = React;
import { describe, expect, it, vi } from "vitest";

const useThemeMock = vi.fn();

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => useThemeMock(),
}));

import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle 交互测试", () => {
  it("触发切换并更新语义标签", () => {
    const toggleTheme = vi.fn();
    useThemeMock.mockReturnValue({ theme: "light", toggleTheme, switchable: true });

    const lightNode = ThemeToggle();
    expect(lightNode?.props["aria-label"]).toBe("切换到深色模式");
    lightNode?.props.onClick();
    expect(toggleTheme).toHaveBeenCalledTimes(1);

    useThemeMock.mockReturnValue({ theme: "dark", toggleTheme, switchable: true });
    const darkNode = ThemeToggle();
    expect(darkNode?.props["aria-label"]).toBe("切换到浅色模式");
  });
});
