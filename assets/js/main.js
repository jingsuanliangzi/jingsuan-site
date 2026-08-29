
(() => {
  const body = document.body;
  const header = document.querySelector('[data-header]');
  const progress = document.querySelector('.progress span');
  const nav = document.querySelector('.nav');
  const menu = document.querySelector('.menu');
  const page = body.dataset.page;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
  document.querySelectorAll('[data-route]').forEach(a => {
    if (a.dataset.route === page) a.classList.add('active');
  });

  if (menu && nav) {
    menu.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open');
      menu.setAttribute('aria-expanded', 'false');
    }));
  }

  function onScroll(){
    const y = scrollY || 0;
    header?.classList.toggle('scrolled', y > 15);
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if (progress) progress.style.width = `${Math.min(100, y/max*100)}%`;
  }
  onScroll();
  addEventListener('scroll', onScroll, {passive:true});

  const reveals = [...document.querySelectorAll('.reveal')];
  if (reduced || !('IntersectionObserver' in window)) reveals.forEach(x => x.classList.add('visible'));
  else {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    }), {threshold:.12});
    reveals.forEach(x => io.observe(x));
  }

  document.querySelectorAll('.console-tab').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.console-tab').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.console-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === btn.dataset.target));
  }));

  if (matchMedia('(pointer:fine)').matches && !reduced) {
    const dot = document.querySelector('.cursor-dot'), ring = document.querySelector('.cursor-ring');
    body.classList.add('has-cursor');
    let x=innerWidth/2,y=innerHeight/2,rx=x,ry=y;
    addEventListener('pointermove',e=>{x=e.clientX;y=e.clientY;dot.style.left=x+'px';dot.style.top=y+'px'});
    const tick=()=>{rx+=(x-rx)*.16;ry+=(y-ry)*.16;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(tick)};tick();
    document.querySelectorAll('a,button,.magnetic-card').forEach(el=>{
      el.addEventListener('mouseenter',()=>body.classList.add('cursor-large'));
      el.addEventListener('mouseleave',()=>body.classList.remove('cursor-large'));
    });

    document.querySelectorAll('.magnetic').forEach(el=>{
      el.addEventListener('pointermove',e=>{
        const r=el.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;
        el.style.transform=`translate(${dx*.10}px,${dy*.10}px)`;
      });
      el.addEventListener('pointerleave',()=>el.style.transform='');
    });

    const tilt = document.querySelector('[data-tilt]');
    tilt?.parentElement?.addEventListener('pointermove',e=>{
      const r=tilt.parentElement.getBoundingClientRect(),tx=(e.clientX-r.left)/r.width-.5,ty=(e.clientY-r.top)/r.height-.5;
      tilt.style.transform=`rotateY(${tx*9}deg) rotateX(${-ty*7}deg)`;
    });
    tilt?.parentElement?.addEventListener('pointerleave',()=>tilt.style.transform='');
  }

  function particleField(canvas, density=22000, lineDist=110){
    if(!canvas)return;
    const ctx=canvas.getContext('2d');
    if(!ctx)return;
    let w=0,h=0,dpr=1,pts=[],raf=0;
    function resize(){
      const r=canvas.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,2);
      canvas.width=Math.max(1,w*dpr);canvas.height=Math.max(1,h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
      const n=Math.max(16,Math.min(72,Math.floor(w*h/density)));
      pts=Array.from({length:n},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.15,vy:(Math.random()-.5)*.15,r:Math.random()*1.2+.35}));
      draw();
    }
    function draw(){
      ctx.clearRect(0,0,w,h);
      for(let i=0;i<pts.length;i++){
        const p=pts[i];
        if(!reduced){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1}
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle='rgba(158,211,255,.48)';ctx.fill();
        for(let j=i+1;j<pts.length;j++){
          const q=pts[j],d=Math.hypot(p.x-q.x,p.y-q.y);
          if(d<lineDist){
            ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);
            ctx.strokeStyle=`rgba(103,160,226,${(1-d/lineDist)*.12})`;ctx.lineWidth=.55;ctx.stroke();
          }
        }
      }
      if(!reduced)raf=requestAnimationFrame(draw);
    }
    resize();
    let t; addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(()=>{cancelAnimationFrame(raf);resize()},120)},{passive:true});
  }

  particleField(document.querySelector('#quantum-canvas'), 23000, 115);
  particleField(document.querySelector('#final-canvas'), 26000, 120);
  document.querySelectorAll('.panel-canvas').forEach(c=>particleField(c, 18000, 100));
})();
