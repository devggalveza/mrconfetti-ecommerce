import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Toaster } from "@/components/ui/sonner";
import { StoreProvider } from "@/stores/store-provider";

import appCss from "../index.css?url";

export type RouterAppContext = {
  queryClient: QueryClient;
};

/**
 * The one route that renders its own header instead of the site header. It is a
 * single greppable constant rather than a layout route: the checkout page needs
 * the checkout header, every other route needs the site header, and the footer
 * stays on all of them.
 */
const CHECKOUT_PATH = "/checkout";

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Mr. Confetti – Todo para tu fiesta",
      },
      {
        name: "description",
        content:
          "Globos, decoración y dulces para cumpleaños, graduaciones y revelaciones de género. Envío a toda Guatemala.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),

  component: RootDocument,
});

function RootDocument() {
  // Read the current path through the router's own state so the document renders
  // the right chrome on the server too, without importing anything from checkout.
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isCheckout = pathname === CHECKOUT_PATH;

  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        <StoreProvider>
          <div className="flex min-h-svh flex-col">
            {isCheckout ? null : <SiteHeader />}
            <main className="flex-1">
              <Container>
                <Outlet />
              </Container>
            </main>
            <SiteFooter />
          </div>
        </StoreProvider>
        <Toaster richColors />

        <TanStackRouterDevtools position="bottom-left" />
        <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
}
