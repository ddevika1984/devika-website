/* ------------------------------------------------------------------
   Reads a Google Sheet and hands back clean JSON.

   The browser cannot fetch a Google Sheet directly (Google sends no CORS
   headers), so this runs on Vercel instead and the page calls this.

   It uses the gviz JSON endpoint rather than CSV on purpose: gviz returns
   typed cells, so a date comes back as Date(2026,9,6) instead of a string
   that could be read as either 6 October or 10 June.

   The sheet must be shared as "Anyone with the link, Viewer" or this
   returns nothing.
   ------------------------------------------------------------------ */

/* headers=1 is not optional. Without it Google guesses whether row 1 is a
   header, and it guesses by looking for a type change between row 1 and
   the rest. That works on the events sheet, which has a date column, and
   fails on the guides sheet, which is text all the way down: the columns
   come back named "a", "b", "c" and the header row arrives as data.
   Stating it explicitly makes both sheets behave the same way. */
const GVIZ = id =>
  `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&headers=1`;

/* gviz wraps its JSON in a JavaScript callback, so cut that off first. */
function unwrap(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error('unexpected gviz response');
  return JSON.parse(text.slice(start, end + 1));
}

/* Date(2026,9,6) -> "2026-10-06". Month is zero based in gviz. */
function gvizDate(v) {
  const m = /^Date\((\d+),(\d+),(\d+)/.exec(String(v));
  if (!m) return null;
  const pad = n => String(n).padStart(2, '0');
  return `${m[1]}-${pad(Number(m[2]) + 1)}-${pad(m[3])}`;
}

function cellValue(cell) {
  if (!cell) return '';
  if (typeof cell.v === 'string' && cell.v.startsWith('Date(')) {
    return gvizDate(cell.v) || cell.f || '';
  }
  if (cell.v === null || cell.v === undefined) return '';
  if (typeof cell.v === 'number') return String(cell.f != null ? cell.f : cell.v);
  return String(cell.v);
}

/* Columns are matched by header name, not position, so inserting or
   reordering a column in the sheet does not break anything. */
function rowsFrom(table) {
  const headers = (table.cols || []).map(c =>
    String(c.label || c.id || '').trim().toLowerCase()
  );
  const out = [];
  for (const r of table.rows || []) {
    const rec = {};
    let any = false;
    headers.forEach((h, i) => {
      if (!h) return;
      const v = cellValue((r.c || [])[i]).trim();
      rec[h] = v;
      if (v) any = true;
    });
    if (any) out.push(rec);
  }
  return out;
}

/* The first data row of a CSV-imported sheet can come back as a header
   repeat. Drop a row that is just the column names again. */
function dropRepeatedHeader(rows) {
  if (!rows.length) return rows;
  const looksLikeHeader = Object.entries(rows[0]).every(
    ([k, v]) => String(v).trim().toLowerCase() === k
  );
  return looksLikeHeader ? rows.slice(1) : rows;
}

async function readSheet(id) {
  if (!id) return null;
  const res = await fetch(GVIZ(id), { headers: { 'User-Agent': 'devika-site' } });
  if (!res.ok) throw new Error(`sheet responded ${res.status}`);
  const data = unwrap(await res.text());
  if (!data.table) throw new Error('sheet returned no table');
  return dropRepeatedHeader(rowsFrom(data.table));
}

/* One place to decide how a response is cached and shaped, so both
   endpoints behave the same way. */
async function serve(res, id, shape) {
  try {
    const rows = await readSheet(id);
    if (!rows) return res.status(503).json({ error: 'sheet not configured' });
    const clean = rows.map(shape).filter(r => r && r.title);
    /* Cached at the edge for five minutes, and a stale copy is served
       while a fresh one is fetched, so Google being slow never blocks
       the page. */
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=86400'
    );
    return res.status(200).json(clean);
  } catch (err) {
    /* Fail loudly enough to debug, quietly enough that the page falls
       back to the committed JSON instead of showing an error. */
    console.error('sheet read failed:', err.message);
    return res.status(502).json({ error: 'could not read the sheet' });
  }
}

module.exports = { readSheet, serve };
