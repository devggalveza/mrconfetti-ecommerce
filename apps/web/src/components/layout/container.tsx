import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** The design's `.wrap`: 1240px max width with a 16px gutter at every breakpoint. */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1240px] px-4", className)}>{children}</div>;
}
