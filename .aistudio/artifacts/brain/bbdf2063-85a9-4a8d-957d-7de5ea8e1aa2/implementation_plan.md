# iPadOS-Style Magnetic Cursor & Magnify Snap for Hamdan

An authentic reproduction of the iPadOS trackpad pointer experience with magnetic attraction, morphing geometry, and unified target displacement, applied exclusively to the `hamdan` title wordmark.

### User Review & Critical Decisions

> [!IMPORTANT]
> Key constraints confirmed by the user:

- **Target Scope Exclusivity**:
  - The magnetic snap and magnify effect applies **only** to the primary `hamdan` header text (and its active `Coming soon` header counterpart).
  - All navigation links (`[ docs ]`, `[ mail ]`, `[ blog ]`, `[ books ]`, `[ GitHub ]`, `[ youtube ]`, `[ Ayah detect ]`) remain standard, clean, and non-magnetic.
- **Physical Dynamics & Motion Feel**:
  - **Free State**: Over empty canvas, the cursor is a minimal, smooth 12px translucent dark dot gliding with spring physics.
  - **Magnetic Horizon**: When the pointer enters the proximity threshold (~80px from the `hamdan` wordmark), an invisible magnetic field pulls the cursor toward the title.
  - **Snap & Morph State**: On direct hover, the cursor morphs from a circle into a soft rounded pill enclosing the `hamdan` text, stretching and shifting slightly as the mouse moves within the text boundary.
  - **Unified Target Reactivity**: The `hamdan` text itself magnetically displaces by a proportional dampening factor (`~0.2x` mouse delta) with spring elasticity, making text and pointer feel like one unified physical object.
  - **Click / Press Feedback (`whilePress`)**: Pressing squashes the snapped cursor and wordmark slightly (`scale 0.96`), springing back on release and triggering the re-scramble wave.
  - **Pointer Capability Check**: Only activates on desktop/pointer environments (`@media (pointer: fine)`), cleanly disabling on touchscreens without interfering with mobile taps.

---

### 1. Overview & Core Concept

- **What It Does**: Emulates the fluid, organic iPadOS trackpad pointer. The cursor floats freely as a minimal dot, but as it nears the central `hamdan` wordmark, it is magnetically captured, expanding and morphing to enclose the wordmark while the text itself stretches and pulls towards the mouse before smoothly releasing.
- **Why It Matters**: Adds a high-craft, playful physical micro-interaction to the personal branding focal point while preserving complete minimalist restraint across the rest of the page.

---

### 2. User Experience & Visual Design

- **State Transitions**:
  1. **Gliding (Free Space)**: Small 12px circular dot (`bg-zinc-800/30 backdrop-blur-xs`) following the pointer smoothly via spring physics.
  2. **Magnetic Field (Within ~80px)**: Proximity detection accelerates the cursor towards the wordmark's center point, dampening free drift.
  3. **Snapped (Hover)**: Cursor geometry smoothly animates (width, height, border-radius) to encapsulate the bounding box of `hamdan` with generous 12px padding, morphing into a subtle translucent rounded pill (`bg-zinc-900/10 dark:bg-zinc-100/10`).
  4. **Magnetic Drag**: Moving the mouse inside the snapped zone causes the cursor and the `hamdan` letters to rubberband and stretch toward the mouse with dampening (`dx * 0.18`, `dy * 0.18`).
  5. **Click / Press**: Interactive squash (`scale: 0.96`) and re-scramble trigger.
  6. **Release**: Moving outside the magnetic threshold releases the cursor with spring easing, snapping back to the 12px circular dot.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Scoped to Header Wordmark Only**:
  - *Chosen Approach*: Specifically bind magnetic capture solely to the `hamdan` header ref.
  - *Why*: Directly aligns with user specification ("this shouldt be for any of the links this effect should only be when the user is hovering over the Hamdan text at the top"), preserving clean navigation ergonomics.
- **Decision 2: Motion Springs for Physical Authenticity**:
  - *Chosen Approach*: Use spring-based interpolation (`stiffness: 350, damping: 28`) for cursor position, size morphing, and text displacement.
  - *Why*: Linear or fixed-time easing feels synthetic; spring physics replicate the organic, elastic feel of iPadOS pointers.

---

### 4. Technical Architecture & Component Structure

```
┌───────────────────────────────────────────────────────────────┐
│                           App.tsx                             │
│                                                               │
│   ┌───────────────────────────────────────────────────────┐   │
│   │               MagneticCursor (Overlay)                │   │
│   │   - Tracks mouse position via pointermove             │   │
│   │   - Bounding client rect calculation of #hamdan-title │   │
│   │   - Proximity field (~80px threshold)                 │   │
│   │   - Spring morph: Circle (12px) <──> Pill (W × H)     │   │
│   └───────────────────────────────────────────────────────┘   │
│                               │                               │
│                               ▼                               │
│   ┌───────────────────────────────────────────────────────┐   │
│   │               #hamdan-title (Header Ref)              │   │
│   │   - Displaced by magnetic spring (tx, ty)             │   │
│   │   - whilePress scale squash                           │   │
│   │   - Retains text-scramble and click-to-scramble       │   │
│   └───────────────────────────────────────────────────────┘   │
│                                                               │
│   ┌───────────────────────────────────────────────────────┐   │
│   │                  Bracketed Links                      │   │
│   │   - Clean, standard hover states (non-magnetic)       │   │
│   └───────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

- **Clean DOM & Pointer Events**:
  - The custom cursor layer has `pointer-events-none` so all native clicks, links, and keyboard navigation pass through unobstructed.
