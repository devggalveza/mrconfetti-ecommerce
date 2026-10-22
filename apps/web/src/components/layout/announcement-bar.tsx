import { useEffect, useState } from "react";

import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";
import { FREE_SHIPPING_FROM } from "@/lib/constants";
import { formatMoney } from "@/lib/format";

/** One message every five seconds: long enough to read, short enough to rotate. */
const ROTATE_MS = 5000;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * The strip's copy, in display order. Every claim is traceable to the rest of the
 * storefront: the free-shipping threshold, the nationwide delivery promise and the
 * store-pickup method the checkout offers. Edit this array to change the messages.
 */
export const ANNOUNCEMENT_MESSAGES: ReadonlyArray<string> = [
  `Envío gratis en compras desde ${formatMoney(FREE_SHIPPING_FROM)}`,
  "Enviamos a toda Guatemala",
  "Recoge tu pedido en tienda",
];

/**
 * The announcement bar above the header: a full-width brand strip with the
 * messages above rotating in place. It is not sticky, so it scrolls away while
 * the header stays pinned, and it holds the first message still when the user
 * asks for reduced motion.
 */
export function AnnouncementBar() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Track the motion preference, including a change that arrives later.
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // The server render and the first client render both show message one, so the
  // rotation can only start after hydration.
  useEffect(() => {
    if (reducedMotion || ANNOUNCEMENT_MESSAGES.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % ANNOUNCEMENT_MESSAGES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  return (
    <aside aria-label="Anuncios" className="bg-brand text-white">
      <Container>
        <div className="grid min-h-9 place-items-center text-center text-xs font-medium sm:text-[13px]">
          {ANNOUNCEMENT_MESSAGES.map((message, index) => (
            <p
              key={message}
              className={cn(
                "col-start-1 row-start-1 px-1 py-1.5 transition-opacity duration-500 motion-reduce:transition-none",
                index === activeIndex ? "opacity-100" : "opacity-0",
              )}
            >
              {message}
            </p>
          ))}
        </div>
      </Container>
    </aside>
  );
}
