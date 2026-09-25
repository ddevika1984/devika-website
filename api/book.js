/* ------------------------------------------------------------------
   Where every Payment Page's "Redirect URL" points, after the customer
   pays. Razorpay appends its own payment id to whatever URL is
   configured, so this renders a real page rather than bouncing straight
   to Calendly - a redirect only exists as long as the tab does, and a
   page survives someone switching to their banking app for UPI and
   coming back a minute later.

   Each Payment Page needs its "Redirect URL" (Settings on the page, not
   the webhook) set to:

     https://<site>/api/book?p=<product key>

   using the keys in lib/products.js, e.g. ?p=counsel-1-online. Razorpay
   adds razorpay_payment_id itself, so the full URL it hits looks like
   /api/book?p=counsel-1-online&razorpay_payment_id=pay_xxx.

   No email, no webhook dependency for the customer to see the link -
   this is the whole booking flow now. The Razorpay webhook
   (webhooks/razorpay.js) still fires separately to record the payment
   in the Bookings sheet; it no longer sends anything to the customer.

   In-person counseling (`counsel-1-person`) is one exception: no
   Calendly event, location and time vary, so its product entry carries
   a `whatsapp` number instead of a `calendlyUrl` and this page shows a
   "message on WhatsApp" button in its place - see the branch in page()
   below.

   The Meditation Club's one-time monthly plan (`meditation-monthly`) is
   another: paying gets you into a WhatsApp *group*, not a session, so
   its product entry carries a `whatsappGroup` invite link instead, and
   this page shows a "join the group" button that goes straight there.
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
  const heading = product ? 'Thank you!' : 'Payment received.';
  let body, cta;

  if (product && product.whatsappGroup) {
    body = `Tap below to join the Meditation Club WhatsApp group.`;
    cta = `<a class="btn" href="${escapeAttr(product.whatsappGroup)}">Join the WhatsApp group</a>`;
  } else if (product && product.whatsapp) {
    body = `Please contact Dr Devika on WhatsApp at ${formatPhone(product.whatsapp)} for location and time.`;
    cta = `<a class="btn" href="https://wa.me/${escapeAttr(product.whatsapp)}">Message on WhatsApp</a>`;
  } else if (product) {
    body = `Your ${escapeHtml(product.name.toLowerCase())} is booked as far as payment goes.
       Tap below to pick a time that works for you.`;
    cta = link
      ? `<a class="btn" href="${escapeAttr(link)}">Book your session</a>`
      : `<a class="btn" href="mailto:info@drddevikakamat.com">Email us</a>`;
  } else {
    body = `We couldn't tell which session this was for, so please email us and
       we'll get you booked by hand.`;
    cta = `<a class="btn" href="mailto:info@drddevikakamat.com">Email us</a>`;
  }

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

/* wa.me needs the full international number (91xxxxxxxxxx); the page
   copy reads better as the plain 10-digit number Devika actually gives
   out, so this strips a leading "91" only when what's left is a normal
   10-digit Indian mobile number. */
function formatPhone(whatsapp) {
  const digits = String(whatsapp);
  return digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;');
}
