import { Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

const STEPS = ["Carrito", "Envío y pago", "Confirmación"] as const;

/** The checkout variant of the header: logo, three-step indicator and secure note. */
export function CheckoutHeader({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <Container>
        <div className="flex h-16 items-center gap-6">
          <Link
            to="/"
            aria-label="Inicio Mr. Confetti"
            className="shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <img
              src="/mrconfetti-logo.webp"
              alt="Mr. Confetti"
              width={48}
              height={48}
              className="size-12 rounded-lg"
            />
          </Link>

          <ol
            aria-label="Pasos de la compra"
            className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground md:flex"
          >
            {STEPS.map((label, index) => {
              const step = index + 1;
              const isCurrent = step === currentStep;
              const marker = (
                <span
                  className={cn(
                    "inline-grid size-6 place-items-center rounded-full bg-surface text-xs",
                    isCurrent && "bg-brand text-white",
                  )}
                >
                  {step}
                </span>
              );
              const stepClass = cn(
                "inline-flex min-h-11 items-center gap-1.5",
                isCurrent && "text-brand",
              );
              return (
                <li key={label} className="flex items-center gap-6">
                  {index > 0 ? <span aria-hidden="true" className="h-px w-6 bg-border" /> : null}
                  {step === 1 ? (
                    <Link
                      to="/cart"
                      aria-current={isCurrent ? "step" : undefined}
                      className={cn(stepClass, "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring")}
                    >
                      {marker}
                      {label}
                    </Link>
                  ) : (
                    <span aria-current={isCurrent ? "step" : undefined} className={stepClass}>
                      {marker}
                      {label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="size-5 text-success" aria-hidden="true" />
            <span className="hidden md:inline">Compra segura</span>
          </div>
        </div>
      </Container>
    </header>
  );
}
