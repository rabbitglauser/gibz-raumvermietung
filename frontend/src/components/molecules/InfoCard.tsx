import type { ReactNode } from "react";

interface InfoCardProps {
  imageUrl: string;
  imageAlt?: string;
  icon: ReactNode;
  label: string;
  value: string;
}

export function InfoCard({
  imageUrl,
  imageAlt,
  icon,
  label,
  value,
}: InfoCardProps) {
  return (
    <div className="flex flex-col border border-[#d6dde5] bg-white">
      <div className="aspect-[16/9] w-full overflow-hidden bg-[#eef2f6]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={imageAlt ?? label}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#eef4fa] text-[#00539b]">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold tracking-[0.08em] text-[#5f6872]">
            {label}
          </div>
          <div className="truncate text-[14px] font-semibold text-[#003b73]">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}
