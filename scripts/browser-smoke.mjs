// Mobile-size browser regression checks for the actual running UI.
// This test runs in GitHub Actions, independent of its SVG geometry unit tests.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

mkdirSync('artifacts', {recursive:true});
const server=spawn('python3',['-m','http.server','8091','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let browser;
try {
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({
    viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,
    hasTouch:true,locale:'en-US',reducedMotion:'reduce'
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  let ready=false;
  for(let attempt=0;attempt<30;attempt++){
    try{
      const response=await page.goto('http://127.0.0.1:8091/',{waitUntil:'load',timeout:3000});
      if(response.ok()) { ready=true;break; }
    }catch{}
    await sleep(250);
  }
  assert.ok(ready,'static server should start');
  await page.waitForSelector('#experimentChoices button');
  await page.waitForSelector('#acetate-rotation');
  console.log('Rendered page title:',await page.title());
  await page.locator('#modeMoire').click();
  assert.equal(await page.locator('#experimentChoices button').count(),8,
    'All eight true-moiré experiments must be discoverable on mobile');

  for(const key of ['circles','squares','engine','sailboat','tide','vortex','radiance','folds']) {
    await page.locator('[data-preset="'+key+'"]').click();
    assert.equal(await page.locator('#experimentTitle').textContent(),
      ({circles:'Magic circles',squares:'Magic squares',engine:'Smoking engine',
      sailboat:'Sailboat at sea',tide:'Tidal lines',vortex:'Vortex',
      radiance:'Radiance',folds:'Woven folds'})[key]);
    const svg=page.locator('#experiment');
    const count=await svg.locator('path,circle,rect').count();
    assert.ok(count>10,key+' must show actual picture, found '+count+' SVG primitives');
    assert.ok(await page.locator('#acetate-layer').count(),'acetate must be present');
    if(['circles','squares','engine','sailboat'].includes(key)) {
      await page.locator('#overlayButton').click();
      await page.locator('#stage').screenshot({path:'artifacts/'+key+'.png'});
      await page.locator('#overlayButton').click();
    }
    console.log(key+': '+count+' live SVG shapes');
  }

  // The existing wheel regression: verify the base wheel even with mask hidden.
  await page.locator('#modeBarrier').click();
  assert.equal(await page.locator('#experimentChoices button').count(),2);
  await page.locator('[data-preset="wheel"]').click();
  await page.locator('#overlayButton').click();
  const segments=await page.locator('#experiment .interlaced-ink svg').count();
  assert.ok(segments>50,'turning wheel should contain many actual interlaced strips');
  await page.locator('#stage').screenshot({path:'artifacts/wheel.png'});
  await page.locator('#overlayButton').click();

  // Programmatically dispatch realistic multi-pointer coordinates. This exercises
  // the same event handlers as touchscreens; native capture is stubbed because
  // browser security forbids capturing synthetic pointers.
  await page.locator('#modeMoire').click();
  await page.locator('[data-preset="engine"]').click();
  await page.evaluate(()=>{
    const el=document.querySelector('#stage');
    el.setPointerCapture=()=>{};
    el.hasPointerCapture=()=>false;
    el.releasePointerCapture=()=>{};
    const send=(type,pointerId,x,y)=>el.dispatchEvent(new PointerEvent(type,{
      bubbles:true,cancelable:true,pointerType:'touch',pointerId,
      clientX:x,clientY:y,isPrimary:pointerId===11,button:0
    }));
    send('pointerdown',11,140,350);
    send('pointerdown',12,260,350);
    send('pointermove',12,310,400);
    send('pointermove',11,155,380);
    send('pointerup',11,155,380);
    send('pointerup',12,310,400);
  });
  const rotation=await page.locator('#acetate-rotation').getAttribute('transform');
  const translate=await page.locator('#acetate-shift').getAttribute('transform');
  assert.ok(rotation && !rotation.includes('rotate(0.0000'),rotation);
  assert.ok(translate && !translate.includes('translate(0.00000 0.00000)'),translate);
  console.log('Two-finger gesture results:',rotation,translate);
  assert.deepEqual(errors,[],'Browser should have zero uncaught page exceptions');
  console.log('PASS: 8 moiré choices, 2 barrier choices, live vector art and two-finger gesture');
}finally{
  if(browser)await browser.close();
  server.kill();
}
