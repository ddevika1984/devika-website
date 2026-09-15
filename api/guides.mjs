import { serve } from './_sheet.mjs';

/* Sheet: "Devika website — Guides". */
const SHEET_ID =
  process.env.SHEET_GUIDES_ID || '1m4aKs8l4XbWf1KEVk43TBgnd43V-MKUhkAS2QBeTE58';

export default async function handler(req, res) {
  await serve(res, SHEET_ID, r => ({
    title:  r.title  || '',
    detail: r.detail || '',
    format: r.format || '',
    length: r.length || '',
    price:  r.price  || '',
    file:   r.file   || '',
    link:   r.link   || ''
  }));
}
