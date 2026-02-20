import * as React from "react";
import { Button as FluentButton } from "@fluentui/react-components";
import { cn } from "@/lib/utils";

type Variant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type Size = "default" | "sm" | "lg" | "icon";

export type ButtonProps = React.PropsWithChildren<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
  }
>;

const appearanceMap = {
  default: "primary",
  destructive: "primary",
  outline: "outline",
  secondary: "secondary",
  ghost: "subtle",
  link: "transparent",
} as const;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", children, ...props }, ref) => {
    return (
      <FluentButton
        ref={ref}
        appearance={appearanceMap[variant]}
        size={size === "lg" ? "large" : size === "sm" ? "small" : "medium"}
        className={cn(size === "icon" && "min-w-8 w-8 h-8 p-0", className)}
        {...(props as any)}
      >
        {children}
      </FluentButton>
    );
  }
);

Button.displayName = "Button";
