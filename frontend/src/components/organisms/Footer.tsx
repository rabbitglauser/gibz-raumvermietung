const linkColumn = [
  "Grundbildung",
  "Weiterbildung",
  "Informationen",
  "Ansprechpartner",
];

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13 22v-8h2.7l.4-3H13V9.1c0-.9.3-1.5 1.5-1.5H16V5c-.3 0-1.2-.1-2.2-.1-2.2 0-3.8 1.4-3.8 3.9V11H7v3h3v8h3z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5a2.5 2.5 0 11.02 5 2.5 2.5 0 01-.02-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-.95 1.84-1.95 3.8-1.95 4.05 0 4.8 2.66 4.8 6.13V21h-4v-5.4c0-1.3-.02-2.95-1.8-2.95s-2.07 1.4-2.07 2.86V21h-4z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23 7.2s-.2-1.6-.9-2.3c-.8-.9-1.7-.9-2.2-1C16.6 3.6 12 3.6 12 3.6s-4.6 0-7.9.3c-.5 0-1.4 0-2.2 1C1.2 5.6 1 7.2 1 7.2S.8 9 .8 10.9v1.8c0 1.9.2 3.7.2 3.7s.2 1.6.9 2.3c.8.9 1.9.9 2.4 1C5.8 19.9 12 20 12 20s4.6 0 7.9-.3c.5-.1 1.4-.1 2.2-1 .7-.7.9-2.3.9-2.3s.2-1.8.2-3.7v-1.8c0-1.9-.2-3.7-.2-3.7zM9.7 14.7V8.4l6 3.2-6 3.1z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#74776d] text-white">
      <div className="mx-auto grid max-w-[1150px] gap-8 px-6 py-10 md:grid-cols-3 md:divide-x md:divide-white/30">
        <div className="md:pr-8">
          <ul className="space-y-2 text-[14px]">
            {linkColumn.map((label) => (
              <li key={label}>
                <a href="#" className="hover:underline">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:px-8">
          <div className="text-[14px] font-semibold">Folgen Sie uns</div>
          <ul className="mt-3 space-y-2 text-[14px]">
            <li>
              <a href="#" className="flex items-center gap-2 hover:underline">
                <FacebookIcon /> Facebook
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-2 hover:underline">
                <LinkedInIcon /> LinkedIn
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-2 hover:underline">
                <YouTubeIcon /> YouTube
              </a>
            </li>
          </ul>
        </div>

        <div className="md:pl-8">
          <h4 className="text-[14px] font-semibold">Kontakt</h4>
          <address className="mt-3 not-italic text-[13px] leading-relaxed">
            GIBZ Gewerblich-industrielles
            <br />
            Bildungszentrum Zug
            <br />
            Baarerstrasse 100 | Postfach
            <br />
            6301 Zug
            <br />
            <a
              href="mailto:sekretariat.gibz@zg.ch"
              className="hover:underline"
            >
              sekretariat.gibz@zg.ch
            </a>
          </address>
        </div>
      </div>
    </footer>
  );
}
