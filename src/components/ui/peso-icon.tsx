import React from "react";

export function PesoIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <span
      aria-label="Philippine Peso"
      className={`font-black font-sans leading-none inline-flex items-center justify-center select-none text-current ${className}`}
      style={{ fontSize: "1.15em", transform: "translateY(-1px)" }}
    >
      ₱
    </span>
  );
}