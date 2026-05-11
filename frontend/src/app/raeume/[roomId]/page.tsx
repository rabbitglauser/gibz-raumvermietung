import { notFound } from "next/navigation";

import {
  BookingSidebar,
  FeaturesSection,
  Footer,
  Header,
  SeatingSection,
} from "@/components/organisms";
import { InfoCard } from "@/components/molecules";
import type { AdditionalMaterial, Room } from "@/lib/api";
import { getStaticRoom, getStaticRooms } from "@/lib/rooms";

function PeopleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M3 13c.8-2.4 2.8-3.5 5-3.5s4.2 1.1 5 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AreaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="11" height="11" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 6h11M6 2.5v11" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function FloorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 12h12M4 9h8M6 6h4M8 3v0"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-[20px] font-bold text-[#003b73]">{title}</h2>
      <div className="mt-2 h-px bg-[#d6dde5]" />
      <ul className="mt-4 space-y-2 text-[14px] leading-relaxed text-[#003b73]">
        {items.map((item) => (
          <li key={item} className="border border-[#d6dde5] bg-white px-4 py-3">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatMaterial(material: AdditionalMaterial) {
  const parts = [material.name];

  if (material.dimensions) {
    parts.push(material.dimensions);
  }

  if (material.max_quantity) {
    parts.push(`max. ${material.max_quantity}`);
  }

  return parts.join(" · ");
}

function buildFeatureList(room: Room) {
  return [
    ...room.fixed_setup,
    ...room.notebook_connections.map((connection) => `Notebook: ${connection}`),
    ...room.internet_access.map((access) => `Internetzugang: ${access}`),
  ];
}

export function generateStaticParams() {
  return getStaticRooms().map((room) => ({
    roomId: room.room_id,
  }));
}

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const room = getStaticRoom(roomId);

  if (!room) {
    notFound();
  }

  return (
    <>
      <Header />

      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-[1150px] px-4 py-10 sm:py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold tracking-[0.12em] text-[#00539b]">
                RAUM-DETAILS
              </div>
              <h1 className="mt-2 text-[32px] font-bold leading-tight text-[#003b73] sm:text-[36px]">
                {room.name}
              </h1>
              <p className="mt-3 max-w-[720px] text-[15px] leading-relaxed text-[#5f6872]">
                {room.description}
              </p>

              <div className="mt-6 overflow-hidden border border-[#d6dde5] bg-[#eef4fa]">
                <div className="aspect-[16/9] w-full">
                  {room.image_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={room.image_path}
                      alt={room.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col justify-between p-6">
                      <div className="text-[11px] font-semibold tracking-[0.12em] text-[#5f6872]">
                        {room.location}
                      </div>
                      <div className="text-[34px] font-bold leading-tight text-[#003b73]">
                        {room.name}
                      </div>
                    </div>
                  )}
                </div>
                {room.image_note && (
                  <div className="border-t border-[#d6dde5] bg-white px-4 py-3">
                    <p className="text-[13px] leading-relaxed text-[#5f6872]">
                      {room.image_note}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoCard
                  icon={<PeopleIcon />}
                  label="KAPAZITÄT"
                  value={`bis ${room.capacity} Personen`}
                />
                <InfoCard
                  icon={<AreaIcon />}
                  label="FLÄCHE"
                  value={`${room.area_m2} m²`}
                />
                <InfoCard
                  icon={<FloorIcon />}
                  label="LAGE"
                  value={`${room.floor} / ${room.building}`}
                />
              </div>
            </div>

            <div className="lg:sticky lg:top-6 lg:self-start">
              <BookingSidebar room={room} />
            </div>
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-2">
            <FeaturesSection title="Grundeinrichtung" items={buildFeatureList(room)} />
            <SeatingSection seating={room.seating_options} />
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-2">
            <DetailList
              title="Zusatzmaterial"
              items={room.additional_material.map(formatMaterial)}
            />
            <DetailList
              title="Mikrofone"
              items={[
                ...room.microphones.map(
                  (microphone) => `${microphone.kind}: ${microphone.quantity} Stk.`
                ),
                ...room.microphone_notes,
              ]}
            />
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-2">
            <DetailList title="Verpflegung" items={room.catering.notes} />
            <DetailList
              title="Hinweise"
              items={[
                `Besichtigung: ${room.inspection_contact.email}, ${room.inspection_contact.phone}`,
                ...room.reservation_notes,
              ]}
            />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
