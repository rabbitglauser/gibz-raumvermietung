export function Header() {
  const navItems = ["Grundbildung", "Weiterbildung", "Service", "Über uns"];

  return (
    <header className="w-full bg-white text-[#003b71]">
      <div className="mx-auto max-w-[1180px] px-6 md:px-10">
        {/* Top line */}
        <div className="flex items-center justify-between pt-5 text-sm">
          <p className="font-bold text-black">
            GIBZ Gewerblich-industrielles Bildungszentrum Zug
          </p>

          <div className="flex items-center gap-1 text-sm text-[#003b71]">
            <a href="#" className="hover:underline">
              ↖ Kontakt
            </a>
            <span>|</span>
            <a href="#" className="hover:underline">
              ↖ iZug
            </a>
          </div>
        </div>

        {/* Navigation row */}
        <div className="flex flex-col gap-6 py-9 lg:flex-row lg:items-center lg:justify-between">
          <nav className="flex flex-wrap items-center gap-x-9 gap-y-4 text-2xl font-normal">
            {navItems.map((item) => (
              <a
                key={item}
                href="#"
                className="flex items-center gap-1 whitespace-nowrap text-[#003b71]"
              >
                {item}
                <span className="text-xl">⌄</span>
              </a>
            ))}
          </nav>

          <form className="flex h-[46px] w-full max-w-[330px] shadow-[0_0_6px_rgba(0,0,0,0.45)]">
            <input
              type="text"
              placeholder="GIBZ durchsuchen"
              className="h-full flex-1 border border-slate-300 bg-white px-4 text-xl text-slate-700 outline-none placeholder:text-slate-400"
            />

            <button
              type="submit"
              className="flex h-full w-[56px] items-center justify-center bg-white text-[#003b71]"
              aria-label="Suchen"
            >
              <svg
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Blue line like mockup */}
      <div className="mx-auto h-[6px] max-w-[1180px] bg-[#b8ddeb]" />
    </header>
  );
}