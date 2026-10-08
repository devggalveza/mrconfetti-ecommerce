import { Link } from "@tanstack/react-router";

import { toProductsLink } from "@/features/home/lib/products-link";

type SectionHeadingProps = {
  title: string;
  headingId: string;
  actionLabel?: string;
  actionHref?: string;
};

/**
 * The heading row shared by the home sections: an `h2` with a trailing link to
 * the full listing. Without `actionHref` only the heading renders.
 */
export function SectionHeading({
  title,
  headingId,
  actionLabel = "Ver todo",
  actionHref,
}: SectionHeadingProps) {
  const action = actionHref === undefined ? undefined : toProductsLink(actionHref);

  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <h2 id={headingId} className="text-lg leading-tight font-bold">
        {title}
      </h2>
      {action ? (
        <Link
          to={action.to}
          search={action.search}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {actionLabel}
          <span aria-hidden="true"> ›</span>
        </Link>
      ) : null}
    </div>
  );
}
