# Moiré Lab

**A pocket optical playground, with printed books as the destination.**

[Moiré Lab on GitHub Pages](https://udeudeude.github.io/Moire-Lab/) · [Source](https://github.com/udeudeude/Moire-Lab)

The project began with an interest in Bliss, Sands & Co.'s *The Magic Moving Picture Book*. Its organizing principle is simple: move a patterned transparent sheet across stationary ink and something in the image appears to move. This app provides **real superimposed vector line fields**, not a video that merely imitates their appearance.

## What's in draft 0.1

- **True moiré mode (primary):** four procedural experiments: tidal lines, vortex, radiance, woven folds. Slide a second grating by touch, slider, arrow keys or automatic playback. Adjust pitch, distortion and angular misalignment.
- **Barrier-grid mode (secondary):** a mechanically different four-frame interlacing experiment, with rotating wheel and swimming fish presets.
- **Phone-first:** touch controls, responsive interface, settings stored locally, standalone web manifest, and offline cache after a successful visit.
- **Print:** separately downloadable original and transparent ink-grid **SVGs**, in US Letter or A4, sized in real millimetres. Square artwork at 90, 120 or 150 mm. Each pair includes identical registration crosses. A 0.6–2.0 mm calibration sheet tests the printer.

There are no frameworks, subscriptions, external CDNs, telemetry or generated images.

## Try it

Open **https://udeudeude.github.io/Moire-Lab/** on a phone or desktop once GitHub Pages has deployed the repository.

If the URL is not live, select **Settings → Pages → Build and deployment → GitHub Actions** in this repository, then rerun **Actions → Verify and publish Moiré Lab**. Deployment is configured in `.github/workflows/pages.yml`. The automated workflow runs vector and JavaScript checks before publication.

For a local server:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Because it uses ES modules, launching `index.html` directly as a `file:` URL is not supported by every browser.

## Printing the first optical pair

1. Pick a mode, preset, line spacing and artwork size. Select the actual paper format: **US Letter or A4**.
2. Download **Picture**, **Acetate**, and the **Calibration sheet**.
3. Print the picture on ordinary paper and the acetate artwork on **laser/inkjet-compatible transparency film**, using actual size / 100%; disable Fit to Page and all automatic scaling.
4. Confirm the reference bar is **50 mm**, and that the intended pitch prints as fine distinct lines. If it merges or looks irregular, increase line spacing.
5. Align the crosses on the two sheets, then slide the acetate **vertically for moiré** or **horizontally for barrier-grid animation**. The overlay has a 9 mm patterned bleed on every side so it can move without uncovering the art. Registration marks are outside that bleed.

**Important:** Screen previews can show extra moiré caused by the phone's pixel matrix and resampling. The authoritative physical pitch is the dimension in the exported SVG; never judge print quality solely from the phone preview. Some printers or SVG/PDF viewers ignore intended dimensions, hence the calibration ruler.

**Physical distinction:** In true moiré experiments, both images are *gratings*. No still frame sequence is encoded. In barrier-grid experiments, the drawing is segmented into separate frames and the acetate is an opaque slit mask. Both use physical overlays, but are different optical mechanisms.

## Design and implementation

`geometry.js` is deliberately UI-independent. It generates the base ink, overlay lines, screen SVG markup, printable independent SVG sheets, and calibration. Coordinates are normalized to a 120-unit square; the print export converts physical millimetres to SVG coordinate units. `app.js` manages input, drag/play, state and downloads. `test/geometry.test.js` verifies pitch conversion, all presets, the masks and print geometry.

Run `npm test` or `node --test` on Node 22+. No package installation is necessary.

## Next experiments

- [ ] **True-moiré narrative scenes:** driven wheels, moving smoke, flowing water and flames, rather than only abstract line fields; study how to tailor phase maps to an actual image.
- [ ] A two-sheet print preview including trim/crop contours, negative/positive ink options, live magnification and printer registration controls.
- [ ] Import user-made SVG paths and convert them into line-field masks, or (separately) into interlaced barrier-grid frames.
- [ ] Multi-panel spreads and an actual **book layout**: turn pages, acetate pocket, binding constraints, safe areas and export.
- [ ] Export directly to PDF, including printable printer tests and accurate inches/mm metadata.
- [ ] Photograph/scan the physical tests; compare apparent motion and tolerances across printers, film, pitches and viewing distances.
- [ ] Expand barrier animation to arbitrary frame sets, with editable frame timing and shape imports.
- [ ] More accessible visual settings, color experiments, and low-ink/high-contrast options.

Version 0.1 is a workshop, not yet a book-layout tool. Its first purpose is to find which optical designs are worth putting on paper.

## Credits

Inspired by the optical principle illustrated by *The Magic Moving Picture Book* (Bliss, Sands & Co.), with no claim that its historical images or publishing rights are reproduced here.

Released under the MIT License.
