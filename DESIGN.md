# Design System: Frota KLIN Premium Command Center
**Project Concept:** Midnight Canvas / NASA Style

## 1. Visual Theme & Atmosphere
The atmosphere is "Technical, Dense, yet Airy." It mimics a state-of-the-art telematics command center (NASA control room logic). It relies heavily on deep dark backgrounds intersected by crisp, neon-like accents to highlight critical data. The use of "Deep Glassmorphism" provides depth without clutter. The interface feels highly responsive, professional, and built for uninterrupted operations.

## 2. Color Palette & Roles
* **Deep Space Base (Backgrounds):** `bg-[#0B0F19]` / `bg-slate-900` - Used as the absolute background canvas.
* **Surface Glass (Cards & Containers):** `bg-white/5` to `bg-slate-800/80` (with backdrop-blur). Used for modular panels and cards.
* **Frost Border (Borders):** `border-white/10` to `border-slate-700/50`. Used to delineate surfaces invisibly but crisply.
* **Primary Emerald (Accent):** `emerald-500` (#10b981) - Used for primary actions, system 'OK' statuses, and buttons.
* **Sky Blue (Secondary Accent):** `sky-500` (#0ea5e9) - Used for information density markers and analytical totals.
* **Stark Text (Primary Typography):** `text-slate-200` (#e2e8f0) - Used for main body and titles.
* **Muted Tech (Secondary Typography):** `text-slate-400` (#94a3b8) - Used for labels, uppercase indicators, and secondary data.

## 3. Typography Rules
* **Numbers & Telemetry:** Exclusively `font-mono` (e.g., Fira Code, JetBrains Mono, or system mono). Used for all KMs, IDs, and financial metrics.
* **Labels:** `uppercase tracking-widest text-[10px]` or `text-xs`. This "micro-label" approach mimics aviation interfaces.
* **Body:** Inter / Roboto standard sans.

## 4. Component Stylings
* **Buttons:** 
  * Shape: `rounded-xl` for standard buttons, pill-shaped for special callouts.
  * Transitions: `transition-all duration-200 ease-out`.
  * Interaction: Color changes and shadow glow on hover. *NO `scale` layout shifting.*
* **Cards/Containers:** 
  * Geometry: Subtly rounded corners (`rounded-2xl`).
  * Elevation: Outer space is flat, but cards hover slightly above it with `shadow-lg shadow-black/40` and `border-white/10`.
  * Interactive Cards: Should not physically jump, but their borders and shadows should illuminate.
* **Badges:**
  * Shape: `rounded-md`, tight horizontal padding.
  * Style: 15% opacity background with 100% opacity text of the same hue, surrounded by a 20% opacity border to mimic "glowing LEDs."

## 5. Layout Principles
* **Grid:** Asymmetric layouts focusing on side navigation vs dense center stages.
* **Spacing:** 16px/24px (gap-4/gap-6) macro spacing; 4px/8px (gap-1/gap-2) micro spacing.
* **Z-Index:** Clear stack: Background (0) -> Cards (10) -> Floating Nav (20) -> Modals/Dropdowns (50).
