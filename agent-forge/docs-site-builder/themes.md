# Theme Catalog

Five preset color palettes for the docs site. Each theme is fully accessible (WCAG AA) and comes with:

- 11-shade brand scale (50 → 950)
- 11-shade accent scale
- Surface / text / border tokens for light and dark modes
- Gradient definitions
- Syntax highlighting palette

The agent loads only the theme the user picked during setup.

---

## Aurora (default)

Cosmic violet → pink gradients. The signature look. Use for AI, ML, infrastructure, or anything that wants to feel current and slightly futuristic.

### Light mode

| Token | Hex |
|---|---|
| `--surface-0` | `#fdfcff` |
| `--surface-1` | `#ffffff` |
| `--surface-2` | `#f7f5fb` |
| `--surface-3` | `#efeaf7` |
| `--text-primary` | `#0f0a1f` |
| `--text-secondary` | `#4b4360` |
| `--text-tertiary` | `#7c7295` |
| `--border-subtle` | `#ece7f5` |
| `--border-strong` | `#d8cfe8` |

### Dark mode

| Token | Hex |
|---|---|
| `--surface-0` | `#0a0611` |
| `--surface-1` | `#12091f` |
| `--surface-2` | `#1a0f2e` |
| `--surface-3` | `#241735` |
| `--text-primary` | `#f5f0ff` |
| `--text-secondary` | `#a89cc0` |
| `--text-tertiary` | `#6b5f85` |
| `--border-subtle` | `#241735` |
| `--border-strong` | `#3a2856` |

### Brand + accent scales

```
--brand-50:  #faf5ff    --accent-50:  #fdf2f8
--brand-100: #f3e8ff    --accent-100: #fce7f3
--brand-200: #e9d5ff    --accent-200: #fbcfe8
--brand-300: #d8b4fe    --accent-300: #f9a8d4
--brand-400: #c084fc    --accent-400: #f472b6
--brand-500: #a855f7    --accent-500: #ec4899   /* primary + accent */
--brand-600: #9333ea    --accent-600: #db2777
--brand-700: #7e22ce    --accent-700: #be185d
--brand-800: #6b21a8    --accent-800: #9d174d
--brand-900: #581c87    --accent-900: #831843
--brand-950: #3b0764    --accent-950: #500724
```

### Gradient

```css
--brand-gradient: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
```

### Syntax highlighting

```
keyword: #a855f7  |  string: #10b981  |  number: #f59e0b
function: #ec4899 |  comment: #7c7295 italic  |  variable: #f5f0ff
```

---

## Midnight

Editorial navy + electric cyan. Serious, technical, authoritative. Use for financial, security, enterprise, or API reference docs.

### Light mode

| Token | Hex |
|---|---|
| `--surface-0` | `#fbfcfe` |
| `--surface-1` | `#ffffff` |
| `--surface-2` | `#f2f6fb` |
| `--surface-3` | `#e6eef7` |
| `--text-primary` | `#0a1628` |
| `--text-secondary` | `#3d4d63` |
| `--text-tertiary` | `#6c7d94` |
| `--border-subtle` | `#e2eaf5` |
| `--border-strong` | `#c8d5e6` |

### Dark mode

| Token | Hex |
|---|---|
| `--surface-0` | `#050914` |
| `--surface-1` | `#0a1122` |
| `--surface-2` | `#111a30` |
| `--surface-3` | `#1a2545` |
| `--text-primary` | `#eef4ff` |
| `--text-secondary` | `#a3b2cc` |
| `--text-tertiary` | `#647692` |
| `--border-subtle` | `#1a2545` |
| `--border-strong` | `#2a3a5e` |

### Brand + accent scales

```
--brand-50:  #ecfeff    --accent-50:  #f0f9ff
--brand-100: #cffafe    --accent-100: #e0f2fe
--brand-200: #a5f3fc    --accent-200: #bae6fd
--brand-300: #67e8f9    --accent-300: #7dd3fc
--brand-400: #22d3ee    --accent-400: #38bdf8
--brand-500: #0ea5e9    --accent-500: #06b6d4   /* primary + accent */
--brand-600: #0284c7    --accent-600: #0891b2
--brand-700: #0369a1    --accent-700: #0e7490
--brand-800: #075985    --accent-800: #155e75
--brand-900: #0c4a6e    --accent-900: #164e63
--brand-950: #082f49    --accent-950: #083344
```

### Gradient

```css
--brand-gradient: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
```

### Syntax highlighting

```
keyword: #0ea5e9  |  string: #10b981  |  number: #f59e0b
function: #06b6d4 |  comment: #647692 italic  |  variable: #eef4ff
```

---

## Forest

Calm green with warm accents. Approachable, healthy, growth-oriented. Use for developer onboarding, educational, or sustainability docs.

### Light mode

| Token | Hex |
|---|---|
| `--surface-0` | `#fbfdfb` |
| `--surface-1` | `#ffffff` |
| `--surface-2` | `#f2f8f3` |
| `--surface-3` | `#e6f2e8` |
| `--text-primary` | `#0a1f14` |
| `--text-secondary` | `#3d5044` |
| `--text-tertiary` | `#6c8073` |
| `--border-subtle` | `#dcebe0` |
| `--border-strong` | `#c1d9c8` |

### Dark mode

| Token | Hex |
|---|---|
| `--surface-0` | `#050e0a` |
| `--surface-1` | `#0a1811` |
| `--surface-2` | `#12241b` |
| `--surface-3` | `#1c3428` |
| `--text-primary` | `#eef7f1` |
| `--text-secondary` | `#a3ccae` |
| `--text-tertiary` | `#647a6d` |
| `--border-subtle` | `#1c3428` |
| `--border-strong` | `#2f4c3a` |

### Brand + accent scales

```
--brand-50:  #ecfdf5    --accent-50:  #fffbeb
--brand-100: #d1fae5    --accent-100: #fef3c7
--brand-200: #a7f3d0    --accent-200: #fde68a
--brand-300: #6ee7b7    --accent-300: #fcd34d
--brand-400: #34d399    --accent-400: #fbbf24
--brand-500: #10b981    --accent-500: #f59e0b   /* primary + accent */
--brand-600: #059669    --accent-600: #d97706
--brand-700: #047857    --accent-700: #b45309
--brand-800: #065f46    --accent-800: #92400e
--brand-900: #064e3b    --accent-900: #78350f
--brand-950: #022c22    --accent-950: #451a03
```

### Gradient

```css
--brand-gradient: linear-gradient(135deg, #10b981 0%, #f59e0b 100%);
```

### Syntax highlighting

```
keyword: #10b981  |  string: #f59e0b  |  number: #06b6d4
function: #059669 |  comment: #647a6d italic  |  variable: #eef7f1
```

---

## Sunset

Coral and amber. Warm, energetic, human. Use for consumer products, creative tools, or docs with a playful tone.

### Light mode

| Token | Hex |
|---|---|
| `--surface-0` | `#fffcfb` |
| `--surface-1` | `#ffffff` |
| `--surface-2` | `#fdf6f2` |
| `--surface-3` | `#faeae0` |
| `--text-primary` | `#1f0f0a` |
| `--text-secondary` | `#524034` |
| `--text-tertiary` | `#8a725f` |
| `--border-subtle` | `#f5e4d8` |
| `--border-strong` | `#e6c9b3` |

### Dark mode

| Token | Hex |
|---|---|
| `--surface-0` | `#140805` |
| `--surface-1` | `#22110b` |
| `--surface-2` | `#301b13` |
| `--surface-3` | `#42281c` |
| `--text-primary` | `#fff5ee` |
| `--text-secondary` | `#e6b399` |
| `--text-tertiary` | `#8a725f` |
| `--border-subtle` | `#42281c` |
| `--border-strong` | `#5c3826` |

### Brand + accent scales

```
--brand-50:  #fff7ed    --accent-50:  #fff1f2
--brand-100: #ffedd5    --accent-100: #ffe4e6
--brand-200: #fed7aa    --accent-200: #fecdd3
--brand-300: #fdba74    --accent-300: #fda4af
--brand-400: #fb923c    --accent-400: #fb7185
--brand-500: #f97316    --accent-500: #f43f5e   /* primary + accent */
--brand-600: #ea580c    --accent-600: #e11d48
--brand-700: #c2410c    --accent-700: #be123c
--brand-800: #9a3412    --accent-800: #9f1239
--brand-900: #7c2d12    --accent-900: #881337
--brand-950: #431407    --accent-950: #4c0519
```

### Gradient

```css
--brand-gradient: linear-gradient(135deg, #f97316 0%, #f43f5e 100%);
```

### Syntax highlighting

```
keyword: #f97316  |  string: #10b981  |  number: #06b6d4
function: #f43f5e |  comment: #8a725f italic  |  variable: #fff5ee
```

---

## Monochrome

Editorial black and white. Timeless, focused, print-inspired. Use for long-form technical writing, design systems, or reference material where content must dominate.

### Light mode

| Token | Hex |
|---|---|
| `--surface-0` | `#ffffff` |
| `--surface-1` | `#ffffff` |
| `--surface-2` | `#f7f7f8` |
| `--surface-3` | `#efeff1` |
| `--text-primary` | `#0a0a0a` |
| `--text-secondary` | `#4a4a4a` |
| `--text-tertiary` | `#8a8a8a` |
| `--border-subtle` | `#eaeaea` |
| `--border-strong` | `#d0d0d0` |

### Dark mode

| Token | Hex |
|---|---|
| `--surface-0` | `#0a0a0a` |
| `--surface-1` | `#111111` |
| `--surface-2` | `#1a1a1a` |
| `--surface-3` | `#242424` |
| `--text-primary` | `#f5f5f5` |
| `--text-secondary` | `#a0a0a0` |
| `--text-tertiary` | `#6a6a6a` |
| `--border-subtle` | `#242424` |
| `--border-strong` | `#3a3a3a` |

### Brand + accent scales

```
--brand-50:  #f7f7f8    --accent-50:  #faf9f7
--brand-100: #efeff1    --accent-100: #f3f0eb
--brand-200: #d5d5d8    --accent-200: #e5dfd3
--brand-300: #adadb3    --accent-300: #c8beab
--brand-400: #7d7d84    --accent-400: #a89b81
--brand-500: #57575e    --accent-500: #8a7c62
--brand-600: #3d3d43    --accent-600: #6b5f4a
--brand-700: #2a2a2e    --accent-700: #524839
--brand-800: #1a1a1c    --accent-800: #3a3327
--brand-900: #0a0a0a    --accent-900: #241f18   /* primary */
--brand-950: #000000    --accent-950: #12100c
```

### Gradient

```css
--brand-gradient: linear-gradient(135deg, #0a0a0a 0%, #57575e 100%);
```

### Syntax highlighting

```
keyword: #0a0a0a bold  |  string: #4a4a4a  |  number: #6b5f4a
function: #0a0a0a bold |  comment: #8a8a8a italic  |  variable: #0a0a0a
```

### Special rules

- Aurora hero background reduces to a subtle radial gradient using `--surface-2` and `--surface-3` (no colorful blobs)
- Section card hover glow becomes a soft gray shadow instead of colored glow
- Gradient text on headlines becomes a subtle vertical fade from `--text-primary` at 100% to 70% opacity

---

## Custom (user-provided)

If the user picks Custom, they provide two hex codes: `primary` and `accent`. The agent must then:

1. Generate the full 50 → 950 scale from each hex using standard shade math:
   - 500 = the provided hex
   - Lighter shades (50–400): mix with white progressively
   - Darker shades (600–950): mix with black progressively
2. Generate 4 surface tones (0–3):
   - Light mode: near-white with 0.5–3% brand tint
   - Dark mode: near-black with brand-family hue shift
3. Verify contrast ratios:
   - Body text on surface-0 must be ≥ 4.5:1
   - If not, warn the user and offer to darken text or lighten surface
4. Use `linear-gradient(135deg, <primary> 0%, <accent> 100%)` for the brand gradient
