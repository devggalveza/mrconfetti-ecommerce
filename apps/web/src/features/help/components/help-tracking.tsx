import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { selectLastOrder } from "@/stores/selectors";
import { useOrdersStore } from "@/stores/orders-store";
import { useStoresHydrated } from "@/stores/store-provider";

import { HELP_COPY } from "../data/help-copy";
import { formatOrderDate } from "../lib/format-order-date";
import {
  resolveTracking,
  TRACKING_STEPS,
  type TrackingResult,
  type TrackingStepState,
} from "../lib/tracking";

/** Id of the reference input. Exported so the label and the error cannot drift from it. */
export const TRACKING_REFERENCE_FIELD_ID = "help-tracking-reference";

/** Id of the field error, referenced by `aria-describedby` while the error is shown. */
export const TRACKING_REFERENCE_ERROR_ID = "help-tracking-reference-error";

/**
 * A visible state marker per tracked step. It is `aria-hidden` because the state
 * word beside it already carries the meaning, so the distinction is never
 * colour-only even for sighted users who cannot separate the hues.
 */
const STEP_MARKER: Record<TrackingStepState, string> = {
  done: "✓",
  current: "→",
  pending: "○",
};

/**
 * The tracking section. The heading, the description and the `#pedido` anchor
 * render unconditionally, on the server too; only the panel reads the persisted
 * last order, so a single named loading status stands in for it until the store
 * provider rehydrates. Same convention as `/cart`, `/favoritos` and `/checkout`.
 */
export function HelpTracking() {
  const hydrated = useStoresHydrated();

  return (
    <section id="pedido" className="scroll-mt-30">
      <h2 className="text-xl font-bold">{HELP_COPY.tracking.heading}</h2>
      <p className="text-muted-foreground mt-2 text-sm">{HELP_COPY.tracking.description}</p>

      {hydrated ? <TrackingPanel /> : <TrackingLoading />}
    </section>
  );
}

/**
 * Stands in for the lookup panel while the stores rehydrate. It is presentational
 * and claims no result. The single `role="status"` region is named so assistive
 * tech announces the wait.
 */
function TrackingLoading() {
  return (
    <div role="status" aria-label={HELP_COPY.loading} className="mt-4">
      <Skeleton aria-hidden="true" className="h-2 w-full" />
      <Skeleton aria-hidden="true" className="mt-4 h-24 w-full" />
    </div>
  );
}

/**
 * The lookup form. It is a controlled local-state form, not
 * `@tanstack/react-form`: a single field with a single cross-field rule does not
 * justify the dependency, the same reasoning as the phase 8 checkout decision.
 * The clock is read at this boundary and passed to the pure rules, so the rules
 * stay deterministic.
 */
function TrackingPanel() {
  const lastOrder = useOrdersStore(selectLastOrder);
  const [value, setValue] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const showError = fieldError !== null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const resolved = resolveTracking(value, lastOrder, new Date());

    // `empty` and `malformed` are field errors and produce no result panel.
    if (resolved.status === "empty" || resolved.status === "malformed") {
      setFieldError(
        resolved.status === "empty"
          ? HELP_COPY.tracking.emptyError
          : HELP_COPY.tracking.malformedError,
      );
      setResult(null);
      return;
    }

    setFieldError(null);
    setResult(resolved);
  };

  return (
    <div className="mt-4">
      <form
        noValidate
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor={TRACKING_REFERENCE_FIELD_ID} className="text-sm font-medium">
            {HELP_COPY.tracking.label}
          </label>
          <input
            id={TRACKING_REFERENCE_FIELD_ID}
            name="reference"
            type="text"
            value={value}
            placeholder={HELP_COPY.tracking.placeholder}
            autoComplete="off"
            onChange={(event) => {
              setValue(event.target.value);
              setFieldError(null);
            }}
            // Both references are set only while the field error is shown, so the
            // announced description and the visible error cannot disagree.
            aria-invalid={showError ? true : undefined}
            aria-describedby={showError ? TRACKING_REFERENCE_ERROR_ID : undefined}
            className="border-border bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring min-h-11 rounded-full border px-4 text-sm"
          />
          <p className="text-muted-foreground text-xs">{HELP_COPY.tracking.hint}</p>
        </div>

        <Button type="submit" size="pill">
          {HELP_COPY.tracking.submit}
        </Button>
      </form>

      {showError ? (
        <p id={TRACKING_REFERENCE_ERROR_ID} role="alert" className="text-destructive mt-2 text-sm">
          {fieldError}
        </p>
      ) : null}

      {result === null ? null : <TrackingResultPanel result={result} />}
    </div>
  );
}

/** The resolved lookup: an honest not-found message or the four-step timeline. */
function TrackingResultPanel({ result }: { result: TrackingResult }) {
  if (result.status === "not-found") {
    return (
      <p role="status" className="text-muted-foreground mt-4 text-sm">
        {HELP_COPY.tracking.notFound(result.reference)}{" "}
        <a
          href="#contacto"
          className="text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-sm font-medium underline underline-offset-2"
        >
          {HELP_COPY.topics.contacto}
        </a>
      </p>
    );
  }

  if (result.status !== "found") {
    return null;
  }

  const { order, steps } = result;

  return (
    <div className="mt-4">
      <p role="status" className="text-sm font-medium">
        {HELP_COPY.tracking.found(result.reference)}
      </p>

      {/* The two labels already read as sentences, so they are plain paragraphs
          rather than a description list whose `dd` would sit under no `dt`. */}
      <div className="text-muted-foreground mt-2 space-y-1 text-sm">
        <p>{HELP_COPY.tracking.dateLabel(formatOrderDate(order.date))}</p>
        <p>{HELP_COPY.tracking.totalLabel(formatMoney(order.total))}</p>
      </div>

      {/* The order comes from `TRACKING_STEPS`, the single ordered source of
          progression, zipped with the copy module's per-step labels. */}
      <ol
        aria-label={HELP_COPY.tracking.stepsLabel}
        className="border-border divide-border mt-4 divide-y border-y"
      >
        {TRACKING_STEPS.map((id) => {
          const step = HELP_COPY.tracking.stepById[id];
          const state = steps[id];
          const current = state === "current";

          return (
            <li
              key={id}
              aria-current={current ? "step" : undefined}
              className="flex items-start gap-3 py-3"
            >
              <span
                aria-hidden="true"
                className="text-muted-foreground mt-0.5 w-4 shrink-0 text-center text-sm"
              >
                {STEP_MARKER[state]}
              </span>
              <div className="min-w-0">
                <p className="font-medium">{step.label}</p>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
              <span
                className={cn(
                  "ml-auto shrink-0 text-sm",
                  current ? "text-brand font-semibold" : "text-muted-foreground",
                )}
              >
                {HELP_COPY.tracking.stepState[state]}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
