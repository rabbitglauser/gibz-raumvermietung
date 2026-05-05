type Cell =
  | { kind: "empty" }
  | { kind: "day"; day: number; muted?: boolean; marker?: "booked" | "selected" | "dot"; bookingLabel?: string };

const weekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

// Mai 2024 — 1. Mai = Mittwoch. Vormonat füllt Mo-Di mit 29, 30 (April).
const cells: Cell[] = [
  { kind: "day", day: 29, muted: true },
  { kind: "day", day: 30, muted: true },
  { kind: "day", day: 1 },
  { kind: "day", day: 2, marker: "booked", bookingLabel: "08:00 - 12:00" },
  { kind: "day", day: 3 },
  { kind: "day", day: 4 },
  { kind: "day", day: 5 },

  { kind: "day", day: 6 },
  { kind: "day", day: 7 },
  { kind: "day", day: 8 },
  { kind: "day", day: 9 },
  { kind: "day", day: 10 },
  { kind: "day", day: 11 },
  { kind: "day", day: 12 },

  { kind: "day", day: 13, marker: "dot" },
  { kind: "day", day: 14 },
  { kind: "day", day: 15 },
  { kind: "day", day: 16 },
  { kind: "day", day: 17 },
  { kind: "day", day: 18 },
  { kind: "day", day: 19 },

  { kind: "day", day: 20 },
  { kind: "day", day: 21 },
  { kind: "day", day: 22 },
  { kind: "day", day: 23 },
  { kind: "day", day: 24, marker: "selected" },
  { kind: "day", day: 25 },
  { kind: "day", day: 26 },

  { kind: "day", day: 27 },
  { kind: "day", day: 28 },
  { kind: "day", day: 29 },
  { kind: "day", day: 30 },
  { kind: "day", day: 31 },
  { kind: "day", day: 1, muted: true },
  { kind: "day", day: 2, muted: true },
];

function DayCell({ cell }: { cell: Cell }) {
  if (cell.kind === "empty") {
    return <div className="min-h-[72px] border border-[#eceff3] bg-[#fafbfc]" />;
  }

  return (
    <div
      className={`relative min-h-[72px] border border-[#eceff3] bg-white p-1.5 ${
        cell.muted ? "text-[#c2c8d0]" : "text-[#003b73]"
      }`}
    >
      <span className="text-[12px] font-semibold">{cell.day}</span>

      {cell.marker === "booked" && cell.bookingLabel && (
        <div className="mt-1 bg-[#003b73] px-1.5 py-1 text-[10px] font-semibold tracking-[0.04em] text-white">
          {cell.bookingLabel}
        </div>
      )}

      {cell.marker === "dot" && (
        <div className="mt-1 inline-block h-3 w-3 bg-[#00539b]" />
      )}

      {cell.marker === "selected" && (
        <div className="mt-1 bg-[#e9933b] px-1.5 py-1 text-[10px] font-semibold tracking-[0.04em] text-white">
          Ihre Auswahl
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-[12px] text-[#5f6872]">
      <span className="inline-block h-3 w-3" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

export function AvailabilityCalendar() {
  return (
    <section>
      <div className="flex items-end justify-between">
        <h2 className="text-[20px] font-bold text-[#003b73]">Verfügbarkeit</h2>
        <span className="text-[13px] text-[#5f6872]">Mai 2024</span>
      </div>
      <div className="mt-2 h-px bg-[#d6dde5]" />

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-7 border-b border-[#d6dde5] pb-2">
            {weekdays.map((d) => (
              <div
                key={d}
                className="px-1 text-[11px] font-semibold tracking-[0.08em] text-[#5f6872]"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-px bg-[#eceff3]">
            {cells.map((c, i) => (
              <DayCell key={i} cell={c} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-5">
        <LegendItem color="#003b73" label="Belegt" />
        <LegendItem color="#d6dde5" label="Verfügbar" />
        <LegendItem color="#e9933b" label="Auswahl" />
      </div>
    </section>
  );
}
