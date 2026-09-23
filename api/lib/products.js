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
   assets/site.js. Verified against site.js as of the first build.

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
    calendlyUrl: 'https://calendly.com/REPLACE_ME/counseling-online',
    sessionsTotal: 1
  },
  'counsel-1-person': {
    amount: 10000,
    name: 'Holistic counseling (1 session, in person)',
    calendlyUrl: 'https://calendly.com/REPLACE_ME/counseling-in-person',
    sessionsTotal: 1
  },
  'nutrition-4': {
    amount: 15000,
    name: 'Integrative nutrition',
    calendlyUrl: 'https://calendly.com/REPLACE_ME/nutrition-session',
    sessionsTotal: 4
  }
};

/* The meditation club (a monthly subscription) and the paid guides have
   no Calendly event behind them, so they are deliberately absent and
   their payments are recorded without a booking email. */
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
