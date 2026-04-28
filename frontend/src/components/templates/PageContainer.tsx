import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <main className="min-h-screen p-10">
      <div className="mx-auto max-w-3xl space-y-6">{children}</div>
    </main>
  );
}
