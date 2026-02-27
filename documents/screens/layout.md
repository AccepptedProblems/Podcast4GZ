---
openspec: 0.1.0
kind: screen
metadata:
  name: App Layout
  description: Root layout shell with Header, optional Sidebar, and Footer. Provides navigation, theming, and responsive structure for all pages.
  status: planned
  phase: 1
  route: "*"
  file: src/app/layout.tsx
  updated: 2026-02-27
dependencies:
  packages:
    - next-themes
    - next/font/google (Inter)
    - lucide-react
  components:
    - "@/components/layout/Header"
    - "@/components/layout/Footer"
    - "@/components/layout/MobileNav"
    - "@/components/layout/Sidebar"
    - "@/components/ui/button"
    - "@/components/ui/sheet"
    - "@/components/ui/dropdown-menu"
---

# App Layout

## Overview

The root layout wraps every page in PodcastW4GZ. It renders a persistent Header with navigation, an optional collapsible Sidebar (desktop only), a `<main>` content area, and a Footer. Theming (dark/light) is managed by `next-themes` with system preference detection. The font stack uses Inter loaded via `next/font/google`.

---

## Wireframe

### Desktop (>= 1024px)

```
+------------------------------------------------------------------+
| [Logo: PodcastW4GZ]   Home  Search  Directory  Compare  Analytics|
|                                                 [Cmd+K]  [Theme] |
+------------------------------------------------------------------+
|          |                                                        |
| Sidebar  |                    <main>                              |
| (opt.)   |              Page content here                         |
|          |                                                        |
|          |                                                        |
|          |                                                        |
|          |                                                        |
+------------------------------------------------------------------+
| Footer: Built by W4GZ Team  |  GitHub  |  Spotify API  |  2026  |
+------------------------------------------------------------------+
```

### Tablet (768px - 1023px)

```
+------------------------------------------+
| [Logo]  Home Search Directory ...  [Theme]|
+------------------------------------------+
|                                          |
|              <main>                      |
|         Page content here                |
|                                          |
+------------------------------------------+
| Footer (stacked)                         |
+------------------------------------------+
```

### Mobile (< 768px)

```
+-------------------------------+
| [Logo: PW4GZ]   [Search] [=] |
+-------------------------------+
|                               |
|          <main>               |
|     Page content here         |
|                               |
+-------------------------------+
| Footer (minimal, stacked)    |
+-------------------------------+

Hamburger menu opens Sheet overlay:
+-------------------------------+
|  [X Close]                    |
|                               |
|  Home                         |
|  Search                       |
|  Directory                    |
|  Compare                      |
|  Analytics                    |
|                               |
|  ----                         |
|  Theme: [Light] [Dark] [Sys] |
|  GitHub                       |
+-------------------------------+
```

---

## Component Tree

```
RootLayout (src/app/layout.tsx)
├── <html lang="vi">
│   ├── Inter font class
│   └── <body>
│       └── ThemeProvider (next-themes)
│           ├── Header (src/components/layout/Header.tsx)
│           │   ├── Logo (link to /)
│           │   ├── DesktopNav
│           │   │   ├── NavLink "Home" -> /
│           │   │   ├── NavLink "Search" -> /search
│           │   │   ├── NavLink "Directory" -> /directory
│           │   │   ├── NavLink "Compare" -> /compare
│           │   │   └── NavLink "Analytics" -> /analytics
│           │   ├── SearchShortcut (Cmd+K / Ctrl+K badge)
│           │   ├── ThemeToggle (dropdown: Light, Dark, System)
│           │   └── MobileNav (visible < 768px)
│           │       ├── SearchIconButton -> /search
│           │       └── HamburgerButton -> opens Sheet
│           │           └── Sheet (shadcn/ui)
│           │               ├── NavLink items
│           │               ├── Separator
│           │               ├── ThemeSelector
│           │               └── GitHubLink
│           ├── <main className="flex-1">
│           │   └── {children}  ← page content
│           └── Footer (src/components/layout/Footer.tsx)
│               ├── Credits "Built by W4GZ Team"
│               ├── GitHubLink (icon + text)
│               ├── SpotifyAttribution "Powered by Spotify Web API"
│               └── Copyright year
```

---

## Data Requirements

| Data            | Source         | Notes                                    |
|-----------------|----------------|------------------------------------------|
| Current route   | `usePathname()` | Highlight active nav link               |
| Theme           | `next-themes`  | Persisted in localStorage                |
| Search shortcut | Client-side    | Keyboard listener for Cmd+K / Ctrl+K    |

No server-side data fetching is required for the layout itself.

---

## User Interactions

| Interaction                  | Behavior                                                    |
|------------------------------|-------------------------------------------------------------|
| Click nav link               | Client-side navigation via `next/link`                      |
| Click logo                   | Navigate to `/`                                             |
| Press Cmd+K / Ctrl+K        | Focus search bar on current page or navigate to `/search`   |
| Click theme toggle           | Opens dropdown with Light / Dark / System options            |
| Select theme                 | Applies theme class to `<html>`, persists to localStorage   |
| Click hamburger (mobile)     | Opens Sheet overlay with full navigation                     |
| Click X or outside Sheet     | Closes mobile navigation                                     |
| Click nav link in Sheet      | Navigates and closes Sheet                                   |
| Click GitHub link (footer)   | Opens repository in new tab                                  |

---

## Responsive Behavior

| Breakpoint         | Behavior                                                         |
|--------------------|------------------------------------------------------------------|
| `>= 1024px` (lg)  | Full horizontal nav in Header. Optional Sidebar visible.         |
| `768-1023px` (md)  | Horizontal nav (may truncate labels to icons). No Sidebar.       |
| `< 768px` (sm)     | Logo + search icon + hamburger only. Nav in Sheet overlay.       |

### Layout CSS Strategy

```
body          -> min-h-screen flex flex-col
Header        -> sticky top-0 z-50 border-b bg-background/95 backdrop-blur
main          -> flex-1 container mx-auto px-4 py-6
Footer        -> border-t py-6 text-sm text-muted-foreground
```

---

## Theme Configuration

```typescript
// next-themes setup in layout.tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
```

Supported themes: `light`, `dark`, `system`.

Dark mode uses Tailwind `dark:` variant classes throughout the application.

---

## Font Configuration

```typescript
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
})
```

The `vietnamese` subset is included to support proper rendering of Vietnamese diacritics.

---

## Accessibility

- All nav links have descriptive labels
- Keyboard navigation supported (Tab, Enter, Escape for Sheet)
- Search shortcut announced via `aria-keyshortcuts`
- Theme toggle has `aria-label="Toggle theme"`
- Mobile Sheet uses `role="dialog"` with focus trap
- Skip-to-content link as first focusable element
