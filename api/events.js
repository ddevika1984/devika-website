const { serve } = require('./_sheet.js');

/* Sheet: "Devika website — Events". The id is not a secret; the sheet is
   readable by anyone with the link, which is what lets the site read it. */
const SHEET_ID =
  process.env.SHEET_EVENTS_ID || '1SEoJz7CupAfm2RH8LN4yhbBFmyDm3snpv9W8N5gSze4';

module.exports = async (req, res) =>
  serve(res, SHEET_ID, r => ({
    title:  r.title  || '',
    date:   r.date   || '',
    time:   r.time   || '',
    place:  r.place  || '',
    format: r.format || '',
    price:  r.price  || '',
    detail: r.detail || '',
    link:   r.link   || ''
  }));
