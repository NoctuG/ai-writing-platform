import {
  createLightTheme,
  createDarkTheme,
  BrandVariants,
  Theme,
} from "@fluentui/react-components";

// 定义品牌色彩方案（紫金配色）
const brandColors: BrandVariants = {
  10: "#020105",
  20: "#0F0A1A",
  30: "#1C122F",
  40: "#291A44",
  50: "#362259",
  60: "#432A6E",
  70: "#503283",
  80: "#5D3A98",
  90: "#6A42AD",
  100: "#774AC2",
  110: "#8452D7",
  120: "#915AEC",
  130: "#9E62FF",
  140: "#AB6AFF",
  150: "#B872FF",
  160: "#C57AFF",
};

// 创建浅色主题
export const lightTheme: Theme = createLightTheme(brandColors);

// 创建深色主题
export const darkTheme: Theme = createDarkTheme(brandColors);

// 主题类型
export type ThemeMode = "light" | "dark";

// 获取当前主题
export const getTheme = (mode: ThemeMode): Theme => {
  return mode === "light" ? lightTheme : darkTheme;
};
