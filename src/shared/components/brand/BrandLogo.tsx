import { Car, Snowflake } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export type BrandLogoProps = {
  /** Base glyph size in px — both icons render at it; the wordmark tracks ~0.55x. */
  size?: number;
  /** Icon-only mode for tight spaces (sidebar tile, compact brand rows). */
  withWordmark?: boolean;
  className?: string;
};

/**
 * MAC-Egypt brand lockup — Snowflake glyph ABOVE the wordmark, Car glyph BELOW.
 * The vertical stack is RTL/LTR-neutral by construction (no directional bias),
 * and every part draws from currentColor so a wrapping context can repaint it
 * (e.g. `text-white` on the navy shell); the default is the primary token
 * (#0072A8 — light theme) which flips to its readable dark-theme counterpart.
 */
export function BrandLogo({
  size = 28,
  withWordmark = true,
  className,
}: BrandLogoProps) {
  const wordmarkSize = Math.max(11, Math.round(size * 0.55));

  return (
    <span
      role="img"
      aria-label="MAC-Egypt"
      className={cn(
        "inline-flex flex-col items-center gap-0.5 text-[color:var(--primary)]",
        className
      )}
    >
      <Snowflake aria-hidden style={{ width: size, height: size }} strokeWidth={2} />
      {withWordmark ? (
        <span
          aria-hidden
          dir="ltr"
          className="font-bold leading-tight tracking-tight"
          style={{ fontSize: wordmarkSize }}
        >
          MAC-Egypt
        </span>
      ) : null}
      <Car aria-hidden style={{ width: size, height: size }} strokeWidth={2} />
    </span>
  );
}
