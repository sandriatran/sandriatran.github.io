// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Astro configuration for Sandria Tran's portfolio.
 * - React integration enables interactive islands (cards, nav, lightbox)
 * - Tailwind v4 via Vite plugin for utility styling
 * - Static output targets GitHub Pages deployment
 */
export default defineConfig({
  site: 'https://sandriatran.github.io',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  output: 'static',
  devToolbar: { enabled: false },
});
