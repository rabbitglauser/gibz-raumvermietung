import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[72px] w-full border border-[#d6dde5] bg-white px-3 py-2 text-[13px] text-[#003b73] shadow-none transition-colors placeholder:text-[#5f6872] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#003b73] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
