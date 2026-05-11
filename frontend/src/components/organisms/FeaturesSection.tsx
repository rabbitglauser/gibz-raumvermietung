function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8.5l3.2 3L13 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface FeaturesSectionProps {
  title?: string;
  items: string[];
}

export function FeaturesSection({
  title = "Ausstattung",
  items,
}: FeaturesSectionProps) {
  return (
    <section>
      <h2 className="text-[20px] font-bold text-[#003b73]">{title}</h2>
      <div className="mt-2 h-px bg-[#d6dde5]" />
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-3 text-[14px] text-[#003b73]">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-[#eef4fa] text-[#00539b]">
              <CheckIcon />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
