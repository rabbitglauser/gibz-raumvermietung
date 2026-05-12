import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import ReservationIntro from "@/components/organisms/ReservationIntro";
import ReservationForm from "@/components/organisms/ReservationForm";

export default function ReservationPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-white text-slate-900">
      <Header />

      <main className="mx-auto grid w-full max-w-[1180px] flex-1 grid-cols-1 gap-16 px-8 py-16 md:px-12 lg:grid-cols-[1fr_1.05fr] lg:items-start lg:gap-20 lg:py-20">
        <ReservationIntro />
        <ReservationForm />
      </main>

      <Footer />
    </div>
  );
}