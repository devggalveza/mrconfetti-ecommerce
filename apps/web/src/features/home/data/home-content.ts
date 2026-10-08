import {
  Baby,
  Balloon,
  Cake,
  Candy,
  Gift,
  GraduationCap,
  Package,
  PartyPopper,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { products } from "@/features/catalog/data/products";
import { BRANDS, CATEGORIES, type Brand, type Category } from "@/features/catalog/schemas/product";
import { formatMoney } from "@/lib/format";

/** A banner of the hero slider, with the size the source artwork declares. */
export type HeroSlide = {
  id: string;
  image: string;
  width: number;
  height: number;
  alt: string;
  href: string;
};

/**
 * The three promo banners shipped in `apps/web/public/banners`, in the order the
 * design's slider shows them. `width`/`height` are the real pixel sizes so the
 * slider reserves its space before the image loads.
 */
export const HERO_SLIDES: ReadonlyArray<HeroSlide> = [
  {
    id: "bienvenida",
    image: "/banners/banner-1.png",
    width: 1920,
    height: 720,
    alt: "Mr. Confetti, artículos para fiestas: el logotipo sobre un fondo morado y azul con formas de confeti",
    href: "/products",
  },
  {
    id: "graduaciones",
    image: "/banners/banner-2.webp",
    width: 1500,
    height: 300,
    alt: "Temporada de graduaciones: calcomanías de birrete y diploma con descuentos en todos los productos de temporada",
    href: "/products?cat=Graduación",
  },
  {
    id: "independencia",
    image: "/banners/banner-3.png",
    width: 1920,
    height: 384,
    alt: "Independencia de Guatemala: letras decoradas con paisajes, tejidos y estrellas sobre un fondo azul y blanco",
    href: "/products?deal=true",
  },
];

/** The "REBAJAS / 50 %" panel beside the slider. */
export type HeroPromo = {
  eyebrow: string;
  percent: number;
  description: string;
  ctaLabel: string;
  href: string;
};

export const HERO_PROMO: HeroPromo = {
  eyebrow: "REBAJAS",
  percent: 50,
  description: "En artículos de fiesta y todo para la temporada de graduaciones",
  ctaLabel: "Ver rebajas",
  href: "/products?deal=true",
};

/** A popular-category shortcut: the catalog category, its icon and its filter link. */
export type HomeCategory = {
  category: Category;
  icon: LucideIcon;
  href: string;
};

/**
 * The seven real catalog categories, in `CATEGORIES` order, each mapped to the
 * closest lucide icon and to its own products filter.
 */
export const HOME_CATEGORIES: ReadonlyArray<HomeCategory> = [
  { category: CATEGORIES[0], icon: GraduationCap, href: `/products?cat=${CATEGORIES[0]}` },
  { category: CATEGORIES[1], icon: Balloon, href: `/products?cat=${CATEGORIES[1]}` },
  { category: CATEGORIES[2], icon: PartyPopper, href: `/products?cat=${CATEGORIES[2]}` },
  { category: CATEGORIES[3], icon: Cake, href: `/products?cat=${CATEGORIES[3]}` },
  { category: CATEGORIES[4], icon: Baby, href: `/products?cat=${CATEGORIES[4]}` },
  { category: CATEGORIES[5], icon: Candy, href: `/products?cat=${CATEGORIES[5]}` },
  { category: CATEGORIES[6], icon: Sparkles, href: `/products?cat=${CATEGORIES[6]}` },
];

/** The accessible names the home sections use, so labels and tests cannot drift. */
export const HOME_SECTION_HEADINGS = {
  heroPromotions: "Promociones destacadas",
  heroCarousel: "Banners de promociones",
  popularCategories: "Explora las categorías populares",
  campaigns: "Campañas de temporada",
  brands: "Explora las marcas oficiales",
} as const;

/**
 * A campaign tile of the three-column banner row. `gradient` and `icon` are the
 * card's own paint, so the component stays a renderer.
 */
export type HomeCampaign = {
  id: string;
  eyebrow: string;
  title: string;
  ctaLabel: string;
  href: string;
  gradient: string;
  icon: LucideIcon;
};

/**
 * The three campaign banners, in the design's order. Each gradient pairs two
 * brand tokens so the three cards stay distinct without the template's own
 * magenta/blue/red palette, and every `title` is a plain string that wraps.
 */
export const HOME_CAMPAIGNS: ReadonlyArray<HomeCampaign> = [
  {
    id: "fiesta-completa",
    eyebrow: "Todo en una sola compra",
    title: "Kits de fiesta hasta 35 % dto.",
    ctaLabel: "Comprar kits",
    href: "/products?cat=Decoración",
    gradient: "bg-linear-150 from-brand to-brand-dark",
    icon: ShoppingBag,
  },
  {
    id: "combo-revelacion",
    eyebrow: "Reserva ya",
    title: "Combos para revelaciones hasta 25 % dto.",
    ctaLabel: "Ver combos",
    href: "/products?cat=Revelación de género",
    gradient: "bg-linear-150 from-discount to-brand",
    icon: Gift,
  },
  {
    id: "dulces-pinata",
    eyebrow: "Ofertas exclusivas",
    title: "Dulces y piñatas hasta 38 % dto.",
    ctaLabel: "Comprar dulces",
    href: "/products?cat=Dulces y piñata",
    gradient: "bg-linear-150 from-brand-dark to-discount",
    icon: Package,
  },
];

/** One of the three official stores, with the filter that lists its catalogue. */
export type HomeBrand = {
  name: Brand;
  href: string;
};

/** The three real catalog brands; the filter is derived so it cannot drift. */
export const HOME_BRANDS: ReadonlyArray<HomeBrand> = BRANDS.map((brand) => ({
  name: brand,
  href: `/products?brand=${brand}`,
}));

/** The cheapest price in the catalogue, the floor the trust cards quote. */
const PRICE_FLOOR = Math.min(...products.map((product) => product.price));

/** A mini trust card below the brand row: bold line, secondary line, one tint. */
export type HomeTrustCard = {
  id: string;
  title: string;
  detail: string;
  tone: string;
};

export const HOME_TRUST_CARDS: ReadonlyArray<HomeTrustCard> = [
  {
    id: "precios",
    title: "Precios para toda celebración",
    detail: `Desde ${formatMoney(PRICE_FLOOR)} en ${products.length} productos`,
    tone: "bg-brand-soft",
  },
  {
    id: "temporada",
    title: "Temporada de graduaciones",
    detail: "Arcos, birretes y decoración dorada",
    tone: "bg-success/10",
  },
  {
    id: "dulces",
    title: "Dulces para tu piñata",
    detail: "Surtidos y golosinas listos para la fiesta",
    tone: "bg-highlight/20",
  },
];

/** The season band above the closing rails. */
export type SeasonBanner = {
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
};

export const SEASON_BANNER: SeasonBanner = {
  title: "Ofertas limitadas para graduaciones",
  description: "Descuentos en arcos de globos, birretes y decoración dorada para tu celebración",
  ctaLabel: "Comprar ahora",
  href: "/products?cat=Graduación",
};
