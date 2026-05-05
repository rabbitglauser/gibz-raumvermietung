"use client";

import { useState } from "react";

function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      style={{
        transform: direction === "right" ? "rotate(180deg)" : undefined,
      }}
    >
      <path
        d="M8 2L4 6l4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface PaginationProps {
  totalPages?: number;
}

export function Pagination({ totalPages = 3 }: PaginationProps) {
  const [page, setPage] = useState(1);

  const baseBtn =
    "flex h-9 w-9 items-center justify-center border text-[13px] transition";

  return (
    <nav
      aria-label="Seitennavigation"
      className="flex items-center justify-center gap-2"
    >
      <button
        type="button"
        aria-label="Vorherige Seite"
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        className={`${baseBtn} border-[#d6dde5] text-[#5f6872] hover:border-[#003b73] hover:text-[#003b73]`}
      >
        <Arrow direction="left" />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => {
        const active = n === page;
        return (
          <button
            key={n}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => setPage(n)}
            className={`${baseBtn} ${
              active
                ? "border-[#003b73] bg-[#003b73] font-semibold text-white"
                : "border-[#d6dde5] text-[#003b73] hover:border-[#003b73]"
            }`}
          >
            {n}
          </button>
        );
      })}

      <button
        type="button"
        aria-label="Nächste Seite"
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        className={`${baseBtn} border-[#d6dde5] text-[#5f6872] hover:border-[#003b73] hover:text-[#003b73]`}
      >
        <Arrow direction="right" />
      </button>
    </nav>
  );
}
