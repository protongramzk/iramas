---
name: Lumina Flux
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#b9ccb5'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#849581'
  outline-variant: '#3b4b3a'
  surface-tint: '#00e55b'
  primary: '#edffe8'
  on-primary: '#003911'
  primary-container: '#00ff66'
  on-primary-container: '#007128'
  inverse-primary: '#006e27'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#fcf9f9'
  on-tertiary: '#303030'
  tertiary-container: '#dfdddc'
  on-tertiary-container: '#626161'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6bff83'
  primary-fixed-dim: '#00e55b'
  on-primary-fixed: '#002107'
  on-primary-fixed-variant: '#00531b'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e4e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#474746'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system moves away from harsh industrial aesthetics toward a **Modern Fluent** experience. It targets high-end consumers and tech-savvy users who appreciate precision without the friction of "hacker" aesthetics. 

The visual language blends **Minimalism** with **Glassmorphism**. It utilizes deep tonal layering and subtle translucency to create a sense of organized complexity. The interface should feel like a premium physical device—cool to the touch, responsive, and effortlessly sophisticated. The signature neon green is no longer a primary structural element but a focused beacon for high-priority actions and status indicators.

## Colors

The palette is built on a foundation of deep, layered neutrals to establish a professional "Pro App" atmosphere.

- **Primary (#00FF66):** Reserved for core calls-to-action, success states, and active indicators. It should be used sparingly to maintain its visual impact.
- **Surface Tiers:**
    - `Base`: #0F0F0F (The deepest layer).
    - `Container`: #1A1A1A (Standard cards and modules).
    - `Elevated`: #262626 (Popovers and floating menus).
- **Accents:** Use low-opacity versions of the primary color (10-15%) for hover states and subtle highlights rather than solid blocks of color.

## Typography

This design system exclusively utilizes **Inter** to achieve a systematic, neutral, and highly legible interface. 

- **Weight Strategy:** Use `SemiBold` (600) and `Bold` (700) for headlines to create clear hierarchy against the dark background. 
- **Readability:** Body text should maintain a `Regular` (400) weight. Avoid pure white (#FFFFFF) for long-form text; use a high-contrast grey (#E4E4E7) to reduce eye strain.
- **Labels:** Small labels and captions should use slightly increased letter-spacing to ensure clarity at diminished scales.

## Layout & Spacing

The layout follows a **fluid grid** model with a consistent 4px baseline rhythm. 

- **Desktop:** 12-column grid with 24px gutters. Use wide margins (40px+) to allow the content to breathe, emphasizing the premium nature of the app.
- **Mobile:** 4-column grid with 16px margins. 
- **Logic:** Spacing between related elements (labels and inputs) should use `stack-sm`. Spacing between distinct sections within a card should use `stack-md`. Major page sections use `stack-lg`.

## Elevation & Depth

Depth is communicated through **Tonal Layers** and **Subtle Shadows**, moving away from the flat, bordered look of brutalism.

- **Shadows:** Use large, highly diffused shadows (e.g., `blur: 30px`, `y: 10px`) with very low opacity (15-20% black) to lift containers off the base surface.
- **Glassmorphism:** For top navigation bars and modals, apply a `backdrop-filter: blur(12px)` with a semi-transparent fill (#1A1A1A at 80% opacity).
- **Separators:** Replace heavy borders with 1px hairlines using a low-contrast color (#333333) or omit them entirely in favor of whitespace.

## Shapes

The shape language is defined by **modern roundness**. 

- **Standard Elements:** Buttons, input fields, and small chips use a 0.5rem (8px) radius.
- **Containers:** Cards and modals use a 1rem (16px) radius to create a softer, more approachable frame for content.
- **Active States:** Subtle "inner glows" (1px inside stroke) can be used on active primary buttons to enhance the premium feel.

## Components

- **Buttons:** Primary buttons use the Electric Neon Green with black text for maximum legibility. Secondary buttons use a dark grey ghost style with white text.
- **Inputs:** Fields should have a subtle #262626 background with no border in their rest state. On focus, apply a 1px solid Primary Green border and a faint outer glow.
- **Chips:** Small, pill-shaped indicators. For status, use a small dot of color next to the text rather than coloring the entire background of the chip.
- **Cards:** Use the `Container` color (#1A1A1A) with a very subtle 1px border (#333333). Ensure internal padding is generous (24px).
- **Progress Indicators:** Use the Primary Green for the active track, but use a deep grey for the background track to keep the look sophisticated.