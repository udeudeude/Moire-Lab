import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRESETS, spacing, experimentMarkup, moireInk, moireAcetate,
  barrierInk, barrierAcetate, frameArtwork, printSheet, calibrationSheet
} from '../geometry.js';

const moire = { mode:'moire', preset:'tide', pitch:1, amplitude:50, angle:0, speed:1, size:120, paper:'letter', phase:0 };
const barrier = { ...moire, mode:'barrier', preset:'wheel', pitch:5.6 };

test('all four moire experiments are genuine vector line fields', () => {
  for (const preset of ['tide','vortex','radiance','folds']) {
    const s = moireInk({ ...moire, preset });
    assert.match(s, /<path d=/);
    assert.match(s, /stroke-width=/);
    assert.doesNotMatch(s, /<image|<animate|data:image|frame/);
    assert.ok(s.length > 3000, preset + ' has a nontrivial line field');
    assert.ok(PRESETS[preset]);
  }
});

test('moire acetate is real transparent lines, not a solid photograph', () => {
  const s = moireAcetate({ ...moire, angle:6 });
  assert.match(s, /rotate\(6 60 60\)/);
  assert.match(s, /stroke="#121c1a"/);
  assert.doesNotMatch(s, /fill="#fff"|<image/);
  assert.ok(s.includes('M -175'));
});

test('pitch converts to print size with consistent physical millimetres', () => {
  for (const size of [90,120,150]) {
    for (const pitch of [.6,1,1.8,2.4]) {
      const mm = spacing({ ...moire, size, pitch }) * size / 120;
      assert.ok(Math.abs(mm - pitch) < 1e-10);
    }
  }
});

test('barrier mode interlaces four genuinely different illustrations', () => {
  const s = barrierInk(barrier);
  const strips = (s.match(/<svg x=/g) || []).length;
  assert.ok(strips > 20, 'Every interlaced strip should have a visible SVG viewport');
  assert.equal((s.match(/<\/svg>/g) || []).length, strips);
  assert.doesNotMatch(s, /<clipPath|clip-path=/);
  assert.match(s, /viewBox="/);
  assert.match(s, /overflow="hidden"/);
  assert.notEqual(frameArtwork(barrier, 0), frameArtwork(barrier, 1));
  const fish = { ...barrier, preset:'fish' };
  assert.notEqual(frameArtwork(fish, 1), frameArtwork(fish, 3));
  assert.match(barrierAcetate(barrier), /<rect/);
  const noMask = experimentMarkup(barrier).replace(/<g id="acetate-layer">[\s\S]*?<\/g><\/g><\/g>$/, '');
  assert.match(noMask, /class="interlaced-ink"/, 'Base wheel must exist independently of overlay');
});

test('stage contains a separable movable overlay with 120-unit view geometry', () => {
  for (const p of [moire,barrier]) {
    const s = experimentMarkup(p);
    assert.match(s, /id="lab-clip"/);
    assert.match(s, /id="acetate-layer"/);
    assert.match(s, /id="acetate-shift"/);
    assert.match(s, /clip-path="url\(#lab-clip\)"/);
  }
});

test('paper and transparent acetate are different, registration-matched A4 SVG files', () => {
  for (const p of [moire,barrier]) {
    const a = printSheet(p,'acetate');
    const b = printSheet(p,'base');
    for (const s of [a,b]) {
      assert.match(s, /xmlns="http:\/\/www.w3.org\/2000\/svg"/);
      assert.match(s, /width="215.9mm" height="279.4mm"/);
      assert.match(s, /50 mm reference ruler/);
      assert.match(s, /100 percent scale/);
      assert.ok(s.endsWith('</svg>'));
      assert.doesNotMatch(s, /NaN|Infinity|undefined/);
    }
    assert.match(a, /acetate-bleed/);
    assert.match(b, /fill="#fff"/);
    assert.notEqual(a,b);
    assert.equal((a.match(/stroke="#6d867c"/g)||[]).length,4);
    assert.equal((b.match(/stroke="#6d867c"/g)||[]).length,4);
  }
});

test('calibration contains six real line pitches and a 50 mm ruler', () => {
  const s = calibrationSheet();
  assert.equal((s.match(/lines per inch/g)||[]).length, 6);
  assert.match(s, /50 mm reference ruler/);
  assert.match(s, /0.60 mm pitch/);
  assert.match(s, /2.00 mm pitch/);
});

test('extreme allowed values remain finite and exportable', () => {
  for (const pitch of [.6,2.4]) {
    const s = printSheet({...moire, size:150, pitch, amplitude:100, angle:-12},'base');
    assert.ok(s.length > 5000);
    assert.doesNotMatch(s, /NaN|Infinity/);
  }
});

test('A4 exports retain their own page dimensions, without scaling the drawing', () => {
  const s = printSheet({...moire, paper:'a4'}, 'base');
  assert.match(s, /width="210mm" height="297mm"/);
  assert.match(s, /120 mm square/);
});
