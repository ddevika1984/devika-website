/* ------------------------------------------------------------------
   Dr. Devika Kamat — site behaviour
   CONFIG and CH, the two things a non-developer is likely to change,
   live in assets/data.js. See CLAUDE.md in the repo root before editing
   further down. esc/slugify/usableLink/load and the chapter renderer
   are shared with event.html, guide.html and offering.html; see
   assets/detail.js and assets/chapter.js.
   ------------------------------------------------------------------ */

(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- build chapters ---------- */
  var host=document.getElementById('chapters');
  host.innerHTML=CH.map(chapterHTML).join('');
  [].slice.call(host.querySelectorAll('.chap')).forEach(function(sec){
    var s=CH.filter(function(c){return c.id===sec.id})[0];
    wireChapter(sec,s);
  });

  /* ---------- spine nodes (crown at top, root at bottom) ---------- */
  function nodes(into){
    CH.slice().reverse().forEach(function(s){
      var b=document.createElement('button');
      b.className='node'; b.dataset.go=s.id; b.style.setProperty('--c',s.c);
      b.setAttribute('aria-label',s.en+', '+s.t);
      b.innerHTML='<span class="tip"><b>'+esc(s.t)+'</b><i>'+esc(s.en)+' · '+esc(s.sans)+'</i>'+
        '<span class="w">'+esc(s.for_)+'</span></span>';
      b.addEventListener('click',function(){
        document.getElementById(s.id).scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
      });
      into.appendChild(b);
    });
    var g=document.createElement('button');
    g.className='ground'; g.setAttribute('aria-label','Events');
    g.innerHTML='<span class="tip"><b>Events</b><i>A way back to yourself</i>'+
      '<span class="w">Workshops, circles and on demand sessions, online and in person.</span></span>';
    g.addEventListener('click',function(){
      document.getElementById('events').scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
    });
    into.appendChild(g);
  }
  nodes(document.getElementById('spine'));

  var rail=document.createElement('nav');
  rail.className='rail'; rail.setAttribute('aria-label','Chapters');
  rail.innerHTML='<span class="cord"></span>';
  nodes(rail);
  document.body.appendChild(rail);

  /* ---------- offerings dropdown, same order as the page ---------- */
  (function(){
    var wrap=document.getElementById('drop'),btn=document.getElementById('dropBtn'),
        menu=document.getElementById('dropMenu');
    var head='<a role="menuitem" class="mobonly" href="#about">'+
      '<span class="dt" style="--c:#CC8A77"></span>'+
      '<span><b>About Dr. Devika Kamat</b><i>In her own words</i></span></a>'+
      '<a role="menuitem" class="mobonly" href="#events">'+
      '<span class="dt" style="--c:#CC8A77"></span>'+
      '<span><b>Events</b><i>Offline &amp; online</i></span></a>';
    menu.innerHTML=head+CH.map(function(c){
      var sub=c.f&&c.f.length?c.f[c.f.length-1][1]:c.en;
      return '<a role="menuitem" href="#'+c.id+'"><span class="dt" style="--c:'+c.c+'"></span>'+
        '<span><b>'+esc(c.t)+'</b><i>'+esc(c.en)+' · '+esc(sub)+'</i></span></a>';
    }).join('');
    function open(v){
      wrap.dataset.open=v?'1':'';
      btn.setAttribute('aria-expanded',String(!!v));
      menu.hidden=!v;
    }
    btn.addEventListener('click',function(e){e.stopPropagation();open(menu.hidden)});
    menu.addEventListener('click',function(e){if(e.target.closest('a'))open(false)});
    document.addEventListener('click',function(e){if(!wrap.contains(e.target))open(false)});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')open(false)});
    open(false);
  })();

  var heroNodes=[].slice.call(document.querySelectorAll('#spine .node'));
  var railNodes=[].slice.call(rail.querySelectorAll('.node'));
  var grounds=[].slice.call(document.querySelectorAll('.ground'));
  var aboutSec=document.getElementById('about');
  var eventsSec=document.getElementById('events');

  /* ---------- hero motes ---------- */
  (function(){
    var cv=document.getElementById('motes'),cx=cv.getContext('2d'),P=[],W=0,H=0;
    var TINT=['#CC8A77','#AC6670','#69847A','#F0ECDC','#7A4340'];
    function size(){var d=Math.min(devicePixelRatio||1,2);W=cv.clientWidth;H=cv.clientHeight;
      cv.width=W*d;cv.height=H*d;cx.setTransform(d,0,0,d,0,0);seed()}
    function seed(){P=[];var n=Math.round(Math.min(70,Math.max(26,W/22)));
      for(var i=0;i<n;i++)P.push({x:Math.random()*W,y:Math.random()*H,r:.6+Math.random()*1.9,
        v:.10+Math.random()*.34,d:(Math.random()-.5)*.14,o:.10+Math.random()*.42,
        c:TINT[(Math.random()*TINT.length)|0],p:Math.random()*6.28})}
    function loop(t){
      cx.clearRect(0,0,W,H);
      for(var i=0;i<P.length;i++){var m=P[i];
        if(!reduce){m.y-=m.v;m.x+=m.d+Math.sin((t/1400)+m.p)*.14;if(m.y<-6){m.y=H+6;m.x=Math.random()*W}}
        cx.globalAlpha=m.o;cx.fillStyle=m.c;cx.beginPath();cx.arc(m.x,m.y,m.r,0,6.284);cx.fill();
      }
      requestAnimationFrame(loop);
    }
    size();requestAnimationFrame(loop);
    var rt;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(size,180)});
  })();

  /* ---------- events ---------- */
  (function(){
    var list=document.getElementById('agenda');
    var MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    function render(rows){
      var today=new Date(); today.setHours(0,0,0,0);
      rows=(rows||[])
        .filter(function(r){return r && r.title && r.date})
        .filter(function(r){var d=new Date(r.date); return !isNaN(d) && d>=today})
        .sort(function(a,b){return new Date(a.date)-new Date(b.date)});

      if(!rows.length){
        list.innerHTML='<div class="evempty">Nothing scheduled at the moment. '+
          'New circles and workshops are announced here first.</div>';
        return;
      }
      list.innerHTML=rows.map(function(d){
        var parts=String(d.date).split('-');
        var day=parts[2]||'--', mon=MONTHS[(parseInt(parts[1],10)||1)-1]||'', yr=parts[0]||'';
        var bits=[d.time,d.place,d.format,d.price].filter(Boolean)
          .map(function(x){return '<span>'+esc(x)+'</span>'}).join('');
        var href=d.link||('mailto:'+CONFIG.email+'?subject='+encodeURIComponent(d.title));
        var img=usableLink(d.image);
        return '<div class="ev'+(img?' has-img':'')+'">'+
          '<div class="when"><div class="d">'+esc(day)+'</div><div class="m">'+esc(mon)+' '+esc(yr)+'</div></div>'+
          '<div class="what"><b><a href="/event?e='+esc(eventSlug(d))+'">'+esc(d.title)+'</a></b>'+
            (d.detail?'<p>'+esc(d.detail)+'</p>':'')+
            (bits?'<div class="evmeta">'+bits+'</div>':'')+
          '</div>'+
          (img?'<img class="evimg" src="'+esc(img)+'" alt="" loading="lazy" decoding="async">':'')+
          '<div class="act"><a class="pill solid" href="'+esc(href)+'" target="_blank" rel="noopener">'+
            '<span>Reserve a place</span></a></div>'+
        '</div>';
      }).join('');
    }

    load(CONFIG.eventsUrl,CONFIG.eventsFallback).then(render);
  })();

  /* ---------- reviews ---------- */
  (function(){
    var list=document.getElementById('reviewgrid'); if(!list) return;

    function stars(rating){
      var n=Math.round(Number(rating));
      if(!n||n<1) return '';
      n=Math.min(n,5);
      return '<div class="rvstars" aria-hidden="true">'+'&#9733;'.repeat(n)+'&#9734;'.repeat(5-n)+'</div>';
    }

    function render(rows){
      rows=(rows||[]).filter(function(r){return r && r.title && r.review});
      if(!rows.length){
        list.innerHTML='<div class="evempty">New reviews are posted here as they come in.</div>';
        return;
      }
      list.innerHTML=rows.map(function(r){
        return '<div class="rv">'+
          stars(r.rating)+
          '<p>'+esc(r.review)+'</p>'+
          '<div class="rvwho"><b>'+esc(r.title)+'</b>'+
            (r.context?'<span>'+esc(r.context)+'</span>':'')+
          '</div>'+
        '</div>';
      }).join('');
    }

    load(CONFIG.reviewsUrl,CONFIG.reviewsFallback).then(render);
  })();

  /* ---------- scroll state ---------- */
  var chaps=[].slice.call(document.querySelectorAll('.chap'));
  new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)e.target.classList.add('in')})},
    {threshold:.18}).observe(aboutSec);
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting) e.target.classList.add('in'); });
  },{threshold:.2});
  chaps.forEach(function(c){io.observe(c)});

  var bar=document.getElementById('bar');
  var hero=document.getElementById('hero');

  function onScroll(){
    var vh=innerHeight, best=-1, bestD=1e9;
    chaps.forEach(function(c,i){
      var b=c.getBoundingClientRect();
      var d=Math.abs(b.top+b.height/2-vh/2);
      if(b.top<vh*.75&&b.bottom>vh*.25&&d<bestD){bestD=d;best=i}
    });
    heroNodes.forEach(function(n,i){n.classList.toggle('on', CH.length-1-i===best)});
    railNodes.forEach(function(n,i){n.classList.toggle('on', CH.length-1-i===best)});
    var ev=eventsSec.getBoundingClientRect();
    var evOn = ev.top<vh*.7 && ev.bottom>vh*.3;
    grounds.forEach(function(g){g.classList.toggle('on',evOn)});
    if(evOn){heroNodes.concat(railNodes).forEach(function(n){n.classList.remove('on')})}
    var past = hero.getBoundingClientRect().bottom < vh*.35;
    rail.classList.toggle('show', past);
    bar.classList.toggle('solid', scrollY>50);
  }
  var tick=false;
  addEventListener('scroll',function(){if(tick)return;tick=true;
    requestAnimationFrame(function(){onScroll();tick=false})},{passive:true});
  addEventListener('resize',onScroll);
  onScroll();
})();
