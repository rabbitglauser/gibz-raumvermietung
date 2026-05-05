import { Footer, FilterBar, Header } from "@/components/organisms";
import { Pagination, RoomCard } from "@/components/molecules";

const rooms = [
  {
    title: "Auditorium West",
    description:
      "Zentraler Hörsaal mit modernster AV-Technik und Tageslicht.",
    capacity: "85 Personen",
    price: "CHF 850/Tag",
    imageUrl:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=70",
  },
  {
    title: "Atelier Loft",
    description: "Kreativer Workspace für Workshops und Team-Events.",
    capacity: "35 Personen",
    price: "CHF 420/Tag",
    imageUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=70",
  },
  {
    title: "Executive Boardroom",
    description: "Repräsentativer Sitzungsraum für diskrete Meetings.",
    capacity: "20 Personen",
    price: "CHF 680/Tag",
    imageUrl:
      "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=900&q=70",
  },
  {
    title: "Main Hall",
    description: "Grosszügige Mehrzweckhalle für Kongresse und Empfänge.",
    capacity: "100 Personen",
    price: "CHF 1’250/Tag",
    imageUrl:
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=70",
  },
  {
    title: "Seminar Room 102",
    description:
      "Klassischer Schulungsraum mit viel Platz für Gruppenarbeiten.",
    capacity: "45 Personen",
    price: "CHF 380/Tag",
    imageUrl:
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=900&q=70",
  },
  {
    title: "Media Lab",
    description:
      "Spezialisierter Raum für Videoproduktion und Digital Editing.",
    capacity: "25 Personen",
    price: "CHF 550/Tag",
    imageUrl:
      "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=900&q=70",
  },
];

export default function RaeumePage() {
  return (
    <>
      <Header />

      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-[1150px] px-4 py-10 sm:py-12">
          <header className="mb-8">
            <h1 className="text-[32px] font-bold leading-tight text-[#003b73] sm:text-[36px]">
              Verfügbare Räume
            </h1>
            <p className="mt-3 max-w-[520px] text-[14px] leading-relaxed text-[#5f6872]">
              Entdecken Sie unsere hochmodernen Schulungs- und Konferenzräume
              für Ihre nächste Veranstaltung im Herzen von Zug.
            </p>
          </header>

          <div className="mb-10">
            <FilterBar />
          </div>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard key={room.title} {...room} />
            ))}
          </section>

          <div className="mt-12">
            <Pagination totalPages={3} />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
