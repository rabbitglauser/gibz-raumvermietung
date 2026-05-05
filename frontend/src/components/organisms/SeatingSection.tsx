function SeatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 7V4.5a1.5 1.5 0 011.5-1.5h6a1.5 1.5 0 011.5 1.5V7M2.5 7h11v3.5h-11zM4 10.5V13M12 10.5V13"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const seating = [
  { label: "Theater", count: "30 Plätze" },
  { label: "Seminar", count: "24 Plätze" },
  { label: "Block", count: "16 Plätze" },
];

export function SeatingSection() {
  return (
    <section>
      <h2 className="text-[20px] font-bold text-[#003b73]">Bestuhlung</h2>
      <div className="mt-2 h-px bg-[#d6dde5]" />
      <ul className="mt-4 space-y-3">
        {seating.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between border border-[#d6dde5] bg-white px-4 py-3"
          >
            <span className="flex items-center gap-3 text-[14px] font-semibold text-[#003b73]">
              <span className="flex h-7 w-7 items-center justify-center bg-[#eef4fa] text-[#00539b]">
                <SeatIcon />
              </span>
              {row.label}
            </span>
            <span className="text-[13px] text-[#5f6872]">{row.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
