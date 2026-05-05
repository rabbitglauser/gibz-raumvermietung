"use client";

function ChevronDown() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5f6872]"
    >
      <path
        d="M2 4l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="mr-2"
    >
      <path
        d="M2 4h12M4 8h8M6 12h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="text-[10px] font-semibold tracking-[0.08em] text-[#5f6872]">
        {label}
      </span>
      {children}
    </div>
  );
}

function Select({
  defaultValue,
  options,
}: {
  defaultValue: string;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        defaultValue={defaultValue}
        className="h-9 w-full appearance-none border border-[#d6dde5] bg-white px-3 pr-8 text-[13px] text-[#003b73] focus:border-[#00539b] focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown />
    </div>
  );
}

function ToggleChip({ label }: { label: string }) {
  return (
    <label className="flex h-9 cursor-pointer items-center gap-2 border border-[#d6dde5] bg-white px-3 text-[13px] text-[#003b73] hover:border-[#00539b]">
      <input
        type="checkbox"
        className="h-3.5 w-3.5 accent-[#00539b]"
      />
      {label}
    </label>
  );
}

export function FilterBar() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="border border-[#d6dde5] bg-white p-4"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <Field label="KAPAZITÄT (PERSONEN)">
          <Select
            defaultValue="20 - 40 Personen"
            options={[
              "Bis 20 Personen",
              "20 - 40 Personen",
              "40 - 80 Personen",
              "80+ Personen",
            ]}
          />
        </Field>

        <Field label="PREISSPANNE (CHF/TAG)">
          <Select
            defaultValue="CHF 200 - 500"
            options={[
              "CHF 0 - 200",
              "CHF 200 - 500",
              "CHF 500 - 1000",
              "CHF 1000+",
            ]}
          />
        </Field>

        <Field label="AUSSTATTUNG">
          <div className="flex flex-wrap gap-2">
            <ToggleChip label="Hybrid" />
            <ToggleChip label="Catering" />
          </div>
        </Field>

        <button
          type="submit"
          className="flex h-9 items-center justify-center bg-[#003b73] px-5 text-[12px] font-semibold tracking-[0.08em] text-white hover:bg-[#00539b] lg:self-end"
        >
          <FilterIcon />
          FILTERN
        </button>
      </div>
    </form>
  );
}
