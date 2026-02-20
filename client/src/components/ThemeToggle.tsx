import { Button } from "@fluentui/react-components";
import {
  WeatherMoon24Regular,
  WeatherSunny24Regular,
} from "@fluentui/react-icons";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme, switchable } = useTheme();

  if (!switchable || !toggleTheme) {
    return null;
  }

  return (
    <Button
      appearance="subtle"
      icon={theme === "light" ? <WeatherMoon24Regular /> : <WeatherSunny24Regular />}
      onClick={toggleTheme}
      aria-label={`切换到${theme === "light" ? "深色" : "浅色"}模式`}
      title={`切换到${theme === "light" ? "深色" : "浅色"}模式`}
    />
  );
}
