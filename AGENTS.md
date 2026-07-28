## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

Run `npm run check:audit`, `npm run check`, `npm run build`, and `npm run check:size` before pushing.

## Project conventions

- Use `~/components/ui/Section.astro` for page and prose-width shells instead of repeating container classes.
- Define colors, spacing, and fonts in the `@theme` block in `src/assets/styles/tailwind.css`. There is no `--aw-*` token layer.
- Reuse the `heading`, `content-heading`, `btn`, `btn-ghost`, and `icon-btn` utilities.
- The site is dark-only. Do not introduce ad hoc `dark:` variants.
- Posts live in the `src/data/post` content collection. Post permalinks are `/%slug%`; `/posts` is the listing.
- Site configuration lives in `src/config.yaml`. The `vendor/integration` build integration exposes it through the `astrowind:config` virtual module.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
