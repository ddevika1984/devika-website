const { serve } = require('./_sheet.js');

/* Sheet: "Devika website — Guides". */
const SHEET_ID =
  process.env.SHEET_GUIDES_ID || '1m4aKs8l4XbWf1KEVk43TBgnd43V-MKUhkAS2QBeTE58';

module.exports = async (req, res) =>
  serve(res, SHEET_ID, r => ({
    title:  r.title  || '',
    detail: r.detail || '',
    format: r.format || '',
    length: r.length || '',
    price:  r.price  || '',
    file:   r.file   || '',
    link:   r.link   || ''
  }));
