"use client";

import { useState } from "react";

import { BookingDialog } from "@/components/organisms/BookingDialog";
import type { Room, RoomPrice } from "@/lib/api";

interface BookingSidebarProps {
  room: Room;
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3.5" width="12" height="9" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.5 4l5.5 4.5L13.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function PriceLine({ price }: { price: RoomPrice }) {
  const halfDay =
    price.half_day_chf === 0
      ? "kostenlos"
      : price.half_day_chf
        ? `Fr. ${price.half_day_chf}`
        : "auf Anfrage";
  const fullDay =
    price.full_day_chf === 0
      ? "kostenlos"
      : price.full_day_chf
        ? `Fr. ${price.full_day_chf}`
        : "auf Anfrage";

  return (
    <li className="border-t border-[#eceff3] py-3 first:border-t-0 first:pt-0">
      <div className="text-[13px] font-semibold text-[#003b73]">
        {price.label}
      </div>
      <div className="mt-1 grid grid-cols-2 gap-2 text-[12px] text-[#5f6872]">
        <span>1/2 Tag: {halfDay}</span>
        <span>1 Tag: {fullDay}</span>
      </div>
    </li>
  );
}

export function BookingSidebar({ room }: BookingSidebarProps) {
  const [open, setOpen] = useState(false);
  const cateringEmail = room.reservation.catering_send_to_email;
  const cateringRequired = room.catering.required;

  return (
    <aside className="border border-[#d6dde5] bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-[0.08em] text-[#5f6872]">
          RESERVATION
        </span>
        <span className="bg-[#00539b] px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-white">
          ANFRAGE
        </span>
      </div>

      <div className="mt-4">
        <div className="text-[12px] text-[#5f6872]">Raumkosten</div>
        <ul className="mt-3">
          {room.pricing.map((price) => (
            <PriceLine key={price.label} price={price} />
          ))}
        </ul>
      </div>

      <div className="my-5 h-px bg-[#eceff3]" />

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center bg-[#003b73] py-3 text-[13px] font-semibold tracking-[0.08em] text-white hover:bg-[#00539b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003b73]"
      >
        RESERVATION ANFRAGEN
      </button>

      <div className="my-5 h-px bg-[#eceff3]" />

      <div className="block">
        <span className="text-[10px] font-semibold tracking-[0.08em] text-[#5f6872]">
          VERPFLEGUNG
        </span>
        <div className="mt-1.5 flex h-10 items-center justify-between border border-[#d6dde5] px-3 text-[13px] text-[#003b73]">
          <span className="truncate">{cateringEmail}</span>
          <span className="text-[#5f6872]">
            <MailIcon />
          </span>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-[#5f6872]">
        {cateringRequired
          ? "Speisen und Getränke sind über das Restaurant Treff zu beziehen."
          : "Verpflegung nach Absprache."}
      </p>

      <BookingDialog open={open} onOpenChange={setOpen} room={room} />
    </aside>
  );
}
