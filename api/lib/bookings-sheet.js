/* ------------------------------------------------------------------
   Writes to the "Bookings" Google Sheet through an Apps Script Web App
   (see sheets/bookings-webapp.gs). The Sheets read path elsewhere in this
   repo (api/_sheet.js) only reads, via Google's public gviz endpoint,
   which cannot write. Apps Script is the write side: it runs inside the
   sheet itself and exposes one POST/GET URL, so there is no Google Cloud
   project or service account credential to manage.

   BOOKINGS_SHEET_URL is the Web App's /exec URL from the Apps Script
   deploy screen. BOOKINGS_SHEET_SECRET is a random string you choose,
   set the same in both the Vercel env var and the top of the .gs file, so
   a stranger who finds the URL cannot write junk into the sheet.
   ------------------------------------------------------------------ */

async function callSheet(action, payload) {
  const url = process.env.BOOKINGS_SHEET_URL;
  const secret = process.env.BOOKINGS_SHEET_SECRET;
  if (!url || !secret) throw new Error('bookings sheet not configured');

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, action, ...payload })
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`bookings sheet returned non-JSON: ${text.slice(0, 200)}`);
  }
  if (!res.ok || data.error) {
    throw new Error(`bookings sheet error: ${data.error || res.status}`);
  }
  return data;
}

/* Called from the Razorpay webhook once a payment is confirmed. */
function upsertPayment(fields) {
  return callSheet('upsert_payment', fields);
}

/* Called from the Calendly webhook when someone books a slot. */
function recordBooking(fields) {
  return callSheet('record_booking', fields);
}

/* Called from the Calendly webhook on any cancellation. host_cancelled
   separates "Devika had a conflict" from "the client cancelled or moved
   it themselves", which decides whether we email about it. Either way the
   session slot goes back, so a reschedule does not count as two sessions
   of a package. */
function recordCancellation(fields) {
  return callSheet('record_cancellation', fields);
}

module.exports = {
  upsertPayment,
  recordBooking,
  recordCancellation
};
