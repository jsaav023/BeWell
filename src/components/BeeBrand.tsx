import { BeeMark } from "./BeeMark";

type Props = {
  size?: "sm" | "lg";
  className?: string;
};

export function BeeBrand({ size = "lg", className = "" }: Props) {
  const isLarge = size === "lg";

  return (
    <div
      className={`inline-flex items-center justify-center gap-2.5 ${className}`}
    >
      <BeeMark size={isLarge ? 34 : 22} />
      <span
        className={`brand-title font-[family-name:var(--font-display)] tracking-tight text-[var(--ink)] ${
          isLarge ? "text-5xl sm:text-6xl" : "text-sm uppercase tracking-[0.16em]"
        }`}
      >
        BeWell
      </span>
    </div>
  );
}
