/* ------------------------------------------------------------------
   Shared by event.html and guide.html: the single-item pages that give
   each event or guide its own shareable URL (?e=... or ?g=...). Not
   loaded by index.html, so it duplicates a few small helpers from
   site.js rather than adding a load-order dependency between pages.
   ------------------------------------------------------------------ */

function esc(v){return String(v==null?'':v).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

/* Turns a title into the slug used in the page's URL. Events add the date
   too (see eventSlug in site.js) since the same title can recur, such as
   a monthly circle, and would otherwise collide. This copy must build the
   same slug the listing page links to, or the link 404s. */
function slugify(s){
  return String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

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
