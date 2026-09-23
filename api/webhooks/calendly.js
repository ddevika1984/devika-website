/* ------------------------------------------------------------------
   Calendly webhook. Create the subscription once with Calendly's API
   (organization webhook, scope "user" or "organization", events
   invitee.created and invitee.canceled, callback URL
   https://<site>/api/webhooks/calendly) - Calendly hands back a signing
   key at creation time, which is CALENDLY_WEBHOOK_SIGNING_KEY here.
   There is no dashboard toggle for this on most plans, it has to be
   created via a one-off API call - see README setup notes.

   Every Calendly link we email out carries ?utm_content=<razorpay payment
   id> and ?utm_source=<product code>, built by bookingUrl() in
   lib/products.js. That is how invitee.created below knows which payment a
   booking belongs to without guessing from name or email (people mistype
   both).

   invitee.canceled fires in two situations that need different handling:
   - the client rescheded or cancelled it themselves through Calendly's
     own flow - Calendly already emails them about that, so this just
     updates the sheet.
   - Devika cancelled it from her own Calendly, e.g. a last-minute
     conflict. Calendly's payload names who cancelled
     (payload.cancellation.canceled_by), so that case is detected here and
     gets its own warmer email with a fresh booking link, which Calendly
     does not send on its own.
   ------------------------------------------------------------------ */

const crypto = require('crypto');
const { productFor, bookingUrl } = require('../lib/products.js');
const { recordBooking, recordCancellation } = require('../lib/bookings-sheet.js');
const { sendEmail, bookingConfirmedEmail, needsRescheduleEmail } = require('../lib/email.js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  if (!signingKey) return res.status(503).json({ error: 'not configured' });

  const rawBody = await readRawBody(req);
  if (!verifySignature(req.headers['calendly-webhook-signature'], rawBody, signingKey)) {
    console.error('calendly webhook: bad signature');
    return res.status(400).json({ error: 'bad signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (e) {
    return res.status(400).json({ error: 'bad json' });
  }

  try {
    if (event.event === 'invitee.created') {
      await handleCreated(event.payload);
    } else if (event.event === 'invitee.canceled') {
      await handleCanceled(event.payload);
    }
  } catch (err) {
    console.error('calendly webhook: handling failed:', err.message);
  }

  return res.status(200).json({ ok: true });
};

async function handleCreated(payload) {
  const paymentId = extractUtmContent(payload);
  const invitee = payload;
  const eventInfo = payload.scheduled_event || {};
  const startTime = eventInfo.start_time;
  const endTime = eventInfo.end_time;
  const eventUri = eventInfo.uri || payload.uri;

  const referenceId = extractUtmSource(payload);
  const product = productFor(referenceId);

  const sheetRow = await recordBooking({
    payment_id: paymentId || '',
    customer_email: (invitee.email || '').toLowerCase(),
    calendly_event_uri: eventUri || '',
    calendly_start_time: startTime || '',
    calendly_end_time: endTime || ''
  });

  const rescheduleUrl = invitee.reschedule_url || '';
  const cancelUrl = invitee.cancel_url || '';
  const name = invitee.name || (sheetRow && sheetRow.customer_name) || '';
  const productName = (product && product.name) || (sheetRow && sheetRow.product_name) || 'your session';

  if (invitee.email) {
    const msg = bookingConfirmedEmail({
      name,
      productName,
      startTime,
      rescheduleUrl,
      cancelUrl
    });
    await sendEmail({ to: invitee.email, ...msg });
  }
}

async function handleCanceled(payload) {
  const invitee = payload;
  const cancellation = payload.cancellation || {};
  const hostEmail = (process.env.HOST_EMAIL || '').toLowerCase();
  const canceledBy = (cancellation.canceled_by || '').toLowerCase();

  /* If the person who cancelled is not the invitee, and matches the
     host's own email, this was Devika cancelling from her side rather
     than the client rescheduling themselves. */
  const hostCancelled = Boolean(
    hostEmail &&
      canceledBy &&
      canceledBy !== (invitee.email || '').toLowerCase() &&
      canceledBy.includes(hostEmail)
  );

  const eventInfo = payload.scheduled_event || {};
  const referenceId = extractUtmSource(payload);
  const product = productFor(referenceId);
  const paymentId = extractUtmContent(payload);

  /* Recorded for every cancellation, not just the host's, so the freed
     session goes back on a package. A client rescheduling arrives here as
     a cancel and then a fresh booking, and that booking counts a session. */
  const sheetRow = await recordCancellation({
    payment_id: paymentId || '',
    calendly_event_uri: eventInfo.uri || payload.uri || '',
    host_cancelled: hostCancelled
  });

  /* Calendly emails the client itself when they cancel or move something
     of their own accord, so the only case needing a word from us is the
     one Calendly has no warm wording for. */
  if (!hostCancelled) return;

  const productName = (product && product.name) || (sheetRow && sheetRow.product_name) || 'your session';
  const url = bookingUrl(product || productFor(sheetRow && sheetRow.reference_id), {
    paymentId: paymentId || (sheetRow && sheetRow.payment_id),
    name: invitee.name,
    email: invitee.email
  });

  if (invitee.email && url) {
    const msg = needsRescheduleEmail({ name: invitee.name, productName, bookingUrl: url });
    await sendEmail({ to: invitee.email, ...msg });
  }
}

function extractUtmContent(payload) {
  const t = payload.tracking || {};
  return t.utm_content || null;
}
function extractUtmSource(payload) {
  const t = payload.tracking || {};
  return t.utm_source || null;
}

function verifySignature(header, rawBody, signingKey) {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(',').map(p => {
      const [k, v] = p.split('=');
      return [k.trim(), v];
    })
  );
  if (!parts.t || !parts.v1) return false;

  const signedPayload = `${parts.t}.${rawBody}`;
  const expected = crypto.createHmac('sha256', signingKey).update(signedPayload).digest('hex');

  return (
    expected.length === parts.v1.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1))
  );
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}
