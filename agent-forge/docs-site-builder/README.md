# Docs Site Builder Agent — Next.js 15 Edition

Turn any folder of Markdown files into a **modern, premium documentation site** in one shot.

Built on **Next.js 15 + Tailwind CSS 4 + Framer Motion + MDX + Shiki**. No Docusaurus. No limitations. Full design control.

The output matches or exceeds Stripe, Vercel, and Linear docs quality.

---

## Quick Start

1. **Attach** `docs-site-builder.agent.md` in your AI editor chat (Kiro, Copilot, Cursor, Claude Code) — this is the **only file you attach**, the agent reads its sibling files (`DESIGN_SYSTEM.md`, `themes.md`) by itself
2. **Send:** `Build a modern docs site from ./docs`
3. **Answer** 8 questions (name, theme, layout, features)
4. **Wait** — agent generates everything, runs build, reports success
5. **Preview:** `cd docs-site && npm run dev` → http://localhost:3000

---

## What You Get

A `docs-site/` folder with:

```
docs-site/
├── app/                    ← Next.js 15 App Router
│   ├── layout.tsx          ← glassmorphism nav, theme provider, fonts
│   ├── page.tsx            ← animated landing page (aurora hero + cards)
│   └── docs/              ← your documentation pages
├── components/             ← 15 modern React components
├── content/                ← your .md files (copied, originals untouched)
├── public/fonts/           ← Inter + JetBrains Mono (self-hosted)
├── tailwind.config.ts      ← theme tokens from your chosen palette
├── next.config.mjs         ← static export (no server needed)
└── package.json
```

---

## Features

### Visual Design
- Aurora animated gradient hero (3 drifting conic blobs)
- Glassmorphism navbar (`backdrop-filter: blur(20px)`)
- Cursor-tracked card glow (Linear-style spotlight)
- Gradient text with shimmer animation
- True dark mode (separately designed, not inverted)
- 5 theme presets or custom hex codes

### Animations (Framer Motion)
- Smooth page transitions (fade + slide between routes)
- Scroll-reveal sections (fade-up on viewport enter)
- Staggered card grid appearance
- Button hover shine sweep
- Theme toggle icon rotation
- Sidebar collapse/expand spring

### Interactive Components
- Cmd+K command palette with fuzzy search + keyboard nav
- Copy button on code blocks with success animation
- Collapsible sections
- Heading anchor links (hover → click → copy URL)
- Back-to-top floating button
- Responsive mobile slide-in menu

### Developer Experience
- MDX — embed React components inside markdown
- Shiki syntax highlighting (same engine as VS Code)
- Hot reload during development
- TypeScript everywhere
- Static export — deploy as plain HTML anywhere

### Performance
- < 120KB bundle (gzipped)
- Lighthouse 95+
- Self-hosted fonts (no external requests)
- Static HTML output (no server)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, static export) |
| Styling | Tailwind CSS 4 (utility-first) |
| Animations | Framer Motion 11 |
| Markdown | MDX 3 + next-mdx-remote |
| Syntax | Shiki 1.x |
| Dark mode | next-themes |
| Search | Fuse.js (client-side fuzzy) |
| Icons | Lucide React |
| Fonts | Inter Variable + JetBrains Mono Variable |

---

## Theme Presets

See [`themes.md`](./themes.md) for full palette definitions.

| Preset | Vibe | Primary |
|---|---|---|
| **Neutral** (default) | Clean slate/zinc — like Vercel, Linear, Notion | `#6366f1` (indigo) |
| Aurora | Violet → pink accents on neutral base | `#a855f7` → `#ec4899` |
| Midnight | Deep navy + cyan, enterprise/API feel | `#0ea5e9` |

Or provide custom hex codes — the agent generates a full 50–950 scale automatically.

**Readability guarantee:** Body text is ALWAYS neutral gray — never brand-tinted. Brand colors only appear in links, buttons, badges, and gradients. This is what Stripe/Vercel/Linear do.

---

## Layout Modes

| Mode | Best for | What it generates |
|---|---|---|
| Single page | ≤10 docs | All content on one scrollable page with sidebar (like Convora docs) |
| Multi-page | 10+ docs | Each .md gets its own route, sidebar links between pages |

The agent recommends based on your file count. You can override.

---

## File Anatomy — 6 files in this folder

| File | Purpose |
|---|---|
| `docs-site-builder.agent.md` | **Main file — attach this in chat.** Full agent instructions. |
| `README.md` | This file. For humans. |
| `DESIGN_SYSTEM.md` | Visual language spec the agent references for consistent design. |
| `themes.md` | 5 theme palettes + custom palette generation rules. |
| `templates/` | (empty — kept as placeholder for future reference files) |

Lean and simple. The agent generates everything from its instructions + design system + themes. No bulky template files needed — Next.js + Tailwind components are generated inline.

---

## Deploy Anywhere

Static output (`out/` folder). Works on:
- **Vercel** — push to GitHub, auto-detected
- **Netlify** — `netlify.toml` generated
- **Azure Static Web Apps** — GitHub Actions workflow generated
- **GitHub Pages** — workflow generated
- **Any web server** — just serve the `out/` folder
