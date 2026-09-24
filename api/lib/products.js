/* ------------------------------------------------------------------
   What each offering costs, what to call it, which Calendly event type
   to send the buyer to, and how many sessions they just bought.

   Products are looked up BY PRICE. That needs explaining, because it is
   not the obvious choice.

   These offerings are Razorpay *Payment Pages*, not Payment Links. A
   Payment Link carries a Reference ID that a webhook can read, which
   would be the natural thing to key on. Payment Pages have no equivalent:
   the dashboard shows a "Payment Page Title" and a pl_... id against each
   payment, but neither is in the payment.captured webhook payload, and
   notes, description and invoice_id all arrive empty. The amount is the
   only thing in the payload that distinguishes one offering from another.

   This works because every price here is distinct, and that is a real
   constraint, not a coincidence to rely on quietly:

   **If two offerings are ever priced the same, this breaks**, and it
   breaks silently - whichever is listed first wins and the other one's
   buyers get sent to the wrong Calendly. If a price changes, change it
   here in the same breath. Anything unrecognised is recorded and left
   alone rather than guessed at, and logged so it can be spotted.

   Prices must agree with the Razorpay page, same rule as the CH array in
   assets/data.js. Verified against that array as of the first build.

   Calendly URLs are placeholders until the real event types exist.
   ------------------------------------------------------------------ */

const PRODUCTS = {
  'discovery-call': {
    amount: 2500,
    name: 'Discovery call',
    calendlyUrl: 'https://calendly.com/drddevikakamat--holisticwellness/soul-alchemy',
    sessionsTotal: 1
  },
  'counsel-1-online': {
    amount: 8000,
    name: 'Holistic counseling (1 session, online)',
    calendlyUrl: 'https://calendly.com/drddevikakamat--holisticwellness/holistic-councilling-rewiring-energy-alignment',
    sessionsTotal: 1
  },
  /* In-person has no Calendly link on purpose - Devika books these
     herself after the client emails her, rather than through Calendly.
     api/book.js falls back to an "email us" button when calendlyUrl is
     empty, which is exactly the behaviour wanted here. */
  'counsel-1-person': {
    amount: 10000,
    name: 'Holistic counseling (1 session, in person)',
    calendlyUrl: '',
    sessionsTotal: 1
  },
  'nutrition-4': {
    amount: 15000,
    name: 'Integrative nutrition',
    calendlyUrl: 'https://calendly.com/drddevikakamat--holisticwellness/integrative-nutrition',
    sessionsTotal: 4
  },
  /* Membership, not a booking - no Calendly event, so no booking email.
     `membership.durationDays` is how long one payment covers, used by the
     webhook to stamp a paid_through date in the Bookings sheet so a
     monthly Apps Script pass can flag whoever has lapsed. Monthly is a
     true recurring Razorpay subscription (auto-charged, cancel anytime),
     so a fresh payment.captured - and a fresh row here - arrives every
     ~30 days on its own. Annual is a single upfront Payment Page payment
     covering the full year. */
  'meditation-monthly': {
    amount: 1198,
    name: 'Meditation Club (monthly)',
    calendlyUrl: '',
    sessionsTotal: 0,
    membership: { durationDays: 30 }
  },
  'meditation-annual': {
    amount: 14376,
    name: 'Meditation Club (annual)',
    calendlyUrl: '',
    sessionsTotal: 0,
    membership: { durationDays: 365 }
  }
};

/* The paid guides have no Calendly event behind them either, so their
   payments are recorded without a booking email the same way. */
function productForAmount(rupees) {
  const amount = Number(rupees);
  if (!amount) return null;
  const key = Object.keys(PRODUCTS).find(k => PRODUCTS[k].amount === amount);
  return key ? { key, ...PRODUCTS[key] } : null;
}

function productFor(key) {
  return PRODUCTS[key] ? { key, ...PRODUCTS[key] } : null;
}

/* Builds the Calendly link that goes into every email we send.

   utm_source carries the product key and utm_content carries the Razorpay
   payment id. Calendly passes both straight through to its webhook, which
   is how api/webhooks/calendly.js matches a booking back to the exact
   payment without guessing from a name or email the person may have typed
   differently. Every link we hand out has to carry them, including the
   follow-up and reschedule links, or that booking lands on no row. */
function bookingUrl(product, { paymentId, name, email } = {}) {
  if (!product || !product.calendlyUrl) return '';
  const params = new URLSearchParams({ hide_gdpr_banner: '1' });
  if (name) params.set('name', name);
  if (email) params.set('email', email);
  if (product.key) params.set('utm_source', product.key);
  if (paymentId) params.set('utm_content', paymentId);
  return `${product.calendlyUrl}?${params.toString()}`;
}

module.exports = { PRODUCTS, productFor, productForAmount, bookingUrl };
