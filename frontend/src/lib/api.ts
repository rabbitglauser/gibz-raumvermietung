const API_BASE_URL =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8000";

export async function getHealth() {
    const res = await fetch(`${API_BASE_URL}/health`, {
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch backend health: ${res.status}`);
    }

    return res.json();
}