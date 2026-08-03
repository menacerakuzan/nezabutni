"use client";

import { useState } from "react";

export function CandleButton({ pid, initialCount }: { pid: string; initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const [lit, setLit] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

  async function handleClick() {
    if (lit) return;
    try {
      const res = await fetch(`${apiUrl}/defenders/${pid}/candles`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setCount(data.candleCount ?? count + 1);
      } else {
        setCount((c) => c + 1);
      }
    } catch {
      setCount((c) => c + 1);
    }
    setLit(true);
  }

  const hintId = `candle-hint-${pid}`;

  return (
    <div className="group/candle relative inline-flex">
      <button
        onClick={handleClick}
        disabled={lit}
        aria-describedby={hintId}
        className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
          lit
            ? "cursor-default bg-gold/15 text-gold-soft"
            : "bg-gold text-void shadow-[0_10px_30px_-12px_rgba(223,155,59,0.9)] hover:bg-gold-soft active:translate-y-px"
        }`}
      >
        <span
          aria-hidden="true"
          className={`h-2 w-2 rounded-full ${
            lit ? "bg-gold-soft shadow-[0_0_10px_2px_rgba(239,193,120,0.8)]" : "bg-void/40"
          }`}
        />
        {lit ? `Свічку запалено · ${count}` : "Запалити свічку"}
      </button>
      <span
        id={hintId}
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-60 -translate-x-1/2 rounded-[3px] border border-hair-strong bg-void px-3 py-2 text-xs leading-relaxed text-ink opacity-0 shadow-lg transition-opacity duration-150 group-hover/candle:opacity-100 group-focus-within/candle:opacity-100"
      >
        Символічний знак пам’яті: ваша свічка приєднається до його вогника на Полі — і залишиться там для всіх, хто прийде після вас.
      </span>
    </div>
  );
}
