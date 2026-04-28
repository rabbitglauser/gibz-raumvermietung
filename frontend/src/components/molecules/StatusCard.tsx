import type { ReactNode } from "react";
import { Heading } from "@/components/atoms";

interface StatusCardProps {
  title: string;
  children: ReactNode;
}

export function StatusCard({ title, children }: StatusCardProps) {
  return (
    <section className="rounded-xl border p-6">
      <Heading level={2} className="mb-2">
        {title}
      </Heading>
      {children}
    </section>
  );
}
