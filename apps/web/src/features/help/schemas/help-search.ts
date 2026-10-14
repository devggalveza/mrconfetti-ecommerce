import { z } from "zod";

/**
 * The seven anchored help sections, in table-of-contents order. This tuple is
 * the single ordered source of the page's sections, so a new entry must be
 * added here before its label, section body or footer link can exist.
 */
export const HELP_TOPICS = [
  "ayuda",
  "pedido",
  "devoluciones",
  "contacto",
  "nosotros",
  "privacidad",
  "terminos",
] as const;

export type HelpTopic = (typeof HELP_TOPICS)[number];

/** The help page's typed search state. Only the active section is addressable. */
export type HelpSearch = { tema?: HelpTopic };

/**
 * Validates `?tema=`. An unknown value is stripped, not rejected: the page then
 * renders with no active entry, which is the same state a bare `/ayuda` link
 * produces. Rejecting it would turn a stale bookmark into an error page.
 */
export const helpSearchSchema: z.ZodType<HelpSearch> = z.object({
  tema: z.enum(HELP_TOPICS).optional().catch(undefined),
});
