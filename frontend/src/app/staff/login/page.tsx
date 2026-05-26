"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setStaffToken } from "@/lib/staff-api";
import { API_BASE_URL } from "@/lib/api";

export default function StaffLoginPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/staff/reservations?upcoming=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        setError("Ungültiges Token. Bitte erneut versuchen.");
        return;
      }

      if (!res.ok) {
        setError("Server-Fehler. Bitte später erneut versuchen.");
        return;
      }

      setStaffToken(token);
      router.push("/staff/reservations");
    } catch {
      setError("Verbindung zum Server fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#eef4fa", fontFamily: "Arial, sans-serif" }}
    >
      <div
        className="w-full max-w-sm bg-white shadow-md"
        style={{ borderRadius: 0 }}
      >
        <div
          className="px-6 py-4 text-white text-sm font-bold tracking-wide"
          style={{ backgroundColor: "#003b73" }}
        >
          GIBZ Raumverwaltung
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-4">
          <h1 className="text-lg font-bold" style={{ color: "#003b73" }}>
            Mitarbeiter-Anmeldung
          </h1>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="token"
              className="text-sm font-medium text-gray-700"
            >
              Staff-Token
            </label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              placeholder="Token eingeben"
              className="border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#003b73]"
              style={{ borderRadius: 0 }}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            className="px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "#003b73", borderRadius: 0 }}
          >
            {loading ? "Wird geprüft…" : "Anmelden"}
          </button>
        </form>
      </div>
    </div>
  );
}
