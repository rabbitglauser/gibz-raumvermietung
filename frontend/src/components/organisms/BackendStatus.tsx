"use client";

import { useEffect, useState } from "react";
import { CodeBlock } from "@/components/atoms";
import { StatusCard } from "@/components/molecules";

type BackendHealth =
  | { status: "checking" }
  | { status: "not configured" }
  | { status: "online"; data: unknown }
  | { status: "offline"; message: string };

export function BackendStatus() {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:8000"
      : undefined);
  const [health, setHealth] = useState<BackendHealth>(
    apiBaseUrl ? { status: "checking" } : { status: "not configured" },
  );

  useEffect(() => {
    if (!apiBaseUrl) {
      return;
    }

    const controller = new AbortController();

    async function checkHealth() {
      try {
        const response = await fetch(`${apiBaseUrl}/health`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Health check failed with status ${response.status}`);
        }

        const data: unknown = await response.json();
        setHealth({ status: "online", data });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setHealth({
          status: "offline",
          message: error instanceof Error ? error.message : "Health check failed",
        });
      }
    }

    void checkHealth();

    return () => controller.abort();
  }, [apiBaseUrl]);

  const output =
    health.status === "online"
      ? health.data
      : health.status === "offline"
        ? { status: health.status, message: health.message }
        : { status: health.status };

  return (
    <StatusCard title="Backend status">
      <CodeBlock>{JSON.stringify(output, null, 2)}</CodeBlock>
    </StatusCard>
  );
}
