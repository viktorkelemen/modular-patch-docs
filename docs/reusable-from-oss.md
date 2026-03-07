# Reusable Patterns from Open-Source Projects

Research date: March 2026

---

## 1. Patch Library (github.com/zwippie/patch-library)

**Stack:** Vanilla JS, HTML5 Canvas, Webpack 4, no runtime deps. Backend (not in repo) handles persistence.

### What we can reuse

**Cable rendering — quadratic Bezier with gravity sag:**
```js
ctx.moveTo(from.x, from.y);
const dx = Math.abs(from.x - to.x);
const cx = Math.min(from.x, to.x) + (dx / 2);  // midpoint X
const cy = Math.max(from.y, to.y) + 160;         // sag below lowest point
ctx.quadraticCurveTo(cx, cy, to.x, to.y);
```
Simple, effective droop. We could adapt this for SVG path `Q` commands.

**Knob rotation model:**
- Knob values stored as degrees (0 to `limit`, typically 300°)
- Mouse-Y drag maps to rotation: `value += (prevY - currentY) * 2`
- Clamped to `[0, limit]`
- Rendered by rotating the knob image

This is the standard DAW convention and worth adopting when we add knob tracking.

**Cable color cycling:** Fixed palette, round-robin assignment — same approach we already use.

**Duplicate cable = delete:** Creating the same connection again removes it. Simple toggle UX worth considering.

**Touch event forwarding:** Maps touch events to synthetic MouseEvents for mobile support.

**JSON patch format:**
```json
{
  "connections": [{"from": 0, "to": 36, "color": "#ff3366"}],
  "knobValues": [150, 150, 0],
  "buttonValues": [false, true],
  "toggleValues": [0, 1]
}
```
Compact but uses integer indices (fragile across module versions). Our string-based jack IDs are better for portability.

### What NOT to reuse
- Canvas-only rendering — bad for accessibility, harder to build UI on top of
- Integer-indexed jacks — fragile; our string IDs are better
- No undo/redo, no client-side persistence — we're already ahead here
- Manual pixel coordinate entry for jacks — we already have a jack editor

### Key insight
Their biggest pain point is manual coordinate entry for new modules. Our jack editor directly solves this. Their codebase validates that a lightweight, dependency-free approach works for this domain.

---

## 2. Patchbook (github.com/SpektroAudio/Patchbook)

**Stack:** Python parser (~370 lines), MIT license, abandoned since 2019 but stable spec (v1.2).

### What we can reuse

**Signal type taxonomy — 6 connection types:**

| Operator | Type | GraphViz style |
|----------|------|---------------|
| `>>` | CV | gray solid |
| `->` | Audio | bold solid |
| `p>` | Pitch (1V/oct) | blue solid |
| `g>` | Gate | red dashed |
| `t>` | Trigger | orange dashed |
| `c>` | Clock | purple dashed |

Our current `JackType` has: `audio-out`, `cv-in`, `gate-out`, `gate-in`, `trigger-out`, `trigger-in`. We're missing **pitch** and **clock** as distinct types. Worth adding.

**Human-readable text export format:**
```
VOICE 1:
- Maths (Ch 1 Out) >> DPO (A 1V/Oct)
- DPO (Final) -> QPAS (In L)

* DPO:
| Harmonics = 30%
| FM Bus = 50%
```
We could generate this from our patch state for sharing on forums, Reddit, etc. Simple to implement.

**JSON output structure (module-centric):**
```json
{
  "modules": {
    "maths": {
      "parameters": {"rise": "50%", "fall": "30%"},
      "connections": {
        "out": {"ch 1": [{"input_module": "dpo", "input_port": "a 1v/oct", "connection_type": "cv"}]},
        "in": {"trig 1": {"output_module": "sequencer", "output_port": "gate 1", "connection_type": "gate"}}
      }
    }
  }
}
```
Good reference for an interchange format. Fix: inputs should be arrays too (mults are common).

**GraphViz flowchart generation:** DOT language output that renders signal flow diagrams. We could offer a "signal flow" view using a JS GraphViz renderer (e.g., `@viz-js/viz`).

### Implementation plan for Patchbook export
A JS function to convert our `PatchState` to Patchbook format:
1. Group cables by source module
2. Map our `JackType` to Patchbook operators
3. Output text with module names and jack labels
4. Optionally include knob values as `* Module:` parameter blocks

---

## 3. VCV Rack Patch Format

**Stack:** C++, open source (GPLv3), `.vcv` files are Zstandard-compressed tar containing `patch.json`.

### What we can reuse

**Cable schema — validates our approach:**
```json
{
  "id": 1183,
  "outputModuleId": 2748,
  "outputId": 1,
  "inputModuleId": 1362,
  "inputId": 3,
  "color": "#d50bd5"
}
```
Nearly identical to our `Cable` type. Good validation that our data model is on the right track.

**Plugin manifest — module categorization tags:**
```json
{
  "slug": "VCO",
  "name": "VCO-1",
  "tags": ["Oscillator", "Polyphonic"],
  "description": "...",
  "manualUrl": "...",
  "modularGridUrl": "..."
}
```
We should add `tags` and `category` to our `ModuleTemplate` for filtering/search as the library grows.

**Module slug pattern:** URL-safe identifiers (`make-noise-dpo`) rather than display names. We already do this with our template IDs.

---

## 4. PATCH & TWEAK Symbols

**Format:** SVG (77 KB) + PNG (758 KB), Creative Commons licensed.

### What we can reuse

Abstract function-based icons for a "signal flow" schematic view:
- Circle = oscillator/sound source
- Triangle = filter
- Trapezoid = VCA
- Arch = envelope
- Wave = LFO
- Color-coded connections by signal type

These are module-agnostic, so a patch documented with symbols works regardless of specific hardware. Could offer this as an alternative view alongside our photorealistic panel view.

### Implementation
Download SVGs, extract individual symbols, use as React components in a "Schematic View" toggle.

---

## 5. Other Notable Finds

### No existing React/TS Eurorack patch documentation tool
Our project fills a genuine gap. The closest tools are either:
- Canvas-based vanilla JS (Patch Library)
- Game engine-based (The Patch Project / GDevelop)
- Text-only (Patchbook)
- Form-based (PatchBank)

### ModularGrid has no API
Module data must be self-maintained. The admin has explicitly stated no API exists and scraping is not permitted. User-contributed module templates (our jack editor approach) is the right strategy.

### Patchstorage has an API
Could be a future integration target for sharing/discovering patches across platforms.

### SVG Panel Templates
github.com/retoid/Module-Panel-Templates has community SVG templates for Eurorack panels. Format: `Make_Model_Template.svg`. Could supplement our PNG panel images.

---

## Priority Recommendations

### High value, low effort
1. **Patchbook text export** — Generate shareable text from our patch state (~50 lines of code)
2. **Add pitch and clock jack types** — Align with the widely-used 6-type taxonomy
3. **Module tags/categories** — Add to `ModuleTemplate` for future filtering

### High value, medium effort
4. **Knob position tracking** — Adopt Patch Library's rotation model (degree-based, mouse-Y drag)
5. **Signal flow view** — Use PATCH & TWEAK symbols + Graphviz-style layout as alternate view

### Medium value, higher effort
6. **VCV Rack patch import** — Parse `.vcv` JSON, map modules by slug, import cable connections
7. **Patchstorage API integration** — Share patches to the largest patch community
