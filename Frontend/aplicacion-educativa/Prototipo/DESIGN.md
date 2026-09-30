---
name: Playful Wonder
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf3'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d5e3fc'
  on-surface: '#0d1c2e'
  on-surface-variant: '#3f4850'
  inverse-surface: '#233144'
  inverse-on-surface: '#eaf1ff'
  outline: '#707881'
  outline-variant: '#bfc7d2'
  surface-tint: '#006398'
  primary: '#006194'
  on-primary: '#ffffff'
  primary-container: '#007bb9'
  on-primary-container: '#fdfcff'
  inverse-primary: '#93ccff'
  secondary: '#795900'
  on-secondary: '#ffffff'
  secondary-container: '#ffc329'
  on-secondary-container: '#6f5100'
  tertiary: '#006949'
  on-tertiary: '#ffffff'
  tertiary-container: '#00855d'
  on-tertiary-container: '#f5fff7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#ffdf9f'
  secondary-fixed-dim: '#f9bd22'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5c4300'
  tertiary-fixed: '#68fcbf'
  tertiary-fixed-dim: '#45dfa4'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#f8f9ff'
  on-background: '#0d1c2e'
  surface-variant: '#d5e3fc'
typography:
  display-hero:
    fontFamily: Quicksand
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: 0.5px
  display-hero-mobile:
    fontFamily: Quicksand
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: 0.25px
  headline-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: 0.25px
  headline-lg-mobile:
    fontFamily: Quicksand
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: 0.2px
  headline-md:
    fontFamily: Quicksand
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: 0.15px
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: 0.15px
  body-md:
    fontFamily: Nunito Sans
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: 0.1px
  label-chunky:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: 0.5px
  caption:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.2px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  touch-min: 3.5rem
  touch-target: 4rem
  gutter-mobile: 1.25rem
  gutter-tablet: 2rem
  stack-xs: 0.5rem
  stack-sm: 0.75rem
  stack-md: 1rem
  stack-lg: 1.5rem
  stack-xl: 2.25rem
  card-padding: 1.5rem
---

## Brand & Style

This design system is crafted for early learners and exploratory kids aged 5 to 11, balancing playful joy with developmental safety and utmost clarity. The design style combines tactile skeuomorphic affordances—chunky physical "pushable" surfaces, thick bottom-lip borders, and soft layered depth—with warm, inviting minimalism. Every element is deliberately oversized, highly responsive, and immediately legible to nurture autonomous learning, reduce cognitive strain, and celebrate micro-achievements with tactile delight.

The emotional atmosphere radiates warmth, safety, curiosity, and encouragement. Interfaces feel like tangible play objects rather than flat digital utilities.

## Colors

The palette is rooted in soft cloud and cream foundations, punctuated by vibrant, juicy accent colors that communicate clear interaction states and rewards.

- **Primary (`#0284C7` / `#38BDF8`)**: Electric Sky Blue. The primary navigational and functional anchor. Represents forward momentum, primary actions, and key discovery paths.
- **Secondary (`#FBBF24` / `#D97706`)**: Sunny Warm Yellow. Highlighting active streaks, energy counters, hints, and interactive highlights.
- **Tertiary (`#34D399` / `#059669`)**: Fresh Leaf Green. Signifies correct answers, progress milestones, completed modules, and affirmative actions.
- **Accent - Juicy Tangerine (`#FB923C` / `#EA580C`)**: Used for urgent alerts, secondary calls-to-action, challenges, and high-energy touchpoints.
- **Accent - Playful Berry (`#A855F7` / `#7E22CE`)**: Reserved exclusively for rewards, mystery boxes, stars, and celebratory achievement badges.
- **Background & Surfaces**: Base canvases use Warm Cloud (`#FDFBF7`) and Soft Cream (`#F8FAFC`). Cards sit on pure white (`#FFFFFF`) with contrasting tinted borders.
- **Neutrals & Text**: Body copy relies on Slate Deep Navy (`#1E293B` and `#475569`) ensuring WCAG AAA legibility against pale cream backgrounds. Never use pure black (`#000000`).

## Typography

Typography prioritizes early literacy and optical comfort. Headings in Quicksand deliver geometric roundness and friendly letterforms, while Nunito Sans provides generous x-heights, open apertures, and distinctive character forms essential for early readers.

- Font weights lean bold (`600` and `700`) to guarantee extreme contrast against tinted and colored buttons.
- Letter spacing is intentionally expanded across all sizes to prevent visual crowding for dyslexic or developing readers.
- Heading sizes scale responsively for handheld devices via dedicated mobile configurations, preventing awkward line wrapping.

## Layout & Spacing

Layouts follow a fluid, child-friendly 4-column structure on mobile and an 8-column layout on tablets, prioritizing vertical flow and thumb-accessible bottom navigation.

- **Touch Safety**: All interactive hit targets enforce a strict minimum size of `56px` (`3.5rem`), scaling up to `64px` (`4rem`) for game inputs and bottom persistent primary triggers.
- **Breathing Room**: Vertical margins are generous, preventing accidental mistaps. Component groupings maintain at least `16px` of spatial detachment.
- **Handheld Margins**: Mobile screens apply a consistent outer gutter of `20px` (`1.25rem`) to ensure thumbs resting on bezel edges never inadvertently trigger actions.

## Elevation & Depth

Visual hierarchy uses physical, tangible tactile layering instead of diffused drop shadows. Elements feel like physical toy blocks or soft rubber badges.

- **Chunky 3D Bottom Lip**: Interactive surfaces rely on solid, non-blurred bottom offsets (e.g., `box-shadow: 0 5px 0 #0369A1` for Primary Blue). When pressed, elements transform downward by `3px` while the bottom lip collapses to `2px`, providing immediate tactile confirmation.
- **Card Float**: Surface cards feature a light `2px` tinted outline (`#E2E8F0`) reinforced by a soft layered elevation (`box-shadow: 0 8px 0 #E2E8F0, 0 12px 24px rgba(15, 23, 42, 0.05)`).
- **Badge Glaze**: Reward containers and high-value status chips include an internal semi-translucent top specular reflection (`inset 0 2px 0 rgba(255, 255, 255, 0.6)`), giving them a collectible, glossy finish.

## Shapes

The shape vocabulary strictly eliminates sharp angles to convey safety, softness, and playfulness.

- **Corner Geometry**: Buttons, interactive chips, and floating navigation pills employ full pill geometry (`9999px` / roundedness level `3`).
- **Surface Geometry**: Modals, large content cards, and exercise containers enforce a minimum border-radius of `24px` up to `32px`.
- **Inner Nesting Rule**: Nested elements within cards maintain concentric radii (`R_inner = R_outer - padding`) to ensure visual harmony without pinching.

## Components

### Buttons
- **Primary Buttons**: Oversized pill shapes (`60px` height) with solid electric sky blue fill, bold white Quicksand label, and an extruding `5px` deep cyan bottom edge (`#0369A1`). Active press translates the button down by `3px` with instant audio/haptic feedback.
- **Secondary Buttons**: Warm cloud background with a thick `3px` solid stroke matching the action tone, plus an extruded bottom border.

### Interactive Choice Cards
- Cards feature a pure white canvas, `28px` corner radiuses, a `2px` stroke, and a `6px` bottom lip.
- Selection states swap the stroke and shadow to Electric Sky Blue or Sunny Yellow, triggering an energetic bounce animation.

### Gamified Progress Bar
- A thick `24px` tall pill-shaped track in soft slate cream with an inner inset shadow.
- The active bar uses vibrant Fresh Leaf Green with a glossy upper highlight and an animated glowing icon anchored to the leading edge.

### Reward Badges & Star Counters
- Circular or pill-shaped containers featuring Playful Berry or Sunny Yellow gradients, glazed with an inner white rim.
- Numbers are displayed in bold Quicksand numerals with thick contrasting outlines for instant recognition.

### Input Fields & Selectors
- Chunky `56px` minimum height containers with `24px` rounded corners, soft pastel backgrounds, and oversized, high-contrast placeholder typography.