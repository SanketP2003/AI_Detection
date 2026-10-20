# AI Verify — Design Baseline Specification & Visual Audit Gate

This document records the design baseline per **SAAS_CONVERSION_PROMPT.md §2.7** and **Task A2**.

## 1. Capture Methodology & Commands

Baseline screenshots were captured in headless Chrome across all 9 canonical routes at 3 standard viewports:
- **Desktop (1440px)**: 1440 × 900
- **Tablet (1024px)**: 1024 × 768
- **Mobile (390px)**: 390 × 844

### Command Used:
```powershell
$routes = @('/', '/signin', '/dashboard', '/detection', '/history', '/reports', '/advisor', '/how-it-works', '/settings')
$widths = @(
    @{ w = 1440; h = 900; name = "1440" },
    @{ w = 1024; h = 768; name = "1024" },
    @{ w = 390; h = 844; name = "390" }
)
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$outDir = "docs\design-baseline"

foreach ($r in $routes) {
    $slug = if ($r -eq '/') { 'landing' } else { $r.TrimStart('/') }
    foreach ($v in $widths) {
        $outFile = "$outDir\$slug-$($v.name).png"
        $url = "http://localhost:3000$r"
        Start-Process -FilePath $chrome -ArgumentList "--headless=new", "--disable-gpu", "--virtual-time-budget=4000", "--window-size=$($v.w),$($v.h)", "--screenshot=$outFile", $url -Wait
    }
}
```

Screenshots are saved locally in `docs/design-baseline/*.png` and excluded from git tracking via `.gitignore`.

---

## 2. Locked Computed Styles & Typography Tokens

### Typography Specifications
- **Body Text**:
  - `font-family`: `"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  - `font-size`: `14px`
  - `line-height`: `1.6`
  - `color`: `var(--ink)` (`#20241f` light / `#f1f3ed` dark)
  - `background`: `var(--bg)` (`#f5f5f0` light / `#161916` dark)

- **Marketing Hero Heading (`.hero-copy h1`)**:
  - `font-family`: `"Manrope", sans-serif`
  - `font-weight`: `700`
  - `font-size`: `56px` (`42px` ≤ 900px, `32px` ≤ 600px)
  - `line-height`: `1.12`
  - `letter-spacing`: `-0.035em`
  - `color`: `var(--ink)`

- **Workspace Page Heading (`.page-title h1`)**:
  - `font-family`: `"Manrope", sans-serif`
  - `font-weight`: `600`
  - `font-size`: `34px` (`28px` ≤ 600px)
  - `line-height`: `1.2`
  - `letter-spacing`: `-0.035em`
  - `color`: `var(--ink)`

- **Section Subheadings (`.font-display`)**:
  - `font-family`: `"Sora", sans-serif`
  - `font-weight`: `600` or `700`
  - `font-size`: `18px – 22px`
  - `line-height`: `1.25`

- **Tabular Numerals & Monospace (`.font-mono`)**:
  - `font-family`: `"JetBrains Mono", monospace`
  - `font-size`: `11px – 12px`

---

## 3. Component & Surface Recipes

- **Primary Button (`.button.primary`)**:
  - `background-color`: `var(--green)` (`#174d3b` light / `#86b99a` dark)
  - `color`: `#ffffff` (light) / `#161916` (dark)
  - `border-radius`: `var(--radius-sm)` (`8px`)
  - `font-size`: `12px`
  - `font-weight`: `700`

- **Secondary Button (`.button.secondary`)**:
  - `background-color`: `var(--surface)` (`#ffffff` light / `#1e221f` dark)
  - `border`: `1px solid var(--line)` (`#dcded7` light / `#343a35` dark)
  - `color`: `var(--ink)`
  - `border-radius`: `8px`
  - `font-size`: `12px`
  - `font-weight`: `600`

- **Card (`.glass-card`)**:
  - `background`: `var(--surface)` (`#ffffff` light / `#1e221f` dark)
  - `border`: `1px solid var(--line)` (`#dcded7` light / `#343a35` dark)
  - `border-radius`: `var(--radius-md)` (`14px`)
  - `box-shadow`: `var(--shadow-card)` (`0 8px 32px rgba(25, 38, 31, 0.06)` light / `0 8px 32px rgba(0, 0, 0, 0.3)` dark)

- **Panel Container (`.glass-panel`)**:
  - `border-radius`: `var(--radius-lg)` (`20px`)
  - `border`: `1px solid var(--line)`

---

## 4. Visual Regression Gate Rules

Per §2.7:
1. No font, spacing, radius, or color drift allowed on existing surfaces.
2. No cumulative layout shift (CLS).
3. All new surfaces (pricing, billing, admin, legal) must strictly adhere to this baseline token contract.
