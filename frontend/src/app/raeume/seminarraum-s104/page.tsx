import {
  AvailabilityCalendar,
  BookingSidebar,
  FeaturesSection,
  Footer,
  Header,
  SeatingSection,
} from "@/components/organisms";
import { InfoCard } from "@/components/molecules";

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

export default function RoomDetailPage() {
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
                Seminarraum S104
              </h1>

              <div className="mt-6 aspect-[16/9] w-full overflow-hidden border border-[#d6dde5] bg-[#eef2f6]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=70"
                  alt="Seminarraum S104"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoCard
                  imageUrl="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=70"
                  icon={<PeopleIcon />}
                  label="KAPAZITÄT"
                  value="bis 30 Personen"
                />
                <InfoCard
                  imageUrl="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=600&q=70"
                  icon={<AreaIcon />}
                  label="FLÄCHE"
                  value="65 m²"
                />
                <InfoCard
                  imageUrl="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=70"
                  icon={<FloorIcon />}
                  label="ETAGE"
                  value="1. OG / S-Trakt"
                />
              </div>
            </div>

            <div className="lg:sticky lg:top-6 lg:self-start">
              <BookingSidebar />
            </div>
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-2">
            <FeaturesSection />
            <SeatingSection />
          </div>

          <div className="mt-12">
            <AvailabilityCalendar />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
