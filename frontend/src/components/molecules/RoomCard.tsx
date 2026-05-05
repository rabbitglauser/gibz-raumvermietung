interface RoomCardProps {
  title: string;
  description: string;
  capacity: string;
  price: string;
  imageUrl: string;
  imageAlt?: string;
}

function PeopleIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="mr-1.5"
    >
      <circle cx="8" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M3 13c.8-2.4 2.8-3.5 5-3.5s4.2 1.1 5 3.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RoomCard({
  title,
  description,
  capacity,
  price,
  imageUrl,
  imageAlt,
}: RoomCardProps) {
  return (
    <article className="flex flex-col border border-[#d6dde5] bg-white">
      <div className="aspect-[16/9] w-full overflow-hidden bg-[#eef2f6]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={imageAlt ?? title}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[17px] font-semibold text-[#003b73]">{title}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#5f6872]">
          {description}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-[#eceff3] pt-3 text-[13px]">
          <span className="flex items-center text-[#5f6872]">
            <PeopleIcon />
            {capacity}
          </span>
          <span className="font-semibold text-[#00539b]">{price}</span>
        </div>

        <button
          type="button"
          className="mt-4 border border-[#003b73] py-2 text-[12px] font-semibold tracking-[0.08em] text-[#003b73] hover:bg-[#003b73] hover:text-white"
        >
          DETAILS ANSEHEN
        </button>
      </div>
    </article>
  );
}
