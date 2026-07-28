# Architecture diagrams — working notes

Handoff notes for `arch.html` and its two diagrams. Written so a later session
(human or agent) can resume without re-deriving the brief, re-asking the
questions, or re-verifying the code.

**These notes are portable on purpose.** They were written in the pipeline repo
that the diagram describes, and are being carried into the website repo where
the page will be published. Everything needed to continue is in this file; the
one thing it cannot give you is the source code the diagram claims things
about — see [Facts verified against the code](#facts-verified-against-the-code)
for how to treat that.

**Status:** built and verified. The page carries **both** diagrams — the
concentric SVG above 900 px, the single-column HTML/CSS one below it. 43
automated checks pass. **Next task: publish it on the website.** Start at
[Moving this into the website](#moving-this-into-the-website).

## Files

| File | What it is | State |
|---|---|---|
| `arch.html` | The whole deliverable. One self-contained HTML document, 1365 lines: two diagrams plus prose, one `<style>`, one inline `<script>`. Zero external requests. No build step. | Built |
| this file | The brief, the decisions, the verification suite | Current |

### Left behind in the pipeline repo

Not needed for the website work, recorded so you know they exist and are not
missing by accident:

- `assets/src/arch.drawio` → `assets/target/arch.svg` — an older drawio diagram
  of the same system, rendered by a `diagram-check` CI workflow. **Stale**, and
  deliberately untouched. It is a separate job, still outstanding.
- Branch `docs/arch-html-diagram`, draft PR #146, **not for merge** — it exists
  so the file can be checked out and viewed locally. Source of truth for
  `arch.html` up to commit `e7878ab` in
  `nathaniel-may/personal-analytics`.

---

## Moving this into the website

The active task. **Read [Why this one worked: ask first](#why-this-one-worked-ask-first)
before touching anything** — the reason this artifact was accepted after
earlier attempts were rejected is that the questions got asked first. The same
applies to integration, which has more genuinely open choices than the build
did.

### Ask before writing code

1. **Which integration mode?** These are three different jobs, not three
   spellings of one:
   - **Served as-is** at a path (`/architecture`, or an `.html` file the site
     serves verbatim). Near-zero integration cost, and it preserves every
     property that was actually verified: offline-capable, no build step, no
     external requests, works from `file://`. **Recommended unless there is a
     reason it must live inside the site's chrome.**
   - **A route in the site's framework**, keeping the page's own styles but
     scoped so they cannot escape. Moderate cost; the hazards below are all
     live.
   - **Re-skinned into the site's design system** — the page adopts site fonts,
     colours, spacing. Highest cost, and it puts several load-bearing design
     decisions back on the table (see the constraints list).
2. **Does the site have a light theme?** The page is **dark-only by explicit
   request**, and does not respond to a light-theme signal, so there is no
   half-lit broken state. On a light or auto site it will look like an
   intentional dark island — which is fine, but confirm it is wanted before
   building a light variant. Building one is not a small change: the palette's
   whole logic is value descending inward.
3. **Does the site already have a header, nav, and footer?** The page ships its
   own masthead (`h1` + three-paragraph lede) and a footer. Both may duplicate
   site chrome.
4. **Fonts.** The page uses system stacks deliberately — a hosted artifact's CSP
   can block font CDNs and a `file://` open has no network, so a linked font
   would silently fall back. If the site already loads webfonts, adopting them
   is reasonable *for the prose*; keep the mono stack for identifiers, paths and
   cron strings, where the current sizes are tuned to it.
5. **Is the site public?** The page is fully domain-neutral (it never says what
   the data is) and that was deliberate. It stays correct on a public site — but
   confirm nothing about the surrounding page reintroduces the domain.

### Integration hazards, specifically

All of these are safe in the standalone file and only bite when it is embedded
in a page that has its own CSS. This list is the reason "served as-is" is the
recommendation.

- **The stylesheet restyles bare elements.** `html`, `body`, `section`,
  `table`, `th`, `td`, `h1`, `h2`, `footer`, plus `* { box-sizing: border-box }`.
  Dropped into a shared stylesheet these hit the whole site.
- **Generic class names, very likely to collide:** `page`, `panel`, `figure`,
  `figures`, `legend`, `rule`, `cost`, `costs`, `masthead`, `lede`, `eyebrow`,
  `scroller`, `band`, `edge`, `tick`, `hit`, `lit`, `grp`, `both`, `plain`,
  `outer`, `arch`. (The mobile layout is already namespaced — every class is
  `m…`/`mcard-…` and every id `m-…`/`mb-…`. Only the older desktop half is
  exposed.)
- **The custom properties are on `:root` and generically named:** `--text`,
  `--serif`, `--sans`, `--mono`, `--line`, `--edge`, `--node`, `--core`,
  `--ink`, `--shell`, `--job`, `--muted`, `--dim`, `--amber`. On a site with its
  own design tokens, `--text` and the three font stacks are near-certain
  collisions in **both** directions. Prefix them if the page is embedded.
- **SVG marker ids are document-global.** `ah` and `ahl` (arrowheads),
  referenced as `marker-end: url(#ah)`. A second SVG anywhere on the page using
  those ids breaks the arrows. Related: `url(#…)` references resolve against the
  document base URL in some engines, so **a `<base href>` tag in the site
  template can break every arrowhead and the warehouse glow.** Test for this
  specifically if the site uses one.
- **The script assumes its own DOM.** One IIFE, `var`-scoped, no module
  wrapper. It calls `getElementById` for `arch`, `march`, `panel`, `p-role`,
  `p-title`, `p-vendor`, `p-body`, `p-hint` and dereferences them without
  guarding. If a framework renders only part of the page, or defers the
  markup, it throws. It also binds a `keydown` listener to `document` for Esc.
- **`td:nth-child(n)` selectors assume exactly the four-column table.** Adding
  or reordering a column silently restyles the wrong cells.

### What must not change without asking the author

Every one of these is a decision already made, several of them corrections the
author made to my work. They are not defaults to be re-derived:

- **Three sources at Load, when the repo has two.** A deliberate inaccuracy,
  chosen for symmetry. See [Known deliberate inaccuracy](#known-deliberate-inaccuracy).
- **Dark only.** See question 2 above.
- **Domain-neutral.** The real project is health and training data; that is
  scrubbed on purpose.
- **Zero external requests.** Verify after any change, don't assume.
- **Amber is reserved for interaction**, plus the two lit cron ticks and the
  stat figures. The warehouse keeps its teal and its 16 px glow — the author
  called that out specifically as worth keeping.
- **Nothing moves on desktop.** The mobile expand-in-place is the sole
  exception and stays scoped below 900 px.
- **The fourth table column stays empty** until the author writes it.

### If the prose needs to change

The page's argument is tuned and was iterated on with the author. Two figures
in it are **not** derived from code and will go stale silently:

- **"~1 min" / "~2 min of compute per day" / "sixty times over"** — from the
  author, not measured anywhere.
- **"5 JSON files"** — true as of the pipeline repo at `e7878ab`.

If either needs re-checking, it has to happen in the pipeline repo; there is no
way to verify them from the website.

---

## Why this one worked: ask first

The previous attempts at this diagram were rejected. The thing that changed was
**asking a round of questions before writing any code, and a second round once
the code raised real ambiguities.** If you are picking this up, do the same
before making structural changes.

The questions worth asking for work like this:

1. **What is the thesis?** Not "what does the system do" — what should the
   reader walk away believing? Everything else follows from it.
2. **How much interaction do you actually want?** "Interactive" is a trap word.
3. **Who is the reader, and what do they do next?** Determines whether labels
   name vendors or roles.
4. **What is explicitly out of scope?** Cheaper to ask than to cut later.
5. **How literal should labels be?** Real filenames and vendors, or portable roles?

Ask again mid-build whenever the code contradicts the design, rather than
quietly picking one. The Deploy/warehouse correction below came from exactly
that, and it came from the author, not from me.

---

## The brief (answers already given — do not re-ask)

### Thesis

> The warehouse is not a service. It is a file, and nothing can reach it.

Framed **through the lens of minimum maintenance burden**. In the author's
words: this is maintained alone, in whatever time is left over; every live
endpoint is something to monitor, patch, and be woken up by, and it is added
security surface. The design has none of the author's own to run. That framing
outranks elegance-for-its-own-sake — if a choice makes the page prettier but
weakens the maintenance argument, it loses.

### Audience

Someone technical **evaluating this pattern for their own pipeline**. Most
interested in the offline-DuckDB idea, then in where the other moving parts
went (Clerk, Netlify, Railway). They are **not** being onboarded to this repo,
so nothing should be organised around directory structure.

### Interaction

**Minimal.** Hover or click for detail. Opacity and colour only — nothing
moves, animates, or reflows on desktop. Click pins, Esc releases, every region
keyboard-focusable. This constraint is load-bearing; earlier rejected versions
were over-interactive.

> **Renegotiated once, for mobile only.** A phone has no hover and the detail
> panel is below the fold, so tapping a card would update text you cannot see.
> Expand-in-place was confirmed by the author on 2026-07-28 and is scoped to
> the column layout; the desktop figure still moves nothing. Everything else
> on mobile is still opacity and colour.

### Composition

**Concentric — public shell outside, private core inside.** Value descends
inward: the public ring is the lit surface, the job band is a hole in it, the
core is deeper still.

### Labels

**Roles first, vendors as subtext.** Boxes read `Load` / `Model` / `Extract` /
`Deploy` with `Node.js`, `dbt-core`, `Observable FW`, `Netlify CLI` set smaller
underneath. Portable to a reader using different vendors.

### Domain

**Fully domain-neutral.** The page never says what the data is. The real
project is health and training data; that is irrelevant to the argument and is
scrubbed from the artifact. Sources are three interchangeable `Source` boxes
distinguished only by credential model.

### Scope — in

- The two-a-day scheduled job and its steps
- The warehouse
- Encrypted backup to B2 (kept deliberately simple)
- Clerk auth at the edge — the one public network surface

### Scope — out

- **Local development.** Changes nothing about the shape.
- **The Whoop OAuth token handoff.** Real, interesting, but a second restic
  repo and another box. Mentioned once in a panel, not drawn.
- **The `sheets` seed source.** See the caveat below.
- **The existing `arch.drawio`.** Stale; a separate job.

### Known deliberate inaccuracy

The diagram shows **three sources all entering at Load**. The repo has **two**
there. The real third source is `dbt/seeds/source_sheets/` (`exercises`,
`exercise_log`), which is loaded by `dbt seed` during the **Model** step, not by
the Node ingester.

This was offered as a choice and the author chose the generic placeholder for
symmetry — the third box balances the layout and makes "swap these for whatever
you care about" structural rather than asserted. **Do not "fix" this without
asking.** If it is ever revisited, the accurate version routes the third source
to Model and costs one crossing line.

---

## Facts verified against the code

Checked directly against the source, with citations, at the time of writing.

> **In the website repo these paths do not exist.** They refer to
> `nathaniel-may/personal-analytics` at commit `e7878ab`. Treat the table as
> settled — it is the record of the verification, not a to-do. If a claim has
> to be re-checked, it can only be done in that repo. Do not weaken a statement
> on the page merely because you cannot see the file from here.

| Claim | Where |
|---|---|
| Cron is `0 11,23 * * *` UTC; job starts, runs, exits; no resident worker | `railway.toml`, `justfile: railway-cron-job` |
| Job refuses to start unless `RAILWAY_VOLUME_MOUNT_PATH=/data` and `DUCKDB_PATH=/data/warehouse.duckdb` exactly, and `/data` is a real mount | `justfile: railway-cron-job` |
| Step order: `_ingest-live` → `transform` → `build-dashboard` → `publish-dashboard` → `backup-if-due` | `justfile: railway-cron-job` |
| One failing source does not stop the run; it still publishes | `justfile` comments, `ingestion/src/main.ts` |
| Loaders open the warehouse **read-only**, one query each, write one JSON file | `dashboard/src/data/_duckdb.ts` (`access_mode: 'READ_ONLY'`) |
| **Five** loaders | `dashboard/src/data/*.json.ts` |
| Windowing happens at build time, not page load | `dashboard/src/data/daily-sums.json.ts` |
| **Deploy does not read warehouse data.** It hashes `dashboard/dist` on disk and uploads it. Its only warehouse contact is `meta.publish_state.last_dist_hash` | `publish/src/commands/publishDashboard.ts`, `publish/src/lib/distHash.ts`, `publish/src/lib/publishState.ts` |
| Backup covers `source_*` schemas only → Parquet → restic AES-256 client-side → B2 via its **S3-compatible** API | `backup-restore/src/commands/backup.ts`, README |
| `backup-if-due` self-schedules weekly; no second scheduler | `backup-restore/src/commands/backupIfDue.ts` |
| Netlify edge function guards `/*`, requires `metadata.role === "owner"`; 7-day sessions | `netlify/edge-functions/auth.ts`, `netlify.toml` |

**Runtime: ~1 minute ± 10 s per run** (≈2 min of compute per day). This came
from the author, not the code — there is no measurement in the repo. If it
drifts, the "~2 min" figure and the "sixty times over" line in the job panel
both need updating.

The 20-minute figure in the root README is a **budget**, not a measurement.
Don't present it as runtime.

---

## Design system

Keep a new asset consistent with these or change them deliberately everywhere.

### Colour — dark only, by request

No light theme. The page does not respond to a light-theme signal, so there is
no broken half-lit state. This is a choice, not an omission.

```
--ink        #080b0d   page ground, cyan-biased near-black
--shell      #111a21   public ring
--job        #0a0f12   job band  (value descends inward)
--core       #0d2028   warehouse fill
--core-edge  #4d7d8b   warehouse stroke
--node       #202d37   every box
--line       #2b3a45   box + band strokes
--edge       #3a4a54   connectors
--text       #dce4e7 / --muted #7e8f9a / --dim #55646d
--amber      #e5a44e   accent
```

Two rules that hold the palette together:

1. **Amber is reserved for interaction** plus the two lit cron ticks and the
   stat figures. At rest the figure is otherwise neutral; the accent appears
   when you engage.
2. **The warehouse carries the only hue.** Teal because it is amber's
   complement (so the resting focal colour never competes with the interaction
   colour) and because the neutrals are already cyan-biased, so it reads as the
   same family turned up rather than a new colour entering the page. It has a
   16 px glow — the author called this out specifically as worth keeping.

### Type

No webfonts. CSP on hosted artifacts blocks font CDNs and a `file://` open has
no network, so a linked font would silently fall back. System stacks only.

- **Serif** (`Charter, Iowan Old Style, Palatino, Georgia`) — the argument: headings and prose
- **Sans** (system UI stack) — interface: box titles, labels, table
- **Mono** (`ui-monospace, SF Mono, Menlo`) — identifiers, paths, cron, edge labels

### Geometry — concentric asset (≥900 px)

- **Every box is 126 × 60.** No exceptions. This was an explicit request after
  four different sizes read as arbitrary.
- `viewBox="0 0 1062 828"` — wide, reading left to right.
- Rows at `228 / 324 / 420`; sources, steps and the reader chain share them.
- Columns: `68` sources | `230–832` job band | `868` reader chain.
- Ring gaps: 44 px outside the public nodes, 36 px inside.
- Grid is documented in a comment at the top of the `<svg>`. Keep it current.
- `min-width: 844px` on `svg.arch` is **derived, not chosen**: it is exactly
  what the page gives the figure at the 900 px swap point (900 − 56 of
  padding), so the figure never scrolls sideways on desktop. If the breakpoint
  or `.page` padding moves, recompute it.

### Geometry — column asset (<900 px)

- **Cards take whatever width the column gives them.** The uniform-box rule
  holds *within* an asset; here it means one card style, not one pixel width.
- Rail inset is `30px` = 9 px bar + 21 px connector. Change one, change all
  three (`.mrail` padding, `.mrail-bar` width, `.mrail > .mcard::before`).
- Connectors sit at `top: 25px`, pinned to the card's title row rather than
  its centre, so they stay put when a card expands.
- `.mrail-bar` runs `top: -14px` (the gap above, so it meets the warehouse
  card's bottom edge) to `bottom: 26px` (clearing `.mrail-end`).

### Conventions the drawing uses

| Device | Means |
|---|---|
| Dashed band border | Exists only while the job runs |
| The rail | Every step that moves data opens the same one file |
| Nothing crosses into the core from outside | The thesis, drawn rather than captioned |
| No arrow returns from the published side | There is no query path back |
| Extract → Deploy | The only step-to-step edge; every other step communicates through the warehouse |

---

## Verification

No automated tests were checked into the pipeline repo — it has no Playwright
dependency and adding one for a single doc asset was not worth it. **On the
website that calculus may differ**: if the site already runs Playwright, these
are worth keeping as a real test rather than a scratch script, because the
integration work is exactly the kind that breaks them.

**All 43 pass as of 2026-07-28**, run from [the script below](#the-script)
against a `file://` URL. Re-run after any structural change. The list is
complete enough to rebuild the script from, if the script itself is lost.

Both layouts:

1. **Zero non-`file:` requests**, at 1280 px *and* 390 px. The whole point of
   "standalone" — it must render offline and from any host. Assert on
   `page.on('request')`; check both widths, since the layouts load different
   things.
2. No console errors, no page errors.
3. **No horizontal body overflow** at 320 / 360 / 375 / 390 / 430 / 768 / 899 /
   900 / 1024 px. 320 px matters: it caught a pre-existing `minmax(340px, 1fr)`
   in `.costs` that pushed the page sideways, since fixed to `min(340px, 100%)`.

Concentric asset (≥900 px):

4. **No text overflows its box.** Compare each `<text>` `getBBox()` against its
   rect. Note: `getBBox()` ignores the element's own `transform`, so rotated
   labels need checking by hand.
5. All 12 node boxes are exactly `126 × 60`; 15 regions are keyboard-focusable.
6. Hover traces / click pins / Esc releases, all still working.
7. The mobile column is **not** rendered.
8. **The figure fits its container without scrolling** at 900 / 920 / 921 /
   1024 / 1280 px — 900 px is the one that matters, being the swap point and
   the tightest the figure ever gets. The scroll hint is asserted by band
   (900–920 px), not by measured overflow: it is insurance for platforms whose
   scrollbar is counted in the media query but not given to the layout, which
   a headless overlay-scrollbar browser cannot reproduce.

Column asset (<900 px):

9. The column renders and both `.diagram-wrap` and `.panel` do not.
10. **The two assets carry identical `data-key` sets** — 15 each. This is the
   check that catches a node added to one layout and forgotten in the other.
11. Card widths resolve to two values only (rail-indented and not).
12. Tap expands in place: `.open`, `aria-expanded="true"`, body visible, and
    the title suppressed when it duplicates the card head — and present when
    it does not.
13. Tapping lights related cards (`Model` lights the warehouse) and dims the
    rest.
14. The expanded body stays inside the viewport.
15. Accordion holds: only one card open at a time. Esc collapses and clears the
    dimming. All 15 heads are focusable buttons.
16. The role table stacks — `table` is `display: block`, `thead` hidden, and
    `.table-scroll` no longer scrolls.
17. Under `reducedMotion: 'reduce'`, transition duration is `0s`.

### The script

Kept here rather than checked in, because it is the one artifact that does not
survive the move and rewriting it from the list above would cost an hour. It
takes the page URL as an argument, so it works against `file://` now and
against a dev server once the page is on the site.

```bash
npm i playwright && npx playwright install --with-deps chromium
node check.mjs "file:///abs/path/to/arch.html"    # or http://localhost:PORT/architecture
```

<details>
<summary><code>check.mjs</code></summary>

```js
import { chromium } from 'playwright';

const URL = process.argv[2];
if (!URL) { console.error('usage: node check.mjs <url>'); process.exit(2); }

// Only meaningful for file:// — on a real host, same-origin requests are fine
// and this should be relaxed to "no cross-origin requests".
const OFFLINE = URL.startsWith('file:');

const out = [];
let failed = 0;
const ok = (name, pass, detail = '') => {
  out.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!pass) failed++;
};

const browser = await chromium.launch();

/* ---- requests + errors, both layouts ---- */
for (const [label, w, h] of [['desktop', 1280, 900], ['mobile', 390, 844]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const bad = [], errs = [];
  page.on('request', r => {
    const u = r.url();
    if (OFFLINE ? !u.startsWith('file:') : new URL(u).origin !== new URL(URL).origin) bad.push(u);
  });
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(URL, { waitUntil: 'networkidle' });
  ok(`[${label}] no external requests`, bad.length === 0, bad.join(', '));
  ok(`[${label}] no console / page errors`, errs.length === 0, errs.join(' | '));
  await page.close();
}

/* ---- concentric asset ---- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(URL);

  const over = await page.evaluate(() => {
    const bad = [];
    for (const g of document.querySelectorAll('#arch g')) {
      const rect = g.querySelector('rect');
      if (!rect) continue;
      const rx = +rect.getAttribute('x'), ry = +rect.getAttribute('y');
      const rw = +rect.getAttribute('width'), rh = +rect.getAttribute('height');
      for (const t of g.querySelectorAll('text')) {
        if (t.getAttribute('transform')) continue; // getBBox ignores it; check by hand
        const b = t.getBBox();
        if (b.x < rx - 0.5 || b.x + b.width > rx + rw + 0.5 ||
            b.y < ry - 0.5 || b.y + b.height > ry + rh + 0.5) {
          bad.push(`${g.id}: "${t.textContent.slice(0, 28)}"`);
        }
      }
    }
    return bad;
  });
  ok('[desktop] no SVG text overflows its rect', over.length === 0, over.join('; '));

  const sizes = await page.evaluate(() =>
    [...document.querySelectorAll('#arch rect.node-rect')]
      .map(r => `${r.getAttribute('width')}x${r.getAttribute('height')}`));
  ok('[desktop] every node box is 126x60',
    sizes.length === 12 && sizes.every(s => s === '126x60'),
    `${sizes.length} boxes: ${[...new Set(sizes)].join(', ')}`);

  await page.hover('#g-warehouse');
  const hovered = await page.evaluate(() => ({
    engaged: document.getElementById('arch').classList.contains('engaged'),
    title: document.getElementById('p-title').textContent
  }));
  ok('[desktop] hover traces + fills panel',
    hovered.engaged && hovered.title === 'Warehouse', JSON.stringify(hovered));

  await page.click('#g-backup');
  const pinnedTitle = await page.textContent('#p-title');
  await page.mouse.move(5, 5);
  const stillPinned = await page.textContent('#p-title');
  ok('[desktop] click pins',
    pinnedTitle === 'Durability' && stillPinned === 'Durability', `${pinnedTitle} / ${stillPinned}`);

  await page.keyboard.press('Escape');
  ok('[desktop] Esc releases', (await page.textContent('#p-title')) === 'Three rings');

  const focusable = await page.evaluate(() =>
    document.querySelectorAll('#arch .hit[tabindex="0"]').length);
  ok('[desktop] every region keyboard-focusable', focusable === 15, `${focusable}`);

  ok('[desktop] mobile column not rendered', await page.evaluate(() =>
    getComputedStyle(document.getElementById('march')).display === 'none'));
  await page.close();
}

/* ---- body must never scroll sideways, at any width ---- */
for (const w of [320, 360, 375, 390, 430, 768, 899, 900, 1024]) {
  const page = await browser.newPage({ viewport: { width: w, height: 844 } });
  await page.goto(URL);
  const r = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
    wide: [...document.querySelectorAll('.page *')]
      .filter(el => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .slice(0, 3).map(el => el.tagName + '.' + (el.className.toString().split(' ')[0] || ''))
  }));
  ok(`[${w}px] no horizontal body overflow`, r.scroll <= r.client + 1,
    `${r.scroll} vs ${r.client}${r.wide.length ? ' — ' + r.wide.join(', ') : ''}`);
  await page.close();
}

/* ---- the swap band ---- */
for (const w of [900, 920, 921, 1024, 1280]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  await page.goto(URL);
  const r = await page.evaluate(() => {
    const s = document.querySelector('.scroller');
    return {
      figureScrolls: s.scrollWidth > s.clientWidth + 1,
      hint: getComputedStyle(document.querySelector('.scroll-hint')).display,
      bodyScrolls: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    };
  });
  ok(`[${w}px] figure fits, body never scrolls`,
    !r.figureScrolls && !r.bodyScrolls, JSON.stringify(r));
  // asserted by band, not by overflow — see note 8 above
  ok(`[${w}px] scroll hint only in the scrollbar-risk band`,
    (r.hint !== 'none') === (w >= 900 && w <= 920), `hint ${r.hint}`);
  await page.close();
}

/* ---- column asset ---- */
{
  const page = await browser.newPage({ viewport: { width: 375, height: 844 } });
  await page.goto(URL);

  const swap = await page.evaluate(() => ({
    column: getComputedStyle(document.getElementById('march')).display,
    svg: getComputedStyle(document.querySelector('.diagram-wrap')).display,
    panel: getComputedStyle(document.getElementById('panel')).display
  }));
  ok('[375px] column renders, SVG + panel do not',
    swap.column === 'flex' && swap.svg === 'none' && swap.panel === 'none', JSON.stringify(swap));

  ok('[375px] every desktop key has a card', await page.evaluate(() =>
    document.querySelectorAll('#march .mcard[data-key]').length) === 15);

  ok('[375px] mobile keys identical to SVG keys', await page.evaluate(() => {
    const a = [...document.querySelectorAll('#arch .hit')].map(e => e.dataset.key).sort();
    const b = [...document.querySelectorAll('#march .mcard[data-key]')].map(e => e.dataset.key).sort();
    return JSON.stringify(a) === JSON.stringify(b);
  }));

  const widths = await page.evaluate(() => [...new Set(
    [...document.querySelectorAll('#march .mcard:not(.mcard-zone) .mcard-head')]
      .map(h => Math.round(h.getBoundingClientRect().width)))].sort((a, b) => a - b));
  ok('[375px] card widths resolve to two', widths.length <= 2, widths.join(', '));

  await page.click('#m-transform .mcard-head');
  const expanded = await page.evaluate(() => {
    const c = document.getElementById('m-transform');
    const b = c.querySelector('.mcard-body');
    return {
      open: c.classList.contains('open'),
      aria: c.querySelector('.mcard-head').getAttribute('aria-expanded'),
      visible: !b.hidden && b.getBoundingClientRect().height > 20,
      role: b.querySelector('.mcard-role')?.textContent,
      title: b.querySelector('.mcard-title')?.textContent ?? null,
      engaged: document.getElementById('march').classList.contains('engaged'),
      lit: [...document.querySelectorAll('#march .mcard.lit')].map(e => e.id).sort(),
      fits: b.getBoundingClientRect().right <= document.documentElement.clientWidth + 1
    };
  });
  ok('[375px] tap expands in place',
    expanded.open && expanded.visible && expanded.aria === 'true' &&
    expanded.role === 'Step 2' && expanded.title === null, JSON.stringify(expanded).slice(0, 170));
  ok('[375px] tap lights related cards',
    expanded.engaged && expanded.lit.includes('m-warehouse'), expanded.lit.join(','));
  ok('[375px] expanded body stays in the viewport', expanded.fits);

  await page.click('#m-src1 .mcard-head');
  ok('[375px] title kept where it differs from the head',
    (await page.textContent('#m-src1 .mcard-title')) === 'A source with rotating credentials');

  await page.click('#m-backup .mcard-head');
  ok('[375px] only one card open at a time',
    await page.evaluate(() => document.querySelectorAll('#march .mcard.open').length) === 1);

  await page.keyboard.press('Escape');
  const closed = await page.evaluate(() => ({
    open: document.querySelectorAll('#march .mcard.open').length,
    engaged: document.getElementById('march').classList.contains('engaged')
  }));
  ok('[375px] Esc collapses', closed.open === 0 && !closed.engaged, JSON.stringify(closed));

  ok('[375px] every card head is a focusable button', await page.evaluate(() =>
    document.querySelectorAll('#march .mcard-head').length) === 15);

  const table = await page.evaluate(() => {
    const s = document.querySelector('.table-scroll');
    return {
      display: getComputedStyle(document.querySelector('table')).display,
      thead: getComputedStyle(document.querySelector('thead')).display,
      fits: s.scrollWidth <= s.clientWidth + 1
    };
  });
  ok('[375px] role table stacks instead of scrolling',
    table.display === 'block' && table.thead === 'none' && table.fits, JSON.stringify(table));

  await page.screenshot({ path: 'mobile-full.png', fullPage: true });
  await page.close();
}

/* ---- reduced motion ---- */
{
  const page = await browser.newPage({ viewport: { width: 375, height: 844 }, reducedMotion: 'reduce' });
  await page.goto(URL);
  await page.click('#m-build .mcard-head');
  const t = await page.evaluate(() => getComputedStyle(document.querySelector('#m-build')).transitionDuration);
  ok('[reduced motion] transitions disabled', t === '0s', t);
  await page.close();
}

await browser.close();
console.log(out.join('\n'));
console.log(failed ? `\n${failed} FAILING` : `\nall green (${out.length} checks)`);
process.exit(failed ? 1 : 0);
```

</details>

**Take screenshots too, not just assertions.** Two of the three real bugs in
the mobile build — every collapsed card rendering as an empty box, and the `+`
landing mid-title on the warehouse card — passed every assertion and were only
visible in a render. Shoot `#march` at 375 px, `.diagram-wrap` at 1280 px, and
the role-table section at 375 px.

---

## The mobile column, as built

**Decided and done:** a second asset designed for narrow screens, both kept —
CSS-swap at **900 px** so only one renders. Two layouts to keep in sync; that
cost was accepted knowingly. Below 900 px `.diagram-wrap` and `.panel` are
`display: none`; above it `.mobile-arch` is.

### The actual problem

Not the layout. **The concentric diagram is an SVG with a fixed `viewBox`.**
SVG scales its text with its container, so on a phone it can only shrink below
legibility or scroll sideways. Every layout change attempted before the column
was fighting that rather than removing it.

Progress made by rearranging alone, measured at a 390 px viewport:

| Layout | Screens wide |
|---|---|
| Side-by-side rings | 2.16× |
| Both public groups on top | 1.75× |
| Top-to-bottom, widest row = 3 | 1.47× |

Still not a fit, and it could not become one by rearranging.

> **Both rearrangements have since been reverted** (`eda5717`, `2b24653`), at
> the author's request, once the column existed. They only ever bought narrowness
> for phones, and the figure is no longer rendered on a phone — so the cost they
> charged the desktop reading was buying nothing. **The concentric asset is back
> to the side-by-side layout of `06e6be4`**, which is the one to keep; the two
> commits above are history, not a fallback. The colour and contrast work in
> `06e6be4` and the grid work in `ed27de1` were never part of the experiment
> and are untouched.

### The constraint

375 px phone, minus page padding, leaves ~335 px. For a title at 14 px and a
mono sub at 11 px — comfortable, not squinting — a card needs ~300 px.

- **3 across:** impossible
- **2 across:** ~140 px each; `Published site` and `signed-in browser` don't fit
- **1 across:** 300 px card, with type *larger* than today

One column is not a compromise at this width. It is the only option that lets
the type grow.

### The design

**HTML and CSS, not SVG**, so the diagram's text is real page text at a fixed
size — identical at 375 px and 899 px — and the layout reflows instead of
scaling.

A single column, with the warehouse as a continuous vertical bar down the left.
What was sketched, and what got built, differ in one place — noted below:

```
┌─ PUBLIC INTERNET ────────────────┐
│  ┌────────────────────────────┐  │
│  │ Source        REST · OAuth │  │
│  │ Source      REST · API key │  │
│  │ Source      REST · API key │  │
│  └─────────────┬──────────────┘  │
│ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌│╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  │
│  SCHEDULED JOB │ 0 11,23 · ~1 min│
│  ╔═════════════▼══════════════╗  │
│  ║ WAREHOUSE                  ║  │
│  ║ DuckDB · /data/warehouse…  ║  │
│  ║ no process · no port       ║  │
│  ╚═╤══════════════════════════╝  │
│    ║ ┌────────────────────────┐  │
│    ╟─┤ Load           Node.js │  │  writes
│    ║ ├────────────────────────┤  │
│    ╟─┤ Model         dbt-core │  │  reads + writes
│    ║ ├────────────────────────┤  │
│    ╟─┤ Extract    Observable  │  │  reads, read-only
│    ║ └────────────────────────┘  │
│    ║ ┌────────────────────────┐  │
│    ╟─┤ Durability      restic ├──┼──→ Cold copy
│    ║ └────────────────────────┘  │
│    ╚  volume detaches            │
│      ┌────────────────────────┐  │
│      │ Deploy     Netlify CLI │  │  ← no connector
│      └────────────────────────┘  │
│ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌│╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  │
│      Published site → Auth → You │
└──────────────────────────────────┘
```

Widths: bar 9 + gutter 21 + card = 30 px of inset. Cards fill the rest, so
they measure 303 px unindented and 273 px on the rail at a 375 px viewport.

**The one departure from the sketch.** The sketch put `Cold copy` outside the
dashed region to the right of `Durability`, which one column cannot express —
there is no "beside". Built instead: `Cold copy` and `Published site` sit
together *below* the closing dashed rule under the label **"What the run
leaves behind"**, each carrying an upward relation line (`↑ from Durability`,
`↑ from Deploy`). This turns out to read better than the sketch — the run ends
and two artifacts outlive it, which is true, and it keeps every public-ring
node outside the dashed rules where it belongs. The reader chain follows.

The relation lines are load-bearing on mobile in a way they are not on
desktop: with no drawn connectors outside the rail, `↑ from Durability` is the
only thing carrying the backup edge. Keep them short enough not to wrap —
two had to be cut down during the build.

### Why the bar is worth it on the merits, not just for width

The warehouse stops being a box things point at and becomes a continuous
presence that **begins and ends inside the job**. The bar starts where the
volume mounts and terminates where it detaches; scrolling past that terminator
*is* the mount lifetime. The horizontal rail was always a slightly abstract
stand-in for this.

Two things then come free:

- **Deploy is visibly the one step with no connector to the bar** — the
  correction the author caught, drawn rather than argued.
- **"Nothing outside reaches the core" needs no caption**, because outside the
  dashed region the bar does not exist.

### What it gives up

**The gestalt.** You traverse the system instead of seeing its shape at once.
Free on a phone — you couldn't see it at once anyway — but a real loss on
desktop, and it is exactly what the concentric version is good at. Hence
keeping both.

### How the two assets share content

**They do not duplicate prose.** The mobile card markup is static HTML (so the
diagram still draws with JS off), but every expansion pulls `role` / `title` /
`vendor` / `body` out of the same `DATA` object the desktop panel uses. Adding
a node means editing `DATA` once.

- **Keys are identical across both.** `data-key` on the SVG `.hit` groups and
  on the mobile `.mcard`s; a check asserts the two sets match, so a node added
  to one and forgotten in the other fails.
- **Highlighting is shared too.** `DATA[key].lit` holds SVG ids; the mobile
  code maps `g-x` → `m-x` and ignores `e-*` entries, because edges have no
  counterpart in the column. So tapping `Durability` still lights `Cold copy`
  even though no line is drawn between them.
- **The expansion drops the title when it merely repeats the card head** —
  "Model" under a card headed Model adds nothing, whereas "A source with
  rotating credentials" under one headed Source does.

Two CSS traps worth knowing, both hit during the build:

- `.mcard-body { display: flex }` **beats the UA `[hidden]` rule**, so every
  collapsed card rendered as an empty box until `.mcard-body[hidden]` restated
  `display: none`. Author styles win over UA styles regardless of specificity.
- `td:nth-child(4):empty::after` works for the to-fill-in cells because **CSS
  `:empty` ignores comment nodes**. Add whitespace inside those `<td>`s and the
  em-dash placeholder silently stops rendering.

### The role table, stacked

Below 900 px the role/choice/why table stops being a table: `thead` is hidden,
each `<tr>` becomes a card, role reads as the eyebrow, choice as the serif
headline, and `td[data-label]::before` labels the two prose columns. The empty
fourth column renders its label and an em dash — which is what it needed, a
place to sit that reads as unwritten rather than broken. Above 900 px it is
the original table, unchanged and still scrolling sideways.

---

## Open questions

Answered 2026-07-28: expand-in-place **confirmed** (scoped to mobile); the
breakpoint is **900 px**; the fourth table column stays empty for now.

**For the website work** — these are the ones to raise, and they are expanded
in [Ask before writing code](#ask-before-writing-code):

1. **Integration mode** — served as-is, framework route, or re-skinned?
2. **Light theme** — the page is dark-only; does that stand on this site?
3. **Site chrome** — does the page keep its own masthead and footer?
4. **Fonts** — adopt the site's, or keep the system stacks?
5. **Where it lives** — path, nav entry, whether it is linked from anywhere.

**Still open from the build:**

6. **Fourth table column** (`When I'd use something different`) is intentionally
   empty, awaiting the author. Eight `<td data-label="…"><!-- to fill in --></td>`
   markers. Do not add whitespace inside them — see the `:empty` trap above.
   This is the most likely thing to want filling in before it goes public.
7. **Tablet portrait (768 px) gets the column**, with generous margins. It is
   legible and correct, but it is the width where the concentric figure would
   also have fit. Worth a look on a real iPad before calling it settled.

**Left in the pipeline repo, not website work:**

8. **Should either asset replace `target/arch.svg`** in that repo's root README,
   or do the drawio and the HTML pages coexist?
9. **`arch.drawio` is stale** and still needs updating regardless.

## Standing constraints

- Standalone single file. **Zero external requests** — no CDN, no webfont, no
  remote image. Verify, don't assume.
- Dark mode only.
- Domain-neutral.
- Boxes uniform within an asset.
- Amber reserved for interaction; the warehouse keeps its glow — in the column
  layout that means the bar as well as the card.
- Nothing moves on desktop. The mobile expansion is the sole exception and
  stays scoped to `<900 px`.

## Repo state

### Where `arch.html` comes from

`nathaniel-may/personal-analytics`, branch `docs/arch-html-diagram`, at commit
`e7878ab`. Draft PR #146, **not for merge** — the branch exists so the file can
be checked out and viewed locally, and that remains true. **The page was never
merged to that repo's main, and does not need to be.** It is being published
from the website instead.

If the file and these notes arrive separately or out of sync, the branch above
is the tiebreaker.

Commit history worth knowing, newest first:

| Commit | What |
|---|---|
| `e7878ab` | Restored the side-by-side figure; derived the figure's `min-width` from the breakpoint |
| `4c5ac6b` | These notes, updated for the column |
| `006523e` | The column asset, the stacked table, the `.costs` overflow fix |
| `2b24653`, `eda5717` | Mobile layout experiments — **reverted**, history not fallback |
| `06e6be4` | Colour and contrast work; the core's own hue. **Kept** |
| `ed27de1` | Put the figure on one grid. **Kept** |

### Working-tree gotcha, if you are back in that repo

The pipeline repo's working tree carries many untracked macOS `._*` AppleDouble
files. Stage by explicit path; never `git add -A`. The ones under
`.git/objects/pack/` produce the harmless `error: index file … is too small`
noise on every git command — it is not a corrupt repository.

Whether the website repo has the same problem is unknown; check before staging.
