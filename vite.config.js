import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "logo.png", "robots.txt"],
      manifest: {
        name: "PAL",
        short_name: "PAL",
        description: "Collaborative project planning with an AI co-pilot.",
        theme_color: "#030712",
        background_color: "#030712",
        display: "standalone",
        start_url: "/",
        scope: "/",
        orientation: "portrait-primary",
        categories: ["productivity", "utilities"],
        icons: [
          {
            src: "logo.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff,woff2}"],
        cleanupOutdatedCaches: true,
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            // Cache Google Fonts if used in future
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
