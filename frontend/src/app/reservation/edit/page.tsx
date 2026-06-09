import { Suspense } from "react";

import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import EditReservation from "@/components/organisms/EditReservation";

export default function EditReservationPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-white text-slate-900">
      <Header />
      <main className="mx-auto w-full max-w-[760px] flex-1 px-6 py-12 md:px-10">
        <Suspense
          fallback={<p className="text-sm text-slate-500">Wird geladen…</p>}
        >
          <EditReservation />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
