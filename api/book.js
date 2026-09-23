/* ------------------------------------------------------------------
   Where every Payment Page's "Redirect URL" points, after the customer
   pays. Razorpay appends its own payment id to whatever URL is
   configured, so this renders a real page rather than bouncing straight
   to Calendly - a redirect only exists as long as the tab does, and a
   page survives someone switching to their banking app for UPI and
   coming back a minute later.

   In-person counseling does not redirect here at all - Devika books that
   one herself after the client emails her, so its Payment Page's success
   message just says that directly, with no redirect and nothing to
   configure here.

   Each of the other Payment Pages needs its "Redirect URL" (Settings on
   the page, not the webhook) set to:

     https://<site>/api/book?p=<product key>

   using the keys in lib/products.js, e.g. ?p=counsel-1-online. Razorpay
   adds razorpay_payment_id itself, so the full URL it hits looks like
   /api/book?p=counsel-1-online&razorpay_payment_id=pay_xxx.

   No email, no webhook dependency for the customer to see the link -
   this is the whole booking flow now. The Razorpay webhook
   (webhooks/razorpay.js) still fires separately to record the payment
   in the Bookings sheet; it no longer sends anything to the customer.
   ------------------------------------------------------------------ */

const { productFor, bookingUrl } = require('./lib/products.js');

module.exports = async (req, res) => {
  const { p, razorpay_payment_id: paymentId } = req.query || {};
  const product = p ? productFor(String(p)) : null;
  const link = product ? bookingUrl(product, { paymentId }) : '';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(page({ product, link }));
};

function page({ product, link }) {
  const heading = product ? 'Thank you.' : 'Payment received.';
  const body = product
    ? `Your ${escapeHtml(product.name.toLowerCase())} is booked as far as payment goes.
       Tap below to pick a time that works for you.`
    : `We couldn't tell which session this was for, so please email us and
       we'll get you booked by hand.`;
  const cta = product && link
    ? `<a class="btn" href="${escapeAttr(link)}">Book your session</a>`
    : `<a class="btn" href="mailto:info@drddevikakamat.com">Email us</a>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Book your session — Dr. Devika Kamat</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500&family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet">
<style>
  :root{--rose:#AC6670;--cream:#F0ECDC;--ui:Poppins,system-ui,-apple-system,sans-serif;
    --mono:'IBM Plex Mono',ui-monospace,'SF Mono',monospace}
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#100D0C;color:var(--cream);font-family:var(--ui);font-weight:300;
    padding:32px 20px}
  .card{max-width:420px;text-align:center}
  .mono{display:block;font-family:var(--mono);font-size:10px;letter-spacing:.2em;
    text-transform:uppercase;color:var(--rose);margin-bottom:18px}
  h1{font-size:28px;font-weight:400;margin:0 0 14px}
  p{font-size:15px;line-height:1.6;color:#cfc9b8;margin:0 0 32px}
  .btn{display:inline-block;padding:14px 32px;font-family:var(--mono);font-size:11px;
    letter-spacing:.16em;text-transform:uppercase;background:var(--rose);color:#100D0C;
    text-decoration:none;border-radius:2px}
  .btn:hover{opacity:.9}
</style>
</head>
<body>
  <div class="card">
    <span class="mono">Dr. Devika Kamat</span>
    <h1>${heading}</h1>
    <p>${body}</p>
    ${cta}
  </div>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;');
}
