# Competitive Analysis: Synth Patch Documentation Tools

Research date: March 2026

## What We're Building

**modular-patch-docs** — A React/Vite web app for visually documenting Eurorack modular synth patches. Users place module panels on a canvas, connect jacks with colored patch cables, and save/share configurations. Currently supports Make Noise modules (DPO, XPO, QPAS, Maths, Mimeophon) with jack-level precision, undo/redo, IndexedDB saves, and Google Sheets sync.

---

## Direct Competitors

### 1. SynthPatch.io

**URL:** https://www.synthpatch.io

**What it does:** Interactive web app for creating, managing, and sharing synthesizer patches for semi-modular and fixed-architecture synths.

**Key features:**
- Interactive virtual synth panels — turn knobs, connect cables, flip switches exactly like the hardware
- Knob positions stored as MIDI values (0-127)
- Cable routing with source/destination tracking
- Audio clip uploads per patch
- Collections, tagging, community browsing
- Private sharing links (PRO)

**Supported synths:** Moog (DFAM, Grandmother, Matriarch, Mother-32, Mavis, Labyrinth, Subharmonicon, Minitaur), Make Noise (0-Coast, 0-Control, Strega), Korg MS-20 mini, Arturia MicroFreak, Dreadbox, Erica Synths, BASTL, Modern Sounds. Regularly expanding.

**Pricing:**
- Free tier: limited patches, earn bonus slots by sharing publicly (+1 per public share, +2 with audio clip)
- PRO: $8/month or $60/year — private links, unlimited patches

**Strengths:**
- Polish and UX quality (5-star rating, 24 reviews)
- Precise parameter capture (knobs, not just cables)
- Audio samples per patch
- Community/sharing features
- Covers semi-modular/desktop synths well

**Weaknesses:**
- Focused on fixed-architecture synths, NOT Eurorack modular
- No support for arbitrary module combinations / custom racks
- No visual rack layout
- Paywall for core features (private sharing)

**Relevance to us:** Most direct competitor in concept, but targets a different segment (semi-modular/desktop synths vs Eurorack). They capture knob positions — we currently don't, which is a potential feature gap.

---

### 2. PatchBank

**URL:** https://patchbank.app

**What it does:** All-in-one Eurorack studio manager — module catalog, patch documentation, and community sharing.

**Key features:**
- Module inventory with specs, notes, manufacturer docs
- Patch documentation with connection diagrams, settings, audio recordings
- Search and filtering
- Community sharing and discovery

**Pricing:** Free forever for hobbyists, no credit card required.

**Strengths:**
- Specifically targets Eurorack (our exact domain)
- Module catalog / gear tracking
- Audio attachment support
- Free model

**Weaknesses:**
- Less visual/interactive than SynthPatch — more form-based documentation
- Newer, smaller community
- No interactive panel images with clickable jacks

**Relevance to us:** Most direct competitor in the Eurorack space. If they're form-based and we're visual/interactive, that's our differentiator.

---

### 3. Patch Library

**URL:** https://patch-library.net

**What it does:** Create and share patches for semi-modular synths with interactive visual interfaces.

**Key features:**
- Mouse-drag cable patching between outputs and inputs
- Knob/switch manipulation
- Audio preview upload (wav/ogg/mp3, <1MB)
- No account required — cookie-based ownership
- URL-based sharing (just copy the URL)

**Supported synths:** Behringer Neutron, Model-D, Crave; Moog DFAM, Mother-32; Make Noise 0-Coast; Erica Pico System III.

**Pricing:** Free.

**Open source:** Yes — GitHub repo at github.com/zwippie/patch-library

**Strengths:**
- Zero-friction UX (no signup, cookie-based)
- Interactive visual patching
- Open source
- Clean, focused design

**Weaknesses:**
- Limited to specific semi-modular synths
- No Eurorack / custom rack support
- Cookie-based ownership is fragile
- Small audio file limit

**Relevance to us:** Very similar interaction model to ours (drag cables, click jacks). Good UX reference. Open source — worth studying the codebase.

---

## Adjacent / Partial Competitors

### 4. ModularGrid — Patches

**URL:** https://modulargrid.net/e/patches

**What it does:** ModularGrid is primarily a rack planner/database, but has a "Sketch a Patch" feature for documenting patches.

**Key features:**
- Drag-and-drop rack planner (Eurorack, Buchla, 5U, Serge)
- Massive module database
- "Sketch a Patch" — quick draw/share/comment on basic patches
- Community features

**Strengths:**
- Largest modular synth community
- Comprehensive module database
- Already where Eurorack users plan their racks

**Weaknesses:**
- Patch documentation is secondary / basic
- No interactive jack-level patching on module panels
- Sketch feature is simplified, not detailed

**Relevance to us:** ModularGrid has the audience and the module data. Our interactive patching could complement their rack planner. Integration or import from ModularGrid would be valuable.

---

### 5. Patchstorage

**URL:** https://patchstorage.com

**What it does:** Community platform for sharing patches across 100+ audio/music platforms.

**Key features:**
- 17,000+ active users
- Supports VCV Rack (8,800+ patches), ZOIA, Drambo, Organelle, Pd, and many more
- User profiles, top contributors, followers
- Discord community
- API access

**Strengths:**
- Huge community, mature platform
- Covers software modular (VCV Rack) extensively
- Free

**Weaknesses:**
- Patch files, not visual documentation — you upload a file, not diagram a patch
- No interactive visual patching
- Focused on software/digital platforms, not hardware Eurorack

**Relevance to us:** Different approach (file storage vs visual documentation). Could be a distribution channel — export patches as shareable files.

---

### 6. Patchbook (Markup Language)

**URL:** https://github.com/SpektroAudio/Patchbook

**What it does:** A text-based markup language for writing modular synth patches, with a Python parser that outputs JSON and Graphviz flowcharts.

**Example:**
```
*Maths
> Ch 1 Out >> Oscillator 1 V/Oct
> Ch 4 Out >> Filter Cutoff

*Oscillator 1
> Saw Out >> Filter Audio In
```

**Strengths:**
- Human-readable text format
- Outputs JSON (machine-parseable)
- Can generate visual flowcharts via Graphviz
- Platform-agnostic

**Weaknesses:**
- Text-only — no interactive visual interface
- Requires learning the syntax
- No knob positions, no audio, no images
- Project appears dormant

**Relevance to us:** Interesting as an import/export format. We could support Patchbook import or offer text-based patch descriptions alongside our visual approach.

---

### 7. PATCH & TWEAK Symbols

**URL:** https://www.patchandtweak.com/symbols/

**What it does:** A standardized symbol system for documenting modular patches on paper or digitally.

**Key features:**
- Abstract icons for functions (oscillator = circle, filter = triangle, etc.)
- Color-coded connections by signal type
- Module-agnostic — works with any hardware
- Free under Creative Commons

**Strengths:**
- Universal visual language
- Great for teaching/learning
- Module-independent (portable across setups)
- Free/open

**Weaknesses:**
- Not a software tool — just a symbol set
- No knob positions by design (intentionally abstract)
- Manual process

**Relevance to us:** We could offer a "schematic view" that uses these symbols alongside our photorealistic panel view. Good for sharing patches across different setups.

---

## Feature Comparison Matrix

| Feature | Us (current) | SynthPatch.io | PatchBank | Patch Library | ModularGrid |
|---|---|---|---|---|---|
| Interactive visual panels | Yes | Yes | No | Yes | No |
| Eurorack support | Yes | No | Yes | No | Yes |
| Custom module combos | Yes | No | Unclear | No | Yes |
| Cable patching | Yes | Yes | Diagram | Yes | Sketch |
| Knob positions | No | Yes (MIDI) | Text | Yes | No |
| Audio clips | No | Yes | Yes | Yes (limited) | No |
| Save/load patches | Yes (IndexedDB) | Yes (cloud) | Yes (cloud) | Yes (cookie) | Yes |
| Community/sharing | No | Yes | Yes | Yes (URL) | Yes |
| Undo/redo | Yes | Unknown | No | Unknown | No |
| Export (JSON/CSV) | Yes (Sheets) | No | No | No | No |
| Module database | 5 modules | ~20 synths | Large | ~7 synths | Massive |
| Pricing | Free | Freemium | Free | Free | Free |

---

## Key Takeaways & Opportunities

### Our Differentiators
1. **Eurorack-native** — We're one of very few tools focused on modular Eurorack patching with real panel images
2. **Interactive jack-level precision** — Clickable jacks on actual module panels, not abstract diagrams
3. **Custom rack layouts** — Users bring any combination of modules, not limited to fixed synths
4. **Local-first** — IndexedDB + optional Sheets sync, no forced account/cloud dependency

### Gaps to Address
1. **Knob/parameter positions** — SynthPatch and Patch Library capture this; we don't yet
2. **Audio clips** — Every competitor with sharing supports audio demos
3. **Community/sharing** — We have no public sharing, discovery, or community features
4. **Module library size** — We have 5 modules; competitors have 7-20+ (ModularGrid has thousands)
5. **User accounts** — Currently cookie/local-only; needed for community features

### Strategic Options
1. **Expand module library fast** — Allow user-contributed module templates (upload panel image + place jacks) to crowdsource coverage
2. **Add knob tracking** — Overlay draggable knob indicators on panel images
3. **Audio attachment** — Record or upload audio per patch
4. **Shareable URLs** — Generate unique links to view patches (read-only)
5. **ModularGrid integration** — Import rack configurations from ModularGrid
6. **Patchbook export** — Text-based patch description for forums/sharing
7. **PATCH & TWEAK schematic view** — Abstract signal-flow diagram alongside panel view
