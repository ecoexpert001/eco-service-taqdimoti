# ECO SERVICE · The journey of one application

A full-screen, step-by-step web presentation of ECO SERVICE (eco-service.uz). It follows one sample application (No. 371668581) through the eight stages of state ecological expertise, over a live 3D satellite map of Uzbekistan. 35 steps, about 6 minutes, in Uzbek, Russian and English, with a dark and a light theme.

## Present it

1. Double-click **`present.bat`**. The first run installs dependencies, which takes a minute. After that it builds the latest version and opens it in your browser.
2. Press **F** for full screen.
3. Needs Node.js and an internet connection: the satellite imagery and terrain stream live.

| Action | Keys |
|---|---|
| Next step | Right arrow, Space, Page Down, Enter, a presentation clicker, or left click |
| Previous step | Left arrow, Page Up, Backspace, or right click |
| First / last step | Home / End |
| Full screen | F |
| Language (UZ → RU → EN) | L, or the UZ / RU / EN buttons top right |
| Light / dark theme | T, or the sun / moon button top right |
| Jump to a step | add `#12` to the address |
| Open in a language / theme | add `?lang=ru` or `?theme=light`, e.g. `/?lang=en&theme=light#15` |

The mouse pointer and the language / theme buttons hide themselves after two seconds without movement. The chosen language and theme are remembered in the browser; changing the language reloads the page on the same step.

## Edit it

- **The story** lives in `src/steps.js`: one entry per step, with the card text, the map camera, the visual and the stage rail. Text is written in English and passed through `t()`.
- **Translations** are in `src/locales.js`: the English text is the key, followed by `[Uzbek, Russian]`. When you change an English sentence, change its key there too; a missing key falls back to English and is reported in the browser console during `npm run dev`.
- **Themes**: colour tokens at the top of `src/styles.css` (`:root` is dark, `:root[data-theme=light]` is light); map colours in `PAL` at the top of `src/map.js`.
- **Facts and sample data** (application number, site coordinates, stage names, inspection criteria) are in `src/data.js`. Everything comes from the ECO SERVICE process deck.
- **Map cameras and layers**: `src/map.js` (`CAMERAS` at the top).
- **Restricted-zone layers** (step 12 and the expert's site check): the original KMZ files are in `data-src/kmz/` (water protection zones SMQZ, forestry lands, reservoirs, drinking groundwater deposits). After adding or replacing a KMZ, run `python tools/kmz_to_geojson.py`: it writes simplified GeoJSON to `public/data/zones/`. The presentation checks the site coordinates against these layers in the browser (inside a zone? distance to the nearest one), so the result on screen always matches the data. A new layer needs an entry in `LAYERS` (tool) and `ZONE_LAYERS` (`src/zones.js`).
- **The animated visuals on the right**: `src/visuals.js`.
- **Colours, type and layout**: `src/styles.css` (tokens at the top).

To preview while editing, run `npm run dev` and open http://localhost:5174.

## Sources and credits

- Process, stages and sample data: the ECO SERVICE process deck (`eco-service-presentation-en (3).pptx`).
- Satellite imagery: Esri World Imagery (© Esri, Maxar, Earthstar Geographics). Check Esri's terms of use before a public event or publishing a recording; the tile source is one line in `src/map.js` and can be swapped for a licensed provider.
- Terrain: Mapzen / AWS Terrain Tiles (open data).
- Boundaries: geoBoundaries (CC BY 4.0) and Natural Earth (public domain).
- Map engine: MapLibre GL JS. Animation: GSAP. Icons: Lucide. Fonts: Geologica and Martian Mono (SIL Open Font License).

Inspection markers on the map and the masked personal data are illustrative and labelled as such on screen.
