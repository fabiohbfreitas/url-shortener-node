# Shrink — Design Styleguide (Tailwind CSS v4)

> A dark-only, modern minimalist design system for a URL shortener app.  
> Configured entirely in CSS using Tailwind v4's `@theme` directive — no `tailwind.config.js`.

---

## 0. Tailwind v4 Theme Setup

In Tailwind v4, all design tokens live in your main CSS file using `@theme`. Import Tailwind first, then declare your tokens:

```css
@import "tailwindcss";

@theme {
  /* ── Fonts ───────────────────────────────── */
  --font-display: "DM Serif Display", serif;
  --font-mono: "DM Mono", monospace;

  /* ── Colors ──────────────────────────────── */
  --color-bg: #0c0c0d;
  --color-surface: #141416;
  --color-raised: #1c1c1f;
  --color-border: #2a2a2e;
  --color-border-strong: #3f3f46;
  --color-primary: #f4f4f5;
  --color-secondary: #71717a;
  --color-muted: #3f3f46;
  --color-accent: #e8571a;
  --color-accent-sub: #1f1107;
  --color-success: #22c55e;
  --color-danger: #ef4444;

  /* ── Font sizes ──────────────────────────── */
  --text-2xs: 11px;
  --text-xs: 13px;
  --text-sm: 15px;
  --text-md: 18px;
  --text-lg: 24px;
  --text-xl: 36px;

  /* ── Spacing (extends default scale) ─────── */
  --spacing-18: 4.5rem;

  /* ── Border radius ───────────────────────── */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;

  /* ── Easing ──────────────────────────────── */
  --ease-expo: cubic-bezier(0.16, 1, 0.3, 1);

  /* ── Transitions ─────────────────────────── */
  --duration-micro: 120ms;
  --duration-element: 200ms;
  --duration-panel: 320ms;

  /* ── Animation ───────────────────────────── */
  --animate-fade-up: fadeUp 0.5s var(--ease-expo) both;

  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
```

> **Fonts** — add to `<head>`:
>
> ```html
> <link
>   href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Serif+Display:ital@0;1&display=swap"
>   rel="stylesheet"
> />
> ```

### How v4 tokens become utilities

Every `@theme` variable automatically generates a utility class:

| CSS variable        | Generated utility                              |
| ------------------- | ---------------------------------------------- |
| `--color-accent`    | `bg-accent`, `text-accent`, `border-accent`    |
| `--color-surface`   | `bg-surface`, `text-surface`, `border-surface` |
| `--font-display`    | `font-display`                                 |
| `--font-mono`       | `font-mono`                                    |
| `--text-2xs`        | `text-2xs`                                     |
| `--radius-lg`       | `rounded-lg`                                   |
| `--animate-fade-up` | `animate-fade-up`                              |

---

## 1. Brand Concept

**Name:** Shrink  
**Tagline:** Less URL. More signal.  
**Personality:** Precise. Quiet. Efficient. No fluff.  
**Aesthetic:** Utilitarian dark — like a terminal someone made beautiful.

---

## 2. Color

All surfaces are dark. Color is used sparingly as signal, never decoration.

| Role                        | Utility class             | Value     |
| --------------------------- | ------------------------- | --------- |
| Page background             | `bg-bg`                   | `#0C0C0D` |
| Cards, inputs, panels       | `bg-surface`              | `#141416` |
| Hover / elevated surfaces   | `bg-raised`               | `#1C1C1F` |
| Subtle borders              | `border-border`           | `#2A2A2E` |
| Active borders, focus rings | `border-border-strong`    | `#3F3F46` |
| Primary text                | `text-primary`            | `#F4F4F5` |
| Secondary / labels          | `text-secondary`          | `#71717A` |
| Muted / disabled            | `text-muted`              | `#3F3F46` |
| Accent — brand / CTA        | `text-accent` `bg-accent` | `#E8571A` |
| Accent background (badges)  | `bg-accent-sub`           | `#1F1107` |
| Success / confirmed         | `text-success`            | `#22C55E` |
| Error / delete              | `text-danger`             | `#EF4444` |

### Rules

- Never `text-white` or `bg-white` — use `text-primary` / `bg-bg`.
- `bg-accent` or `text-accent` appears on **one element per view** only.
- No `bg-linear-*` gradients unless dark-to-dark, single axis, very subtle.

---

## 3. Typography

### Typefaces

| Role                      | Utility        | Font                                           |
| ------------------------- | -------------- | ---------------------------------------------- |
| Hero / display headings   | `font-display` | DM Serif Display 400, italic variant available |
| All UI text, labels, data | `font-mono`    | DM Mono 400 / 500                              |

`font-mono` is the global base. Set it on `<body>`. Never use `font-sans` anywhere.

### Type Scale

| Size                         | Utility                    | Usage                                        |
| ---------------------------- | -------------------------- | -------------------------------------------- |
| 11px                         | `text-2xs`                 | Timestamps, metadata, uppercase micro-labels |
| 13px                         | `text-xs`                  | Secondary labels, helper text                |
| 15px                         | `text-sm`                  | Body copy, input text                        |
| 18px                         | `text-md`                  | Card titles, short URLs                      |
| 24px                         | `text-lg`                  | Section headings                             |
| 36px                         | `text-xl`                  | Page-level headings                          |
| fluid `clamp(42px,6vw,72px)` | inline style or `@utility` | Hero only — `font-display`                   |

### Tracking & Weight patterns

| Pattern               | Classes                                                    |
| --------------------- | ---------------------------------------------------------- |
| Uppercase micro-label | `text-2xs font-mono uppercase tracking-widest text-muted`  |
| URL / data string     | `font-mono text-sm tracking-tight text-secondary truncate` |
| Button label          | `font-mono text-xs font-medium tracking-wide`              |
| Short URL (card)      | `font-mono text-md font-medium text-primary`               |

### Rules

- Max body line length: `max-w-prose`
- Left-align all copy — no `text-center` except hero single-line
- Hierarchy via size + spacing, not color fills

---

## 4. Spacing

Tailwind v4 keeps the default 4px (`0.25rem`) scale. Key landmarks:

| Classes           | Value | Usage                         |
| ----------------- | ----- | ----------------------------- |
| `gap-1` / `p-1`   | 4px   | Tight icon padding            |
| `gap-2` / `p-2`   | 8px   | Inner element spacing         |
| `gap-3` / `p-3`   | 12px  | Component inner padding       |
| `gap-4` / `p-4`   | 16px  | Default gap                   |
| `gap-5` / `p-5`   | 20px  | Card padding                  |
| `gap-6` / `p-6`   | 24px  | Section gutter / page padding |
| `gap-8` / `p-8`   | 32px  | Layout rhythm                 |
| `gap-12` / `p-12` | 48px  | Section breaks                |
| `gap-20` / `p-20` | 80px  | Page-level vertical rhythm    |

---

## 5. Layout

```html
<div class="max-w-5xl mx-auto px-6"></div>
```

- Max content width: `max-w-5xl` (1080px)
- Page gutter: `px-6` → `md:px-12`
- Link card list: `flex flex-col gap-3`
- Section divider: `border-t border-border` (no filled bands)

### Principles

- Whitespace is load-bearing — `py-20` for hero, `py-12` between sections
- Hierarchy through `gap-*` and font size, never background color fills
- Left-align everything

---

## 6. Components

> All components use `font-mono` as base. No exceptions.

### 6.1 URL Input

```html
<input
  type="url"
  placeholder="https://your-long-url.com/…"
  class="flex-1 h-[52px] bg-surface border border-border rounded-md px-5
         text-sm font-mono text-primary placeholder:text-muted
         outline-none focus:border-border-strong
         transition-colors duration-[120ms] ease-[var(--ease-expo)]"
/>
```

No `ring-*` — border color change is the only focus indicator.

### 6.2 Button — Primary

```html
<button
  class="h-11 px-5 bg-primary text-bg text-xs font-mono font-medium
         tracking-wide rounded-md
         transition-opacity duration-[120ms] hover:opacity-[0.88]"
>
  Shrink →
</button>
```

### 6.3 Button — Ghost

```html
<button
  class="h-9 px-5 border border-border text-secondary text-xs font-mono
         rounded-md transition-colors duration-[120ms] ease-[var(--ease-expo)]
         hover:border-border-strong hover:text-primary"
>
  Sign in
</button>
```

### 6.4 Link Card

```html
<div
  class="bg-surface border border-border rounded-lg p-5
            flex justify-between gap-3
            transition-colors duration-[120ms] ease-[var(--ease-expo)]
            hover:bg-raised hover:border-border-strong"
>
  <div class="min-w-0">
    <p class="text-md font-medium text-primary font-mono">shrt.io/abc123</p>
    <p class="text-xs text-secondary font-mono truncate mt-0.5">
      https://very-long-original-url.com/path/to/content
    </p>
    <div class="flex items-center gap-4 mt-3">
      <span class="text-2xs text-muted">3 days ago</span>
      <span class="text-2xs text-muted">· 142 clicks</span>
      <span
        class="bg-accent-sub text-accent text-2xs uppercase tracking-widest px-2 py-0.5 rounded-sm"
      >
        active
      </span>
    </div>
  </div>

  <div class="flex items-start gap-1.5 shrink-0">
    <!-- icon buttons -->
  </div>
</div>
```

`min-w-0` on the left column + `truncate` on the long URL prevents overflow.

### 6.5 Badge

```html
<span
  class="bg-accent-sub text-accent font-mono text-2xs
             uppercase tracking-widest px-2 py-0.5 rounded-sm"
>
  active
</span>
```

### 6.6 Icon Button

```html
<button
  class="w-8 h-8 flex items-center justify-center rounded-md text-muted
         transition-colors duration-[120ms] ease-[var(--ease-expo)]
         hover:bg-raised hover:text-primary"
>
  <!-- Lucide SVG: width="15" height="15" stroke-width="1.5" stroke-linecap="square" -->
</button>
```

### 6.7 Nav

```html
<nav class="border-b border-border py-5">
  <div class="max-w-5xl mx-auto px-6 flex items-center justify-between">
    <!-- Logo -->
    <div
      class="flex items-center gap-2 font-mono text-sm font-medium text-primary"
    >
      <span class="w-2 h-2 rounded-full bg-accent"></span>
      shrt
    </div>

    <!-- Links -->
    <div class="flex items-center gap-6">
      <a
        class="font-mono text-xs text-secondary
                transition-colors duration-[120ms] hover:text-primary"
      >
        Dashboard
      </a>
      <!-- ghost button for sign in -->
    </div>
  </div>
</nav>
```

### 6.8 Section Label

```html
<span
  class="flex items-center gap-2 font-mono text-2xs uppercase tracking-widest text-muted"
>
  <span class="w-1.5 h-1.5 rounded-full bg-accent"></span>
  Recent links
</span>
```

---

## 7. Iconography

- Library: **Lucide** (`lucide-react` or inline SVG)
- Stroke: `stroke-width="1.5"` `stroke-linecap="square"`
- Default size: `15×15px` in UI, `20×20px` for emphasis
- Outline only — never filled
- Color always via `currentColor`, controlled by parent `text-*`

---

## 8. Motion

In v4, custom easing and duration are available as CSS variables. Reference them with the arbitrary value bracket syntax:

| Context                | Classes                                                                   |
| ---------------------- | ------------------------------------------------------------------------- |
| Hover color / border   | `transition-colors duration-[120ms] ease-[var(--ease-expo)]`              |
| Fade + slide element   | `transition-[opacity,transform] duration-[200ms] ease-[var(--ease-expo)]` |
| Panel / modal          | `transition-all duration-[320ms] ease-[var(--ease-expo)]`                 |
| Page-load card stagger | `animate-fade-up [animation-delay:300ms]`                                 |

Stagger pattern — increment `animation-delay` by `60ms` per card:

```html
<div class="animate-fade-up [animation-delay:300ms]">Card 1</div>
<div class="animate-fade-up [animation-delay:360ms]">Card 2</div>
<div class="animate-fade-up [animation-delay:420ms]">Card 3</div>
```

- Only animate `opacity` and `transform` — never layout properties.

---

## 9. Do & Don't

| ✅ Do                                         | ❌ Don't                               |
| --------------------------------------------- | -------------------------------------- |
| `hover:bg-raised` on interactive surfaces     | `shadow-*` or `drop-shadow-*` anywhere |
| `hover:border-border-strong` for active state | `ring-*` focus indicators              |
| `text-accent` on one element per view         | `bg-linear-*` gradients as decoration  |
| `truncate` + `min-w-0` on URL containers      | Unwrapped long strings                 |
| `font-mono` on all UI text                    | `font-sans` anywhere                   |
| `font-medium` at most                         | `font-bold` / `font-extrabold`         |
| `py-12` / `py-20` section rhythm              | Dense stacking without space           |
| `border-t border-border` to divide sections   | Filled band dividers                   |

---

_Shrink Styleguide v3.0 — Tailwind v4. Dark only. Always._
