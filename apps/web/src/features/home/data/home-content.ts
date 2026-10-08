import { Baby, Balloon, Cake, Candy, GraduationCap, PartyPopper, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { CATEGORIES, type Category } from "@/features/catalog/schemas/product";

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

/** Copy for the home sections phase 2 ships. */
export const HOME_SECTION_HEADINGS = {
  heroPromotions: "Promociones destacadas",
  heroCarousel: "Banners de promociones",
  popularCategories: "Explora las categorías populares",
} as const;
