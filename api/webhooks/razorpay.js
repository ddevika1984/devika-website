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

   Which offering was bought comes from the amount, EXCEPT for the
   Meditation Club's annual subscription - see the branch below and the
   comment on meditation-annual in lib/products.js for why amount alone
   is not enough for that one.
   ------------------------------------------------------------------ */

const crypto = require('crypto');
const { productForAmount, productFor } = require('../lib/products.js');
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

  /* A subscription charge's payload carries a `subscription` entity
     alongside `payment`; a one-time Payment Page payment never does. The
     Meditation Club's annual plan is priced identically to its one-time
     monthly plan on purpose (same ₹1,198), so amount can't tell them
     apart here - this can, and has to run first. There is only one
     subscription product on the site today, so no plan_id lookup yet;
     if a second one is ever added, match on
     event.payload.subscription.entity.plan_id instead of assuming. */
  const subscription = event.payload && event.payload.subscription && event.payload.subscription.entity;
  const product = subscription ? productFor('meditation-annual') : productForAmount(rupees);
  const email = (payment.email || '').toLowerCase();
  const paidAt = new Date((payment.created_at || Date.now() / 1000) * 1000);

  /* Membership products (the Meditation Club) carry a durationDays that
     says how long this one payment covers. Stamping paid_through here,
     at capture time, means the Bookings sheet can flag a lapsed member
     with a plain date comparison - see flagLapsedMembers_ in
     sheets/bookings-webapp.gs - without recomputing it from paid_at every
     time the sheet is checked. */
  const paidThrough = product && product.membership
    ? new Date(paidAt.getTime() + product.membership.durationDays * 24 * 60 * 60 * 1000).toISOString()
    : '';

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
      paid_at: paidAt.toISOString(),
      paid_through: paidThrough
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
