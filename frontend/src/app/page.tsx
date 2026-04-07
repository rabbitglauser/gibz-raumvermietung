import { getHealth } from "@/lib/api";

export default async function HomePage() {
  const health = await getHealth();

  return (
      <main className="min-h-screen p-10">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold">Room Rental</h1>
          <p className="text-lg text-gray-600">
            Next.js + FastAPI + MongoDB starter
          </p>

          <div className="rounded-xl border p-6">
            <h2 className="mb-2 text-xl font-semibold">Backend status</h2>
            <pre className="rounded bg-gray-100 p-4 text-sm">
            {JSON.stringify(health, null, 2)}
          </pre>
          </div>
        </div>
      </main>
  );
}