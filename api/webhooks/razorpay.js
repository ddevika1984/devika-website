/* ------------------------------------------------------------------
   Razorpay webhook. Configure this URL (https://<site>/api/webhooks/razorpay)
   under Settings -> Webhooks in the Razorpay dashboard, subscribed to the
   "payment.captured" event, and set the webhook secret it gives you as
   RAZORPAY_WEBHOOK_SECRET in Vercel.

   payment.captured, not payment_link.paid: the offerings are Razorpay
   *Payment Pages*, which do not raise payment link events at all.
   Subscribing to the wrong event is a silent failure - nothing errors,
   the endpoint simply never gets called - so if payments stop producing
   booking emails, check the event subscription first.

   This records the payment in the Bookings sheet, which is all it does
   now. The customer's own booking link comes from the redirect Razorpay
   sends them to right after paying (see api/book.js) rather than from an
   email out of this webhook, so nothing here is on the critical path for
   the customer - this exists purely so Devika has a record of who paid.

   Which offering was bought comes from the amount. See lib/products.js
   for why, and for the constraint that keeps it working.
   ------------------------------------------------------------------ */

const crypto = require('crypto');
const { productForAmount } = require('../lib/products.js');
const { upsertPayment } = require('../lib/bookings-sheet.js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ error: 'not configured' });

  const signature = req.headers['x-razorpay-signature'];
  const rawBody = await readRawBody(req);

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const ok =
    typeof signature === 'string' &&
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

  if (!ok) {
    console.error('razorpay webhook: bad signature');
    return res.status(400).json({ error: 'bad signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (e) {
    return res.status(400).json({ error: 'bad json' });
  }

  if (event.event !== 'payment.captured') {
    return res.status(200).json({ ignored: event.event || true });
  }

  const payment = event.payload && event.payload.payment && event.payload.payment.entity;
  if (!payment) return res.status(200).json({ ignored: 'missing payment entity' });

  /* Razorpay works in paise. */
  const rupees = (payment.amount || 0) / 100;
  const product = productForAmount(rupees);
  const email = (payment.email || '').toLowerCase();

  try {
    await upsertPayment({
      payment_id: payment.id,
      reference_id: product ? product.key : '',
      product_name: product ? product.name : `unrecognised (₹${rupees})`,
      sessions_total: product ? product.sessionsTotal : 1,
      customer_name: '',
      customer_email: email,
      customer_phone: payment.contact || '',
      amount: rupees,
      paid_at: new Date((payment.created_at || Date.now() / 1000) * 1000).toISOString()
    });
  } catch (err) {
    /* Log and still 200 - Razorpay retries on non-2xx, and a sheet hiccup
       should not cause it to spam retries indefinitely. The payment
       itself already succeeded; this only affects our own bookkeeping.
       The email below still goes out, because getting the person booked
       matters more than our own record of it. */
    console.error('razorpay webhook: sheet write failed:', err.message);
  }

  /* Nothing to book against a subscription, a guide, or a price that
     matches no offering, so those are recorded and left alone. The log
     line matters: an unrecognised amount most likely means a price
     changed on a Razorpay page without lib/products.js being updated. */
  if (!product) {
    console.log(`razorpay webhook: no offering priced ₹${rupees}, payment ${payment.id} recorded only`);
  }

  return res.status(200).json({ ok: true });
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}
