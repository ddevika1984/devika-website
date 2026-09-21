/* ------------------------------------------------------------------
   Dr. Devika Kamat — site behaviour
   Everything a non-developer is likely to change lives in CONFIG or CH
   below. See CLAUDE.md in the repo root before editing further down.
   ------------------------------------------------------------------ */

var CONFIG = {
  /* Events and guides are edited in Google Sheets. /api/events and
     /api/guides read those sheets on the server and hand back JSON.
     If a sheet is unreachable the page quietly falls back to the copy
     committed in content/, so a broken sheet shows slightly stale
     content rather than an error. */
  eventsUrl: '/api/events',
  eventsFallback: 'content/events.json',
  guidesUrl: '/api/guides',
  guidesFallback: 'content/guides.json',
  email: 'info@drddevikakamat.com'
};

var CH = [
 {id:"c0",key:"root",sans:"Muladhara",en:"Root",c:"#8F5A42",bg:"#14100E",fg:"#F0ECDC",
  t:"Discovery call",
  img:"images/discoverycall.webp",
  for_:"For finding out whether I can actually help you.",
  det:"We start with a casual conversation about your goals and concerns, and I explain honestly how I think I can help. Some people call it a clarity call. If I am not the right person you will leave knowing who is.",
  f:[["Length","30 minutes"],["Where","Online"],["Cost","₹2,500"]],
  cta:{label:"Book this",href:"https://rzp.io/rzp/2CNVQp0i"}},

 {id:"c1",key:"sacral",sans:"Svadhisthana",en:"Sacral",c:"#7A4340",bg:"#1E1614",fg:"#F0ECDC",
  t:"35+ Women's Wellness Circle",
  img:"images/womenswellnesscircle.webp",
  for_:"For not doing this on your own.",
  det:"The Women's Wellness Circle is a WhatsApp community for women dealing with the same things at the same time. Sleep, hormones, energy, and the things that are hard to say out loud anywhere else. It is a space to connect with other women who get it, understand your body alongside me, take on challenges together, and work on your mind, body, and soul.",
  f:[["Format","Group"],["Cost","Free"]],
  cta:{label:"Join this",href:"https://chat.whatsapp.com/DIMbyxT7PbLBq0O6Puo1BI?mode=gi_t"}},

 {id:"c2",key:"solar",sans:"Manipura",en:"Solar plexus",c:"#AC6670",bg:"#2C1C1C",fg:"#F0ECDC",
  t:"Guides You Can Download and Use",
  img:"images/selfhelp.webp",
  for_:"For the days you would rather do this on your own.",
  det:"Guided audio, written practices and plain guides you buy once and keep. Use them between sessions, or instead of them. Nothing here needs me in the room.",
  f:[],
  guides:true},

 {id:"c3",key:"heart",sans:"Anahata",en:"Heart",c:"#CC8A77",bg:"#3E2723",fg:"#F0ECDC",
  t:"Integrative nutrition",
  img:"images/integrativenutrition.webp",
  for_:"For energy, digestion and weight that will not shift.",
  det:"A month of eating built around the routine you already have, the budget you already have and the kitchen you already have. Three nutrition sessions and one energy session across the month, reviewed weekly and adjusted as we go.",
  f:[["Length","4 sessions over 1 month"],["Format","One to one"],["Cost","₹15,000"]],
  cta:{label:"Book this",href:"https://rzp.io/rzp/hJMniutv"}},

 {id:"c4",key:"throat",sans:"Vishuddha",en:"Throat",c:"#9C9078",bg:"#453F35",fg:"#F0ECDC",
  t:"Holistic counseling, rewiring and energy alignment",
  img:"images/holisticcounseling-v2.webp",
  for_:"For when you are carrying something you cannot put down.",
  det:"Talking and gentle energy work in the same session. Mostly quiet. Take one session if something specific is sitting heavy, or four if it needs working through properly.",
  f:[["Length","1 or 4 sessions"],["Where","Online or in person"],["Cost","From ₹8,000"]],
  picker:{
    sessions:[["1","1 session"],["4","4 sessions"]],
    places:[["online","Online"],["person","In person"]],
    prices:{
      "1-online":{price:"₹8,000",  href:"https://rzp.io/rzp/JXSLclA"},
      "1-person":{price:"₹10,000", href:"https://rzp.io/rzp/3BS7M02S"},
      "4-online":{price:"₹28,000", href:"https://rzp.io/rzp/H44bYeyF"},
      "4-person":{price:"₹35,000", href:"https://rzp.io/rzp/6fZnuhM"}
    }
  }},

 {id:"c6",key:"crown",sans:"Sahasrara",en:"Crown",c:"#8A7A5E",bg:"#EDE8D8",fg:"#2B2118",
  t:"The Meditation Club",
  img:"images/meditationclub.webp",
  for_:"For building a practice you will actually keep.",
  det:"Twenty to thirty minutes, a group that sits together regularly. No experience needed and no pressure to say anything. Come when you can, miss it when you cannot.",
  f:[["Meets","Mon, Tue, Thu at 9.15pm"],["Format","Group"],["Cost","₹1,198 a month"]],
  note:"A monthly subscription. Cancel whenever you want.",
  cta:{label:"Join this",href:"https://rzp.io/rzp/POuxLAl"}}
];

(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(v){return String(v==null?'':v).replace(/[&<>"]/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

  /* Try the sheet, fall back to the committed JSON, and if both fail hand
     back an empty list so the section renders its own empty state. */
  function load(url,fallback){
    function get(u){
      return fetch(u,{cache:'no-store'}).then(function(r){
        if(!r.ok) throw new Error(r.status); return r.json();
      });
    }
    return get(url).catch(function(){
      return fallback&&fallback!==url ? get(fallback).catch(function(){return []}) : [];
    });
  }

  /* ---------- build chapters ---------- */
  var host=document.getElementById('chapters');
  host.innerHTML=CH.map(function(s,i){
    var facts=(s.f&&s.f.length)?'<div class="facts">'+s.f.map(function(p){
      return '<div><div class="k">'+esc(p[0])+'</div><div class="v">'+esc(p[1])+'</div></div>'}).join('')+'</div>':'';

    var guides = s.guides ? '<div class="kit" data-guides><div class="evempty" style="border:0;padding:20px 0">Loading guides&hellip;</div></div>' : '';

    var picker='';
    if(s.picker){
      function grp(name,opts){
        return '<div class="pgroup" role="group" aria-label="'+esc(name)+'">'+opts.map(function(o,n){
          return '<button type="button" class="popt'+(n===0?' on':'')+'" data-'+esc(name)+'="'+esc(o[0])+'">'+esc(o[1])+'</button>'
        }).join('')+'</div>';
      }
      picker='<div class="picker" data-picker>'+
        grp('sessions',s.picker.sessions)+grp('places',s.picker.places)+
        '<div class="pout"><span class="pprice" data-pprice></span></div>'+
      '</div>';
    }

    var media = '<div class="shot"><img src="'+s.img+'" alt="'+esc(s.t)+'" loading="lazy" decoding="async"><span class="warm"></span></div>';

    var go='';
    if(s.picker){
      go='<div class="go"><a class="pill solid" data-pbuy href="#"><span>Book this</span></a></div>';
    } else if(s.cta){
      go = s.cta.href
        ? '<div class="go"><a class="pill solid" href="'+esc(s.cta.href)+'" target="_blank" rel="noopener"><span>'+esc(s.cta.label)+'</span></a></div>'
        : '<div class="go"><a class="pill solid is-soon" href="mailto:'+esc(CONFIG.email)+'?subject='+encodeURIComponent(s.t)+'"><span>'+esc(s.cta.label)+'</span></a></div>';
    }

    return '<section class="chap'+(i%2?' flip':'')+'" id="'+s.id+'" data-chap="'+i+'" '+
      'style="--bg:'+s.bg+';--fg:'+s.fg+';--accent:'+s.c+'">'+
      '<div class="wrap grid">'+
        '<div class="rise">'+
          '<div class="eyeb"><span class="dot"></span><span class="mono">'+String(i+1).padStart(2,'0')+
            ' &middot; '+esc(s.en)+' &middot; '+esc(s.sans)+'</span></div>'+
          '<h2>'+esc(s.t)+'</h2>'+
          '<p class="for">'+esc(s.for_)+'</p>'+
          '<p class="det">'+esc(s.det)+'</p>'+
          (s.det2?'<p class="det">'+esc(s.det2)+'</p>':'')+
          facts+picker+guides+
          (s.note?'<p class="note">'+esc(s.note)+'</p>':'')+
          go+
        '</div>'+
        '<div class="rise">'+media+'</div>'+
      '</div></section>';
  }).join('');

  /* ---------- throat picker ---------- */
  [].slice.call(document.querySelectorAll('[data-picker]')).forEach(function(p){
    var sec=p.closest('.chap');
    var data=CH.filter(function(c){return c.id===sec.id})[0].picker;
    var buy=sec.querySelector('[data-pbuy]');
    var out=p.querySelector('[data-pprice]');
    function state(){
      return p.querySelector('.popt.on[data-sessions]').dataset.sessions+'-'+
             p.querySelector('.popt.on[data-places]').dataset.places;
    }
    function sync(){
      var hit=data.prices[state()];
      out.textContent=hit.price;
      buy.href=hit.href;
    }
    p.addEventListener('click',function(e){
      var b=e.target.closest('.popt'); if(!b) return;
      var attr=b.hasAttribute('data-sessions')?'sessions':'places';
      p.querySelectorAll('.popt[data-'+attr+']').forEach(function(o){o.classList.remove('on')});
      b.classList.add('on');
      sync();
    });
    buy.setAttribute('target','_blank'); buy.setAttribute('rel','noopener');
    sync();
  });

  /* Returns a link we can actually put on a button, or '' if the cell holds
     something that is not one.

     This matters because inserting a file into a Google Sheets cell makes a
     "chip", and the API hands us only the chip's visible text, which is the
     filename. Linking to a filename produces a 404 on our own domain, so the
     rule is that anything without a recognisable scheme or path is rejected.

     A Drive share link is also rewritten to its direct download form, so the
     button downloads the guide instead of dropping the visitor on Drive's
     preview page. */
  function usableLink(raw){
    var s=String(raw||'').trim();
    if(!s) return '';
    var drive=/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?[^#]*id=)([-\w]{16,})/.exec(s);
    if(drive) return 'https://drive.google.com/uc?export=download&id='+drive[1];
    if(/^https?:\/\//i.test(s)) return s;
    /* a file committed alongside the site, e.g. files/morning.pdf */
    if(/^\/?files\/[^\s]+\.[a-z0-9]{2,5}$/i.test(s)) return s;
    return '';
  }

  /* ---------- guides, from the sheet ---------- */
  (function(){
    var box=document.querySelector('[data-guides]'); if(!box) return;
    function render(rows){
      rows=(rows||[]).filter(function(r){return r && r.title});
      if(!rows.length){
        box.innerHTML='<div class="evempty" style="border:0;padding:20px 0">'+
          'New guides are posted here. Write to me at '+esc(CONFIG.email)+' if there is one you want.</div>';
        return;
      }
      box.innerHTML=rows.map(function(r){
        var free=!r.price||/^free$/i.test(String(r.price).trim());
        /* Take whichever column actually holds a link. File is the intended
           home for a free guide and Link for a paid one, but that is a
           distinction only this code cares about, and putting the address in
           the other column should not silently break the button. */
        var target=free
          ? (usableLink(r.file) || usableLink(r.link))
          : (usableLink(r.link) || usableLink(r.file));
        var label=free?'Download':'Buy and download';
        var attrs, href;
        if(target){
          href=target;
          /* download only works same origin. A Drive or Razorpay link has to
             open in a tab, or the attribute is ignored and the click looks
             broken. */
          attrs=/^https?:/i.test(target)
            ? ' target="_blank" rel="noopener"'
            : ' download';
        } else {
          /* No usable link yet, or something that is not a link at all, such
             as a Google Sheets file chip, which the API only gives us as
             plain text. Ask rather than offer a button that 404s. */
          href='mailto:'+CONFIG.email+'?subject='+encodeURIComponent(r.title);
          label='Ask for this';
          attrs='';
        }
        var meta=[r.format,r.length,free?'Free':r.price].filter(Boolean).join(' · ');
        return '<div class="it"><div><b>'+esc(r.title)+'</b>'+
          (r.detail?'<p>'+esc(r.detail)+'</p>':'')+
          (meta?'<span class="mt">'+esc(meta)+'</span>':'')+'</div>'+
          '<a class="pill solid sm" href="'+esc(href)+'"'+attrs+'><span>'+label+'</span></a></div>';
      }).join('');
    }
    load(CONFIG.guidesUrl,CONFIG.guidesFallback).then(render);
  })();

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
    g.className='ground'; g.setAttribute('aria-label','About Dr. Devika Kamat');
    g.innerHTML='<span class="tip"><b>About Dr. Devika Kamat</b><i>In her own words</i>'+
      '<span class="w">How she trained, and why she did all of it to herself first.</span></span>';
    g.addEventListener('click',function(){
      document.getElementById('about').scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
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
        return '<div class="ev">'+
          '<div class="when"><div class="d">'+esc(day)+'</div><div class="m">'+esc(mon)+' '+esc(yr)+'</div></div>'+
          '<div class="what"><b>'+esc(d.title)+'</b>'+
            (d.detail?'<p>'+esc(d.detail)+'</p>':'')+
            (bits?'<div class="evmeta">'+bits+'</div>':'')+
          '</div>'+
          '<div class="act"><a class="pill solid" href="'+esc(href)+'" target="_blank" rel="noopener">'+
            '<span>Reserve a place</span></a></div>'+
        '</div>';
      }).join('');
    }

    load(CONFIG.eventsUrl,CONFIG.eventsFallback).then(render);
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
    var ab=aboutSec.getBoundingClientRect();
    var abOn = ab.top<vh*.7 && ab.bottom>vh*.3;
    grounds.forEach(function(g){g.classList.toggle('on',abOn)});
    if(abOn){heroNodes.concat(railNodes).forEach(function(n){n.classList.remove('on')})}
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
