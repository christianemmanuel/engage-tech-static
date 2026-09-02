# Engage Tech Solutions — Static Site (Phase 1)

Seven page templates built as plain HTML + CSS, faithful to
`../Engage-Tech-Design-System.html` (v1.0), and structured so the WordPress
conversion is a mechanical cut-up rather than a rewrite.

No framework. No build step in the deliverable. No JavaScript dependency for
any content.

---

## Run it

Serve from this directory — links are root-relative, so `file://` will not work:

```bash
cd engage-tech-static
python3 -m http.server 8899
# http://localhost:8899/
```

| Page | URL | Template role |
|---|---|---|
| Home | `/` | dark hero + dark header |
| Service | `/services/managed-it-services/` | light hero, breadcrumb, sticky related rail |
| Location | `/in/raleigh/managed-it-services/` | dark hero + map graphic, 4-level breadcrumb, inline form |
| Industry | `/industries/healthcare-it-services/` | dark hero + sector-inflected graphic |
| Blog post | `/blog/cyber-insurance-controls-2026/` | article header, progress bar, sticky ToC |
| Contact | `/contact/` | light hero, **no** hero visual, **no** CTA band |
| About | `/about-us/` | light hero + light graphic |

---

## Structure

```
engage-tech-static/
├── index.html                                    ← built output (commit these)
├── services/managed-it-services/index.html
├── in/raleigh/managed-it-services/index.html
├── industries/healthcare-it-services/index.html
├── blog/cyber-insurance-controls-2026/index.html
├── contact/index.html
├── about-us/index.html
│
├── assets/
│   ├── css/
│   │   ├── tokens.css          every colour, type, spacing and radius value
│   │   ├── base.css            reset, type scale, focus, reduced-motion
│   │   ├── layout.css          container, section rhythm, grids, splits
│   │   ├── components.css      the capped library of 30 components
│   │   ├── utilities.css       .g-txt + a short, deliberate helper set
│   │   └── a11y-overrides.css  OPTIONAL, not loaded — see "Accessibility"
│   ├── js/main.js              208 lines, progressive enhancement only
│   ├── fonts/                  Inter variable + IBM Plex Mono 400/500/600 (78 KB)
│   ├── logo.jpg                client-supplied brand mark (168×153) — the header/footer tile
│   └── favicon.png             derived from logo.jpg (square-cropped, 64×64)
│
├── src/                        SOURCE — edit here, not the built files
│   ├── partials/*.html         single source of truth for shared markup →
│   │                           these map 1:1 onto WordPress template parts
│   └── pages/*.html            page-unique content + a CONFIG block
└── tools/build.py              stitches src/ into the built pages
```

### Editing

Edit `src/`, then:

```bash
python3 tools/build.py            # all pages
python3 tools/build.py home.html  # one page
```

`build.py` exists for exactly one reason: it guarantees the header, CTA band,
footer, drawer and SVG sprite are **byte-identical** on every page. That is what
makes the WordPress cut-up safe — you cannot accidentally ship seven slightly
different headers. It is a dev convenience, not a runtime dependency; the files
it writes are standalone.

Syntax: `<!--@partial-name-->` includes `src/partials/partial-name.html`
(recursively); `{{VAR}}` is substituted from the page's `CONFIG` JSON block and
defaults to empty.

---

## WordPress conversion map

Shared markup is fenced with `<!-- template-part: name --> … <!-- /template-part: name -->`
in the built HTML, so each block lifts out unambiguously.

| Static | WordPress |
|---|---|
| `src/partials/head.html` + `header.html` | `header.php` |
| `HEADER_MODE` (`""` / `" dark"`) | `body_class()` or an argument — dark **only** where the hero is navy (Home, Location, Industry) |
| `mega-services/industries/resources.html` | `template-parts/nav/mega-*.php`, driven by a `wp_nav_menu` walker |
| `drawer.html` | `template-parts/nav/drawer.php` (same menu, mobile walker) |
| `cta.html` | `template-parts/cta-band.php` — copy from theme options |
| `footer.html` | `footer.php` — 3 menu locations + a NAP block from theme options |
| `mobile-bar.html` | `template-parts/mobile-bar.php` |
| `svg-sprite.html` | `template-parts/svg-sprite.php`, inlined at the top of `<body>` |
| `index.html` | `front-page.php` |
| `services/managed-it-services/` | `single-service.php` (CPT `service`) |
| `in/raleigh/managed-it-services/` | `single-location.php` (CPT `location`, city × service) |
| `industries/healthcare-it-services/` | `single-industry.php` (CPT `industry`) |
| `blog/…/` | `single.php` |
| `contact/`, `about-us/` | `page-contact.php`, `page-about.php` |
| `.tpl-home` … `.tpl-post` body classes | already mirror `body_class()` |

**The sprite must stay inline.** The technology graphics reference `url(#eg)` and
`url(#eg-glow)`; cross-document SVG references do not resolve. It is 9 KB
uncompressed and ~2 KB gzipped.

### Content that must become dynamic

Everything below is already structured as uniform, repeatable blocks with no
one-off styling, and no grid hard-codes an item count:

- **Navigation** — header, mega menus, drawer, footer columns → `wp_nav_menu`
- **Services / industries / locations** — card grids → CPT loops
- **Testimonials** — `<figure class="quote">` → CPT or ACF repeater
- **Stats** — `.stats` / `.stat` → ACF repeater
- **FAQs** — `<details>` blocks → ACF repeater, and generate the `FAQPage` JSON-LD from the same field
- **Blog meta** — author, credential, reviewed date, category, read time → post fields + an author archive
- **NAP + phone** — appears in header, hero, CTA band, footer and JSON-LD; make it **one** theme option
- **CTA band copy** — theme option; identical wording across pages is deliberate

### Schema already in place

`Organization` + `WebSite` (Home), `Service` (Service, Industry),
`LocalBusiness` with `areaServed` (Location, Contact), `Article` + `Person`
(Blog), `FAQPage` (Service, Location, Industry, Contact), `BreadcrumbList`
(everything except Home). Each is a single `<script type="application/ld+json">`
in the page's `CONFIG`, so it becomes one PHP function per template.

---

## Design system fidelity

Sourced verbatim from the design system: all colour tokens, the 100° gradient,
the four shadows, the type scale, radii, the component library, section rhythm
and every mobile behaviour.

**Four places where the design system contradicts itself. Resolved as follows:**

1. **Font weights.** The doc loads static Inter 400–900 but its CSS uses
   550 / 650 / 750 / 850, which static Inter silently rounds. Fixed by
   self-hosting **Inter variable** — those weights now render as specified.

2. **Section padding.** The spec table says 96px desktop; the rendered mockup CSS
   says `.s{padding:84px 0}`. The mockup is the visual truth, so desktop is
   **84px**; the spec table supplies tablet 72px and mobile 56px. No value invented.

3. **H3 size.** The spec table says 28px; every mockup card heading is 16.5px, and
   `.mk h3` is 21px. Resolved by size, not by tag: `h3` = 21px, `.card > h3` takes
   the 16.5px h4 metrics, and `.grid--pillars` (the six core-service cards on Home,
   the one documented exception) keeps 21px. Markup keeps a correct `h2 → h3`
   outline throughout — no heading levels are skipped on any page.

4. **Card grid gap.** The spec table says 24px; the rendered mockup says
   `.grid{gap:16px}` with no responsive change. The mockup wins, so `--grid-gap`
   is **16px flat** at every breakpoint.

**One deliberate deviation, client-directed:**

- **Container is 1280px, not the design system's 1180px** (`--container` in
  `tokens.css`). Gutters are unchanged at 40 / 32 / 20px, so content measures
  1200px at full width instead of 1100px. Side effects, all positive: the
  home-page trust bar now fits on one line instead of wrapping, and the 4-up
  card headings fit on one line. Verified no overflow at 390, 1280, 1366, 1440
  and 1600px. Note that at a 1280px viewport the container exactly fills the
  screen — the 40px gutter is then the only side breathing room.
- The narrower reading measures are **unchanged**, because they are reading
  widths rather than page containers: `.wrap--narrow` 1080px (blog article
  shell), `.wrap--article` 900px (blog header), `.wrap--tight` 860px (contact
  FAQ). Say the word if you want these scaled up too.

**Hero heading semantics, client-directed (SEO):**

- In every hero **except the blog post**, the kicker badge is the page `<h1>`
  and the large display title is a `<p class="h1">`. Visually nothing changes — `.h1` carries the
  exact display metrics (`h1,.h1{…}` in `base.css`), and `.kicker` out-specifies
  the bare `h1` element rules — but the document outline now reads
  *"Raleigh · Charlotte · Statewide NC"* (Home), *"Managed IT Services"*
  (Service), *"Raleigh, North Carolina"* (Location), *"Healthcare & Medical
  Practices"* (Industry), *"Get in touch"* (Contact), *"About Engage Tech
  Solutions"* (About). Exactly one `h1` per page, no heading-level skips.
- **Blog post is the exception:** its `h1` stays the article title so it matches
  the `Article` schema `headline`; the category kicker remains a `<p>`.
- **Screen readers** announce the `h1` as the page title, so on the six swapped
  pages the badge copy is what a VoiceOver user hears first; keep kicker text
  meaningful, not decorative.
- WordPress: `the_title()` should render into `<p class="h1">`, and the `h1`
  should come from a dedicated "kicker" field (ACF text) so editors can tune it
  per page.

**Brand mark:**

- The 30px tile beside the "Engage Tech / Solutions" wordmark is the
  client-supplied `assets/logo.jpg` (the gradient S-mark), used in the header,
  the mobile drawer and the footer via `<img class="lm">`. Its colours are the
  file's own and are not recoloured, per the design system's instruction for
  production logos. The favicon is derived from the same file. The retired
  `#i-bolt` sprite symbol is unused but left in the sprite.
- The source is a 168×153 JPEG. That is sharp at the 30px tile size (5.6× the
  displayed pixels) but JPEG has no transparency and will not scale up cleanly
  — for any larger use (Open Graph image, print, the About hero) a vector or
  high-resolution PNG master is still needed.
- WordPress: wire the tile to `the_custom_logo()` / the Customizer logo so the
  client can replace it without touching templates.

**Other observations, not changed:**

- Blog (17% navy) and Service (25% navy) sit under the 30% navy target. Both match
  their mockups exactly. The design system's own remedy — push one feature section
  to navy — is a content call, so it is flagged rather than applied.
- The "20% cyan" figure in the colour-balance target is a weighting guide, not a
  pixel share; as accent colour it measures 0.7–1.6% of pixels. The binary check
  the design system also states — cyan visible on every page — passes on all seven.

---

### The reading progress bar lives inside the header

It is a child of `.site-header`, absolutely positioned at `bottom:-3px`, and is
shown only on `.tpl-post`. It used to be a sibling with
`position:sticky; top:var(--header-h)` — a hardcoded 72px that matched neither
state, because the header actually measures ~76px at rest and ~60px compressed.
That produced a 4px overlap before scrolling and a **12px gap** after the header
compacted. As a child it is glued to the real bottom edge in both states and at
every breakpoint, with no JS positioning and no value to keep in sync.

The same staleness does not affect `.toc`, `.rail-box--sticky` or `.form--sticky`
— those use `calc(var(--header-h) + 20px)`, and the 20px of slack absorbs the
difference invisibly.

---

### Two structural rules the mega menu depends on

**1 · `.has-mega` must stay `position:static`.** The mega panel is
`position:absolute; left:0; right:0` and must resolve against the sticky
`.site-header` so it spans the full viewport. Making the `<li>` a containing
block (`position:relative`) collapses the panel to the width of its nav button
— about 102px — and the columns spill out over the hero.

**2 · Every top-level nav rule is scoped with `> li >`.** The mega panels are
*descendants* of `.main-nav`, so an unscoped `.main-nav a { … }` reaches inside
them and out-specifies the component classes there. Unscoped, it caused three
faults at once: mega links inherited the dark-header text colour onto a white
panel, `background:none` erased the promo button's gradient, and `opacity:.6`
dimmed every mega icon. Keep the child combinators when editing this block.

Verified on both header variants: all three panels render 1440px wide with a
1280px inner container and the correct column counts (Services 4, Industries 3,
Resources 2), while the top-level items keep their own colour, padding, active
underline and chevron rotation.

---

### Do not remove the `figure`/`blockquote` margin reset

`base.css` resets `figure, figcaption, blockquote, dl, dd { margin: 0 }`.
Browsers apply a UA `margin: 1em 40px` to `figure` and `blockquote`, and both
are used here as layout containers — `figure` is the testimonial card and the
article image, `blockquote` is the quote body and the pull quote. Without the
reset every testimonial card is inset 40px inside its own grid track, which
turns a 16px gap into a 96px one and pushes the whole row 40px out of alignment
with its section heading. Verified: 38 layout blocks across the 7 pages all
start exactly at their container's content edge.

---

## Governance gates (all currently passing)

```bash
# 1 · no hex literal outside tokens.css
grep -nE '#[0-9a-fA-F]{3,6}\b' assets/css/{base,layout,components,utilities}.css

# 2 · no gradient defined outside tokens.css
grep -nE 'linear-gradient|radial-gradient' assets/css/{base,layout,components,utilities}.css

# 3 · no inline grid-template-columns (media queries cannot override inline styles)
grep -rn 'style="[^"]*grid-template-columns' src/pages/
```

Component budget is 30. Adding a 31st means justifying it against an existing one.

---

## Verified

- **Responsive**: no horizontal overflow on any of the 7 pages at 320, 360, 390,
  480, 768, 1024, 1280, 1440px. The blog comparison table scrolls inside its own
  `overflow-x:auto` container by design; the document never scrolls sideways.
- **Component integrity**: every `.btn`, `.logo`, `.kicker` and `.pill` computes
  correctly on all 7 pages (76 buttons, 21 logos, 62 pills checked).
- **Semantics**: exactly one `h1` per page; zero heading-level skips; every form
  field has a matching `<label for>`; every decorative SVG is `aria-hidden`.
- **Mobile**: hamburger + drawer active, primary nav hidden, bottom CTA bar
  present, h1 34px, gutter 20px, section padding 56px — all matching the spec table.
- **Assets**: every referenced CSS/JS/font/SVG path resolves.
- **JS-off**: FAQs are native `<details>`, the drawer falls back to the footer
  sitemap, and no content is gated.

> Note: Chrome headless clamps windows to 500px minimum. Narrow-viewport testing
> must go through an iframe harness (`<iframe width="390">`) or real device
> emulation, otherwise it renders a 500px layout into a 390px image and looks
> broken when it is not.

---

## Accessibility

WCAG AA is met for body copy, ledes, nav, pills, on-dark text and all footer
text. Two gaps remain, both inherited from the design system's own palette:

1. **Primary CTA buttons.** The design system asserts white-on-gradient "clears
   4.5:1 across the whole ramp". Measured: **2.09:1** on the cyan stop and
   **3.98:1** on the blue stop. Because `.btn-pri` renders the first two-thirds of
   the ramp, primary button labels sit at roughly 2–4:1.
2. **Minor**: `--muted-2` on white 2.87:1 (trust-bar label, form placeholders);
   `--cyan-700` on the `--cyan-050` tint 4.31:1 (kicker); `--muted` on `--bg`
   4.50:1 (borderline).

Fixing the button means darkening the CTA gradient, which reduces exactly the
cyan vividness the identity is built on — a brand decision, not a developer one.
So `assets/css/a11y-overrides.css` is written and ready but **not loaded**. It
darkens only the CTA ramp (`#00737E → #1167AC → #173B8F`, all clearing 4.5:1) and
the four minor tokens, leaving every other gradient moment untouched. To enable,
add after `utilities.css`:

```html
<link rel="stylesheet" href="/assets/css/a11y-overrides.css">
```

---

## Still needed before launch

1. **Team photographs, real names and certifications** — the design system calls
   the anonymous About team grid a launch blocker. Placeholder cards are in place
   and labelled.
2. **Real case-study metrics.** `−63%`, `4.2h`, `247 endpoints`, `99.5%` and the
   author "A. Mensah" are placeholders per the design system's own note. Every
   number on the site needs a source.
3. **Client portal and social URLs** — currently pointing at
   `portal.engagetechsolutions.us` and platform roots.
