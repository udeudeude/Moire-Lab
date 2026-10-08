// Moiré Lab: deterministic, resolution-independent vector generators.
// Coordinates are an abstract 120 x 120 square. Export scales them to millimetres.
export const FIELD = 120;
export const PRESETS = {
  tide: { title: 'Tidal lines', description: 'Curved horizontal gratings meet straight acetate lines. Their relative phase makes broad moving currents.' },
  vortex: { title: 'Vortex', description: 'Distorted concentric rings interact with straight acetate lines to produce shifting eddies.' },
  radiance: { title: 'Radiance', description: 'A fan of radial lines intersects a translating linear grating. This is optical interference, not frame animation.' },
  folds: { title: 'Woven folds', description: 'Two aligned gratings, one softly deformed into folds, create sweeping interference bands.' },
  wheel: { title: 'Turning wheel', description: 'Four independently drawn positions are interlaced behind a moving striped barrier. Unlike the moiré studies, this is frame reveal.' },
  fish: { title: 'Swimming fish', description: 'A four-frame drawing is sliced into vertical strips. Move the barrier by one slit width to advance one frame.' },
};
export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(+n) ? +n : lo));
export const fmt = n => Number(n.toFixed(3));
export function spacing(p) {
  // 'pitch' is a real physical distance in mm at the selected print size.
  return clamp(p.pitch, p.mode === 'barrier' ? 2 : .5, p.mode === 'barrier' ? 10 : 3) * FIELD / clamp(p.size, 90, 150);
}
function path(points) {
  return points.map((pt, i) => (i ? 'L' : 'M') + fmt(pt[0]) + ' ' + fmt(pt[1])).join(' ');
}
function horizontalContours(p, kind) {
  const d = [], step = spacing(p), a = clamp(p.amplitude, 0, 100) / 100;
  const amplitude = 11 * a;
  const left = -18, right = FIELD + 18;
  for (let base = -28; base <= FIELD + 28; base += step) {
    const points = [];
    for (let j = 0; j <= 130; j++) {
      const x = left + (right - left) * j / 130;
      let deflection;
      if (kind === 'tide') {
        deflection = amplitude * (0.67 * Math.sin(x * .072 + base * .013) + 0.33 * Math.sin(x * .16 - base * .016));
      } else {
        deflection = amplitude * (.58 * Math.sin(x * .048 + base * .027) * Math.cos(x * .018) +
          .36 * Math.sin(x * .11 - base * .011));
      }
      points.push([x, base + deflection]);
    }
    d.push(path(points));
  }
  return d;
}
function circles(p) {
  const ds = [], step = spacing(p), a = clamp(p.amplitude, 0, 100) / 100;
  for (let r = step; r < 101; r += step) {
    const points = [];
    for (let j = 0; j <= 224; j++) {
      const theta = Math.PI * 2 * j / 224;
      const rr = r + 7.5 * a * Math.sin(theta * 5 + r * .036);
      points.push([60 + Math.cos(theta) * rr, 60 + Math.sin(theta) * rr]);
    }
    ds.push(path(points) + ' Z');
  }
  return ds;
}
function rays(p) {
  const ds = [], step = spacing(p), a = clamp(p.amplitude, 0, 100) / 100;
  const n = Math.ceil(2 * Math.PI * 62 / step);
  for (let i = 0; i < n; i++) {
    const t = 2 * Math.PI * i / n, points = [];
    for (let j = 0; j <= 68; j++) {
      const r = 2 + 112 * j / 68;
      const theta = t + a * .22 * Math.sin(r * .045 + t * 3);
      points.push([60 + r * Math.cos(theta), 60 + r * Math.sin(theta)]);
    }
    ds.push(path(points));
  }
  return ds;
}
export function moireInk(p) {
  const d = (p.preset === 'vortex') ? circles(p) :
    (p.preset === 'radiance') ? rays(p) :
      horizontalContours(p, p.preset === 'folds' ? 'folds' : 'tide');
  const width = fmt(spacing(p) * .36);
  return '<g fill="none" stroke="#172c29" stroke-width="' + width +
    '" stroke-linejoin="round" stroke-linecap="round">' +
    d.map(v => '<path d="' + v + '"/>').join('') + '</g>';
}
export function moireAcetate(p) {
  const step = spacing(p);
  const d = [];
  for (let y = -175; y <= 290; y += step) d.push('M -175 ' + fmt(y) + ' H 295');
  return '<g transform="rotate(' + fmt(clamp(p.angle, -12, 12)) + ' 60 60)" fill="none" stroke="#121c1a" stroke-width="' +
    fmt(step * .38) + '" stroke-linecap="butt"><path d="' + d.join(' ') + '"/></g>';
}
function barrierWheel(frame, a) {
  const turn = frame * (Math.PI / 8) * (.25 + a * 1.6);
  const spokes = [];
  for (let i = 0; i < 8; i++) {
    const t = turn + i * Math.PI / 4;
    spokes.push('<path d="M 60 60 L ' + fmt(60 + 34 * Math.cos(t)) + ' ' + fmt(60 + 34 * Math.sin(t)) + '"/>');
  }
  return '<circle cx="60" cy="60" r="44" fill="none" stroke-width="3"/>' +
    '<circle cx="60" cy="60" r="38" fill="none" stroke-width="1.1"/>' +
    '<g stroke-width="3">' + spokes.join('') + '</g>' +
    '<circle cx="60" cy="60" r="7" fill="#d66044" stroke-width="2"/>' +
    '<circle cx="60" cy="60" r="2.3" fill="#fff"/>' +
    '<path d="M 12 104 H 108" stroke-width="1.2" opacity=".3"/>';
}
function barrierFish(frame, a) {
  const swing = (frame % 4 === 0 ? 0 : frame === 1 ? 1 : frame === 2 ? 0 : -1) * 9 * a;
  const x = (frame - 1.5) * 5 * a;
  const tailX = -24 - swing;
  return '<g transform="translate(' + fmt(x) + ' 0)">' +
    '<path d="M 32 61 C 47 41 80 39 95 60 C 81 81 49 81 32 61 Z" fill="#ebbe84" stroke-width="2"/>' +
    '<path d="M 33 61 L ' + fmt(tailX + 44) + ' ' + fmt(39 + swing) + ' L ' +
    fmt(tailX + 44) + ' ' + fmt(83 - swing) + ' Z" fill="#d66044" stroke-width="2"/>' +
    '<path d="M 55 46 Q 66 34 75 47 M 52 76 Q 65 86 73 76" fill="none" stroke-width="1.7"/>' +
    '<circle cx="84" cy="56" r="3.4" fill="#172c29" stroke="none"/>' +
    '<path d="M 85 69 Q 93 65 94 61" fill="none" stroke-width="1.5"/>' +
    '</g><g fill="none" stroke-width="1.6" opacity=".65"><circle cx="' + fmt(98 + frame * 1.2) +
    '" cy="34" r="5"/><circle cx="110" cy="' + fmt(22 - frame * 1.5) + '" r="3"/></g>';
}
export function frameArtwork(p, i) {
  const a = clamp(p.amplitude, 0, 100) / 100;
  return '<g stroke="#172c29" stroke-linecap="round" stroke-linejoin="round">' +
    (p.preset === 'fish' ? barrierFish(i, a) : barrierWheel(i, a)) + '</g>';
}
// Each narrow SVG has its own native viewport; unlike URL-based clipPaths,
// these slices render consistently in mobile Safari even when injected as SVG.
export function barrierInk(p) {
  const step = spacing(p), frames = 4, slot = step / frames;
  const art = Array.from({length:frames}, (_,i) => frameArtwork(p,i));
  const stripes = [];
  for (let k = -1; k * step < FIELD + step; k++) {
    for (let frame = 0; frame < frames; frame++) {
      const x = k * step + frame * slot;
      if (x + slot <= 0 || x >= FIELD) continue;
      const left = Math.max(0, x), right = Math.min(FIELD, x+slot);
      const width = right-left;
      if (width < .0001) continue;
      // Match local viewBox coordinates to pixel geometry exactly.
      stripes.push('<svg x="' + fmt(left) + '" y="0" width="' + fmt(width) +
        '" height="120" viewBox="' + fmt(left) + ' 0 ' + fmt(width) +
        ' 120" preserveAspectRatio="none" overflow="hidden">' + art[frame] + '</svg>');
    }
  }
  return '<g class="interlaced-ink">' + stripes.join('') + '</g>';
}
export function barrierAcetate(p) {
  const step = spacing(p), slot = step / 4;
  let bars = '';
  for (let x = -step * 26; x < FIELD + step * 26; x += step) {
    bars += '<rect x="' + fmt(x + slot) + '" y="-160" width="' + fmt(step - slot) + '" height="440"/>';
  }
  return '<g fill="#101d1b">' + bars + '</g>';
}
export const ink = p => p.mode === 'barrier' ? barrierInk(p) : moireInk(p);
export const acetate = p => p.mode === 'barrier' ? barrierAcetate(p) : moireAcetate(p);
export function experimentMarkup(p) {
  return '<defs><clipPath id="lab-clip"><rect x="0" y="0" width="120" height="120"/></clipPath></defs>' +
    '<rect x="0" y="0" width="120" height="120" fill="#faf7ee"/>' +
    '<g clip-path="url(#lab-clip)">' + ink(p) +
    '<g id="acetate-layer"><g id="acetate-shift">' + acetate(p) + '</g></g></g>';
}
function cross(x, y) {
  return '<path d="M ' + fmt(x - 4) + ' ' + fmt(y) + ' h 8 M ' + fmt(x) + ' ' +
    fmt(y - 4) + ' v 8" stroke="#6d867c" stroke-width=".22" fill="none"/>';
}
function escapeXml(s) {
  return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
export function paperDimensions(p = {}) {
  return p.paper === 'a4' ? {w:210, h:297, name:'A4'} : {w:215.9, h:279.4, name:'US Letter'};
}
function sheetStart(label, p) {
  const page = paperDimensions(p);
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + page.w + 'mm" height="' + page.h +
    'mm" viewBox="0 0 ' + page.w + ' ' + page.h + '">' +
    '<title>' + escapeXml(label) + '</title><desc>True-size vector artwork for the selected paper size. Print at 100 percent scale, without fit to page.</desc>';
}
function sheetFooter(text, p) {
  const h = paperDimensions(p).h;
  return '<text x="15" y="' + fmt(h-28) + '" font-family="Arial,sans-serif" font-size="3.2" fill="#364842">' +
    escapeXml(text) + '</text>' +
    '<path d="M 15 ' + fmt(h-19) + ' H 65" stroke="#172c29" stroke-width=".4"/>' +
    '<path d="M 15 ' + fmt(h-21) + ' V ' + fmt(h-17) + ' M 65 ' + fmt(h-21) + ' V ' + fmt(h-17) +
    '" stroke="#172c29" stroke-width=".4"/>' +
    '<text x="40" y="' + fmt(h-13) + '" font-family="Arial,sans-serif" font-size="3" text-anchor="middle">50 mm reference ruler</text></svg>';
}
export function printSheet(p, kind) {
  const size = clamp(p.size, 90, 150), x = (paperDimensions(p).w - size) / 2, y = 60, scale = size / FIELD;
  const base = kind === 'base';
  const label = 'MOIRÉ LAB / ' + (base ? 'PICTURE' : 'TRANSPARENT ACETATE') + ' / ' + p.preset;
  let svg = sheetStart(label,p);
  svg += '<text x="15" y="20" font-family="Georgia,serif" font-size="8" font-weight="bold" fill="#172c29">MOIRÉ LAB</text>' +
    '<text x="15" y="29" font-family="Arial,sans-serif" font-size="3.6" fill="#52665d">' +
    escapeXml(base ? '01 / ORIGINAL PICTURE · PRINT ON PAPER' : '02 / MOVING GRID · PRINT ON CLEAR ACETATE') + '</text>' +
    '<text x="15" y="37" font-family="Arial,sans-serif" font-size="3.3" fill="#52665d">' +
    escapeXml(p.mode + ' / ' + p.preset + ' / ' + p.pitch.toFixed(2) + ' mm pitch / ' + size + ' mm square') + '</text>';
  if (base) {
    svg += '<rect x="' + fmt(x) + '" y="' + y + '" width="' + size +
      '" height="' + size + '" fill="#fff"/>' +
      '<svg x="' + fmt(x) + '" y="' + y + '" width="' + size + '" height="' + size +
      '" viewBox="0 0 120 120">' + ink(p) + '</svg>';
  } else {
    // The bleed allows the acetate to keep covering the picture while sliding.
    svg += '<defs><clipPath id="acetate-bleed"><rect x="' + fmt(x - 9) + '" y="' + (y - 9) +
      '" width="' + (size + 18) + '" height="' + (size + 18) + '"/></clipPath></defs>' +
      '<g clip-path="url(#acetate-bleed)"><g transform="translate(' + fmt(x) + ' ' + y +
      ') scale(' + fmt(scale) + ')">' + acetate(p) + '</g></g>';
  }
  // Registration marks match both exports and remain outside the visible art.
  for (const cx of [x - 12, x + size + 12]) for (const cy of [y - 12, y + size + 12]) svg += cross(cx, cy);
  svg += '<rect x="' + fmt(x) + '" y="' + y + '" width="' + size +
    '" height="' + size + '" stroke="#9aa99e" stroke-width=".15" fill="none" stroke-dasharray="1 1"/>';
  return svg + sheetFooter(base ?
    'Match the crosses with the acetate. Artwork is stationary.' :
    'Use transparency film. Trim if desired; keep the moving grid larger than the picture.', p);
}
export function calibrationSheet(p = {}) {
  let svg = sheetStart('MOIRÉ LAB / PRINT CALIBRATION',p);
  svg += '<text x="15" y="21" font-family="Georgia,serif" font-weight="bold" font-size="9">PRINT CALIBRATION</text>' +
    '<text x="15" y="30" font-family="Arial,sans-serif" font-size="3.8">Print at 100% / no scaling / measure the 50 mm bar.</text>';
  const tests = [.6, .8, 1, 1.2, 1.5, 2];
  tests.forEach((step, i) => {
    const top = 47 + 29 * i;
    svg += '<text x="16" y="' + (top - 3) + '" font-family="Arial,sans-serif" font-size="3.4">' +
      step.toFixed(2) + ' mm pitch / ' + Math.round(25.4 / step) + ' lines per inch</text>';
    svg += '<rect x="16" y="' + top + '" width="178" height="20" fill="white" stroke="#a7b3ac" stroke-width=".2"/>';
    for (let x = 16; x < 194; x += step) {
      svg += '<path d="M ' + fmt(x) + ' ' + top + ' V ' + (top + 20) +
        '" stroke="#172c29" stroke-width="' + fmt(step * .38) + '"/>';
    }
  });
  return svg + sheetFooter('Use the coarsest clean, distinct grid that gives the effect you want.',p);
}
