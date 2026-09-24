const { serve } = require('./_sheet.js');

/* Sheet: "Devika website — Reviews". Columns: Name, Review, Context, Rating.
   "Name" is shaped into `title` below because _sheet.js's serve() only
   keeps rows that have one, the same "is this row actually filled in" gate
   Events and Guides already rely on. */
const SHEET_ID =
  process.env.SHEET_REVIEWS_ID || '10xIuBAL1Wo8zZznJ5BKmnDQteNFVu4kZgGM6dR8QyWE';

module.exports = async (req, res) =>
  serve(res, SHEET_ID, r => ({
    title:   r.name    || '',
    review:  r.review  || '',
    context: r.context || '',
    rating:  r.rating  || ''
  }));
