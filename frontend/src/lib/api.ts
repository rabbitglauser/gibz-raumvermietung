const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : undefined);

export async function getHealth() {
  if (!API_BASE_URL) {
    return { status: "not configured" };
  }

  const res = await fetch(`${API_BASE_URL}/health`, {
    cache: "force-cache",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch backend health: ${res.status}`);
  }

  return res.json();
}
