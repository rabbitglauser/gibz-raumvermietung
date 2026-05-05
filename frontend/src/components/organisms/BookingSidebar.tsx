"use client";

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3.5" width="12" height="10.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 6.5h12M5 2v3M11 2v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function BookingSidebar() {
  return (
    <aside className="border border-[#d6dde5] bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-[0.08em] text-[#5f6872]">
          STATUS
        </span>
        <span className="bg-[#00539b] px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-white">
          VERFÜGBAR
        </span>
      </div>

      <div className="mt-4">
        <div className="text-[12px] text-[#5f6872]">Preis pro Stunde</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[28px] font-bold leading-none text-[#00539b]">
            CHF 45.00
          </span>
          <span className="text-[11px] text-[#5f6872]">exkl. MwSt</span>
        </div>
      </div>

      <div className="my-5 h-px bg-[#eceff3]" />

      <label className="block">
        <span className="text-[10px] font-semibold tracking-[0.08em] text-[#5f6872]">
          DATUM
        </span>
        <div className="mt-1.5 flex h-10 items-center justify-between border border-[#d6dde5] px-3 text-[13px] text-[#003b73]">
          <span>24. Mai 2024</span>
          <span className="text-[#5f6872]">
            <CalendarIcon />
          </span>
        </div>
      </label>

      <div className="my-5 h-px bg-[#eceff3]" />

      <label className="block">
        <span className="text-[10px] font-semibold tracking-[0.08em] text-[#5f6872]">
          ZEITRAUM
        </span>
        <div className="mt-1.5 flex h-10 items-center justify-between border border-[#d6dde5] px-3 text-[13px] text-[#003b73]">
          <span>08:00 - 12:00</span>
          <span className="text-[#5f6872]">
            <ClockIcon />
          </span>
        </div>
      </label>

      <button
        type="button"
        onClick={() => {}}
        className="mt-5 w-full bg-[#003b73] py-3 text-[13px] font-semibold tracking-[0.08em] text-white hover:bg-[#00539b]"
      >
        RESERVIEREN
      </button>

      <p className="mt-3 text-[11px] leading-relaxed text-[#5f6872]">
        Kostenlose Stornierung bis 24 Stunden vor Mietbeginn.
      </p>
    </aside>
  );
}
