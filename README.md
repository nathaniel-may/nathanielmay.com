# nathanielmay.com

Personal site and blog for Nathaniel May, built with Astro and Tailwind CSS.

## Development

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run astro -- dev --background
```

Before pushing changes, run:

```sh
npm run check:audit
npm run check
npm run build
npm run check:size
```

## Structure

- `src/pages` contains page routes.
- `src/data/post` contains blog posts, published at root-level permalinks.
- `src/components/ui/Section.astro` defines the standard page and prose containers.
- `src/assets/styles/tailwind.css` defines design tokens and shared utilities.
- `src/config.yaml` contains site, metadata, blog, and analytics configuration.
- `vendor/integration` exposes that configuration through the `astrowind:config` virtual module.

The site is statically generated and deployed to Netlify.

## Credits

The current site was rebuilt from an earlier Gatsby site using parts of the AstroWind project structure.
