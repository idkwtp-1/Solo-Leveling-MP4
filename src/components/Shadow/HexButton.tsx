import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: number;
  glow?: "blue" | "purple" | "red";
  children: ReactNode;
};

export function HexButton({
  size = 56,
  glow = "blue",
  className,
  children,
  ...rest
}: Props) {
  const glowShadow =
    glow === "red"
      ? "0 0 14px oklch(0.6 0.25 20 / 0.8), 0 0 32px oklch(0.6 0.25 20 / 0.45)"
      : glow === "purple"
        ? "0 0 14px oklch(0.5 0.27 295 / 0.8), 0 0 32px oklch(0.5 0.27 295 / 0.45)"
        : "0 0 14px oklch(0.82 0.16 220 / 0.8), 0 0 32px oklch(0.82 0.16 220 / 0.45)";
  return (
    <div
      className="relative inline-flex tap-press"
      style={{
        width: size,
        height: size,
        filter: `drop-shadow(${glowShadow})`,
      }}
    >
      {/* outer border layer */}
      <div
        className="absolute inset-0 hex-clip"
        style={{
          background:
            glow === "red"
              ? "linear-gradient(135deg, oklch(0.6 0.25 20), oklch(0.4 0.25 15))"
              : glow === "purple"
                ? "linear-gradient(135deg, oklch(0.5 0.27 295), oklch(0.82 0.16 220))"
                : "linear-gradient(135deg, oklch(0.82 0.16 220), oklch(0.5 0.27 295))",
        }}
      />
      {/* inner fill */}
      <div className="absolute inset-[2px] hex-clip bg-background" />
      <button
        {...rest}
        className={cn(
          "relative z-10 grid place-items-center w-full h-full hex-clip transition-colors",
          glow === "red" ? "text-red-500 hover:text-red-300" : "text-primary hover:text-foreground",
          className,
        )}
      >
        {children}
      </button>
    </div>
  );
}
