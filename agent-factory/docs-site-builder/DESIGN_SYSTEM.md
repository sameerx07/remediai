# Design System — Stripe-Style Docs

## Core Principle

**Look like Stripe docs.** Clean, flat, professional. No gradients, no glow, no shimmer, no aurora. Content leads.

---

## Layout

- **Two-level navbar:** Top = logo + search + toggle. Below = section tabs (H2s from current doc)
- **Three-column doc page:** Sidebar (left) + Content (center) + TOC (right)
- **Sidebar:** Sticky, collapsible sections, active link = blue text + left border
- **Section nav (H2 tabs):** Horizontal, scroll-spy updates active tab on scroll
- **Content area:** Max-width 680px for prose. Full-width for tables and code blocks.
- **Mermaid diagrams:** Rendered as interactive SVG via client-side mermaid.js (never raw text)

---

## Typography

- Font: Inter (body) + JetBrains Mono (code) — self-hosted WOFF2
- H1: 30px, bold, black
- H2: 24px, semibold, black — preceded by generous spacing + thin border-top
- H3: 18px, semibold, black
- Body: 15px, line-height 1.75, gray-700 (light) / gray-300 (dark)
- Links: brand blue, no underline (underline on hover)
- Max prose width: 680px

---

## Colors

One blue. Everything else is black/white/gray.

- Brand: `#635bff` (light) / `#818cf8` (dark)
- Text primary: `#0f172a` (light) / `#fafafa` (dark)
- Text secondary: `#475569` (light) / `#a3a3a3` (dark)
- Background: `#ffffff` (light) / `#0a0a0a` (dark)
- Surface: `#f9fafb` (light) / `#171717` (dark)
- Border: `#e2e8f0` (light) / `#262626` (dark)

---

## Interactions

**Polished.** Smooth, professional — never flashy.

- Hover on cards: translateY(-2px) + elevated shadow with brand tint. Subtle gradient overlay fades in. "Read more" text appears.
- Hover on links: underline appears.
- Hover on nav items: subtle background change + border hint.
- Active nav/sidebar: brand color + brand-soft background + border indicator.
- Page transition: 300ms opacity + translateY(8px→0) fade-in via Framer Motion.
- Hero entrance: 600ms fade + translateY(30px→0). Status pill scales in. Staggered.
- Card entrance: staggered fade-up (50ms delay between cards) on viewport intersection.
- Search palette: scale(0.96→1) + opacity via AnimatePresence.
- Mobile menu: slide-in from left with backdrop overlay.
- Theme toggle: 300ms body background/color transition.
- Custom scrollbar: thin (6px), rounded, subtle colors.
- All transitions use cubic-bezier easing: [0.25, 0.46, 0.45, 0.94].

---

## Components

- **Home page hero:** Status pill (green dot + "Documentation") → bold 2-line headline → gray tagline → 2 CTA buttons (primary solid brand + secondary outlined) → 3-column quick links row with icons → card grid by section
- **Cards (home):** White/dark bg, 1px border, rounded-2xl. Section icon badge + uppercase section label. Title + description. Hover = translateY(-2px) + brand-tinted shadow + "Read more" arrow fades in. Subtle per-section gradient overlay on hover.
- **Callout:** Left border (blue/green/yellow/red), light tinted bg, icon + title + body
- **Code block:** github-light / github-dark Shiki themes. Copy button top-right.
- **Mermaid diagram:** Detected automatically from code block content. Rendered as SVG in a white/dark container with rounded border and padding. Uses brand colors for lines and actors.
- **Table:** Full-width, 1px borders, gray header row
- **Blockquote:** Left border brand color, surface bg, italic


---

## What NOT to Do

- ❌ No gradient backgrounds on buttons or UI elements
- ❌ No gradient text
- ❌ No gradient buttons
- ❌ No aurora/blob effects
- ❌ No cursor-tracked glow
- ❌ No scroll-reveal on individual text paragraphs
- ❌ No shimmer effects
- ❌ No heavy shadows beyond the defined card-hover
- ❌ No deployment config generation
- ✅ OK: Subtle radial gradient glow on hero background (~10% opacity)
- ✅ OK: Card hover translateY(-2px) + brand-tinted shadow
- ✅ OK: Navbar backdrop-blur
- ✅ OK: Staggered card entrance animations (Framer Motion)
- ✅ OK: Page content fade-in transition
- ✅ OK: Per-card subtle gradient overlay on hover (10% opacity, per-section color)

---

## Accessibility

- All text meets WCAG AA (4.5:1 minimum)
- Focus-visible rings on interactive elements
- Keyboard nav for search, sidebar, section nav
- Semantic HTML (nav, main, aside, article)
- Reduced motion: disable page-fade animation
- Skip-to-content link
