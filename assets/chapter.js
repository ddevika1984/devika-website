/* ------------------------------------------------------------------
   Renders one CH entry (see assets/data.js) as a chapter section, and
   wires up its picker and/or guides list once it is in the DOM.

   Shared by assets/site.js, which uses it for every entry on the
   homepage, and offering.html, which uses it for the single entry that
   page is about. Keeping this in one place means a change to what a CH
   entry can contain only has to be taught to one renderer.

   Depends on esc/slugify/usableLink/load/guideSlug (assets/detail.js)
   and CONFIG (assets/data.js), both loaded first.
   ------------------------------------------------------------------ */

function chapterSlug(s){return slugify(s.t)}

function chapterHTML(s,i){
  var facts=(s.f&&s.f.length)?'<div class="facts">'+s.f.map(function(p){
    return '<div><div class="k">'+esc(p[0])+'</div><div class="v">'+esc(p[1])+'</div></div>'}).join('')+'</div>':'';

  var guides = s.guides ? '<div class="kit" data-guides><div class="evempty" style="border:0;padding:20px 0">Loading guides&hellip;</div></div>' : '';

  var picker='';
  if(s.picker){
    picker='<div class="picker" data-picker>'+
      s.picker.groups.map(function(g){
        return '<div class="pgroup" role="group" aria-label="'+esc(g.key)+'">'+g.opts.map(function(o,n){
          return '<button type="button" class="popt'+(n===0?' on':'')+'" data-group="'+esc(g.key)+'" data-val="'+esc(o[0])+'">'+esc(o[1])+'</button>'
        }).join('')+'</div>';
      }).join('')+
      '<div class="pout"><span class="pprice" data-pprice></span></div>'+
      '<p class="psub" data-psub></p>'+
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
}

/* Wires up the throat-style picker's click handling and, on the guides
   chapter, loads the live guides list. sec is the .chap element already
   in the DOM (from chapterHTML above); s is the same CH entry. */
function wireChapter(sec,s){
  var p=sec.querySelector('[data-picker]');
  if(p && s.picker){
    var buy=sec.querySelector('[data-pbuy]');
    var out=p.querySelector('[data-pprice]');
    var sub=p.querySelector('[data-psub]');
    function state(){
      return s.picker.groups.map(function(g){
        return p.querySelector('.popt.on[data-group="'+g.key+'"]').dataset.val;
      }).join('-');
    }
    function sync(){
      var hit=s.picker.prices[state()];
      out.textContent=hit.price;
      buy.href=hit.href;
      /* sub is optional - only the Meditation Club's picker uses it, to
         spell out which option auto-renews when two options share a
         price and the number alone can't say so. */
      sub.textContent=hit.sub||'';
      sub.style.display=hit.sub?'':'none';
    }
    p.addEventListener('click',function(e){
      var b=e.target.closest('.popt'); if(!b) return;
      var group=b.dataset.group;
      p.querySelectorAll('.popt[data-group="'+group+'"]').forEach(function(o){o.classList.remove('on')});
      b.classList.add('on');
      sync();
    });
    buy.setAttribute('target','_blank'); buy.setAttribute('rel','noopener');
    sync();
  }

  var box=sec.querySelector('[data-guides]');
  if(box && s.guides){
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
          attrs=/^https?:/i.test(target)
            ? ' target="_blank" rel="noopener"'
            : ' download';
        } else {
          href='mailto:'+CONFIG.email+'?subject='+encodeURIComponent(r.title);
          label='Ask for this';
          attrs='';
        }
        var meta=[r.format,r.length,free?'Free':r.price].filter(Boolean).join(' · ');
        return '<div class="it"><div><b><a href="/guide?g='+esc(guideSlug(r))+'">'+esc(r.title)+'</a></b>'+
          (r.detail?'<p>'+esc(r.detail)+'</p>':'')+
          (meta?'<span class="mt">'+esc(meta)+'</span>':'')+'</div>'+
          '<a class="pill solid sm" href="'+esc(href)+'"'+attrs+'><span>'+label+'</span></a></div>';
      }).join('');
    }
    load(CONFIG.guidesUrl,CONFIG.guidesFallback).then(render);
  }
}
