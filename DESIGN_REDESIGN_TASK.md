# AIMirror — Full Visual Redesign Task

## Mission

Redesign the complete visual presentation of both `client-store` and `client-tryon` to match the quality and feel of premium fashion/furniture e-commerce sites (think Moderno, Zara Home, SSENSE, Muji online). The current design is generic and amateurish. The target is a polished, editorial, luxury-adjacent storefront that feels **intentional**, **refined**, and **memorable**.

Preserve all routes, API calls, state logic, and the try-on flow. **Only change presentation**.

---

## Reference Aesthetic

The target feel (based on the reference screenshot provided):

- **Whitespace-led layout** — generous padding, breathing room between sections
- **Minimal, precise typography** — strong hierarchy using weight contrast (ultra-light body, bold/black display)
- **Neutral base palette** — off-whites, warm grays, deep charcoals — with ONE restrained accent
- **Editorial image-first sections** — large hero images with sparse text overlay
- **Micro-interactions** — subtle hover states, smooth transitions, no flashy animations
- **Grid discipline** — strict alignment, consistent column gutters, no random sizing
- **Clean product cards** — image dominant, name + price below with minimal chrome, hover reveals quick-view or CTA
- **Sticky minimal navbar** — logo left, links center or right, icons (search, cart) far right; transparent on hero, white on scroll
- **Section rhythm** — alternating full-bleed and contained sections, category image blocks, featured collections

---

## Design Tokens (update `global.module.css` in both clients)

Replace the current palette and typography with the following system. **All values must become CSS custom properties** so components inherit them automatically.

### Color Palette
```css
/* Base */
--color-bg:          #FAFAF8;   /* warm off-white page background */
--color-surface:     #FFFFFF;   /* cards, modals */
--color-surface-alt: #F4F2EE;   /* subtle section backgrounds */
--color-border:      #E8E5DF;   /* dividers, card borders */

/* Text */
--color-text-primary:   #1A1A18;  /* headings, primary content */
--color-text-secondary: #6B6860;  /* captions, labels, meta */
--color-text-muted:     #A8A49C;  /* placeholders, disabled */
--color-text-inverse:   #FAFAF8;  /* text on dark backgrounds */

/* Accent — use sparingly */
--color-accent:       #C8A96E;   /* warm gold — CTAs, highlights, prices */
--color-accent-hover: #B8965A;

/* Dark sections */
--color-dark-bg:      #1A1A18;
--color-dark-surface: #252521;

/* Semantic */
--color-success: #4A7C59;
--color-error:   #C0392B;
```

### Typography
```css
/* Import in index.html — replace Space Grotesk entirely */
/* Google Fonts: "Cormorant Garamond" (display) + "DM Sans" (body) */

--font-display: 'Cormorant Garamond', Georgia, serif;   /* headings, hero */
--font-body:    'DM Sans', system-ui, sans-serif;       /* body, UI */
--font-label:   'DM Sans', system-ui, sans-serif;       /* labels, buttons — use letter-spacing */

/* Scale */
--text-xs:   0.6875rem;   /* 11px */
--text-sm:   0.8125rem;   /* 13px */
--text-base: 0.9375rem;   /* 15px */
--text-md:   1.0625rem;   /* 17px */
--text-lg:   1.25rem;     /* 20px */
--text-xl:   1.5625rem;   /* 25px */
--text-2xl:  2rem;        /* 32px */
--text-3xl:  2.75rem;     /* 44px */
--text-4xl:  3.75rem;     /* 60px */
--text-5xl:  5rem;        /* 80px */

/* Weight */
--weight-light:   300;
--weight-regular: 400;
--weight-medium:  500;
--weight-semibold: 600;
--weight-bold:    700;

/* Leading */
--leading-tight:  1.1;
--leading-snug:   1.3;
--leading-normal: 1.5;
--leading-relaxed: 1.7;

/* Tracking */
--tracking-tight:  -0.02em;
--tracking-normal:  0;
--tracking-wide:    0.06em;
--tracking-widest:  0.15em;
```

### Spacing & Radius
```css
--space-1:  0.25rem;
--space-2:  0.5rem;
--space-3:  0.75rem;
--space-4:  1rem;
--space-5:  1.25rem;
--space-6:  1.5rem;
--space-8:  2rem;
--space-10: 2.5rem;
--space-12: 3rem;
--space-16: 4rem;
--space-20: 5rem;
--space-24: 6rem;
--space-32: 8rem;

--radius-sm:   2px;
--radius-md:   4px;
--radius-lg:   8px;
--radius-full: 9999px;

/* Layout */
--container-max:     1320px;
--container-padding: clamp(1.5rem, 5vw, 5rem);
--grid-gap:          clamp(1rem, 2.5vw, 2rem);
```

### Motion
```css
--ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--duration-fast:   150ms;
--duration-base:   250ms;
--duration-slow:   400ms;
--duration-slower: 600ms;
```

---

## Update `index.html` in Both Clients

Replace any existing Google Fonts `<link>` with:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
```

Set the root body styles in `global.module.css` (applied via `:global(body)`):
```css
:global(body) {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  background-color: var(--color-bg);
  line-height: var(--leading-normal);
  -webkit-font-smoothing: antialiased;
}
```

---

## client-store Redesign

### Navbar (`components/Navbar`)

**Behavior:** Transparent over the hero, transitions to white with a bottom border on scroll.

**Layout:**
- Max-width container, `display: flex; justify-content: space-between; align-items: center;`
- Logo: `font-family: var(--font-display); font-size: var(--text-xl); font-weight: var(--weight-light); letter-spacing: var(--tracking-wide); text-transform: uppercase;`
- Nav links: `font-family: var(--font-body); font-size: var(--text-xs); font-weight: var(--weight-medium); letter-spacing: var(--tracking-widest); text-transform: uppercase;` — underline on hover via `transform: scaleX()` pseudo-element animation
- Icon group (search, wishlist, cart): SVG icons 20px, gap `var(--space-4)`
- Height: 72px desktop, 60px mobile

```css
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 72px;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  transition: background var(--duration-base) var(--ease-out),
              border-color var(--duration-base) var(--ease-out);
}
```

### Homepage (`pages/Home` or equivalent)

**Hero Section:**
- Full-viewport height (`100svh`), dark overlay on a large background image
- Headline: `font-family: var(--font-display); font-size: clamp(3rem, 7vw, 6rem); font-weight: var(--weight-light); color: var(--color-text-inverse); line-height: var(--leading-tight); letter-spacing: var(--tracking-tight);`
- Subtext: `font-size: var(--text-sm); letter-spacing: var(--tracking-widest); text-transform: uppercase; color: rgba(250,250,248,0.7);`
- CTA button: outlined ghost style on dark — `border: 1px solid rgba(255,255,255,0.5); color: white; padding: 14px 36px; font-size: var(--text-xs); letter-spacing: var(--tracking-widest); text-transform: uppercase;` — fills white on hover, text goes dark

**Category Grid:**
- 2×2 grid of large square image tiles with category name overlaid bottom-left
- Image overlay: linear gradient bottom to top, 0% → 50% opacity dark
- Category label: `font-family: var(--font-display); font-size: var(--text-2xl); font-weight: var(--weight-light); color: white; letter-spacing: var(--tracking-tight);`
- Small "Shop Now →" link below label in `--text-xs --tracking-widest uppercase`

**Section headings (reuse pattern across all sections):**
```css
.sectionHeader {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: var(--space-8);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-8);
}
.sectionTitle {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: var(--weight-light);
  letter-spacing: var(--tracking-tight);
  color: var(--color-text-primary);
}
.sectionLink {
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--color-text-secondary);
  text-decoration: none;
  border-bottom: 1px solid currentColor;
}
```

**Trust Bar (free delivery, returns, etc.):**
- Single row, evenly spaced, `background: var(--color-dark-bg); color: var(--color-text-inverse);`
- `font-size: var(--text-xs); letter-spacing: var(--tracking-wide); text-transform: uppercase; padding: var(--space-4) 0;`

**New Arrivals / Featured Products:**
- 4-column grid desktop, 2-column tablet, 1-column mobile
- No carousel by default — show static grid

**Editorial Split Section (New Collection CTA):**
- Left: large image (60% width)
- Right: text block — label (uppercase xs), large serif headline, body copy, ghost CTA button
- `background: var(--color-surface-alt); padding: var(--space-20) 0;`

### ProductCard (`components/ProductCard`)

This is the most important component to get right.

```
┌─────────────────────────┐
│                         │
│       [IMAGE]           │  ← aspect-ratio: 3/4, object-fit: cover
│                         │
│  [QUICK VIEW on hover]  │  ← absolute, bottom of image, slide up
│                         │
└─────────────────────────┘
  Brand / Category Label     ← --text-xs --tracking-widest uppercase --color-text-muted
  Product Name               ← --text-base --weight-regular --color-text-primary
  $129.00                    ← --text-base --color-accent --weight-medium
  [★★★★☆ 4.2 (12)]          ← small, --color-text-muted (if ratings exist)
```

```css
.card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.imageWrapper {
  position: relative;
  overflow: hidden;
  background: var(--color-surface-alt);
  aspect-ratio: 3 / 4;
}
.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--duration-slower) var(--ease-out);
}
.card:hover .image {
  transform: scale(1.04);
}
.quickView {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(26, 26, 24, 0.85);
  color: var(--color-text-inverse);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  text-align: center;
  padding: var(--space-4);
  transform: translateY(100%);
  transition: transform var(--duration-base) var(--ease-out);
}
.card:hover .quickView {
  transform: translateY(0);
}
.meta { font-size: var(--text-xs); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--color-text-muted); }
.name { font-size: var(--text-base); font-weight: var(--weight-regular); color: var(--color-text-primary); margin: 0; }
.price { font-size: var(--text-base); font-weight: var(--weight-medium); color: var(--color-accent); }
```

### Buttons (global pattern)

Three variants — use consistently:

```css
/* Primary */
.btnPrimary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: 14px 36px;
  background: var(--color-text-primary);
  color: var(--color-text-inverse);
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  border: 1px solid var(--color-text-primary);
  cursor: pointer;
  transition: background var(--duration-base) var(--ease-out),
              color var(--duration-base) var(--ease-out);
}
.btnPrimary:hover {
  background: transparent;
  color: var(--color-text-primary);
}

/* Secondary / Ghost */
.btnGhost {
  /* same as above but inverted — transparent bg, dark border */
  background: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-text-primary);
}
.btnGhost:hover {
  background: var(--color-text-primary);
  color: var(--color-text-inverse);
}

/* Accent */
.btnAccent {
  background: var(--color-accent);
  color: var(--color-text-inverse);
  border-color: var(--color-accent);
}
.btnAccent:hover {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
}
```

### ProductGrid + FilterSidebar

- Sidebar: thin, no heavy boxes — filter groups separated by `1px solid var(--color-border)` dividers, no background
- Filter labels: `--text-xs --tracking-wide uppercase --color-text-secondary`
- Checkboxes: custom CSS squares, `2px solid var(--color-border)`, checked = `var(--color-text-primary)` fill
- Grid: CSS grid, `repeat(auto-fill, minmax(280px, 1fr))`, gap `var(--grid-gap)`

### Product Detail Page

- Left: image gallery — main image large, thumbnail strip below; `aspect-ratio: 1/1` for main
- Right: sticky at top-of-pane while scrolling
  - Breadcrumb: `--text-xs --tracking-wide --color-text-muted`
  - Title: `--font-display --text-4xl --weight-light --leading-tight`
  - Price: `--text-2xl --color-accent`
  - Description: `--text-base --leading-relaxed --color-text-secondary`
  - Add to cart: full-width `btnPrimary`
  - Try-On CTA: full-width `btnGhost` below

### Admin Pages

- Clean, functional, minimal — same token system
- Dashboard: stats in simple bordered tiles, no colored backgrounds
- Table: `border-collapse: collapse`, rows have `1px solid var(--color-border)` bottom borders only (no heavy grid lines)
- Form inputs: `border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 10px 14px; font-family: var(--font-body); font-size: var(--text-base);` — focus state: `border-color: var(--color-text-primary); outline: none;`

### Footer

- Dark background: `var(--color-dark-bg)`
- Four-column layout: Brand/description | Shop links | Info links | Newsletter signup
- Newsletter input: inline — `input` left + `button` right, both same height, button = `var(--color-accent)`
- Social icons: SVG, 20px, `opacity: 0.6` → `1.0` on hover
- Bottom bar: tiny copyright, payment icons — `border-top: 1px solid rgba(255,255,255,0.1)`

---

## client-tryon Redesign

The try-on flow should feel like a premium brand experience — calm, guided, editorial. Use the same token file.

### App-level loading screen (inline styles in `App.jsx`)

Replace the current inline loading screen with:
```js
style={{
  position: 'fixed', inset: 0,
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  background: '#FAFAF8',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  gap: '1.5rem'
}}
```
Add a simple animated dot spinner (CSS keyframes via a `<style>` tag in the JSX), no text other than the brand name in Cormorant Garamond.

### WelcomeScreen

- Full-height, centered layout
- Large serif headline: "See Yourself in It" (or similar aspirational copy) — `--font-display --text-5xl --weight-light`
- Subtext: `--text-sm --tracking-widest uppercase --color-text-secondary`
- Two CTA buttons side by side (Try with Product | Browse Event Looks) — `btnPrimary` and `btnGhost`
- Subtle background: `var(--color-surface-alt)` with a faint noise texture via CSS (`background-image: url("data:image/svg+xml,...")`) — or a large editorial image at 10% opacity

### ProductPickerScreen

- Clean grid of product cards (same `ProductCard` pattern)
- Search bar at top: minimal, no heavy box — just a bottom border input
- Selected state: `outline: 2px solid var(--color-accent); outline-offset: -2px;`

### AutoPickScreen

- Centered card layout
- Event type tiles: square tiles with icon + label, subtle hover lift (`box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px)`)

### CameraScreen

- Dark UI (`--color-dark-bg`)
- Camera feed full-center
- Controls bar at bottom: pill-shaped, semi-transparent dark
- Instruction text: `--text-sm --tracking-wide --color-text-inverse opacity: 0.8`

### ProcessingScreen

- Centered, minimal
- Animated ring spinner — `2px solid var(--color-border)` track, `2px solid var(--color-accent)` fill, rotating
- Text: `--font-display --text-xl --weight-light` — "Crafting your look…"

### ResultScreen

- Side-by-side on desktop (original | result), stacked on mobile
- Download / Share CTAs: `btnPrimary` + `btnGhost`
- "Try Another" link: text-only, underlined, `--color-text-secondary`

---

## Responsive Breakpoints

Apply consistently across both clients:

```css
/* Mobile-first */
/* Base: 0–639px — single column, full-width */
@media (min-width: 640px)  { /* sm — 2 cols where relevant */ }
@media (min-width: 768px)  { /* md — tablet, show sidebar */ }
@media (min-width: 1024px) { /* lg — desktop, full layout */ }
@media (min-width: 1280px) { /* xl — wide screens, larger type */ }
```

Navbar: hamburger menu below 768px (implement a simple CSS toggle or React state — no library needed).
Product grid: `minmax(160px, 1fr)` mobile → `minmax(240px, 1fr)` tablet → `minmax(280px, 1fr)` desktop.

---

## Scroll & Interaction Polish

Add these subtle effects via CSS/JS:

1. **Navbar scroll state**: add a `scrolled` class via `window.addEventListener('scroll', ...)` in a `useEffect` — apply `box-shadow: 0 1px 0 var(--color-border);` when scrolled > 10px.

2. **Image lazy loading**: ensure all `<img>` tags have `loading="lazy"` and `decoding="async"`.

3. **Page transitions**: add a simple fade-in on mount to each page component:
```css
.pageEnter {
  animation: fadeUp var(--duration-slow) var(--ease-out) both;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

4. **Focus styles**: replace browser default with:
```css
:global(*:focus-visible) {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}
```

---

## What NOT to Change

- All route definitions in `App.jsx` files
- All API calls (`fetch('/api/...')`, axios calls, etc.)
- All state logic and try-on flow (`App.jsx` in client-tryon)
- MongoDB schemas, server routes, auth logic
- Environment variable names
- File/folder structure (you may add new CSS Modules but don't reorganize components)
- `package.json` dependencies — no new UI libraries

---

## Deliverable Checklist

Before finishing, verify:
- [ ] `global.module.css` updated in both `client-store/src/styles/` and `client-tryon/src/styles/`
- [ ] Both `index.html` files load Cormorant Garamond + DM Sans from Google Fonts
- [ ] Navbar is sticky and polished in client-store
- [ ] ProductCard has hover image zoom + quick-view slide-up
- [ ] All buttons follow the three-variant pattern (primary, ghost, accent)
- [ ] Footer is dark with newsletter signup
- [ ] All 6 try-on screens are restyled
- [ ] No inline styles remain (except the App.jsx loading screen)
- [ ] All pages are responsive from 320px to 1440px
- [ ] No Tailwind, no component library — pure CSS Modules