import { describe, expect, it } from "vitest";

import { TRACKING_STEPS } from "@/features/help/lib/tracking";
import { HELP_TOPICS } from "@/features/help/schemas/help-search";

import { HELP_COPY, type StaticHelpTopic } from "./help-copy";

/** The five topics that render as authored static sections. */
const STATIC_TOPICS: readonly StaticHelpTopic[] = HELP_TOPICS.filter(
  (topic): topic is StaticHelpTopic => topic !== "ayuda" && topic !== "pedido",
);

/**
 * Walks every string reachable from `HELP_COPY`, including the function-valued
 * builders, so a blank label cannot hide in a nested section.
 */
function walkStrings(
  value: unknown,
  path: string,
  visit: (text: string, path: string) => void,
): void {
  if (typeof value === "string") {
    visit(value, path);
    return;
  }
  if (typeof value === "function") {
    const builder = value as (...args: string[]) => unknown;
    const produced = builder(...Array.from({ length: builder.length }, () => "X"));
    if (typeof produced === "string") {
      visit(produced, path);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkStrings(item, `${path}[${index}]`, visit));
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      walkStrings(child, `${path}.${key}`, visit);
    }
  }
}

describe("HELP_COPY identity", () => {
  it("keeps the title the placeholder route already publishes", () => {
    expect(HELP_COPY.title).toBe("Ayuda | Mr. Confetti");
  });

  it("provides non-empty page-level copy", () => {
    expect(HELP_COPY.description.trim().length).toBeGreaterThan(0);
    expect(HELP_COPY.heading.trim().length).toBeGreaterThan(0);
    expect(HELP_COPY.intro.trim().length).toBeGreaterThan(0);
    expect(HELP_COPY.tocLabel.trim().length).toBeGreaterThan(0);
    expect(HELP_COPY.loading.trim().length).toBeGreaterThan(0);
  });
});

describe("HELP_COPY.topics", () => {
  it("labels every one of the seven topics", () => {
    for (const topic of HELP_TOPICS) {
      expect(HELP_COPY.topics[topic].trim().length).toBeGreaterThan(0);
    }
  });
});

describe("HELP_COPY.faq", () => {
  it("ships six to eight entries with unique, non-empty questions and answers", () => {
    const questions = HELP_COPY.faq.items.map((item) => item.question);
    expect(questions.length).toBeGreaterThanOrEqual(6);
    expect(questions.length).toBeLessThanOrEqual(8);
    expect(new Set(questions).size).toBe(questions.length);
    for (const item of HELP_COPY.faq.items) {
      expect(item.question.trim().length).toBeGreaterThan(0);
      expect(item.answer.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("HELP_COPY.tracking", () => {
  it("describes every tracking step", () => {
    for (const step of TRACKING_STEPS) {
      expect(HELP_COPY.tracking.stepById[step].label.trim().length).toBeGreaterThan(0);
      expect(HELP_COPY.tracking.stepById[step].description.trim().length).toBeGreaterThan(0);
    }
  });

  it("does not promise a lookup the app cannot do", () => {
    const text = HELP_COPY.tracking.notFound("MC-1ABC").toLowerCase();
    expect(text).toContain("mc-1abc");
    expect(text).toContain("último pedido");
  });
});

describe("HELP_COPY.sections", () => {
  it("gives every static topic a title and at least one block", () => {
    expect(STATIC_TOPICS).toHaveLength(5);
    for (const topic of STATIC_TOPICS) {
      const section = HELP_COPY.sections[topic];
      expect(section.title.trim().length).toBeGreaterThan(0);
      expect(section.blocks.length).toBeGreaterThan(0);
    }
  });

  it("publishes only the documentation contact channel and weekday hours", () => {
    const text = JSON.stringify(HELP_COPY.sections.contacto);
    expect(text).toContain("hola@mrconfetti.example");
    expect(text).toContain("de lunes a viernes, de 9 a 18 h");
    expect(text.toLowerCase()).not.toContain("whatsapp");
    expect(text).not.toMatch(/\+?\d[\d\s-]{7,}/);
  });

  it("marks privacy and terms as valueless demo content", () => {
    for (const topic of ["privacidad", "terminos"] as const) {
      const text = JSON.stringify(HELP_COPY.sections[topic]).toLowerCase();
      expect(text).toContain("demostración");
      expect(text).toContain("sin valor legal");
    }
  });
});

describe("HELP_COPY text hygiene", () => {
  it("contains no empty or whitespace-only string anywhere", () => {
    const blanks: string[] = [];
    walkStrings(HELP_COPY, "HELP_COPY", (text, path) => {
      if (text.trim().length === 0) {
        blanks.push(path);
      }
    });
    expect(blanks).toEqual([]);
  });
});
