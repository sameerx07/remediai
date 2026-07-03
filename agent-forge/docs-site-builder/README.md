# Docs Site Builder Agent

Turn any folder of Markdown files into a **modern, production-ready documentation site** in one shot.

The generated site uses **Docusaurus 3** with a completely custom design system that goes beyond Stripe, Vercel, and Tailwind docs — glassmorphism navigation, aurora gradient heroes, animated section cards, command palette search, scroll progress indicator, better code blocks with copy buttons, gradient admonitions, and a genuine dark mode.

---

## Quick Start

### 1. Attach the agent

In your AI editor's chat panel, attach:

```text
agent-forge/docs-site-builder/docs-site-builder.agent.md
```

- **Kiro:** drag the file into chat or use `#File`
- **GitHub Copilot Chat (VS Code):** click the paperclip → Attach files
- **Cursor / Windsurf:** `@` → select the file
- **Claude Code:** `@` and paste the file path

### 2. Send a trigger message

```text
Build a modern docs site from the markdown files in ./docs
```

or

```text
I have documentation in ./00-docs. Generate a docs site.
```

### 3. Answer the question batch

The agent will send **one** message with 8 questions covering:

1. Project name and tagline
2. Location of your Markdown files
3. Theme preset or custom colors
4. Light / dark / auto
5. Landing page style
6. Deployment target
7. Optional features (PDF export, search, auth)
8. Logo and favicon paths

### 4. Confirm and let it run

Once you approve, the agent generates every file, wires deployment, and gives you `npm install && npm start` to preview locally.

---

## What You Get

A `docs-site/` folder next to your source Markdown containing:

```text
docs-site/
├── docs/                          ← your .md files (auto-copied with frontmatter added)
├── src/
│   ├── pages/index.jsx            ← animated landing page
│   ├── pages/index.module.css
│   ├── css/custom.css             ← modern design system (2000+ lines)
│   ├── components/
│   │   ├── CommandPalette.jsx     ← Cmd+K search
│   │   ├── ScrollProgress.jsx     ← reading progress bar
│   │   ├── SectionCard.jsx        ← animated card grid
│   │   ├── Callout.jsx            ← modern admonitions
│   │   └── ThemeToggle.jsx        ← smooth dark/light switch
│   └── theme/                     ← swizzled overrides
├── static/
│   ├── img/                       ← favicon, logo, og-image
│   └── fonts/                     ← Inter + JetBrains Mono self-hosted
├── docusaurus.config.js           ← fully wired
├── sidebars.js                    ← auto-built from folder structure
├── package.json                   ← pinned Node 20, npm scripts
└── .github/workflows/deploy.yml   ← Azure SWA / GitHub Pages / Vercel
```

---

## Design Highlights

The generated site is not stock Docusaurus. Read [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) for the full design language. Summary:

- **Aurora gradient hero** — multi-layer conic + radial gradients, animated
- **Glassmorphism navbar** — frosted backdrop-filter, adaptive on scroll
- **Section card grid** — animated on-scroll, gradient accent borders, hover lift + glow
- **Modern typography** — Inter Variable + JetBrains Mono, self-hosted
- **Command palette** — Cmd+K opens a fuzzy search modal with keyboard navigation
- **Scroll progress** — thin gradient bar at the top of the page
- **Better code blocks** — language icon, copy button, line highlighting, diff support
- **Gradient callouts** — info / warn / tip / danger with icon and left accent
- **Sticky TOC with active section indicator** — smooth scroll, animated dot
- **True dark mode** — proper contrast, not just inverted colors, respects `prefers-color-scheme`
- **Mobile-first** — slide-in menu, touch-friendly, no clipping, respects safe areas
- **Reduced motion** — respects `prefers-reduced-motion`
- **Print-friendly** — clean print stylesheet for PDF export

---

## Theme Presets

Five built-in palettes, each fully accessible (WCAG AA). See [`themes.md`](./themes.md) for full palette definitions.

| Preset | Vibe | Accent |
|---|---|---|
| [Aurora](./themes.md#aurora-default) | Cosmic purple → pink gradients | `#a855f7` → `#ec4899` |
| [Midnight](./themes.md#midnight) | Editorial navy + electric cyan | `#0ea5e9` |
| [Forest](./themes.md#forest) | Calm green + warm accents | `#10b981` |
| [Sunset](./themes.md#sunset) | Warm coral + amber | `#f97316` |
| [Monochrome](./themes.md#monochrome) | Editorial black/white minimal | `#0a0a0a` |

Or pick **Custom** and provide your own primary + accent hex codes. The agent will build a full palette (50–950 scale) from those two values automatically.

---

## Requirements

- Node.js 20+ (agent will check and warn if missing)
- `npm` 10+
- A folder of `.md` files somewhere in your project

---

## Example Prompts

```text
Build a modern docs site from my ./docs folder. Use the Aurora theme.
```

```text
Generate a documentation site for my API. Markdown is in api-docs/.
Custom colors: primary #6366f1, accent #ec4899. Deploy to Vercel.
```

```text
Take everything in wealthyminds/00-docs and turn it into a docs site
with Midnight theme, dark mode default, PDF download, and Azure SWA deployment.
```

---

## Regenerating or Updating

Re-run the agent any time. It will:

1. Detect an existing `docs-site/` folder.
2. Ask what to preserve (custom CSS overrides, config, or nothing).
3. Regenerate the rest.

Your source `.md` files are never modified.

---

## File Anatomy — 17 files, every one has a job

Slimmed down from an earlier 27-file version. Every remaining file has a clear reason to exist as its own file rather than being inlined.

### Root — 4 files

| File | Purpose |
|---|---|
| `docs-site-builder.agent.md` | **The main file** — attach this in chat. Agent instructions, workflow, question batch, error handling, and small inline templates (gitignore, sidebars.js, Root.jsx, static asset READMEs, placeholder logo SVG). |
| `README.md` | For humans. Quick start, example prompts, this anatomy section. The agent never reads this. |
| `DESIGN_SYSTEM.md` | Full design language spec (~640 lines). Referenced by the agent so it knows how the generated CSS should look and behave. |
| `themes.md` | All 5 theme palettes in one catalog — Aurora, Midnight, Forest, Sunset, Monochrome. Agent reads only the section the user picked. |

### `templates/` — 9 files (real code that gets copied into your project)

| File | Lines | What it generates |
|---|---|---|
| `custom.css.tmpl` | ~1900 | Full modern CSS design system — aurora, glassmorphism, gradient buttons, cards, admonitions, print, dark mode, everything. Cannot be inlined without breaking the agent file. |
| `landing-page.jsx.tmpl` | ~130 | Animated home page — aurora hero, gradient headline, section card grid with intersection observer |
| `CommandPalette.jsx.tmpl` | ~150 | Cmd+K search modal with keyboard navigation |
| `docusaurus.config.js.tmpl` | ~110 | Docusaurus 3 configuration — navbar, plugins, prism, metadata |
| `Callout.jsx.tmpl` | ~90 | Modern admonition component (info/tip/warning/danger/note with icons) |
| `landing-page.module.css.tmpl` | ~65 | CSS module scoped to the landing page |
| `SectionCard.jsx.tmpl` | ~50 | Reusable card component with cursor-tracked glow |
| `package.json.tmpl` | ~40 | Node dependencies, npm scripts, engine constraints |
| `ScrollProgress.jsx.tmpl` | ~40 | Top-of-page gradient progress bar |

### `templates/workflows/` — 4 files (deployment options)

User picks one during setup; the rest stay unused for that project.

| File | Format | Deploys to |
|---|---|---|
| `azure-swa.yml.tmpl` | YAML (GitHub Actions) | Azure Static Web Apps |
| `github-pages.yml.tmpl` | YAML (GitHub Actions) | GitHub Pages |
| `netlify.toml.tmpl` | TOML | Netlify |
| `vercel.json.tmpl` | JSON | Vercel |

Cannot be merged — 4 different file formats writing to 4 different locations.

### What got inlined into the agent file

These 6 files used to be their own templates. They were small enough (15–30 lines) that keeping them separate added more clutter than value:

- `gitignore.tmpl` → inlined in Step 4.11 of the agent
- `sidebars.js.tmpl` → inlined in Step 4.3
- `Root.jsx.tmpl` → inlined in the components section
- `placeholder-logo.svg.tmpl` → inlined in Step 4.8
- `fonts-README.md.tmpl` → inlined in Step 4.9
- `img-README.md.tmpl` → inlined in Step 4.8

### The final answer for your team lead

**17 files:** 4 root docs + 9 code templates + 4 deployment configs. No file is optional. The huge `custom.css.tmpl` alone is 1900 lines of the modern design system — that's most of the bulk. Everything else exists because the agent needs the real file content to write into the user's project.
