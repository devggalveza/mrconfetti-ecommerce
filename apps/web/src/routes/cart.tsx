import { useMemo } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { CartEmpty } from "@/features/cart/components/cart-empty";
import { CartLine } from "@/features/cart/components/cart-line";
import { CouponField } from "@/features/cart/components/coupon-field";
import { FreeShippingMeter } from "@/features/cart/components/free-shipping-meter";
import { OrderConfirmationDialog } from "@/features/cart/components/order-confirmation-dialog";
import { OrderSummary } from "@/features/cart/components/order-summary";
import { SavedForLater } from "@/features/cart/components/saved-for-later";
import { CART_COPY } from "@/features/cart/data/cart-copy";
import { computeTotals, type CartTotals } from "@/features/cart/lib/totals";
import { ProductRail } from "@/features/catalog/components/product-rail";
import { products } from "@/features/catalog/data/products";
import { dealsByDiscount } from "@/features/catalog/lib/selectors";
import { useCartStore } from "@/stores/cart-store";
import { usePromoStore } from "@/stores/promo-store";
import { selectAppliedCoupon, selectCartLines } from "@/stores/selectors";
import { useStoresHydrated } from "@/stores/store-provider";

/** Recommended products shown in the rail at the foot of the page. */
const RECOMMENDED_LIMIT = 5;

/** Heading id of the recommended rail. */
const RECOMMENDED_HEADING_ID = "cart-recommended";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: CART_COPY.title },
      { name: "description", content: CART_COPY.description },
    ],
  }),
  component: CartComponent,
});

/**
 * The `/cart` page. It assembles the sections and computes every amount once, at
 * the route, through `computeTotals`; the sections render what they are handed.
 *
 * Persisted cart, promo and order state lives in `localStorage`, which the server
 * cannot read. Everything that does not depend on that state — the breadcrumbs, the
 * `h1` and the recommended rail — therefore renders unconditionally, on the server
 * too, and a single loading status stands in for the persisted sections until the
 * store provider rehydrates. The page is never blank and never shows an empty cart
 * or a zero total over a persisted one.
 */
function CartComponent() {
  const hydrated = useStoresHydrated();
  const lines = useCartStore(selectCartLines);
  const coupon = usePromoStore(selectAppliedCoupon);
  const totals = useMemo(() => computeTotals(lines, products, coupon), [lines, coupon]);
  const recommended = useMemo(() => dealsByDiscount(products).slice(0, RECOMMENDED_LIMIT), []);
  const isEmpty = totals.items.length === 0;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: CART_COPY.breadcrumbRoot, to: "/" },
          { label: CART_COPY.breadcrumbCurrent },
        ]}
      />

      <h1 className="text-2xl font-bold">{CART_COPY.heading}</h1>

      {hydrated ? <CartContents totals={totals} isEmpty={isEmpty} /> : <CartLoading />}

      <ProductRail
        products={recommended}
        title={CART_COPY.recommendedHeading}
        headingId={RECOMMENDED_HEADING_ID}
        actionHref="/products"
      />
    </>
  );
}

/**
 * Stands in for every persisted section — the free-shipping meter, the line list
 * or empty state, the summary, the coupon field, saved-for-later and the order
 * confirmation dialog — while the stores rehydrate. It is presentational and shows
 * no money, so the first paint cannot claim an empty cart or a zero total. The
 * single `role="status"` region is named so assistive tech announces the wait.
 */
function CartLoading() {
  return (
    <div role="status" aria-label={CART_COPY.loading} className="mt-4">
      <Skeleton aria-hidden="true" className="h-2 w-full" />
      <div className="mt-4 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton aria-hidden="true" className="h-28 w-full" />
        <Skeleton aria-hidden="true" className="h-48 w-full" />
      </div>
    </div>
  );
}

/** The persisted cart sections, rendered only once the stores are hydrated. */
function CartContents({ totals, isEmpty }: { totals: CartTotals; isEmpty: boolean }) {
  return (
    <>
      <FreeShippingMeter totals={totals} />

      {isEmpty ? (
        <div className="mt-4">
          <CartEmpty />
        </div>
      ) : (
        <div className="mt-4 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section>
            <ul
              aria-label={CART_COPY.lineListLabel}
              className="border-border divide-border divide-y border-y"
            >
              {totals.items.map((item) => (
                <CartLine key={item.product.id} item={item} />
              ))}
            </ul>
          </section>

          <aside className="flex flex-col gap-6">
            <OrderSummary totals={totals} />
            <CouponField />
          </aside>
        </div>
      )}

      <SavedForLater />

      <OrderConfirmationDialog />
    </>
  );
}
