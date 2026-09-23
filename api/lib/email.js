/* ------------------------------------------------------------------
   Sends transactional email through Resend (resend.com). Resend was
   picked over Gmail here because these emails are sent by server code
   on every payment and booking, not by a person, and a transactional
   provider gives proper deliverability, a dashboard of what was sent,
   and does not put a personal Gmail account at risk of being flagged
   for automated sending.

   RESEND_API_KEY comes from the Resend dashboard. EMAIL_FROM must be an
   address at a domain verified in Resend (Domains -> Add Domain, then a
   few DNS records) - until that is done, Resend only delivers to your
   own account email, which is fine for testing but not for real
   customers.
   ------------------------------------------------------------------ */

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Dr. Devika Kamat <onboarding@resend.dev>';
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from, to, subject, html })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`resend error ${res.status}: ${text}`);
  }
  return res.json();
}

function fmtDateTime(iso) {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata'
    });
  } catch (e) {
    return iso;
  }
}

function wrap(bodyHtml) {
  return `
  <div style="font-family:Georgia,'Times New Roman',serif;max-width:520px;margin:0 auto;color:#2B2118;line-height:1.6">
    ${bodyHtml}
    <p style="margin-top:32px;font-size:13px;color:#8A7A5E">Dr. Devika Kamat</p>
  </div>`;
}

function bookingConfirmedEmail({ name, productName, startTime, rescheduleUrl, cancelUrl }) {
  return {
    subject: `You're booked — ${productName}`,
    html: wrap(`
      <p>Hi ${name || 'there'},</p>
      <p>Your session is confirmed.</p>
      <p><strong>${productName}</strong><br>${fmtDateTime(startTime)}</p>
      <p>Need to change it? You can <a href="${rescheduleUrl}">reschedule</a> or
      <a href="${cancelUrl}">cancel</a> any time before the session.</p>
      <p>See you then.</p>
    `)
  };
}

function needsRescheduleEmail({ name, productName, bookingUrl }) {
  return {
    subject: `We need to reschedule — ${productName}`,
    html: wrap(`
      <p>Hi ${name || 'there'},</p>
      <p>Something has come up on my end and I am not able to keep our
      upcoming session for <strong>${productName}</strong>. I am sorry for
      the short notice.</p>
      <p>Please pick a new time that works for you:</p>
      <p><a href="${bookingUrl}">${bookingUrl}</a></p>
      <p>Thank you for your patience.</p>
    `)
  };
}

module.exports = {
  sendEmail,
  bookingConfirmedEmail,
  needsRescheduleEmail
};
