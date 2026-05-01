"use client";

import { useCurrency } from "@/lib/currency";

export default function CurrencyToggle({ className = "" }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();

  return (
    <div
      className={`relative inline-flex items-center rounded-full border border-fox-border bg-fox-card/80 p-0.5 text-xs font-semibold backdrop-blur-sm ${className}`}
      role="group"
      aria-label="Select display currency"
    >
      {/* Sliding highlight */}
      <span
        className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full bg-gradient-to-r from-fox-primary to-fox-accent shadow-md shadow-fox-primary/30 transition-transform duration-300 ease-out ${
          currency === "KHR" ? "translate-x-[calc(100%+0px)]" : "translate-x-0"
        }`}
        aria-hidden
      />
      <button
        type="button"
        onClick={() => setCurrency("USD")}
        className={`relative z-10 px-3 py-1 rounded-full transition-colors ${
          currency === "USD" ? "text-black" : "text-fox-muted hover:text-fox-text"
        }`}
        aria-pressed={currency === "USD"}
      >
        USD
      </button>
      <button
        type="button"
        onClick={() => setCurrency("KHR")}
        className={`relative z-10 px-3 py-1 rounded-full transition-colors ${
          currency === "KHR" ? "text-black" : "text-fox-muted hover:text-fox-text"
        }`}
        aria-pressed={currency === "KHR"}
      >
        KHR
      </button>
    </div>
  );
}
