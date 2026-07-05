# Theme — Default

One theme. Black, white, and blue. Like Stripe and Vercel. No choices needed.

---

## Light Mode

| Token | Hex | Usage |
|---|---|---|
| `--background` | `#ffffff` | Page background |
| `--surface` | `#f9fafb` | Cards, sidebar, code blocks |
| `--surface-hover` | `#f3f4f6` | Hover states |
| `--text-primary` | `#0f172a` | Headings, body text |
| `--text-secondary` | `#475569` | Descriptions, meta |
| `--text-muted` | `#94a3b8` | Timestamps, labels |
| `--border` | `#e2e8f0` | Dividers, card borders |
| `--brand` | `#635bff` | Links, buttons, active states |
| `--brand-hover` | `#4f46e5` | Button hover |
| `--brand-soft` | `#f5f3ff` | Badge backgrounds, active nav bg |
| `--card-shadow` | `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)` | Default card shadow |
| `--card-shadow-hover` | `0 8px 25px rgba(99,91,255,0.08), 0 4px 10px rgba(0,0,0,0.04)` | Hover card shadow |

## Dark Mode

| Token | Hex | Usage |
|---|---|---|
| `--background` | `#09090b` | Page background |
| `--surface` | `#18181b` | Cards, sidebar |
| `--surface-hover` | `#27272a` | Hover states |
| `--text-primary` | `#fafafa` | Headings, body text |
| `--text-secondary` | `#a1a1aa` | Descriptions |
| `--text-muted` | `#52525b` | Timestamps, labels |
| `--border` | `#27272a` | Dividers |
| `--brand` | `#818cf8` | Links, buttons |
| `--brand-hover` | `#a5b4fc` | Button hover |
| `--brand-soft` | `#1e1b4b` | Badge backgrounds |
| `--card-shadow` | `0 1px 3px rgba(0,0,0,0.2)` | Default card shadow |
| `--card-shadow-hover` | `0 8px 25px rgba(129,140,248,0.1), 0 4px 10px rgba(0,0,0,0.2)` | Hover card shadow |

---

## Navbar

```css
/* Light */ background: rgba(255,255,255,0.8); backdrop-filter: blur(16px); border-bottom: 1px solid #e2e8f0;
/* Dark */  background: rgba(9,9,11,0.8); backdrop-filter: blur(16px); border-bottom: 1px solid #27272a;
```

Frosted glass style — semi-transparent with blur. Content scrolls behind it.

---

## Syntax Highlighting

Shiki built-in themes:
- Light: `github-light`
- Dark: `github-dark`

No custom syntax colors.

---

## NO GARISH GRADIENTS

The agent must NEVER generate:
- Gradient backgrounds on buttons or UI elements
- Gradient text
- Gradient buttons
- Gradient borders
- Aurora/blob effects

BUT these are OK:
- Subtle radial-gradient on hero section (~10% opacity brand color, creates soft glow)
- Per-card gradient overlay on hover (per-section color, ~10% opacity, purely decorative)
- These are NOT visible as "gradients" — they create ambient depth only

Use solid colors for all interactive UI. Buttons = `bg-[var(--brand)]` solid fill.

---

## If User Wants Different Color After Build

Update `globals.css`:
- Change `--brand` to new hex (light mode)
- Change `--brand` to lighter variant (dark mode)
- Change `--brand-hover` and `--brand-soft` accordingly

That's it. One file. Rebuild. Done.
