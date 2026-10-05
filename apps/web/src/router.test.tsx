// @vitest-environment jsdom
import { useQueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getRouter } from "./router";

function QueryClientConsumer() {
  useQueryClient();
  return null;
}

describe("getRouter", () => {
  it("provides a QueryClient to the whole rendered app tree", () => {
    const router = getRouter();
    const Wrap = router.options.Wrap;

    if (!Wrap) {
      throw new Error("getRouter() must expose a router options Wrap");
    }

    expect(() => render(<Wrap>{<QueryClientConsumer />}</Wrap>)).not.toThrow();
  });
});
