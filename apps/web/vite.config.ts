import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({
      router: {
        // Route tests live beside the routes they cover, so the generator must
        // not treat them as route modules and warn on every run.
        routeFileIgnorePattern: "\\.test\\.tsx?$",
      },
    }),
    viteReact(),
  ],
  server: {
    port: 3001,
  },
  ssr: {
    noExternal: ["better-auth"],
  },
});
