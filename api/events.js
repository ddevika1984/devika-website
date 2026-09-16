const { serve } = require('./_sheet.js');

/* Sheet: "Devika website — Events". The id is not a secret; the sheet is
   readable by anyone with the link, which is what lets the site read it. */
const SHEET_ID =
  process.env.SHEET_EVENTS_ID || '1SEoJz7CupAfm2RH8LN4yhbBFmyDm3snpv9W8N5gSze4';

/* Times are shown as "11:00 AM" no matter how they were typed.
   Google hands back whatever the cell is formatted as, so the same 11am can
   arrive as "11:00", "11:00:00" or "11:00 AM" depending on how Devika
   entered it, and she should not have to think about that. Anything this
   cannot read is passed through untouched rather than dropped. */
function tidyTime(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const m = /^(\d{1,2})(?:[:.](\d{1,2}))?(?::\d{1,2})?\s*(am|pm|a\.m\.|p\.m\.)?$/i.exec(s);
  if (!m) return s;

  let hour = parseInt(m[1], 10);
  const mins = m[2] ? m[2].padStart(2, '0') : '00';
  const said = (m[3] || '').toLowerCase().replace(/\./g, '');

  if (hour > 23 || parseInt(mins, 10) > 59) return s;

  let suffix;
  if (said) {
    /* She wrote am or pm, so take her word for it. */
    suffix = said.startsWith('p') ? 'PM' : 'AM';
    if (hour > 12) return s;
    if (hour === 12) hour = suffix === 'AM' ? 0 : 12;
    else if (suffix === 'PM') hour += 12;
  } else {
    /* No am or pm, so it came out of the sheet on a 24 hour clock. */
    suffix = hour >= 12 ? 'PM' : 'AM';
  }
  const shown = hour % 12 === 0 ? 12 : hour % 12;
  return `${shown}:${mins} ${suffix}`;
}

module.exports = async (req, res) =>
  serve(res, SHEET_ID, r => ({
    title:  r.title  || '',
    date:   r.date   || '',
    time:   tidyTime(r.time),
    place:  r.place  || '',
    format: r.format || '',
    price:  r.price  || '',
    detail: r.detail || '',
    link:   r.link   || ''
  }));
