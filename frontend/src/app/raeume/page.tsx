import { Footer, Header } from "@/components/organisms";
import { RoomCard } from "@/components/molecules";
import type { Room } from "@/lib/api";
import { getStaticRooms } from "@/lib/rooms";

function formatPrice(room: Room) {
  const externalPrice =
    room.pricing.find((price) => price.organizer_type === "external_customer") ??
    room.pricing[0];

  if (!externalPrice) {
    return "Preis auf Anfrage";
  }

  if (externalPrice.half_day_chf === 0 && externalPrice.full_day_chf === 0) {
    return "kostenlos";
  }

  if (externalPrice.half_day_chf) {
    return `ab Fr. ${externalPrice.half_day_chf} / 1/2 Tag`;
  }

  if (externalPrice.full_day_chf) {
    return `Fr. ${externalPrice.full_day_chf} / Tag`;
  }

  return "Preis auf Anfrage";
}

export default function RaeumePage() {
  const rooms = getStaticRooms();

  return (
    <>
      <Header />

      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-[1150px] px-4 py-10 sm:py-12">
          <header className="mb-8">
            <h1 className="text-[32px] font-bold leading-tight text-[#003b73] sm:text-[36px]">
              Verfügbare Räume
            </h1>
            <p className="mt-3 max-w-[620px] text-[14px] leading-relaxed text-[#5f6872]">
              Räume für Veranstaltungen, Seminare und Prüfungen am GIBZ Zug.
            </p>
          </header>

          <section className="grid auto-rows-fr grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard
                key={room.room_id}
                title={room.name}
                description={room.description}
                capacity={`bis ${room.capacity} Personen`}
                area={`${room.area_m2} m²`}
                location={room.location}
                price={formatPrice(room)}
                href={`/raeume/${room.room_id}`}
                imageUrl={room.image_path}
              />
            ))}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
