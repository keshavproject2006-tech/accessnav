---
name: Studio Minimalist
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#4c4546'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e1dfdf'
  on-secondary-container: '#636262'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1a1c1c'
  on-tertiary-container: '#838484'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#e4e2e2'
  secondary-fixed-dim: '#c7c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-micro:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.1em
spacing:
  edge-margin: 40px
  section-gap: 160px
  element-gap: 12px
  row-padding: 4px
  container-max: 1800px
---

## Brand & Style

This design system embodies a high-end, editorial aesthetic centered on **Minimalism** and precision. It is tailored for creative agencies, fashion portfolios, and luxury brand showcases where the content (imagery) must remain the focal point. 

The personality is intellectual, confident, and "quietly loud"—achieving impact through extreme whitespace, stark contrast, and sophisticated typographic rhythm. It draws inspiration from Swiss Modernism, utilizing a strict grid and a monochromatic palette to create a digital environment that feels like a premium printed monograph.

The UI stays out of the way, appearing only as functional scaffolding for visual storytelling. Interaction is subtle, relying on elegant transitions and state changes (opacity shifts and color fades) rather than heavy decorative elements.

## Colors

The color strategy is strictly monochromatic, prioritizing clarity and high contrast.

- **Primary & Background:** A pure white (`#FFFFFF`) background provides the "canvas." Typography and key structural elements use solid black (`#000000`).
- **Secondary / Metadata:** A neutral grey (`#5E5E5E`) is reserved for supporting information, column headers, and non-active states to establish a clear visual hierarchy.
- **Accents:** There are no decorative accent colors. Visual interest is introduced exclusively through the photography displayed within the interface or via hover-triggered image previews.
- **Interactive States:** Use opacity transitions (e.g., 70% opacity on hover) or color shifts from grey to black to indicate interactivity without introducing new hues.

## Typography

The system uses **Inter** exclusively, relying on weight, scale, and letter-spacing to create variety.

- **Display Hierarchy:** Large headings utilize tight negative letter-spacing (-0.04em) and semi-bold weights to feel like "objects" on the page.
- **The "List" Aesthetic:** Tables and list views use a medium-sized body font (18px) for readability, balanced by small uppercase labels (12px) for structural headers.
- **Functional Labels:** Navigation and utility links use uppercase 12px or 10px type with increased letter-spacing to evoke a modern, architectural feel.
- **Hierarchy through Weight:** Use `FontWeight: 600` for branding and primary headers, while using `FontWeight: 400` for content and `500` for UI labels.

## Layout & Spacing

The layout follows a **Fixed Grid** model with generous, intentional whitespace that defines the "luxury" feel.

- **Main Container:** Centered layout with a maximum width of 1800px.
- **Rhythm:** Large vertical gaps (160px) separate major structural sections (e.g., Nav to Main Content), while tight spacing (4px to 12px) is used within data groups to maintain proximity.
- **The "Edge" Margin:** Content should respect a minimum 40px padding from the screen edges on large displays, though 10px is used for internal container gutters.
- **Lists & Tables:** Project lists utilize a 4-column grid for alignment across Project Name, Client, Industry, and Year. Data is consistently aligned to the left, with the final column (Year) right-aligned to anchor the grid.

## Elevation & Depth

This is a strictly **Flat** design system. 

- **Depth through Interaction:** Depth is not conveyed via Z-index or shadows, but through dynamic overlays. Specifically, the "Hover Preview" pattern—where an image follows the cursor—creates a layer of ephemeral depth without cluttering the base layout.
- **Transparency:** The hover container uses a 300ms opacity fade to transition from 0 to 100, providing a smooth "glass-like" appearance to the content being surfaced.
- **Borders:** Structural separation is achieved via whitespace or very thin, low-contrast `outline-variant` lines (1px) rather than shadows.

## Shapes

The shape language is primarily **Sharp (0px)** to maintain the editorial/architectural look.

- **Corners:** Containers and buttons utilize 90-degree corners.
- **Images:** Project previews and hover images should be sharp-edged.
- **Exception:** Small utility chips or toggle indicators may use a subtle `0.25rem` (Soft) radius to differentiate functional UI from structural layout, but 0px remains the system default.

## Components

### Buttons & Links
- **Text Buttons:** Primary navigation consists of uppercase text with a 70% opacity hover state. No backgrounds or borders.
- **Action Links:** Include a small trailing icon (e.g., 14px arrow) to indicate external or forward movement.

### Lists (Project Rows)
- **Structure:** Rows have a height determined by the 18px body text plus 4px vertical padding. 
- **Hover State:** Entire row changes text color from `secondary` (grey) to `on-surface` (black). 
- **Cursor Tracking:** The "Floating Preview" component is a 240px wide, 3:4 aspect ratio container that tracks the cursor position precisely during row hovers.

### Navigation
- **Top Bar:** Fixed-height, minimal branding on the left, centered primary links, and a call-to-action on the far right.
- **Footer:** Ultra-minimal micro-type (10px) tracking-heavy text, aligned to the bottom edges of the grid.

### Toggles
- **Grid/List Toggle:** Text-based switch using a vertical pipe (`|`) separator. The active state is indicated by the transition from grey to black.