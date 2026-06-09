// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import remarkDirective from 'remark-directive';
import remarkCalloutDirective from './remark-callout-directive.mjs';

export default defineConfig({
  site: 'https://stock-learn.pages.dev',
  markdown: {
    remarkPlugins: [remarkDirective, remarkCalloutDirective],
  },
  integrations: [
    mdx({
      remarkPlugins: [remarkDirective, remarkCalloutDirective],
    }),
    sitemap(),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
