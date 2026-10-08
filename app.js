import { PRESETS, FIELD, clamp, experimentMarkup, printSheet, calibrationSheet } from './geometry.js';

const $ = id => document.getElementById(id);
const defaults = {
  moire: { mode:'moire', preset:'circles', pitch:1, amplitude:60, angle:0, speed:1, size:120, paper:'letter', phase:0, shiftX:0, shiftY:0 },
  barrier: { mode:'barrier', preset:'wheel', pitch:5.6, amplitude:65, angle:0, speed:1, size:120, paper:'letter', phase:0, shiftX:0, shiftY:0 }
};
const state = { mode:'moire', moire:{...defaults.moire}, barrier:{...defaults.barrier}, overlay:true, playing:false };
const allowed = { moire:['circles','squares','engine','sailboat','tide','vortex','radiance','folds'], barrier:['wheel','fish'] };
const ranges = { pitch: [0.6,8], amplitude:[0,100], angle:[-180,180], speed:[.2,3], size:[90,150] };

try {
  const saved = JSON.parse(localStorage.getItem('moire-lab-v1') || 'null');
  if (saved && (saved.mode === 'moire' || saved.mode === 'barrier')) {
    state.mode = saved.mode;
    for (const mode of ['moire','barrier']) {
      if (!saved[mode] || typeof saved[mode] !== 'object') continue;
      const d = defaults[mode], s = saved[mode];
      for (const key of ['pitch','amplitude','angle','speed','size']) {
        if (typeof s[key] === 'number' && Number.isFinite(s[key])) state[mode][key] = clamp(s[key], ...ranges[key]);
      }
      if (allowed[mode].includes(s.preset)) state[mode].preset = s.preset;
      if (s.paper === 'letter' || s.paper === 'a4') state[mode].paper = s.paper;
      state[mode].phase = 0;
      state[mode].shiftX = typeof s.shiftX === 'number' && Number.isFinite(s.shiftX) ? clamp(s.shiftX,-240,240) : 0;
      state[mode].shiftY = typeof s.shiftY === 'number' && Number.isFinite(s.shiftY) ? clamp(s.shiftY,-240,240) : 0;
    }
    state.overlay = saved.overlay !== false;
  }
} catch { /* Private browsing or unavailable storage should never prevent the lab opening. */ }

let frameHandle = 0, lastFrame = 0, paintPending = false;
const activePointers = new Map();
let gesture = null;
const current = () => state[state.mode];
const modeMoire = $('modeMoire'), modeBarrier = $('modeBarrier');
const stage = $('stage'), experiment = $('experiment');
const phaseRange = $('phaseRange'), playButton = $('playButton');
const controls = {
  pitch: $('pitchRange'), amplitude:$('amplitudeRange'),
  angle:$('angleRange'), speed:$('speedRange'), size:$('sizeSelect')
};
const printSize = $('sizeSelect');
function persist() {
  try {
    localStorage.setItem('moire-lab-v1', JSON.stringify({
      mode:state.mode, moire:state.moire, barrier:state.barrier, overlay:state.overlay
    }));
  } catch { /* App works without storage. */ }
}
function populatePresets() {
  const s = $('presetSelect');
  const labels = {
    circles:'Magic circles · four studies',
    squares:'Magic squares · four studies',
    engine:'Smoking engine · moving smoke',
    sailboat:'Sailboat at sea · water and clouds',
    tide:'Tidal lines · rolling water',
    vortex:'Vortex · warped rings',
    radiance:'Radiance · radial field',
    folds:'Woven folds · soft interference',
    wheel:'Turning wheel · four frames',
    fish:'Swimming fish · four frames'
  };
  s.replaceChildren();
  for (const key of allowed[state.mode]) {
    const opt = document.createElement('option');
    opt.value = key; opt.textContent = labels[key]; s.append(opt);
  }
}
function populateChoices() {
  const choices = $('experimentChoices');
  choices.replaceChildren();
  const names = {
    circles:'Magic circles', squares:'Magic squares', engine:'Smoking engine', sailboat:'Sailboat',
    tide:'Tidal lines', vortex:'Vortex', radiance:'Radiance', folds:'Woven folds',
    wheel:'Turning wheel', fish:'Swimming fish'
  };
  const presets = allowed[state.mode], p = current();
  for (const preset of presets) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'experiment-choice';
    b.dataset.preset = preset;
    b.setAttribute('aria-pressed', String(p.preset === preset));
    b.textContent = names[preset];
    choices.append(b);
  }
  $('experimentCount').textContent = (presets.indexOf(p.preset) + 1) + ' OF ' + presets.length;
}
function updateReadouts() {
  const p = current();
  $('pitchOut').textContent = p.pitch.toFixed(2) + ' mm';
  $('amplitudeOut').textContent = Math.round(p.amplitude) + '%';
  $('angleOut').textContent = p.angle.toFixed(1).replace('.0','') + '°';
  $('speedOut').textContent = p.speed.toFixed(1) + '×';
  $('phaseReadout').textContent = p.phase.toFixed(2) + ' mm';
}
function syncControls() {
  const p = current(), moire = state.mode === 'moire';
  modeMoire.classList.toggle('active', moire);
  modeBarrier.classList.toggle('active', !moire);
  modeMoire.setAttribute('aria-pressed', String(moire));
  modeBarrier.setAttribute('aria-pressed', String(!moire));
  populatePresets();
  populateChoices();
  $('presetSelect').value = p.preset;
  controls.pitch.min = moire ? '0.6' : '2';
  controls.pitch.max = moire ? '2.4' : '8';
  controls.pitch.step = moire ? '0.05' : '0.2';
  controls.angle.disabled = false;
  controls.angle.title = 'Rotate the real acetate pattern, including with a two-finger gesture';
  for (const key of Object.keys(controls)) controls[key].value = String(p[key]);
  $('paperSelect').value = p.paper;
  const phase = phaseRange;
  phase.min = moire ? String(-p.pitch) : '0';
  phase.max = String(p.pitch);
  phase.step = '.01';
  phase.value = String(clamp(p.phase, Number(phase.min), Number(phase.max)));
  $('techniqueLabel').textContent = moire ? 'TRUE MOIRÉ / OVERLAPPING GRIDS' : 'BARRIER GRID / FRAME REVEAL';
  const n = allowed[state.mode].indexOf(p.preset);
  $('figureNumber').textContent = String(moire ? n + 1 : n + 5).padStart(2,'0');
  $('experimentTitle').textContent = PRESETS[p.preset].title;
  $('stageFootnote').textContent = PRESETS[p.preset].description;
  $('overlayButton').textContent = state.overlay ? 'Overlay on' : 'Overlay off';
  $('overlayButton').setAttribute('aria-pressed', String(state.overlay));
  $('dragInstruction').textContent = moire ? 'DRAG TO MOVE · TWO FINGERS TO TURN' : 'SLIDE & TURN THE GRID';
  $('dragIcon').textContent = moire ? '↕' : '↔';
  phaseRange.setAttribute('aria-label', moire ? 'Slide acetate vertically' : 'Slide acetate horizontally');
  stage.style.cursor = moire ? 'ns-resize' : 'ew-resize';
  stage.setAttribute('aria-label', 'Interactive ' + (moire ? 'moiré' : 'barrier') + ' experiment. ' +
    (moire ? 'Drag up or down' : 'Drag left or right') + ' to move the acetate.');
  updateReadouts();
}
function applyPhase() {
  const p = current();
  const factor = FIELD / p.size;
  const v = p.phase * factor;
  const x = (p.shiftX||0)*factor + (state.mode === 'barrier' ? v : 0);
  const y = (p.shiftY||0)*factor + (state.mode === 'moire' ? v : 0);
  const g = $('acetate-shift');
  if (g) g.setAttribute('transform', 'translate(' + x.toFixed(5) + ' ' + y.toFixed(5) + ')');
  const rotation = $('acetate-rotation');
  if (rotation) rotation.setAttribute('transform', 'rotate(' + p.angle.toFixed(4) + ' 60 60)');
  phaseRange.value = String(clamp(p.phase, Number(phaseRange.min), Number(phaseRange.max)));
  $('phaseReadout').textContent = p.phase.toFixed(2) + ' mm';
}
function render() {
  paintPending = false;
  experiment.innerHTML = experimentMarkup(current());
  const layer = $('acetate-layer');
  if (layer) layer.style.display = state.overlay ? '' : 'none';
  applyPhase();
}
function queueRender() {
  if (!paintPending) {
    paintPending = true;
    requestAnimationFrame(render);
  }
}
function stopPlaying() {
  state.playing = false; lastFrame = 0;
  if (frameHandle) cancelAnimationFrame(frameHandle);
  frameHandle = 0;
  $('playGlyph').textContent = '▶';
  $('playText').textContent = 'Play motion';
  playButton.setAttribute('aria-label', 'Play animation');
}
function tick(now) {
  if (!state.playing) return;
  if (lastFrame) {
    const dt = Math.min(.08, (now - lastFrame) / 1000), p = current();
    const oldPhase = p.phase, period = p.pitch;
    p.phase = ((oldPhase + dt * p.speed * period * .67) % period + period) % period;
    applyPhase();
  }
  lastFrame = now;
  frameHandle = requestAnimationFrame(tick);
}
function togglePlay() {
  if (state.playing) { stopPlaying(); return; }
  state.playing = true;
  $('playGlyph').textContent = 'Ⅱ';
  $('playText').textContent = 'Pause motion';
  playButton.setAttribute('aria-label', 'Pause animation');
  lastFrame = 0;
  frameHandle = requestAnimationFrame(tick);
}
function setMode(mode) {
  if (mode === state.mode) return;
  stopPlaying();
  state.mode = mode;
  syncControls(); render(); persist();
}
modeMoire.addEventListener('click', () => setMode('moire'));
modeBarrier.addEventListener('click', () => setMode('barrier'));
function choosePreset(preset) {
  if (!allowed[state.mode].includes(preset)) return;
  stopPlaying();
  current().preset = preset;
  current().phase = 0;
  syncControls(); render(); persist();
}
$('presetSelect').addEventListener('change', e => choosePreset(e.target.value));
$('experimentChoices').addEventListener('click', e => {
  const button = e.target.closest('button[data-preset]');
  if (button) choosePreset(button.dataset.preset);
});
for (const key of ['pitch','amplitude','angle','speed']) {
  controls[key].addEventListener('input', e => {
    const p = current();
    p[key] = Number(e.target.value);
    if (key === 'pitch') {
      p.phase = 0;
      phaseRange.min = state.mode === 'moire' ? String(-p.pitch) : '0';
      phaseRange.max = String(p.pitch);
      phaseRange.value = '0';
    }
    updateReadouts();
    if (key === 'angle') applyPhase();
    else if (key !== 'speed') queueRender();
    persist();
  });
}
printSize.addEventListener('change', e => {
  current().size = Number(e.target.value); current().phase = 0;
  syncControls(); queueRender(); persist();
});
$('paperSelect').addEventListener('change', e => {
  current().paper = e.target.value === 'a4' ? 'a4' : 'letter';
  persist();
});
phaseRange.addEventListener('input', e => {
  stopPlaying(); current().phase = Number(e.target.value); applyPhase();
});
playButton.addEventListener('click', togglePlay);
$('overlayButton').addEventListener('click', () => {
  state.overlay = !state.overlay;
  const layer = $('acetate-layer');
  if (layer) layer.style.display = state.overlay ? '' : 'none';
  syncControls(); persist();
});
$('resetButton').addEventListener('click', () => {
  stopPlaying();
  Object.assign(current(), {phase:0,shiftX:0,shiftY:0,angle:0});
  syncControls(); applyPhase(); persist();
});
$('defaultsButton').addEventListener('click', () => {
  stopPlaying(); state[state.mode] = {...defaults[state.mode]};
  syncControls(); render(); persist();
});
// Pointer Events work with both finger touches and Mac trackpad/mouse input.
// Rebase on each addition/removal so a second finger never makes the grid jump.
const normalizeAngle = a => ((a+180)%360+360)%360-180;
function sampleGesture() {
  const points = [...activePointers.values()];
  if (!points.length) return null;
  const center = {
    x: points.reduce((s,v)=>s+v.x,0)/points.length,
    y: points.reduce((s,v)=>s+v.y,0)/points.length
  };
  const orientation = points.length >= 2 ?
    Math.atan2(points[1].y-points[0].y,points[1].x-points[0].x) : null;
  return {center,orientation};
}
function rebaseGesture() {
  const info = sampleGesture(), p=current();
  if (!info) { gesture=null; return; }
  gesture={...info,phase:p.phase,shiftX:p.shiftX||0,shiftY:p.shiftY||0,angle:p.angle};
}
function wrapPhase(phase,period,moire) {
  if (moire) return ((phase+period)%(2*period)+2*period)%(2*period)-period;
  return ((phase%period)+period)%period;
}
function movePointers() {
  const info=sampleGesture();
  if (!info || !gesture) return;
  const bounds=stage.getBoundingClientRect();
  if (!bounds.width) return;
  const p=current();
  const dx=(info.center.x-gesture.center.x)/bounds.width*p.size;
  const dy=(info.center.y-gesture.center.y)/bounds.width*p.size;
  if (state.mode==='moire') {
    p.phase=wrapPhase(gesture.phase+dy,p.pitch,true);
    p.shiftX=gesture.shiftX+dx;
    p.shiftY=gesture.shiftY;
  } else {
    p.phase=wrapPhase(gesture.phase+dx,p.pitch,false);
    p.shiftY=gesture.shiftY+dy;
    p.shiftX=gesture.shiftX;
  }
  if (info.orientation !== null && gesture.orientation !== null) {
    const delta=Math.atan2(Math.sin(info.orientation-gesture.orientation),
                           Math.cos(info.orientation-gesture.orientation));
    p.angle=normalizeAngle(gesture.angle+delta*180/Math.PI);
  }
  applyPhase();
  controls.angle.value=p.angle;
  $('angleOut').textContent=p.angle.toFixed(1).replace('.0','')+'°';
  // Incremental rebasing permits a continuous turn across the ±180° seam.
  rebaseGesture();
}
stage.addEventListener('pointerdown',e=>{
  if (e.pointerType==='mouse' && e.button!==0) return;
  stopPlaying();
  activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  stage.setPointerCapture(e.pointerId);
  rebaseGesture();
  e.preventDefault();
});
stage.addEventListener('pointermove',e=>{
  if (!activePointers.has(e.pointerId)) return;
  activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  movePointers();
  e.preventDefault();
});
function endPointer(e) {
  if (!activePointers.has(e.pointerId)) return;
  activePointers.delete(e.pointerId);
  if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
  rebaseGesture();
  persist();
}
stage.addEventListener('pointerup',endPointer);
stage.addEventListener('pointercancel',endPointer);
stage.addEventListener('lostpointercapture',e=>{
  if (!activePointers.has(e.pointerId)) return;
  activePointers.delete(e.pointerId);
  rebaseGesture();
  persist();
});
stage.addEventListener('keydown', e => {
  const isHorizontal = state.mode === 'barrier';
  const forward = isHorizontal ? 'ArrowRight' : 'ArrowDown';
  const backward = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
  if (e.key === forward || e.key === backward) {
    stopPlaying();
    const p = current(), delta = e.key === forward ? .05 : -.05;
    p.phase = clamp(p.phase + delta * p.pitch, Number(phaseRange.min), Number(phaseRange.max));
    applyPhase(); e.preventDefault();
  } else if (e.key === ' ') { togglePlay(); e.preventDefault(); }
});
function download(name, markup) {
  const blob = new Blob([markup], {type:'image/svg+xml;charset=utf-8'});
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; a.style.display = 'none';
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function filename(kind) {
  const p = current();
  return 'moire-lab-' + p.mode + '-' + p.preset + '-' + kind + '-' + p.pitch.toFixed(2) + 'mm.svg';
}
$('downloadBase').addEventListener('click', () => download(filename('picture'), printSheet(current(), 'base')));
$('downloadOverlay').addEventListener('click', () => download(filename('acetate'), printSheet(current(), 'acetate')));
$('downloadGuide').addEventListener('click', () => download('moire-lab-calibration-' + current().paper + '.svg', calibrationSheet(current())));
const help = $('helpDialog');
$('helpButton').addEventListener('click', () => help.showModal());
$('closeHelp').addEventListener('click', () => help.close());
document.addEventListener('visibilitychange', () => { if (document.hidden) stopPlaying(); });
window.addEventListener('pagehide', stopPlaying);

syncControls();
render();
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* Optional offline caching. */ });
  });
}
