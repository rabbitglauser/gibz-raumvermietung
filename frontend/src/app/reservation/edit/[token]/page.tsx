import { notFound } from "next/navigation";
import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import ReservationEditForm from "@/components/organisms/ReservationEditForm";
import { getReservationByEditToken } from "@/lib/reservations";
import { getRoom } from "@/lib/api";

interface EditPageProps {
  params: Promise<{ token: string }>;
}

export default async function ReservationEditPage({ params }: EditPageProps) {
  const { token } = await params;
  const reservation = await getReservationByEditToken(token);

  if (!reservation) {
    notFound();
  }

  const room = await getRoom(reservation.room);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-white text-slate-900">
      <Header />
      <main className="mx-auto w-full max-w-[760px] flex-1 px-8 py-16 md:px-12 lg:py-20">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Reservation bearbeiten
        </h1>
        <p className="mb-8 text-sm text-slate-500">
          Sie können Ihre Reservation bis 24 Stunden vor dem Veranstaltungsbeginn
          bearbeiten.
        </p>
        <ReservationEditForm token={token} reservation={reservation} room={room} />
      </main>
      <Footer />
    </div>
  );
}
