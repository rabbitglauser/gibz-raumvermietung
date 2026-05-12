import Link from "next/link";

import { assetPath } from "@/lib/utils";

interface RoomCardProps {
  title: string;
  description: string;
  capacity: string;
  price: string;
  location: string;
  area: string;
  href: string;
  imageUrl?: string | null;
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
  location,
  area,
  href,
  imageUrl,
}: RoomCardProps) {
  return (
    <article className="flex h-full flex-col overflow-hidden border border-[#d6dde5] bg-white">
      <div className="h-56 w-full overflow-hidden bg-[#eef4fa]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={assetPath(imageUrl)}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col justify-between p-5">
            <div className="text-[10px] font-semibold tracking-[0.12em] text-[#5f6872]">
              GIBZ RAUM
            </div>
            <div className="text-[12px] font-semibold tracking-[0.08em] text-[#00539b]">
              {location}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[17px] font-semibold text-[#003b73]">{title}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#5f6872]">
          {description}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#eceff3] pt-3 text-[13px]">
          <span className="flex items-center text-[#5f6872]">
            <PeopleIcon />
            {capacity}
          </span>
          <span className="text-right text-[#5f6872]">{area}</span>
        </div>

        <div className="mt-2 text-[13px] font-semibold text-[#00539b]">
          {price}
        </div>

        <div className="mt-auto pt-4">
          <Link
            href={href}
            className="block border border-[#003b73] py-2 text-center text-[12px] font-semibold tracking-[0.08em] text-[#003b73] hover:bg-[#003b73] hover:text-white"
          >
            DETAILS ANSEHEN
          </Link>
        </div>
      </div>
    </article>
  );
}
