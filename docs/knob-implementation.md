# Knob Position Tracking — Implementation Plan

## UX Conventions (Industry Standard)

Based on research across VCV Rack, DAW plugins, and KVR Audio forums:

| Interaction | Behavior |
|---|---|
| **Drag** | Vertical drag (up = increase). Linear mapping, not circular. |
| **Fine control** | Ctrl + drag = fine adjustment |
| **Reset** | Double-click = reset to default value |
| **Scroll wheel** | Optional, nice to have |
| **Cursor** | Hide cursor during drag (invisible slider pattern) |
| **Value display** | Show value on hover or during drag |

---

## Data Model Changes

### types.ts additions

```typescript
interface KnobDef {
  id: string;
  label: string;
  x: number;          // 0-1 fraction of panel width (same as JackDef)
  y: number;          // 0-1 fraction of panel height
  size: 'small' | 'medium' | 'large';  // visual radius
  defaultValue: number;  // 0-1 normalized
}
```

### Extend ModuleTemplate

```typescript
interface ModuleTemplate {
  // ...existing fields
  knobs?: KnobDef[];
}
```

### Extend PlacedModule

```typescript
interface PlacedModule {
  // ...existing fields
  knobValues?: Record<string, number>;  // knob id → 0-1 normalized value
}
```

### Extend PatchState

No change needed — `PlacedModule` is already part of `PatchState.modules[]`, so `knobValues` persists automatically through existing auto-save and undo/redo.

---

## Rendering Approach

Knobs use the **exact same fractional positioning system as jacks** — overlay absolutely-positioned elements on the module panel image.

### Option A: No dependency (recommended to start)

A knob is just:
1. A `div` at `left: ${knob.x * 100}%`, `top: ${knob.y * 100}%` (same as jacks)
2. An SVG arc or indicator line showing current rotation
3. Pointer event handlers for vertical drag

```tsx
// Minimal knob overlay — no library needed
<div
  style={{
    position: 'absolute',
    left: `${knob.x * 100}%`,
    top: `${knob.y * 100}%`,
    transform: 'translate(-50%, -50%)',
    width: sizeMap[knob.size],
    height: sizeMap[knob.size],
    cursor: 'ns-resize',
  }}
  onPointerDown={startDrag}
  onDoubleClick={resetToDefault}
>
  {/* Rotation indicator */}
  <svg viewBox="0 0 40 40" width="100%" height="100%">
    <circle cx="20" cy="20" r="18" fill="transparent" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
    <line
      x1="20" y1="20"
      x2={20 + 14 * Math.sin(angle)} y2={20 - 14 * Math.cos(angle)}
      stroke="white" strokeWidth="2" strokeLinecap="round"
    />
  </svg>
</div>
```

Where `angle` maps value 0-1 to rotation range (typically -135° to +135°, i.e., 270° sweep):
```typescript
const angle = (value * 270 - 135) * (Math.PI / 180);
```

### Option B: react-knob-headless (if we want polish)

Best React knob library found. TypeScript-native, headless/unstyled, vertical drag, audio-focused.

```bash
npm install react-knob-headless
```

```tsx
import { KnobHeadless, KnobHeadlessLabel, KnobHeadlessOutput } from 'react-knob-headless';

<KnobHeadless
  valueRaw={knobValues[knob.id] ?? knob.defaultValue}
  valueMin={0}
  valueMax={1}
  dragSensitivity={0.006}
  onValueRawChange={(v) => onKnobChange(module.id, knob.id, v)}
  style={{
    position: 'absolute',
    left: `${knob.x * 100}%`,
    top: `${knob.y * 100}%`,
    transform: 'translate(-50%, -50%)',
  }}
>
  {/* Same SVG indicator as above */}
</KnobHeadless>
```

Adds: ARIA accessibility, keyboard controls, configurable drag sensitivity, non-linear mapping utilities. Bundle: ~54 KB.

---

## Interaction Logic (DIY approach)

```typescript
const DRAG_SENSITIVITY = 0.005;  // value change per pixel of vertical drag
const FINE_MULTIPLIER = 0.1;     // when Ctrl is held

function handlePointerDown(e: PointerEvent, knobId: string) {
  e.currentTarget.setPointerCapture(e.pointerId);
  dragState = { knobId, startY: e.clientY, startValue: knobValues[knobId] };
}

function handlePointerMove(e: PointerEvent) {
  if (!dragState) return;
  const sensitivity = e.ctrlKey ? DRAG_SENSITIVITY * FINE_MULTIPLIER : DRAG_SENSITIVITY;
  const delta = (dragState.startY - e.clientY) * sensitivity;
  const newValue = Math.max(0, Math.min(1, dragState.startValue + delta));
  onKnobChange(moduleId, dragState.knobId, newValue);
}

function handleDoubleClick(knobId: string) {
  onKnobChange(moduleId, knobId, knob.defaultValue);
}
```

---

## App.tsx Integration

### New handler (parallel to existing onMoveModule, onAddCable)

```typescript
const handleKnobChange = (moduleId: string, knobId: string, value: number) => {
  pushHistory();
  setModules(prev => prev.map(m =>
    m.id === moduleId
      ? { ...m, knobValues: { ...(m.knobValues || {}), [knobId]: value } }
      : m
  ));
};
```

Pass to Canvas → ModulePanel as `onKnobChange` prop. Existing auto-save and undo/redo pick it up automatically since modules state is already tracked.

---

## Placing Knobs on Modules

Reuse the existing **jack editor** workflow:
1. User opens module template editor
2. Clicks on knob centers on the panel image (same as placing jacks)
3. Sets label, size, and default value
4. Saves to template

The fractional coordinate system (0-1) already handles this — same infrastructure, different data array.

---

## Visual Design Options

### Minimal (transparent overlay)
- Small indicator dot or arc over the actual printed knob on the panel image
- Least visual clutter, relies on the panel photo for context
- Best when panel images are high quality

### Semi-transparent ring
- Colored arc showing current position (like a progress ring)
- Visible but doesn't fully obscure the panel
- Good balance of information and aesthetics

### Knob image rotation
- If we extract individual knob images from panels, rotate them with CSS
- Most realistic but requires per-module knob artwork
- Patch Library uses this approach (separate PNG per knob type, rotated on canvas)

**Recommendation:** Start with the minimal transparent overlay. It works with any panel image without extra artwork. Upgrade to extracted knob images later for specific popular modules.

---

## Knob Sizes

Based on common Eurorack knob sizes (relative to our 380px panel height):

```typescript
const KNOB_SIZES: Record<string, number> = {
  small: 20,   // ~5mm trimpots, attenuverters
  medium: 30,  // standard knobs (most common)
  large: 42,   // main frequency/level knobs
};
```

---

## Persistence

No extra work needed. `knobValues` on `PlacedModule` flows through:
- **Auto-save** → existing `savePatch()` effect serializes modules state
- **IndexedDB** → existing `SavedPatch` includes full `PatchState`
- **Google Sheets sync** → existing sheets export includes module data
- **Undo/redo** → existing `pushHistory()` snapshots modules array
- **JSON export** → already includes all module data

---

## Migration

Existing saved patches have no `knobValues` on their modules. The code should treat missing `knobValues` as empty (`{}`) — all knobs show default position. No migration needed.

---

## Implementation Steps

1. Add `KnobDef` type and extend `ModuleTemplate` + `PlacedModule` in `types.ts`
2. Add knob rendering to `ModulePanel.tsx` (SVG overlay with pointer events)
3. Add `handleKnobChange` to `App.tsx`, wire through Canvas
4. Add knob placement to the jack editor (reuse same coordinate picker)
5. Define knobs for one module (e.g., Maths — 4 large knobs, clear visual reference)
6. Test: drag to adjust, double-click to reset, Ctrl for fine, undo/redo, save/load
