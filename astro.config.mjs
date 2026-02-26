// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import node from "@astrojs/node";

export default defineConfig({
  site: "https://gabriel-guillou.fr",
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [react()],
});
