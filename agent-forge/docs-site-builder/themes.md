# Theme Catalog

Three premium themes. All designed for **readability first** — body text is always neutral (never brand-tinted), contrast ratios exceed WCAG AA (4.5:1 minimum, most are 7:1+).

Brand colors only appear in: links, buttons, badges, gradients, accents. Never in body text or paragraphs.

The user also has the option to provide custom hex codes (primary + accent) — the agent generates the full palette from those.

---

## Neutral (default)

Clean slate/zinc palette. Like Vercel docs, Linear docs, Notion. Works for any project. Never distracting. Always readable.

### Light mode

| Token | Hex | Contrast on bg |
|---|---|---|
| `--surface-0` (page bg) | `#ffffff` | — |
| `--surface-1` (card bg) | `#ffffff` | — |
| `--surface-2` (raised/hover) | `#f9fafb` | — |
| `--surface-3` (sunken) | `#f3f4f6` | — |
| `--text-primary` | `#111827` | 17.4:1 ✅ |
| `--text-secondary` | `#4b5563` | 7.5:1 ✅ |
| `--text-tertiary` | `#9ca3af` | 3.0:1 (labels only) |
| `--border-subtle` | `#e5e7eb` | — |
| `--border-strong` | `#d1d5db` | — |

### Dark mode

| Token | Hex | Contrast on bg |
|---|---|---|
| `--surface-0` (page bg) | `#09090b` | — |
| `--surface-1` (card bg) | `#111113` | — |
| `--surface-2` (raised/hover) | `#1c1c1f` | — |
| `--surface-3` (sunken) | `#27272a` | — |
| `--text-primary` | `#f9fafb` | 18.1:1 ✅ |
| `--text-secondary` | `#d1d5db` | 11.7:1 ✅ |
| `--text-tertiary` | `#9ca3af` | 6.4:1 ✅ |
| `--border-subtle` | `#27272a` | — |
| `--border-strong` | `#3f3f46` | — |

### Brand scale (indigo — modern default)

```
--brand-50:  #eef2ff
--brand-100: #e0e7ff
--brand-200: #c7d2fe
--brand-300: #a5b4fc
--brand-400: #818cf8
--brand-500: #6366f1   ← primary
--brand-600: #4f46e5
--brand-700: #4338ca
--brand-800: #3730a3
--brand-900: #312e81
--brand-950: #1e1b4b
```

### Accent scale (cyan — for secondary highlights)

```
--accent-50:  #ecfeff
--accent-100: #cffafe
--accent-200: #a5f3fc
--accent-300: #67e8f9
--accent-400: #22d3ee
--accent-500: #06b6d4   ← accent
--accent-600: #0891b2
--accent-700: #0e7490
--accent-800: #155e75
--accent-900: #164e63
--accent-950: #083344
```

### Gradient

```css
--brand-gradient: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
```

### Navbar backgrounds

```css
/* Light */ rgba(255, 255, 255, 0.8)
/* Dark */  rgba(9, 9, 11, 0.8)
```

### Syntax highlighting (Shiki theme: github-dark / github-light)

No custom — use Shiki's built-in `github-light` (light mode) and `github-dark` (dark mode). Proven readable.

---

## Aurora

Violet → pink accents on a neutral base. The creative/futuristic look. Body text stays neutral for readability — only accents use the violet/pink.

### Light mode

| Token | Hex | Contrast on bg |
|---|---|---|
| `--surface-0` | `#fafafa` | — |
| `--surface-1` | `#ffffff` | — |
| `--surface-2` | `#f5f3ff` | — |
| `--surface-3` | `#ede9fe` | — |
| `--text-primary` | `#1c1917` | 16.8:1 ✅ |
| `--text-secondary` | `#44403c` | 9.2:1 ✅ |
| `--text-tertiary` | `#78716c` | 4.6:1 ✅ |
| `--border-subtle` | `#e7e5e4` | — |
| `--border-strong` | `#d6d3d1` | — |

### Dark mode

| Token | Hex | Contrast on bg |
|---|---|---|
| `--surface-0` | `#0c0a09` | — |
| `--surface-1` | `#1c1917` | — |
| `--surface-2` | `#292524` | — |
| `--surface-3` | `#44403c` | — |
| `--text-primary` | `#fafaf9` | 18.9:1 ✅ |
| `--text-secondary` | `#d6d3d1` | 12.1:1 ✅ |
| `--text-tertiary` | `#a8a29e` | 6.8:1 ✅ |
| `--border-subtle` | `#292524` | — |
| `--border-strong` | `#44403c` | — |

### Brand scale (violet)

```
--brand-50:  #faf5ff
--brand-100: #f3e8ff
--brand-200: #e9d5ff
--brand-300: #d8b4fe
--brand-400: #c084fc
--brand-500: #a855f7   ← primary
--brand-600: #9333ea
--brand-700: #7e22ce
--brand-800: #6b21a8
--brand-900: #581c87
--brand-950: #3b0764
```

### Accent scale (pink)

```
--accent-50:  #fdf2f8
--accent-100: #fce7f3
--accent-200: #fbcfe8
--accent-300: #f9a8d4
--accent-400: #f472b6
--accent-500: #ec4899   ← accent
--accent-600: #db2777
--accent-700: #be185d
--accent-800: #9d174d
--accent-900: #831843
--accent-950: #500724
```

### Gradient

```css
--brand-gradient: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
```

### Navbar backgrounds

```css
/* Light */ rgba(250, 250, 250, 0.8)
/* Dark */  rgba(12, 10, 9, 0.8)
```

### Syntax highlighting

Shiki themes: `github-light` (light) / `github-dark` (dark). Do NOT use custom syntax colors — readability always wins.

---

## Midnight

Deep navy with cyan accents. For enterprise, finance, security, and API documentation. Serious, authoritative tone.

### Light mode

| Token | Hex | Contrast on bg |
|---|---|---|
| `--surface-0` | `#ffffff` | — |
| `--surface-1` | `#ffffff` | — |
| `--surface-2` | `#f8fafc` | — |
| `--surface-3` | `#f1f5f9` | — |
| `--text-primary` | `#0f172a` | 18.4:1 ✅ |
| `--text-secondary` | `#334155` | 9.8:1 ✅ |
| `--text-tertiary` | `#64748b` | 4.7:1 ✅ |
| `--border-subtle` | `#e2e8f0` | — |
| `--border-strong` | `#cbd5e1` | — |

### Dark mode

| Token | Hex | Contrast on bg |
|---|---|---|
| `--surface-0` | `#020617` | — |
| `--surface-1` | `#0f172a` | — |
| `--surface-2` | `#1e293b` | — |
| `--surface-3` | `#334155` | — |
| `--text-primary` | `#f8fafc` | 19.2:1 ✅ |
| `--text-secondary` | `#cbd5e1` | 11.3:1 ✅ |
| `--text-tertiary` | `#94a3b8` | 6.1:1 ✅ |
| `--border-subtle` | `#1e293b` | — |
| `--border-strong` | `#334155` | — |

### Brand scale (sky/cyan)

```
--brand-50:  #ecfeff
--brand-100: #cffafe
--brand-200: #a5f3fc
--brand-300: #67e8f9
--brand-400: #22d3ee
--brand-500: #0ea5e9   ← primary
--brand-600: #0284c7
--brand-700: #0369a1
--brand-800: #075985
--brand-900: #0c4a6e
--brand-950: #082f49
```

### Accent scale (teal)

```
--accent-50:  #f0fdfa
--accent-100: #ccfbf1
--accent-200: #99f6e4
--accent-300: #5eead4
--accent-400: #2dd4bf
--accent-500: #14b8a6   ← accent
--accent-600: #0d9488
--accent-700: #0f766e
--accent-800: #115e59
--accent-900: #134e4a
--accent-950: #042f2e
```

### Gradient

```css
--brand-gradient: linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%);
```

### Navbar backgrounds

```css
/* Light */ rgba(255, 255, 255, 0.85)
/* Dark */  rgba(2, 6, 23, 0.85)
```

### Syntax highlighting

Shiki themes: `github-light` (light) / `github-dark` (dark).

---

## Custom (user-provided)

The user provides two hex codes: **primary** and **accent**. The agent then:

1. **Generates 50–950 scale** from each hex:
   - 500 = the provided hex
   - 50–400: progressively mix with white
   - 600–950: progressively mix with black/dark

2. **Text colors are ALWAYS neutral** (never brand-tinted):
   - Light text-primary: `#111827`
   - Light text-secondary: `#4b5563`
   - Dark text-primary: `#f9fafb`
   - Dark text-secondary: `#d1d5db`

3. **Surfaces are ALWAYS neutral gray**:
   - Light: white → `#f9fafb` → `#f3f4f6`
   - Dark: `#09090b` → `#111113` → `#1c1c1f`

4. **Brand colors only appear in:**
   - Links
   - Buttons
   - Badges / pills
   - Gradient hero
   - Active nav indicators
   - Code block accents

5. **Gradient:** `linear-gradient(135deg, <primary> 0%, <accent> 100%)`

6. **Verify contrast:** primary-500 on white must be ≥ 3:1 for buttons/links. If not, use primary-600 instead and warn user.

---

## Design Rule (applies to ALL themes)

> **Body text is NEVER brand-colored.** Text is always neutral gray/white. This ensures readability regardless of which theme is selected. Brand colors are accents — links, buttons, badges, hero gradients, hover states — never paragraphs.

This is what separates premium docs (Stripe, Vercel, Linear) from amateur docs (random open-source projects with colored body text that's hard to read).
