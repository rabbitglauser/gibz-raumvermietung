"use client";

const navItems = ["Grundbildung", "Weiterbildung", "Service", "Über uns"];

function ChevronDown() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className="ml-1"
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

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M11 11l3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Header() {
  return (
    <header className="bg-white">
      <div className="mx-auto flex max-w-[1150px] items-center justify-between px-4 pt-3 text-[12px] text-[#003b73]">
        <span className="font-semibold tracking-tight">
          GIBZ Gewerblich-industrielles Bildungszentrum Zug
        </span>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:underline">
            Kontakt
          </a>
          <a href="#" className="hover:underline">
            Zug
          </a>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1150px] flex-wrap items-center justify-between gap-3 px-4 py-4">
        <nav className="flex flex-wrap items-center gap-6 text-[14px] font-semibold text-[#003b73]">
          {navItems.map((label) => (
            <a
              key={label}
              href="#"
              className="flex items-center hover:text-[#00539b]"
            >
              {label}
              <ChevronDown />
            </a>
          ))}
        </nav>

        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          className="flex h-9 items-stretch border border-[#d6dde5] bg-white"
        >
          <input
            type="search"
            placeholder="GIBZ durchsuchen"
            className="w-44 bg-transparent px-3 text-[13px] text-[#003b73] placeholder:text-[#5f6872] focus:outline-none sm:w-56"
          />
          <button
            type="submit"
            aria-label="Suchen"
            className="flex w-9 items-center justify-center bg-[#003b73] text-white hover:bg-[#00539b]"
          >
            <SearchIcon />
          </button>
        </form>
      </div>

      <div className="h-px bg-[#9bc7df]" />
    </header>
  );
}
