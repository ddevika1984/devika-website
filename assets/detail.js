/* ------------------------------------------------------------------
   Small helpers shared by every page that reads an event, a guide or a
   chapter by its slug: index.html (assets/site.js, assets/chapter.js),
   event.html, guide.html and offering.html. Loaded before all of them,
   right after assets/data.js, so there is exactly one copy of how a
   slug is built and one copy of usableLink's rules.
   ------------------------------------------------------------------ */

function esc(v){return String(v==null?'':v).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

/* Turns a title into the slug used in that item's URL. Events add the
   date too, since the same title can recur (a monthly circle) and would
   otherwise collide; guides and chapters have no date, so the title
   alone is it. */
function slugify(s){
  return String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
function eventSlug(r){return slugify(r.title)+'-'+String(r.date||'').trim()}
function guideSlug(r){return slugify(r.title)}
function chapterSlug(s){return slugify(s.t)}

/* Same rule as usableLink in assets/site.js: accepts a real URL, rewrites
   a Drive share link to its direct-download form, accepts a files/ or
   images/ path committed alongside the site, and rejects anything else,
   such as the text a Google Sheets "file chip" hands back. */
function usableLink(raw){
  var s=String(raw||'').trim();
  if(!s) return '';
  var drive=/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?[^#]*id=)([-\w]{16,})/.exec(s);
  if(drive) return 'https://drive.google.com/uc?export=download&id='+drive[1];
  if(/^https?:\/\//i.test(s)) return s;
  if(/^\/?(files|images)\/[^\s]+\.[a-z0-9]{2,5}$/i.test(s)) return s;
  return '';
}

/* Try the sheet, fall back to the committed JSON, same as site.js. */
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

function qparam(k){
  return new URLSearchParams(location.search).get(k)||'';
}
