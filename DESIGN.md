---
name: "ECO SERVICE · The journey of one application"
description: "A cinematic, keyboard-driven presentation that follows one application across a night satellite map of Uzbekistan, through eight stations of state ecological expertise."
colors:
  cyan-hi: "#62d7ea"
  cyan: "#22b8d0"
  now-fill: "#062a31"
  on-cyan: "#032a31"
  leaf: "#96c962"
  leaf-ink: "#4f8a2a"
  done-fill: "#17260d"
  on-leaf: "#0e1a05"
  amber: "#e8b04c"
  amber-ink: "#b07a12"
  on-amber: "#2a1a02"
  coral: "#ef7c64"
  back-fill: "#2c120c"
  ground: "#05080c"
  sheet: "#0b1219"
  panel: "rgba(8, 13, 19, 0.86)"
  panel-2: "rgba(11, 18, 25, 0.92)"
  hair: "rgba(138, 190, 210, 0.16)"
  hair-2: "rgba(138, 190, 210, 0.3)"
  track: "rgba(138, 190, 210, 0.2)"
  ring-idle: "rgba(138, 190, 210, 0.42)"
  ink: "#e9eff2"
  ink-2: "#b0bfc8"
  ink-3: "#7f919c"
  paper: "#e3e9ec"
  paper-ink-2: "#46565e"
  night-mask: "#010305"
  horizon: "#0e3946"
  boundary: "#8fb3c2"
typography:
  display:
    fontFamily: "Geologica Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "5.6rem"
    fontWeight: 720
    lineHeight: 0.92
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Geologica Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "4.4rem"
    fontWeight: 660
    lineHeight: 1.02
    letterSpacing: "-0.038em"
  headline-sm:
    fontFamily: "Geologica Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "3.4rem"
    fontWeight: 640
    lineHeight: 1.07
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Geologica Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "2.45rem"
    fontWeight: 620
    lineHeight: 1.07
    letterSpacing: "-0.028em"
  lead:
    fontFamily: "Geologica Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1.55rem"
    fontWeight: 360
    lineHeight: 1.3
  body:
    fontFamily: "Geologica Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1.12rem"
    fontWeight: 380
    lineHeight: 1.52
    fontFeature: "tnum"
  title-sm:
    fontFamily: "Geologica Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
  label:
    fontFamily: "Geologica Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 380
    lineHeight: 1.35
  chip:
    fontFamily: "Geologica Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "0.76rem"
    fontWeight: 520
  note:
    fontFamily: "Geologica Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "0.74rem"
    fontWeight: 380
    lineHeight: 1.45
  paper-title:
    fontFamily: "Geologica Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 700
    letterSpacing: "0.08em"
  data:
    fontFamily: "Martian Mono Variable, Cascadia Mono, ui-monospace, monospace"
    fontWeight: 420
    letterSpacing: "-0.01em"
rounded:
  paper: "3px"
  tag: "9px"
  control: "10px"
  block: "12px"
  sheet: "14px"
  card: "16px"
  pill: "999px"
spacing:
  gutter: "4.2vw"
  stage-gap: "3.4vw"
  card-w: "34rem"
  block-gap: "1.6rem"
  sheet-inset: "1.4rem"
  block-inset: "1rem"
  row: "0.75rem"
  icon-gap: "0.5rem"
components:
  card-narrative:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.card}"
    padding: "2.1rem 2.3rem 2.2rem"
    width: "{spacing.card-w}"
  sheet-system:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.sheet}"
    padding: "1.1rem 1.4rem"
  panel:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.sheet}"
    padding: "1.2rem 1.3rem"
  paper-document:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ground}"
    typography: "{typography.paper-title}"
    rounded: "{rounded.paper}"
    padding: "2rem 1.9rem 1.5rem"
    height: "min(62vh, 100%)"
  ticket:
    textColor: "{colors.ink}"
    rounded: "{rounded.block}"
    padding: "0.9rem 1rem"
  chip:
    textColor: "{colors.ink-2}"
    typography: "{typography.chip}"
    rounded: "{rounded.pill}"
    padding: "0.3rem 0.72rem"
  chip-cyan:
    backgroundColor: "{colors.cyan-hi}"
    textColor: "{colors.on-cyan}"
  chip-leaf:
    backgroundColor: "{colors.leaf}"
    textColor: "{colors.on-leaf}"
  chip-amber:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.on-amber}"
  option:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.control}"
    padding: "0.6rem 1rem"
  option-selected:
    backgroundColor: "{colors.leaf}"
    textColor: "{colors.on-leaf}"
  button-system:
    textColor: "{colors.cyan-hi}"
    rounded: "{rounded.control}"
    padding: "0.7rem 1.2rem"
  button-system-pressed:
    backgroundColor: "{colors.cyan-hi}"
    textColor: "{colors.on-cyan}"
  map-tag:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    padding: "0.4rem 0.75rem"
  rail-station:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.pill}"
    size: "1.2rem"
  rail-station-now:
    backgroundColor: "{colors.now-fill}"
    textColor: "{colors.ink}"
  rail-station-done:
    backgroundColor: "{colors.leaf}"
    textColor: "{colors.on-leaf}"
  station-node:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.pill}"
  station-node-now:
    backgroundColor: "{colors.now-fill}"
    textColor: "{colors.cyan-hi}"
  station-node-done:
    backgroundColor: "{colors.done-fill}"
    textColor: "{colors.leaf}"
  station-node-back:
    backgroundColor: "{colors.back-fill}"
    textColor: "{colors.coral}"
---

# Design System: ECO SERVICE · The journey of one application

## Overview

**Creative North Star: "The Line the Application Rides"**

The system is a night earth and one lit line. A single application travels over the real satellite map of Uzbekistan, from a 10 m plot in the Fergana Valley to Tashkent and back, and every screen is a station on that line. The ground is a slate-black night with the country's border lit in the shield's cyan and the rest of the world masked; the process is drawn in transit-map grammar (tracks, lit routes, ring stations, a fork, a loop, a transfer); system screens arrive as dark sheets and official documents as pale paper.

Density is low and cinematic: one heading, one or two sentences, at most one evidence block per step, at sizes that read across a hall. Color is a status code, not decoration: Lit Cyan is the system and where the application is now, leaf is done, amber is waiting, coral is returned. Motion is camera flight and line drawing; between steps the earth sways a few degrees so a held step never looks frozen.

The direction refuses the category default, process boxes and arrows on a white slide. Where the build departs from the direction contract, the build is recorded here: the opening crest is 6.4rem (the contract asked for about 7rem) and the wordmark 5.6rem (about 5.4rem). The contract's "official sheets" became two materials in the build: pale paper for documents, dark sheets for system screens.

**Key Characteristics:**
- Night satellite earth as the only ground: imagery desaturated and capped, Uzbekistan's border lit, everything outside it masked.
- Transit-diagram grammar for every process: 3px tracks, 4px lit routes, ring stations, a fork, a loop, a transfer.
- A four-state color code from the shield: cyan current, leaf done, amber waiting, coral returned.
- Two materials for evidence: dark translucent system sheets and flat pale paper for official documents.
- Geologica for every word; Martian Mono only for values the system holds.
- Type and spacing locked to screen height (1rem = min(1.9vh, 1.07vw)), composed at 1920×1080.
- Camera flights and drawn lines carry the motion; a slow, bounded sway keeps the earth alive between steps.

## Colors

A night palette lifted from the shield: a slate-black ground, one lit cyan, and three status hues that only ever mean a state.

### Primary
- **Lit Cyan** (#62d7ea): the cyan that must read on the night ground. The application's route on the map and in diagrams, the current station's ring, the docked rail's fill, the pulse core, icons in evidence blocks, IDs on dark surfaces, cyan chips, the pressed system button.
- **Shield Cyan** (#22b8d0): the shield's own cyan, used broad and soft: the blurred bloom under Uzbekistan's border, the inspection ring and plot fills, the sheet-header wash, the crest's halo, the hero byline's separator dots.
- **Deep Station Cyan** (#062a31): the fill inside a current station (rail dot, diagram disc), so a lit ring reads as a ring of light, not a button.
- **Ink on Cyan** (#032a31): text on any Lit Cyan fill: cyan chips, the riding token, the pressed button, a completed progress pill.

### Secondary
- **Shield Leaf** (#96c962): done and approved. Finished rail stations and diagram stations, the selected decision, the accepted site, the return route that delivers the signed conclusion, history bullets, the finale's full rail and its bracket.
- **Deep Leaf** (#4f8a2a): leaf for paper, where Shield Leaf would wash out: the section check discs and the Finalized status fill.
- **Deep Station Leaf** (#17260d): the fill inside a done diagram station.
- **Ink on Leaf** (#0e1a05): text and checkmarks on Shield Leaf fills.

### Tertiary
- **Waiting Amber** (#e8b04c): waiting. The Awaiting payment chip, the monitored deadline, an expert still being assigned.
- **Deep Amber** (#b07a12): amber for paper, the Draft status fill.
- **Ink on Amber** (#2a1a02): text on Waiting Amber.
- **Returned Coral** (#ef7c64): returned for revision. The review loop, its caption, the returned station's ring.
- **Deep Station Coral** (#2c120c): the fill inside a returned station.

### Neutral
- **Night Ground** (#05080c): the page, the map background, the sky and fog, the idle rail dot, the halo behind any text that sits straight on the map, and the ink of paper.
- **Sheet Slate** (#0b1219): the mean tone of system screens and the fill of idle diagram stations and payment milestones.
- **Glass Panel** (rgba(8, 13, 19, 0.86)): the narrative card, laid over a 14px backdrop blur.
- **Solid Panel** (rgba(11, 18, 25, 0.92)): side panels, source cards and verdict tiles inside a visual.
- **Hairline** (rgba(138, 190, 210, 0.16)): card, sheet and panel borders, rules inside evidence blocks.
- **Strong Hairline** (rgba(138, 190, 210, 0.3)): borders of chips, options, the account block and the key cap.
- **Track** (rgba(138, 190, 210, 0.2)): the unlit track under every route, the rail track, bars; rows inside sheets drop to 8% of the same hue.
- **Idle Ring** (rgba(138, 190, 210, 0.42)): the ring of a station not yet reached.
- **Frost Ink** (#e9eff2): headings and primary text.
- **Mist Ink** (#b0bfc8): sentences, secondary labels, the step counter.
- **Haze Ink** (#7f919c): notes, sub-lines, unreached rail labels, unseen criteria, the imagery credit.
- **Official Paper** (#e3e9ec): official documents and nothing else.
- **Paper Gray** (#46565e): field labels, numerals, footer and roles on paper.
- **Night Mask** (#010305): the fill that darkens everything outside Uzbekistan, at 50–70%.
- **Horizon Teal** (#0e3946): the globe's horizon band.
- **Far Boundary** (#8fb3c2): faint hairlines of other countries' borders, at 10–25%.

### Named Rules
**The Status-Only Hue Rule.** Leaf, amber and coral are states, never accents: leaf is done or approved, amber is waiting, coral is returned. If nothing has happened to it, it does not wear them.

**The Two Cyans Rule.** Lit Cyan draws whatever must be read or followed on the night ground: lines, rings, icons, IDs and their glows. Shield Cyan is the brand's own cyan, used broad and soft: blooms, area fills, washes, halos. Shield Cyan never sets a word.

**The Paper-Is-Official Rule.** Official Paper is reserved for documents the state records or issues: the application record, the expertise conclusion, the signed conclusion. System screens are always dark sheets.

## Typography

**Display Font:** Geologica Variable (with Segoe UI, system-ui, sans-serif)
**Body Font:** Geologica Variable (with Segoe UI, system-ui, sans-serif)
**Label/Mono Font:** Martian Mono Variable (with Cascadia Mono, ui-monospace, monospace), for data only

**Character:** One geometric sans carries every word, from the 5.6rem wordmark down to the smallest labels on paper, so the presentation speaks in one voice. A wide monospace cuts in only where the system holds a value, so numbers read as records rather than prose.

### Hierarchy
- **Display** (720, 5.6rem, 0.92, -0.04em): "ECO SERVICE" on the opening and closing steps.
- **Headline** (660, 4.4rem, 1.02, -0.038em, max 18ch): the centered statement over the open map.
- **Headline Small** (640, 3.4rem, 1.07, -0.035em): the top-anchored heading above the eight-station overview and the finale.
- **Title** (620, 2.45rem, 1.07, -0.028em, balanced): every narrative card heading.
- **Lead** (360, 1.55rem, 1.3, max 24ch): the hero's one line under the wordmark, in Frost Ink.
- **Body** (380, 1.12rem, 1.52, pretty wrap): card sentences in Mist Ink. On the open map it steps up to 1.4rem (center, max 42ch) and 1.3rem (top, max 46ch).
- **Title Small** (600, 1rem): station names in diagrams; sheet, panel and row titles sit at 0.95–1.05rem and 560–620.
- **Label** (380, 0.78rem, 1.35): the sub-line under a station name or sheet title, the text of a map tag.
- **Chip** (520, 0.76rem): chips; progress pills run at 0.74rem.
- **Note** (380, 0.74rem, 1.45): the source or illustration note at a card's foot, in Haze Ink.
- **Paper Title** (700, 0.9rem, 0.08em, written in capitals): the title of an official paper.
- **Data** (Martian Mono, 420, -0.01em, at the size of its line): the application number, coordinates, the step counter, station and field numerals, the designer score and its 1 to 100 scale.

Tabular numerals are on everywhere (font-variant-numeric: tabular-nums on the body), and type is antialiased.

### Named Rules
**The Mono-Is-Data Rule.** Martian Mono sets only values the system holds: the application number, coordinates, step and station numerals, field numbers, the score and its scale, the 15–25 span on the finale rail. The words around a value stay Geologica, even inside one line ("Application No." in Geologica, the number in Mono). Numbers inside headlines and sentences stay Geologica.

**The Tighten-As-It-Grows Rule.** Headings tighten and thicken as they grow: -0.028em at 2.45rem, -0.035em at 3.4rem, -0.038em at 4.4rem, -0.04em at 5.6rem, weight rising from 620 to 720. Body text is never tracked.

**The Form-Title Rule.** Spaced capitals (0.08em, 700) belong to official paper titles alone. Nothing on a dark surface is set in spaced capitals.

## Layout

The stage is a fixed full-screen frame (100vh, no scroll) over a full-bleed map. One rem tracks the screen: 1rem = min(1.9vh, 1.07vw), about 20.5px in the 1920×1080 frame every step is composed for, so a hall projector and a laptop show the same composition. Type, card widths and spacing are in rem, side margins in vw, vertical anchors in vh. There are no breakpoints: the 1.07vw term caps the rem on wide screens, and map cameras shift their zoom by log2 of the screen's size against 1920×1080.

Each step picks one of four layouts:
- **Side** (default): the narrative card, 34rem wide, at the 4.2vw gutter, centered vertically between 10vh from the top and 15vh from the bottom. The visual takes the rest of the width, starting 3.4vw past the card, centered in its slot.
- **Hero**: a 46rem column on the left, full height, for the opening and the close.
- **Center**: one centered column, min(66rem, 86vw), sitting a little above the middle (8vh off the bottom).
- **Top**: the heading anchored at 12vh; the visual runs gutter to gutter from 39vh down to 10vh above the bottom.

The chrome is a fixed frame on the same gutter. Top left at 3.4vh, the mark (2.1rem crest, wordmark at 0.95rem and 640), hidden on hero steps. Top right, the step counter. Across the bottom at 4.4vh, the docked route rail (3.8rem tall, stations at 3% + i × 94/7 % of its width), shown from the first application step through delivery. Bottom right, the advance cue, on the opening step only. Bottom left at 1.1vh, the imagery credit at 0.58rem in Haze Ink.

Inside the card the rhythm is fixed: 1rem from heading to sentence, 1.6rem to the evidence block, 1.5rem to the note. Rows run at about 0.75rem vertical padding, with a 1.4rem inset inside sheets and 1rem inside blocks; icon-to-text gaps sit at 0.4–0.6rem. Diagrams size to min(100%, 74vh × their aspect ratio); papers to min(62vh, 100%) at A-series proportion (1 : 1.414).

The map composes with the layout. Cameras are low and tilted (pitch 34–66°), so the earth's limb or the terrain fills the frame. On side steps the camera pads its left edge to the card's right edge plus 3% of the width; the hero pads 40%; cameras that follow the application keep it in the band under the top bar (75% bottom padding), so it stays visible above the step's visual. On close-up cameras over bright rooftops, the top shade deepens from 0.5 to 0.78 to hold the counter and mark legible.

### Named Rules
**The Height-Locked Rem Rule.** Size everything that composes the frame in rem (1rem = min(1.9vh, 1.07vw)) and compose at 1920×1080; HTML type is never sized in px.

**The Subject-In-The-Clear Rule.** The camera frames its subject in the ground the card leaves free, never behind the card; while the application rides, it holds the band under the top bar.

## Elevation & Depth

A hybrid of light and layering over a dark world. Depth comes first from the stack: the map (satellite, then the mask, then outer boundaries, then the in-map veil, then Uzbekistan's lit border, the site and the route), the map's DOM markers, a fixed shade scrim that grades the frame's edges (a radial vignette plus left, bottom and top gradients), then the stage, the rail and the chrome. Dimming happens inside the map style: a full-globe veil fill in Night Ground sits above the imagery, the mask and the outer boundary lines but below the border, site, route and markers. A step raises it to 0.45–0.75 and drops satellite saturation from -0.34 to -0.6, so the ground recedes while the application stays lit. Surfaces that float over the map carry soft, hanging shadows; state is carried by light.

### Shadow Vocabulary
- **Card hang** (`box-shadow: 0 2.4rem 5rem -2.6rem rgba(0, 0, 0, 0.9), 0 0.8rem 1.6rem -1rem rgba(0, 0, 0, 0.6)`, with `backdrop-filter: blur(14px) saturate(1.15)`): the narrative card.
- **Sheet hang** (`box-shadow: 0 2.6rem 5rem -2.6rem rgba(0, 0, 0, 0.95), 0 1rem 2.2rem -1.4rem rgba(0, 0, 0, 0.7)`): dark system sheets.
- **Paper hang** (`box-shadow: 0 2.2rem 4.4rem -1.8rem rgba(0, 0, 0, 0.9), 0 0.4rem 1rem -0.4rem rgba(0, 0, 0, 0.6)`): official papers; the tight second layer gives the sheet a physical edge.
- **Panel hang** (`box-shadow: 0 2rem 4rem -2.4rem rgba(0, 0, 0, 0.9)`): side panels.
- **Tag lift** (`box-shadow: 0 0.6rem 1.8rem -0.6rem rgba(0, 0, 0, 0.8)`): map tags.
- **Now halo** (`box-shadow: 0 0 0 0.4rem rgba(98, 215, 234, 0.14), 0 0 1.4rem rgba(98, 215, 234, 0.6)`): the current rail station; larger stations widen the ring to 6–7px.
- **Line glow** (`box-shadow: 0 0 12px rgba(98, 215, 234, 0.55)`; on SVG `drop-shadow(0 0 6px rgba(98, 215, 234, 0.55))`): the rail fill and every lit route; leaf and coral routes glow in their own hue at 0.5.
- **Choice glow** (`box-shadow: 0 0.6rem 1.8rem -0.6rem rgba(150, 201, 98, 0.65)`): the selected decision.
- **Map text halo** (`text-shadow: 0 0 0.5rem #05080c, 0 0 1.2rem #05080c`): any text that sits straight on the map; centered and top statements use `0 2px 28px rgba(0, 0, 0, 0.65)`.

### Named Rules
**The Hanging Shadow Rule.** A surface that floats over the map hangs: a large downward offset, a large blur and a negative spread at 0.8–0.95 black, so it darkens the ground beneath it without a visible halo edge.

**The Light-Is-State Rule.** Among routes, stations and choices, glow marks the live thing: the route, the current station, the application's pulse, the chosen answer. Finished stations go flat in leaf; on the docked rail and in diagrams, stations not yet reached are idle hairline rings.

**The Veil-Under-The-Light Rule.** Dim the ground only through the in-map veil, beneath the border, route and markers. The shade scrim above the map only grades the frame's edges for the card, rail and chrome; nothing flat is laid over the whole map to darken it.

## Shapes

Rounded rectangles that soften with size: 9px for map tags, 10px for controls and icon wells, 12px for evidence blocks, 14px for sheets, panels and verdict tiles, 16px for the narrative card. Chips and progress steps are pills; stations, pulses, dots, numerals and corner badges are perfect circles. Official paper is nearly square (3px), the only near-sharp surface, which is what makes it read as paper; redaction bars share the 3px. Lines are round-capped and round-joined: routes 4px, tracks 3px, station rings 2px (diagram stations thicken to 3px once current, done or returned), rules 1px. Masked personal data is a hatched bar (135° stripes at 5px). The transfer for coordination is a rounded frame (22 units in its drawing) enclosing the two divisions; the finale's span is an open bracket (2px leaf, 10px lower corners). The only dashes in the system are on the map's 165 m inspection ring.

### Named Rules
**The Solid Route Rule.** The application's route is a solid, round-capped 4px line, and its lit head (pulse and number tag) rides the tip until the application arrives, when the destination's pulse takes over. Dashes belong to the inspection ring alone, which marks an area, not a path.

## Components

### Buttons
Character: system controls drawn as tinted glass, solid only once pressed.
- **Shape:** gently curved corners (10px).
- **System button:** Lit Cyan text and icon (1.1rem) on a 12% cyan tint with a 1px Lit Cyan border at 50%, 0.7rem 1.2rem padding, 0.95rem at 620.
- **Pressed:** fills solid Lit Cyan with Ink on Cyan. The press is a 0.14s dip to scale 0.93, then a back.out(3) spring.
- **Decision options:** outlined in Strong Hairline (10px, 0.6rem 1rem, 0.9rem Mist Ink, 1.05rem icon). The chosen option fills Shield Leaf with Ink on Leaf at 620 and takes the choice glow. The director's verdict uses larger tiles (14px, Solid Panel, icon in a 2.4rem circle, 1.05rem title over a 0.8rem Haze Ink line) that select with a 1px leaf ring and glow while the other fades to 0.38.
- **No hover:** the deck is driven by keyboard and clicker and the pointer hides after 2.2s; state comes from the step, never from the cursor.

### Chips
- **Style:** pill (999px), 0.3rem 0.72rem, 0.76rem at 520, 0.95rem icon. Neutral chips are outlined in Strong Hairline with Mist Ink.
- **State:** status chips fill solid: Lit Cyan for system events (New, Routed simultaneously), Shield Leaf for done (Accepted, Paid, Signed), Waiting Amber for waiting (Awaiting payment), each with its own deep ink. On paper the status pill sits top right in Deep Amber (Draft) or Deep Leaf (Finalized, with a stamp icon). Progress pills (Review, Analysis, Draft conclusion) fill Lit Cyan as each completes. A status change turns over on its X axis like a split-flap (Awaiting payment to Paid).

### Cards / Containers
The narrative card carries the argument; everything else is evidence.
- **Corner Style:** 16px.
- **Background:** Glass Panel over a 14px backdrop blur (saturate 1.15).
- **Shadow Strategy:** Card hang (see Elevation & Depth).
- **Border:** 1px Hairline.
- **Internal Padding:** 2.1rem 2.3rem 2.2rem, 34rem wide.
- **Anatomy:** the heading first, then one or two sentences, at most one evidence block, an optional source note. On hero, center and top layouts the card drops its panel and its text sits straight on the map; center and top statements carry a soft dark text shadow, the hero byline a ground-colored halo.

**Evidence blocks** sit inside the card, 1.6rem under the sentence:
- **Ticket:** 12px, a 7% Lit Cyan tint with a 32% Lit Cyan border, a 2.4rem icon well (10px), the ID line in Lit Cyan with the number in Mono, the object below at 0.92rem, a chip pushed right. Issued, the whole ticket turns leaf (stamp icon, a Signed, issued chip).
- **Account:** a 12px outlined block with a 6% header strip (icon, title, a New chip), then a two-column field grid with 9% rules; the deadline reads in Waiting Amber with a clock.
- **Coordinates:** a ruled list of numbered rows, each numeral in a 1.4rem Lit Cyan ring, latitude and longitude in Mono.
- **Criteria:** two columns; criteria matched on the map in Frost Ink with Lit Cyan icons, the rest in Haze Ink.
- **Facts:** a hairline-ruled list with Lit Cyan icons.

**System sheet** (a screen of ECO SERVICE): 14px corners, a faint top-lit gradient around Sheet Slate (rgba(14, 22, 30, 0.97) to rgba(9, 15, 21, 0.97)), 1px Hairline, Sheet hang. The header holds the crest (2.3rem), a 1.05rem title over a 0.78rem Haze Ink sub-line, and the ID or a chip pushed right, on a 5% Shield Cyan wash with a hairline below. Rows use the 1.4rem inset and 8% rules, with 2.4rem icon wells (10px, 8% tint). A check draws itself into a 1.7rem leaf-ringed tick. The rating scale is a 6px Track bar filling Lit Cyan to the score, a white 1.1rem knob in a 5px cyan ring at 25%, Mono ends and a 1.6rem Mono value. Until a decision is made the sheet ends at its last check, holding no empty space for what comes later.

**Panel:** Solid Panel, 14px, Panel hang, 1.2rem 1.3rem; a 0.95rem title at 600 with a Lit Cyan icon. History entries are 0.86rem Mist Ink lines with leaf dots.

### Navigation
The docked route rail is the presentation's navigation and its signature: it fills station by station while the camera follows the application.
- **Style:** a 3px Track line from 3% to 97% with eight 1.2rem station dots; labels at 0.8rem with a Mono numeral at 0.64rem.
- **Unreached:** a Night Ground dot in a 2px Idle Ring, Haze Ink label.
- **Current:** Deep Station Cyan fill, Lit Cyan ring, Now halo, Frost Ink label at 620.
- **Done:** solid Shield Leaf with an Ink on Leaf check, Mist Ink label. The Lit Cyan fill runs to the current station over 1.2s and glows.
- **Chrome:** the step counter in Mono at 0.74rem, Mist Ink, current number in Frost Ink at 500 ("04 / 30"); the advance cue is the word Next beside a 2.2rem key cap (8px, Strong Hairline, ground at 60%) holding an arrow. Both carry the ground-colored text halo.
- **Overview and finale:** the same eight stations drawn large (3rem rings, 1.15rem names over 0.8rem descriptions) as Lit Cyan rings; the finale fills them leaf one by one and closes with the leaf bracket over 15–25 working days.

### Transit Diagrams
Every process is drawn as a transit line over the dimmed map.
- **Tracks and routes:** 3px Track, then a 4px Lit Cyan route with round caps and the line glow, drawn on by stroke-dashoffset (0.8–1.3s) while a token rides the same path.
- **Ring stations:** Sheet Slate discs in a 2px Idle Ring with a Haze Ink icon. Current: Deep Station Cyan, a 3px Lit Cyan ring and icon. Done: Deep Station Leaf with a 3px leaf ring. Returned: Deep Station Coral with a 3px coral ring. The ECO SERVICE hub is the crest in a larger disc that sends out one halo pulse.
- **Tokens:** a Lit Cyan capsule (rounded 9 in its drawing) carrying the number in Mono at 600, or a word in Geologica at 660, in Ink on Cyan.
- **Grammar:** a fork for simultaneous routing (with a Routed simultaneously cyan chip), a loop for revision (coral, captioned in coral), a transfer for coordination (a rounded hairline frame around the two divisions, its exit routes in leaf).
- **Labels:** a station name at 1rem and 600 in Frost Ink over a 0.78rem Mist Ink line, max 14rem, under the map text halo.

### Paper Documents
Official documents are flat pale sheets: Official Paper, 3px corners, Paper hang, A-series portrait at min(62vh, 100%), padding 2rem 1.9rem 1.5rem. No gradient, tint or border.
- **Head:** the crest centered (2.8rem), the paper title (0.9rem, 700, 0.08em, capitals), the ID line in gray with the number in Mono and Night Ground, a 24% ink rule below.
- **Fields:** a Mono numeral column (1.5rem), the label at 0.68rem in Paper Gray, the value at 0.86rem and 540 in Night Ground, 14% ink rules. Masked data is a hatched bar at 50% and 28% ink.
- **Sections:** numbered titles at 0.86rem and 620, each with a Deep Leaf check disc that springs in (0.45s) as the section completes, over ruled writing lines at 16%.
- **Signatures:** two columns, each a 60% ink line over its role at 0.68rem. E-IMZO arrives as a record above the line (key icon, "E-IMZO electronic signature", a Signed leaf chip), never as ink.
- **Footer:** 0.68rem Paper Gray, centered over a 24% rule.

### Map Markers
- **Pulse:** a 0.84rem Lit Cyan core with a 2px near-white rim and a glow, and two rings pinging outward (2.6s, scale 1 to 6, 1.3s apart). It turns leaf once the site is accepted or the conclusion is delivered.
- **Tag:** a 9px capsule of Night Ground at 86% with a 45% Lit Cyan border (leaf at 55%), 0.78rem, a document icon in Lit Cyan, "No." then the number in Mono. It sits 1.3rem beside its point, on the side away from the line it trails.
- **The application's head:** a pulse and tag riding the route's tip.
- **Place name:** 0.92rem at 620 under a black text shadow, west of its pulse because the route arrives from the east.
- **Corner badges:** a 6px vertex dot, a 1px Lit Cyan leader, a 1.4rem ringed Mono numeral offset outward.
- **Criteria markers:** a 2.2rem ringed icon disc with a 0.35rem halo at 14%, and a 7px label capsule of ground at 82%, set east or west so labels never collide.
- **Map layers:** the route at 4px in Lit Cyan over a 14px blurred halo at 32% (leaf when the conclusion travels back to the applicant); the border at 1.6px in Lit Cyan over a 16px Shield Cyan bloom; the site outline drawn on over 1.9s with a 12px glow and a 30% fill; the inspection ring dashed (2 / 2.4) at 85% over a 7% fill.

### Step Transitions
- **Leaving:** the card rises 14px and blurs 6px out over 0.36s; a visual rises 16px and blurs 8px out over 0.4s (power2.in).
- **Arriving:** the card comes up from 18px over 0.8s (expo.out); its heading, sentence, block and note follow 0.08s apart, each up from 20px and out of an 8px blur over 1.05s.
- **Phases:** a visual advances by phases on one timeline; jumping or going back rebuilds it and fast-forwards, so the animated and static states always match.
- **Camera:** flights of 3–5.4s (curve 1.3), with route-following flights defaulting to 2.8s; layer changes tween over 1.6s (power2.inOut); the route grows over 2.6s, 3.2s when the head travels the whole way. Once landed, the bearing sways by up to drift × 8° on a 46s cycle.
- **CSS state changes** use the expo curve, cubic-bezier(0.16, 1, 0.3, 1): chrome fades 0.8s, the rail 0.9s, the rail fill 1.2s, station states 0.6s.
- **Reduced motion:** cameras jump, timelines land on their end state, the pulse rings stop.

## Do's and Don'ts

### Do:
- **Do** draw every process as a transit line: a 3px Track, a 4px Lit Cyan route, ring stations in their state colors, a fork for simultaneous routing, a coral loop for revision, a framed transfer for coordination.
- **Do** keep the one application in view: its pulse and number tag mark where it is (the site, then the route's tip), held in the band under the top bar while a visual is up.
- **Do** draw official documents as flat Official Paper (3px corners, crest, numbered hairline-ruled fields or sections, signature lines on what gets signed) and every system screen as a dark sheet.
- **Do** set every value the system holds in Martian Mono and every word in Geologica, splitting within a line where they meet.
- **Do** dim through the in-map veil (0.45–0.75, saturation down to -0.6) so the border, route and markers stay lit above it.
- **Do** halo any text that sits straight on the map with Night Ground (0 0 0.5rem and 0 0 1.2rem).
- **Do** label illustrative screens and sample data with a source note at the card's foot (0.74rem, Haze Ink).
- **Do** step back what is no longer the point by fading it to 0.28–0.38 opacity rather than removing it.
- **Do** keep every word as live text so the deck can be translated; no text is baked into images.

### Don't:
- **Don't** draw the process as boxes and arrows on a white slide.
- **Don't** put leaf, amber or coral on anything that is not a state.
- **Don't** set words in Martian Mono, or the numbers inside headlines and sentences.
- **Don't** draw the application's route dashed or thinner than 4px; dashes belong to the inspection ring alone.
- **Don't** darken the whole map with a flat layer above it; it would bury the lit route and markers. Above the map, only the shade scrim grades the frame's edges.
- **Don't** make a system screen light or an official document dark.
- **Don't** set spaced capitals anywhere but an official paper's title, or put a label above a card's heading.
- **Don't** give elements hover states; state comes from the step, and the pointer hides.
- **Don't** size HTML type in px; the height-locked rem keeps the composition identical on every screen.
