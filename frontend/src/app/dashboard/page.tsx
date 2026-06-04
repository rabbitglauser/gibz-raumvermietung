import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import StaffDashboard from "@/components/organisms/StaffDashboard";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-white text-slate-900">
      <Header />
      <main className="mx-auto w-full max-w-[1180px] flex-1 px-6 py-10 md:px-10">
        <StaffDashboard />
      </main>
      <Footer />
    </div>
  );
}
