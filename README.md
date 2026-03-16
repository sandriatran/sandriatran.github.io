# sandriatran.com

A single-page portfolio built with modern web technologies, designed around an ethereal glassmorphic aesthetic with full light/dark theme support.

## Stack

- **Framework:** [Astro 6](https://astro.build/) with static output and islands architecture
- **UI:** [React 19](https://react.dev/) for interactive components (project cards, navigation, lightbox, kinetic grid)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) via Vite plugin, augmented with custom CSS variables for theming
- **Animation:** [Framer Motion](https://motion.dev/) for spring-based transitions, CSS keyframes for ambient effects
- **Typography:** Cal Sans (display), Lexend Deca (body), Montserrat (UI accents), Cormorant Garamond (editorial)
- **Deployment:** GitHub Pages via GitHub Actions (Node 22, automatic on push to `main`)

## Architecture

```
src/
  components/    # Astro (.astro) + React (.tsx) islands
  data/          # Project metadata (projects.ts)
  layouts/       # Base HTML shell with theme init, meta, fonts
  pages/         # Single index.astro composing all sections
  styles/        # global.css (theme variables) + animations.css (keyframes)
public/
  fonts/         # Self-hosted Cal Sans TTF
  images/        # Gastronomy, memories, project hero images
```

**Hydration strategy:** Navigation, lightbox, cursor, and kinetic grid hydrate on load (`client:load`). Project cards hydrate on scroll into view (`client:visible`). All other sections are zero-JS static HTML.

## Design System

**Theme:** CSS custom properties define a complete light/dark palette — pastel lavender/pink/cream in light mode, deep midnight blues with boosted contrast in dark mode. Theme persists via `localStorage` and respects `prefers-color-scheme`.

**Glassmorphism:** Layered `backdrop-filter: blur()` with semi-transparent surfaces, used across navigation, project cards, keyboard shortcuts tray, and the N-Back game overlay.

**Bokeh atmosphere:** Six animated CSS gradient orbs with staggered `ease-in-out` keyframes create a floating light effect. In dark mode, `mix-blend-mode` switches from `screen` to `normal` for visibility.

**Responsive navigation:** Desktop shows a centered pill bar with expand/collapse on scroll direction. Mobile renders a bottom pill tab bar with horizontally scrollable sections and a pinned theme toggle.

## Features

- Keyboard shortcuts (`H` `A` `P` `G` `M` `D` `S` `L` `?`) with bottom tray overlay
- Custom cursor (toggle with `L`) with lerp-smoothed ring + dot tracking
- Interactive spotlight mode (`S`) highlighting research terms in the About section
- Canvas-based kinetic point grid responding to mouse position
- Image lightbox with Framer Motion entrance animations
- Masonry photo grids with `IntersectionObserver`-triggered reveal animations
- Project drawer (slide-over panel) with spring transitions
- Hidden N-Back cognitive game (`E`) with Web Speech API audio
- Full `prefers-reduced-motion` support
- WCAG AA contrast ratios in both themes

## Development

```bash
npm install
npm run dev      # localhost:4321
npm run build    # static output to dist/
```

Requires Node.js 22+.
