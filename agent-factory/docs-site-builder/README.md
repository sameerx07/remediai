# Docs Site Builder Agent

Turn any folder of Markdown files into a **Stripe-style documentation site**. No config. No gradients. No decisions.

**Stack:** Next.js 15 + Tailwind CSS 4 + MDX + Shiki
**Design:** Black, white, one blue — flat, clean, professional
**Output:** Static HTML, deploy anywhere

---

## How to Use

### 1. Attach the agent file in chat

```
agent-factory/docs-site-builder/docs-site-builder.agent.md
```

That's the only file. Agent reads everything else itself.

### 2. Send your prompt

```
Build a docs site from ./docs
```

### 3. Agent asks ONE question

```
What's the project name and tagline?
```

### 4. Agent builds everything automatically

Scans docs, picks layout, generates full site, runs build, reports success.

### 5. After build — offers adjustments

```
✅ Done. Want to change anything? Or ship it as-is.
```

---

## What It Looks Like

### Navbar (two levels — like Stripe)
```
┌──────────────────────────────────────────────────────┐
│  Logo           🔍 Search (⌘K)        🌙 Toggle     │  ← Level 1
├──────────────────────────────────────────────────────┤
│  Architecture  │ Networking │ Security │ Data        │  ← Level 2 (H2 tabs)
└──────────────────────────────────────────────────────┘
```

### Doc page
```
┌─────────┬────────────────────────────┬──────────┐
│ Sidebar │  Content                   │  TOC     │
│         │                            │          │
│ SECTION │  # Architecture            │  • Intro │
│ Overview│                            │  • VNet  │
│ VNet    │  Platform overview...      │  • AKS   │
│ AKS     │                            │          │
│ Data    │  ## Networking             │          │
│         │  VNet design with...       │          │
└─────────┴────────────────────────────┴──────────┘
```

### Design rules
- No gradients, no aurora, no glow, no shimmer
- Flat, clean, professional
- One blue (`#635bff`) for links + active states
- Hover = subtle border change only
- H2 tabs in navbar update on scroll (scroll-spy)
- Headings separated by spacing + thin borders

---

## Defaults (All Automatic)

| Setting | Value |
|---|---|
| Colors | Black/white + `#635bff` |
| Dark mode | Auto (OS) + toggle |
| Layout | Auto-detected from content size |
| Navbar | Two-level (logo+search top, H2 tabs below) |
| Sidebar | Left, sticky, collapsible |
| Section nav | H2 tabs, scroll-spy |
| Code blocks | Shiki + copy button |
| Search | Cmd+K |
| Animations | Minimal (page fade only) |

---

## After Build — Adjustments

Tell the agent:

- "Change accent to teal"
- "Make headings bigger"
- "Remove home page"

---

## Preview

```powershell
cd docs-site
npm run dev
```

→ http://localhost:3000
