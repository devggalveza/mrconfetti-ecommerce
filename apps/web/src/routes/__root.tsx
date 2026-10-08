import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
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
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        <StoreProvider>
          <div className="flex min-h-svh flex-col">
            <SiteHeader />
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
