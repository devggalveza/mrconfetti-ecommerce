/**
 * Spanish copy for the favourites page, kept out of the components so every
 * heading, label, dialog string and status message has a single editable home.
 *
 * The module follows the phase 6/7 copy convention: one frozen typed object
 * built with `as const`. Components import this object and never inline a
 * user-facing string.
 */

export const FAVORITES_COPY = Object.freeze({
  /** Document title set by the route. */
  title: "Favoritos | Mr. Confetti",
  /** Document description set by the route. */
  description:
    "Guarda los productos de fiesta que más te gustan y encuéntralos aquí cuando quieras comprarlos.",
  /** The page's single `h1`. */
  heading: "Tus favoritos",
  /** Breadcrumb trail labels. */
  breadcrumbRoot: "Inicio",
  breadcrumbCurrent: "Favoritos",
  /** Accessible name of the list that holds the favourite cards. */
  gridLabel: "Productos favoritos",
  /** Accessible name of the loading status that stands in for the persisted grid. */
  loading: "Cargando tus favoritos",

  clear: {
    /** Visible label of the clear-all trigger, present only when a favourite exists. */
    trigger: "Vaciar favoritos",
    title: "¿Vaciar tus favoritos?",
    description:
      "Se quitarán todos los productos de tu lista de favoritos. Esta acción no se puede deshacer.",
    confirm: "Sí, vaciar favoritos",
    cancel: "Cancelar",
  },

  empty: {
    heading: "Aún no tienes favoritos",
    message: "Marca con el corazón los productos que te gusten y los verás reunidos aquí.",
    cta: "Explorar el catálogo",
  },
} as const);
