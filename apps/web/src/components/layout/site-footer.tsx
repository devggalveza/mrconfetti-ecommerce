import { Link } from "@tanstack/react-router";

import { Container } from "@/components/layout/container";

const linkClass =
  "inline-flex min-h-11 items-center py-1.5 text-sm text-footer-muted transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-footer-foreground";

const headingClass = "mb-2 text-[15px] font-semibold text-white";

/** The four-column dark footer: brand column plus three link groups. */
export function SiteFooter() {
  return (
    <footer className="mt-8 bg-footer pt-8 pb-6 text-footer-foreground">
      <Container>
        <div className="grid grid-cols-[1.5fr_repeat(3,1fr)] gap-6 max-lg:grid-cols-2 max-[480px]:grid-cols-1">
          <div>
            <img
              src="/mrconfetti-logo.webp"
              alt="Mr. Confetti"
              width={56}
              height={56}
              className="size-14 rounded-lg"
            />
            <p className="mt-2 max-w-[280px] text-sm text-footer-muted">
              Todo para tu fiesta: globos, decoración, dulces y sorpresas para celebrar cada
              ocasión.
            </p>
          </div>

          <nav aria-label="Comprar">
            <h3 className={headingClass}>Comprar</h3>
            <ul>
              <li>
                <Link to="/products" className={linkClass}>
                  Todos los productos
                </Link>
              </li>
              <li>
                <Link to="/products" search={{ cat: ["Graduación"] }} className={linkClass}>
                  Graduación
                </Link>
              </li>
              <li>
                <Link to="/products" search={{ cat: ["Globos"] }} className={linkClass}>
                  Globos
                </Link>
              </li>
              <li>
                <Link to="/products" search={{ deal: true }} className={linkClass}>
                  Ofertas
                </Link>
              </li>
              <li>
                <Link to="/cart" className={linkClass}>
                  Carrito
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Ayuda">
            <h3 className={headingClass}>Ayuda</h3>
            <ul>
              <li>
                <Link to="/ayuda" className={linkClass}>
                  Centro de ayuda
                </Link>
              </li>
              <li>
                <Link to="/ayuda" search={{ tema: "devoluciones" }} className={linkClass}>
                  Devoluciones
                </Link>
              </li>
              <li>
                <Link to="/ayuda" search={{ tema: "pedido" }} className={linkClass}>
                  Seguir pedido
                </Link>
              </li>
              <li>
                <Link to="/ayuda" search={{ tema: "contacto" }} className={linkClass}>
                  Contacto
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Empresa">
            <h3 className={headingClass}>Empresa</h3>
            <ul>
              <li>
                <Link to="/ayuda" search={{ tema: "nosotros" }} className={linkClass}>
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link to="/ayuda" search={{ tema: "privacidad" }} className={linkClass}>
                  Privacidad
                </Link>
              </li>
              <li>
                <Link to="/ayuda" search={{ tema: "terminos" }} className={linkClass}>
                  Términos
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-6 border-t border-footer-border pt-4 text-[13px] text-footer-muted">
          © 2026 Mr. Confetti. Tienda de demostración con datos de ejemplo.
        </div>
      </Container>
    </footer>
  );
}
