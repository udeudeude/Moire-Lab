// Book-inspired and representational moiré experiments.
// The visible objects and the interfering contours are all vector geometry.
// Original compositions inspired by the 1898 motograph, not scans of its pages.
const ink = '#19332f', faded = '#75948a', warm = '#c87555', paper = '#f9f5e9';
const F = n => Number(n.toFixed(3));
const L = points => points.map((p,i) => (i ? 'L' : 'M') + F(p[0]) + ' ' + F(p[1])).join(' ');
const line = (d, w=0.35, color=ink, extra='') =>
  '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + F(w) + '" stroke-linejoin="round" stroke-linecap="round" ' + extra + '/>';
const filled = (d, fill=paper, width=.5) =>
  '<path d="' + d + '" fill="' + fill + '" stroke="' + ink + '" stroke-width="' + width + '" stroke-linejoin="round"/>';
function getStep(p) { return Math.max(.45, Math.min(3, p.pitch * 120 / p.size)); }
function wavesInRectangle(x,y,w,h,step,a,variant=0) {
  const paths = [];
  for(let row=0; row<=h+step; row+=step) {
    const points = [];
    for(let j=0;j<=100;j++){
      const xx=x+w*j/100;
      const v=Math.sin(xx*.16+row*.065+variant)*(.2+a*1.4)
        + Math.sin(xx*.051-row*.04+variant*1.7)*a*2.0;
      points.push([xx, y+row+v]);
    }
    paths.push(line(L(points), Math.max(.25,step*.29)));
  }
  return paths.join('');
}
function chords(cx,cy,r,step,a,variant) {
  let s='';
  for(let yy=-r; yy<=r; yy+=step) {
    const extent=Math.sqrt(Math.max(0,r*r-yy*yy)), pts=[];
    for(let i=0;i<=32;i++){
      const dx=(-extent+2*extent*i/32);
      const envelope=Math.max(0,1-Math.pow(dx/Math.max(extent,0.001),2));
      pts.push([cx+dx,cy+yy+a*1.3*Math.sin(dx*.2+yy*.15+variant)*envelope]);
    }
    s+=line(L(pts),Math.max(.25,step*.30));
  }
  return s;
}
function wheel(cx,cy,r, spokes=8, turn=0) {
  let s='<circle cx="'+F(cx)+'" cy="'+F(cy)+'" r="'+F(r)+'" fill="none" stroke="'+ink+'" stroke-width=".85"/>';
  s+='<circle cx="'+F(cx)+'" cy="'+F(cy)+'" r="'+F(r-2)+'" fill="none" stroke="'+ink+'" stroke-width=".32"/>';
  for(let i=0;i<spokes;i++) {
    const th=2*Math.PI*i/spokes+turn;
    s+=line('M '+F(cx)+' '+F(cy)+' L '+F(cx+(r-2)*Math.cos(th))+' '+F(cy+(r-2)*Math.sin(th)), .65);
  }
  s+='<circle cx="'+F(cx)+'" cy="'+F(cy)+'" r="2.1" fill="'+paper+'" stroke="'+ink+'" stroke-width=".6"/>';
  return s;
}
function shell(x,y) {
  return '<rect x="'+x+'" y="'+y+'" width="46" height="46" fill="none" stroke="'+ink+'" stroke-width=".5"/>';
}
function squarePanel(n,p) {
  const step=getStep(p), a=p.amplitude/100;
  let s=shell(0,0);
  const hatch=wavesInRectangle(.5,.5,45,45,step,a*.18,n*1.2);
  if(n===0) {
    s+=filled('M 0 0 L 23 23 L 46 0 Z','#e4e0d3');
    s+=filled('M 0 46 L 23 23 L 46 46 Z','#e4e0d3');
    s+=filled('M 0 0 L 23 23 L 0 46 Z','#d5d9cf');
    s+=filled('M 46 0 L 23 23 L 46 46 Z','#d5d9cf');
    // Horizontal interference lines are contained within opposing hourglass triangles.
    for(let row=0;row<=46;row+=step){
      const v=row<=23? row : 46-row, left=23-v, right=23+v;
      s+=line('M '+F(left)+' '+F(row+a*.8*Math.sin(row*.3))+' H '+F(right),Math.max(.25,step*.34));
    }
    s+=line('M 0 0 L 23 23 L 46 0 M 0 46 L 23 23 L 46 46',.7);
  } else if(n===1 || n===3) {
    s+=hatch;
    const d='M 23 0 C 28 17 31 18 46 23 C 30 28 28 30 23 46 C 18 30 16 28 0 23 C 17 19 19 16 23 0 Z';
    s+=filled(d,n===1?'#f6f2e9':'#e6e9df',.75);
    if(n===3) {
      for(let y=3;y<43;y+=step*1.2){
        const half=y<23? 15*(1-y/23):15*(1-(46-y)/23);
        s+=line('M '+F(23-half)+' '+F(y)+' H '+F(23+half),.22,faded);
      }
    }
  } else {
    s+=hatch;
    for(let i=0;i<8;i++){
      const th=2*Math.PI*i/8;
      s+=line('M 23 23 L '+F(23+33*Math.cos(th))+' '+F(23+33*Math.sin(th)),.77);
    }
    s+='<circle cx="23" cy="23" r="1.25" fill="'+ink+'"/>';
  }
  return s;
}
function circlePanel(n,p){
  const step=getStep(p),a=p.amplitude/100,cx=23,cy=23,r=22;
  let s='';
  if(n===0) {
    s+=chords(cx,cy,r,step,a*.35,0);
    for(let rr=5;rr<=r;rr+=5.1)
      s+='<circle cx="23" cy="23" r="'+F(rr)+'" stroke="'+ink+'" stroke-width=".55" fill="none"/>';
  } else if(n===1) {
    s+=chords(cx,cy,r,step,a*.6,2);
    s+=wheel(23,23,22,8,Math.PI/8);
  } else if(n===2) {
    s+=chords(cx,cy,r,step,a*.9,1);
    for(let i=0;i<6;i++){
      const th=i*2*Math.PI/6-Math.PI/2;
      const tip=[cx+r*Math.cos(th),cy+r*Math.sin(th)];
      const left=[cx+12*Math.cos(th-.58),cy+12*Math.sin(th-.58)];
      const right=[cx+12*Math.cos(th+.58),cy+12*Math.sin(th+.58)];
      const d='M 23 23 Q '+F(left[0])+' '+F(left[1])+' '+F(tip[0])+' '+F(tip[1])+
        ' Q '+F(right[0])+' '+F(right[1])+' 23 23';
      s+=line(d,.73);
    }
    s+='<circle cx="23" cy="23" r="1.8" fill="'+ink+'"/>';
  } else {
    s+=chords(cx,cy,r,step,a*.7,4);
    s+=wheel(23,23,22,8,0);
  }
  s+='<circle cx="23" cy="23" r="22" stroke="'+ink+'" stroke-width=".8" fill="none"/>';
  return s;
}
function bookPanels(p,kind){
  let s='<rect width="120" height="120" fill="'+paper+'"/>';
  const positions=[[10,9],[64,9],[10,63],[64,63]];
  positions.forEach(([x,y],i)=>{
    s+='<g transform="translate('+x+' '+y+')">'+
      (kind==='squares'?squarePanel(i,p):circlePanel(i,p))+'</g>';
  });
  s+=line('M 10 116 H 110',.25,faded);
  return s;
}
// Line families whose phase gradient is bent by curves; interference with the
// straight, translating acetate grating makes a slow cloud/smoke/water drift.
function smokePlume(p) {
  const step=getStep(p),a=p.amplitude/100;
  let s='';
  // An expanding diagonal plume from the chimney at (35,54).
  for(let offset=-6;offset<=6;offset+=step) {
    const pts=[];
    for(let i=0;i<=90;i++){
      const t=i/90,x=35+75*t;
      const center=54-40*t-4*Math.sin(t*4.6);
      const breadth=2+t*10;
      const y=center+offset*breadth/8+a*2.6*Math.sin(x*.21+offset*.17)*t;
      pts.push([x,y]);
    }
    s+=line(L(pts),Math.max(.25,step*.36),ink);
  }
  return s;
}
function engine(p){
  let s='<rect width="120" height="120" fill="'+paper+'"/>';
  // Static Victorian steam traction engine details.
  s+=line('M 4 105 Q 34 101 56 105 T 116 105 M 4 109 Q 66 106 116 109',.45,faded);
  s+='<path d="M 22 67 H 71 Q 79 69 79 81 V 94 H 22 Z" fill="#e6e8dc" stroke="'+ink+'" stroke-width=".9"/>';
  s+='<path d="M 25 71 Q 41 64 59 71 L 59 91 H 25 Z" fill="#ebe0cd" stroke="'+ink+'" stroke-width=".8"/>';
  // Stack and smoke are composed separately, smoke must remain optically active.
  s+=smokePlume(p);
  s+=filled('M 31 55 L 37 55 L 39 72 L 29 72 Z','#d0d3c7',.8);
  s+=filled('M 28 53 L 40 53 L 40 56 L 28 56 Z',ink,.3);
  s+=line('M 38 75 H 64 V 87 H 38 Z M 42 78 H 61 M 42 81 H 61 M 42 84 H 61',.45);
  s+=filled('M 68 70 L 92 70 L 98 82 L 81 93 L 68 93 Z','#dce0d3');
  s+=line('M 70 74 H 93 M 70 78 H 95 M 75 85 L 96 85 M 80 71 V 94',.5);
  s+=filled('M 80 62 L 103 62 L 105 66 L 81 66 Z','#d4c6b1');
  s+=line('M 84 66 V 84 M 100 66 V 86',.8);
  // Wheels stand out whether the acetate is present or hidden.
  s+=wheel(35,93,12,8,.05)+wheel(84,90,17,10,.12);
  s+=line('M 45 93 L 68 91 L 84 90 M 45 89 L 77 81',.8);
  s+='<circle cx="60" cy="90" r="3" fill="'+warm+'" stroke="'+ink+'" stroke-width=".6"/>';
  s+=line('M 70 101 Q 80 105 102 102 M 24 109 V 114 M 12 114 H 111',.45);
  return s;
}
function waterField(p) {
  const step=getStep(p),a=p.amplitude/100;
  let s='';
  for(let y=69;y<=115;y+=step){
    const pts=[];
    for(let j=0;j<=100;j++){
      const x=3+114*j/100;
      const wave=a*2.1*Math.sin(x*.13+y*.018)+a*1.15*Math.sin(x*.32-y*.028);
      pts.push([x,y+wave]);
    }
    s+=line(L(pts),Math.max(.22,step*.33));
  }
  return s;
}
function cloud(cx,cy,w,h,p,i) {
  let s='';
  const outline='M '+F(cx-w*.5)+' '+F(cy+h*.2)+
  ' C '+F(cx-w*.52)+' '+F(cy-h*.35)+' '+F(cx-w*.24)+' '+F(cy-h*.48)+' '+F(cx-w*.10)+' '+F(cy-h*.24)+
  ' C '+F(cx)+' '+F(cy-h*.74)+' '+F(cx+w*.28)+' '+F(cy-h*.55)+' '+F(cx+w*.34)+' '+F(cy-h*.17)+
  ' C '+F(cx+w*.69)+' '+F(cy-h*.24)+' '+F(cx+w*.66)+' '+F(cy+h*.28)+' '+F(cx+w*.46)+' '+F(cy+h*.29)+
  ' Z';
  s+=filled(outline,paper,.58);
  const step=getStep(p),a=p.amplitude/100;
  for(let k=-h*.22;k<h*.24;k+=step){
    const left=cx-w*.34,right=cx+w*.42;
    const pts=[];
    for(let j=0;j<=24;j++){
      const x=left+(right-left)*j/24, q=(x-cx)/w;
      pts.push([x,cy+k+.6*a*Math.sin(q*13+i*1.5+k*.2)]);
    }
    s+=line(L(pts),Math.max(.22,step*.26),faded);
  }
  return s;
}
function sailboat(p){
  let s='<rect width="120" height="120" fill="'+paper+'"/>';
  s+='<circle cx="101" cy="18" r="9" fill="#e7d9b7" stroke="'+ink+'" stroke-width=".4"/>';
  for(let i=0;i<9;i++){
    let angle=i*2*Math.PI/9;
    s+=line('M '+F(101+10.5*Math.cos(angle))+' '+F(18+10.5*Math.sin(angle))+' L '+
    F(101+13.5*Math.cos(angle))+' '+F(18+13.5*Math.sin(angle)),.42,warm);
  }
  s+=cloud(27,25,36,16,p,0)+cloud(77,38,31,13,p,1);
  s+=line('M 3 69 Q 42 65 80 69 T 117 69',.65);
  s+=waterField(p);
  // Sailboat on the foreground. Large sails make the image legible without acetate.
  s+=filled('M 56 20 L 56 76 L 24 75 Z','#f4eddd',.82);
  s+=filled('M 60 31 Q 80 52 88 76 L 60 76 Z','#ebd8bb',.82);
  s+=line('M 56 19 V 90 M 49 34 L 56 23 M 60 33 L 67 39',.85);
  s+=filled('M 20 79 Q 56 86 91 78 L 83 91 Q 51 99 28 89 Z','#c77d58',.96);
  s+=line('M 25 84 Q 54 89 88 84 M 45 92 Q 54 95 64 93',.5);
  s+='<circle cx="73" cy="85" r="2" fill="'+ink+'"/>';
  s+=line('M 6 104 Q 20 99 33 104 M 83 106 Q 101 100 116 106',.55);
  return s;
}
export function sceneInk(p) {
  switch (p.preset) {
    case 'squares': return bookPanels(p,'squares');
    case 'circles': return bookPanels(p,'circles');
    case 'engine': return engine(p);
    case 'sailboat': return sailboat(p);
    default: throw new Error('Unknown illustrative preset '+p.preset);
  }
}
export const SCENE_PRESETS = Object.freeze(['circles','squares','engine','sailboat']);
