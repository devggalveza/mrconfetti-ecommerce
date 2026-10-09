import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { Link, createFileRoute } from "@tanstack/react-router";
import { Check, LoaderCircle, ShoppingCart, Star, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { CouponField } from "@/features/catalog/components/coupon-field";
import { ProductDetailTabs } from "@/features/catalog/components/product-detail-tabs";
import type { ProductTabValue } from "@/features/catalog/components/product-detail-tabs";
import { PRODUCT_TAB_VALUES } from "@/features/catalog/components/product-detail-tabs";
import { ProductGallery } from "@/features/catalog/components/product-gallery";
import { ProductOptionSelector } from "@/features/catalog/components/product-option-selector";
import { ProductPerks } from "@/features/catalog/components/product-perks";
import { ProductPrice } from "@/features/catalog/components/product-price";
import { ProductRail } from "@/features/catalog/components/product-rail";
import { QuantityStepper } from "@/features/catalog/components/quantity-stepper";
import { StickyAddToCart } from "@/features/catalog/components/sticky-add-to-cart";
import {
  PRODUCT_ADD_TO_CART_COPY,
  PRODUCT_BREADCRUMB_COPY,
  PRODUCT_INSTALMENTS_COPY,
  PRODUCT_NOT_FOUND_COPY,
  PRODUCT_RELATED_COPY,
  PRODUCT_REVIEWS_COPY,
  PRODUCT_STOCK_COPY,
  PRODUCT_TABS_COPY,
  PRODUCT_TITLE_COPY,
} from "@/features/catalog/data/product-detail-content";
import { products } from "@/features/catalog/data/products";
import { instalments, priceWithPack, quantityLimit } from "@/features/catalog/lib/product-detail";
import { relatedProducts } from "@/features/catalog/lib/selectors";
import type { Product, ProductPack } from "@/features/catalog/schemas/product";
import { FavoriteButton } from "@/features/favorites/components/favorite-button";
import { formatMoney, formatRatingValue, formatReviewCount } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";

/** Anchor the rating row's review-count link points at, and the tabs live under. */
const TABS_SECTION_ID = "product-detail-tabs";

/** Heading id of the related-products rail. */
const RELATED_HEADING_ID = "product-related";

/** Related products shown in the rail; the current product is never among them. */
const RELATED_LIMIT = 5;

/** Milliseconds the add-to-cart button spends on each of its two feedback states. */
const ADD_PENDING_MS = 600;
const ADD_CONFIRMED_MS = 1500;

/** Stars the buy box's rating row draws next to the aggregate label. */
const RATING_STAR_COUNT = 5;

/** The add-to-cart button states, matching the three label keys of the copy module. */
type AddToCartStatus = "idle" | "pending" | "added";

/**
 * Resolves the `$productId` param against the static catalogue.
 *
 * The param arrives as a string, so it is read as a number first: a non-numeric
 * value, a fractional value and an integer that matches no product all resolve to
 * `undefined` and lead to the unknown-product state.
 */
function findProduct(rawProductId: string): Product | undefined {
  const productId = Number(rawProductId);

  if (!Number.isInteger(productId)) {
    return undefined;
  }

  return products.find((product) => product.id === productId);
}

export const Route = createFileRoute("/products_/$productId")({
  head: ({ params }) => {
    const product = findProduct(params.productId);

    return {
      meta: [
        {
          title:
            product === undefined
              ? PRODUCT_TITLE_COPY.notFound
              : PRODUCT_TITLE_COPY.forProduct(product.name),
        },
      ],
    };
  },
  component: ProductDetailRoute,
});

/** The `/products/$productId` route: the product page or the unknown-product state. */
function ProductDetailRoute() {
  const { productId } = Route.useParams();
  const product = findProduct(productId);

  if (product === undefined) {
    return <UnknownProduct />;
  }

  // The router re-renders this same component instance when only the param changes,
  // so the stateful page is keyed by the product: moving from one product to another
  // unmounts it, which resets the quantity, the pack and the add status and clears
  // any in-flight timer with it.
  return <ProductDetail key={product.id} product={product} />;
}

/** The fallback shown for an id that is not a number or matches no product. */
function UnknownProduct() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-2xl font-bold">{PRODUCT_NOT_FOUND_COPY.heading}</h1>
      <p className="text-muted-foreground mx-auto mt-2 mb-6 max-w-[60ch] text-sm">
        {PRODUCT_NOT_FOUND_COPY.message}
      </p>
      <Link
        to="/products"
        className="bg-brand focus-visible:outline-ring inline-flex min-h-11 items-center rounded-full px-6 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {PRODUCT_NOT_FOUND_COPY.backLabel}
      </Link>
    </section>
  );
}

/** The product page for a resolved product: buy box, detail tabs and related rail. */
function ProductDetail({ product }: { product: Product }) {
  const addToCart = useCartStore((state) => state.add);
  const [quantity, setQuantity] = useState(1);
  const [pack, setPack] = useState<ProductPack>(product.packs[0]);
  const [activeTab, setActiveTab] = useState<ProductTabValue>(PRODUCT_TAB_VALUES.description);
  const [status, setStatus] = useState<AddToCartStatus>("idle");
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const timersRef = useRef<number[]>([]);
  const titleId = useId();

  // The delivery promise is fixed for this render of the page, so it cannot drift
  // between the server render and hydration.
  const now = useMemo(() => new Date(), []);
  const related = useMemo(() => relatedProducts(products, product, RELATED_LIMIT), [product]);

  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => {
        window.clearTimeout(timer);
      });
    },
    [],
  );

  const unitPrice = priceWithPack(product, pack);
  const limit = quantityLimit(product);
  const isBuyable = limit > 0;

  const handleAdd = useCallback((): void => {
    if (status !== "idle" || !isBuyable) {
      return;
    }

    // The stepper already keeps the value inside the ceiling, but the invariant is
    // enforced here too, where the line is actually written: the cart never depends
    // on the stepper being the only writer.
    const units = Math.min(quantity, limit);

    setStatus("pending");
    timersRef.current.push(
      window.setTimeout(() => {
        addToCart(product.id, units);
        toast(PRODUCT_ADD_TO_CART_COPY.toast);
        setStatus("added");
        timersRef.current.push(
          window.setTimeout(() => {
            setStatus("idle");
          }, ADD_CONFIRMED_MS),
        );
      }, ADD_PENDING_MS),
    );
  }, [addToCart, isBuyable, limit, product.id, quantity, status]);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: PRODUCT_BREADCRUMB_COPY.rootLabel, to: "/" },
          // `Breadcrumbs` takes a plain `to` string, so the category filter travels
          // as an encoded query: this router version resolves it to the catalogue
          // with its `cat` search applied.
          { label: product.category, to: `/products?cat=${encodeURIComponent(product.category)}` },
          { label: product.name },
        ]}
      />

      <section
        aria-labelledby={titleId}
        className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
      >
        <ProductGallery product={product} />

        <div>
          <p className="text-brand text-sm font-semibold">{product.brand}</p>
          <h1 id={titleId} className="text-[22px] leading-snug font-bold lg:text-[28px]">
            {product.name}
          </h1>

          <div className="text-muted-foreground my-2 flex flex-wrap items-center gap-2 text-sm">
            {/* `ProductRating` prints the count as `4,9 (312)`, which would repeat the
                number the review link already carries, so this row draws its own
                decorative stars and shows the aggregate label instead. */}
            <span aria-hidden="true" className="text-warning flex items-center">
              {Array.from({ length: RATING_STAR_COUNT }, (_, index) => (
                <Star key={index} className="size-3.5 fill-current" strokeWidth={1.5} />
              ))}
            </span>
            <span>{PRODUCT_REVIEWS_COPY.aggregateLabel(formatRatingValue(product.rating))}</span>
            <a
              href={`#${TABS_SECTION_ID}`}
              onClick={() => {
                setActiveTab(PRODUCT_TAB_VALUES.reviews);
              }}
              className="text-brand focus-visible:outline-ring inline-flex min-h-6 items-center font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {formatReviewCount(product.reviews)}
            </a>
          </div>

          <div className="mt-4 mb-1">
            <ProductPrice product={{ ...product, price: unitPrice }} />
          </div>

          <p className="text-muted-foreground text-sm">
            {PRODUCT_INSTALMENTS_COPY.line(
              formatMoney(instalments(unitPrice, PRODUCT_INSTALMENTS_COPY.planCount)),
            )}
          </p>

          <ProductOptionSelector product={product} onPackChange={setPack} />

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <QuantityStepper product={product} value={quantity} onChange={setQuantity} />

            <Button
              ref={addButtonRef}
              type="button"
              size="pill"
              onClick={handleAdd}
              disabled={status !== "idle" || !isBuyable}
              className="min-w-[180px] flex-1"
            >
              {status === "pending" ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin motion-reduce:animate-none"
                />
              ) : null}
              {status === "added" ? <Check aria-hidden="true" className="size-4" /> : null}
              {status === "idle" ? <ShoppingCart aria-hidden="true" className="size-4" /> : null}
              {PRODUCT_ADD_TO_CART_COPY[status]}{" "}
              {/* Appended, never substituted: the visible label stays inside the
                  accessible name, so the button is still "Añadir al carrito" and now
                  also says which product, unlike the related rail's five look-alikes. */}
              <span className="sr-only">
                {PRODUCT_ADD_TO_CART_COPY.productName(product.name)}
              </span>
            </Button>

            <FavoriteButton
              productId={product.id}
              productName={product.name}
              className="border-border hover:text-brand static size-12 shrink-0 rounded-full border opacity-100"
            />
          </div>

          <p
            className={cn(
              "mt-4 flex items-center gap-2 text-sm font-semibold",
              isBuyable ? "text-success" : "text-destructive",
            )}
          >
            {isBuyable ? (
              <Check aria-hidden="true" className="size-4" />
            ) : (
              <XCircle aria-hidden="true" className="size-4" />
            )}
            <span>
              {isBuyable ? PRODUCT_STOCK_COPY.inStock(product.stock) : PRODUCT_STOCK_COPY.outOfStock}
            </span>
          </p>

          <ProductPerks product={product} now={now} />

          <CouponField />
        </div>
      </section>

      <section id={TABS_SECTION_ID} aria-label={PRODUCT_TABS_COPY.sectionLabel} className="mt-8">
        <ProductDetailTabs product={product} value={activeTab} onValueChange={setActiveTab} />
      </section>

      <ProductRail
        products={related}
        title={PRODUCT_RELATED_COPY.heading}
        headingId={RELATED_HEADING_ID}
        actionHref="/products"
      />

      <StickyAddToCart
        product={product}
        unitPrice={unitPrice}
        quantity={quantity}
        onAdd={handleAdd}
        targetRef={addButtonRef}
      />
    </>
  );
}
