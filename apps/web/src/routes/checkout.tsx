import { useMemo } from "react";

import { Navigate, createFileRoute } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CheckoutHeader } from "@/components/layout/checkout-header";
import { Skeleton } from "@/components/ui/skeleton";
import { cartItems } from "@/features/cart/lib/totals";
import { products } from "@/features/catalog/data/products";
import { CheckoutForm } from "@/features/checkout/components/checkout-form";
import { CheckoutSuccess } from "@/features/checkout/components/checkout-success";
import { CHECKOUT_COPY } from "@/features/checkout/data/checkout-copy";
import { useCartStore } from "@/stores/cart-store";
import { useOrdersStore } from "@/stores/orders-store";
import { selectCartLines, selectLastOrder } from "@/stores/selectors";
import { useStoresHydrated } from "@/stores/store-provider";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: CHECKOUT_COPY.title },
      { name: "description", content: CHECKOUT_COPY.description },
    ],
  }),
  component: CheckoutComponent,
});

/**
 * The `/checkout` page.
 *
 * Persisted cart and order state live in `localStorage`, which the server cannot
 * read, so the breadcrumbs, the checkout header and the page heading render on
 * the server too and a single loading status stands in for the persisted
 * sections until the store provider rehydrates. Only then is the state matrix
 * evaluated: a completed order with an empty cart shows the success panel, an
 * empty cart with no order redirects to `/cart`, and anything else shows the
 * form.
 *
 * The `h1` renders unconditionally, exactly as `/cart` and `/favoritos` do, so
 * every state — server paint, loading, redirect, success and form — shows
 * precisely one page heading. Emptiness is read from the same joined items
 * `/cart` uses, so a persisted cart holding only unknown product ids is empty on
 * both routes and can never render a checkout form over an empty item list.
 */
function CheckoutComponent() {
  const hydrated = useStoresHydrated();
  const lines = useCartStore(selectCartLines);
  const lastOrder = useOrdersStore(selectLastOrder);
  const items = useMemo(() => cartItems(lines, products), [lines]);
  const isEmpty = items.length === 0;
  const currentStep = hydrated && isEmpty && lastOrder !== null ? 3 : 2;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: CHECKOUT_COPY.breadcrumbRoot, to: "/" },
          { label: CHECKOUT_COPY.breadcrumbCurrent },
        ]}
      />

      <CheckoutHeader currentStep={currentStep} />

      <h1 className="text-2xl font-bold">{CHECKOUT_COPY.heading}</h1>

      {hydrated ? (
        isEmpty ? (
          lastOrder !== null ? (
            <CheckoutSuccess order={lastOrder} />
          ) : (
            <CheckoutRedirect />
          )
        ) : (
          <CheckoutForm />
        )
      ) : (
        <CheckoutLoading />
      )}
    </>
  );
}

/**
 * Sends an empty checkout back to the cart once the stores have rehydrated, and
 * holds the loading placeholder in the meantime so the form never flashes. The
 * navigation is declarative and replaces the history entry, so the back button
 * does not return to the empty checkout.
 */
function CheckoutRedirect() {
  return (
    <>
      <Navigate to="/cart" replace />
      <CheckoutLoading />
    </>
  );
}

/**
 * Stands in for the persisted sections — the form or the success panel — while
 * the stores rehydrate. It is presentational and shows no money, so the first
 * paint cannot claim an empty cart or a zero total. The single `role="status"`
 * region is named so assistive tech announces the wait.
 */
function CheckoutLoading() {
  return (
    <div role="status" aria-label={CHECKOUT_COPY.loading} className="mt-4">
      <Skeleton aria-hidden="true" className="h-2 w-full" />
      <div className="mt-4 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton aria-hidden="true" className="h-64 w-full" />
        <Skeleton aria-hidden="true" className="h-48 w-full" />
      </div>
    </div>
  );
}
