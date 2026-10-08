// @vitest-environment jsdom
import { useState } from "react";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PriceRangeFilter } from "./price-range-filter";

type Range = { min: number | null; max: number | null };

/** A controlled host, so a committed bound flows back into the inputs. */
function Harness({ onCommit }: { onCommit: (range: Range) => void }) {
  const [range, setRange] = useState<Range>({ min: null, max: null });

  return (
    <PriceRangeFilter
      minPrice={range.min}
      maxPrice={range.max}
      onCommit={(min, max) => {
        setRange({ min, max });
        onCommit({ min, max });
      }}
    />
  );
}

afterEach(() => {
  cleanup();
});

describe("PriceRangeFilter", () => {
  it("does not commit while the visitor is typing", async () => {
    const onCommit = vi.fn();
    const user = userEvent.setup();
    render(<Harness onCommit={onCommit} />);

    await user.type(screen.getByLabelText("Mínimo"), "150");

    expect(onCommit).not.toHaveBeenCalled();
  });

  it("commits the typed value on blur", async () => {
    const onCommit = vi.fn();
    const user = userEvent.setup();
    render(<Harness onCommit={onCommit} />);

    await user.type(screen.getByLabelText("Mínimo"), "150");
    await user.tab();

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith({ min: 150, max: null });
  });

  it("reopens the bound when the field is cleared", async () => {
    const onCommit = vi.fn();
    const user = userEvent.setup();
    render(<Harness onCommit={onCommit} />);

    const minimum = screen.getByLabelText("Mínimo");
    await user.type(minimum, "150");
    await user.tab();
    await user.clear(minimum);
    await user.tab();

    expect(onCommit).toHaveBeenLastCalledWith({ min: null, max: null });
  });
});
