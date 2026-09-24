# Working on this repo

This is the website for Dr. Devika Kamat. It is a **plain static site**. No framework, no
build step, no package.json. Vercel serves the files exactly as they sit here.

Read this before changing anything.

## The golden rules

1. **Never change a payment link without being asked to.** Every `rzp.io` URL in
   `assets/data.js` points at a live Razorpay page that takes real money. A wrong link
   sends someone to the wrong product, or to a 404 after they have decided to pay.
   If a price shown on the site and the price on the Razorpay page disagree, say so and
   stop. Do not "fix" it by guessing.
2. **Do not add a build step, framework, bundler or package manager.** If something seems
   to need one, it almost certainly does not. Ask first.
3. **Push straight to `main`.** Pushing to `main` deploys to the live site immediately.
   That is fine, since a follow-up edit can always be pushed right after — but it means
   there is no review step between a change and it going live, so take extra care with
   anything in golden rule 1.
4. **Do not commit secrets.** There are none here today and it should stay that way.
   Anything sensitive belongs in Vercel's environment variables.

## Where things live

| I want to change... | Edit this |
|---|---|
| The six paid/booked offerings: titles, prices, descriptions, links | the `CH` array in `assets/data.js` |
| The email address, the events source | the `CONFIG` object in `assets/data.js` |
| Hero copy, the About section, the footer, the disclaimer | `index.html` |
| Colours, spacing, layout, animation | `assets/styles.css` |
| Events shown in the Events section | `content/events.json` (until the Google Sheet is connected) |
| The downloadable guides | `content/guides.json` |
| Reviews shown in the Reviews section | `content/reviews.json` (until the Google Sheet is connected) |
| The Gallery photos | `<img>` tags directly in `index.html`'s `#gallery` section, files in `images/gallery/` |
| Photos | `images/` |

## The `CH` array

Lives in `assets/data.js`, alongside `CONFIG`. One entry per offering, in the order they
appear on the page. The order of this array also drives the spine navigation and the
Offerings dropdown, so reordering it reorders the whole site.

`assets/data.js` is loaded before `assets/detail.js`, `assets/chapter.js` and
`assets/site.js` on `index.html`, and before `assets/detail.js` and `assets/chapter.js`
on `offering.html`. Both pages render a chapter from the same `CH` array; see "Event,
guide and offering detail pages" below.

The hero says "Seven ways to come back to yourself," which is the six `CH` entries plus
Events, counted as the seventh way to work together. If an entry is added to or removed
from `CH`, that headline (and the matching line in the hero card and the meta/og
descriptions) needs updating by hand, it is not calculated from the array length.

Each entry:

- `id` — must stay unique and must not change (links point at it)
- `key`, `sans`, `en` — the chakra labelling
- `c`, `bg`, `fg` — accent, background and foreground colour for that chapter
- `t`, `for_`, `det`, `det2` — the copy. `t`, the title, also becomes that offering's
  slug on `offering.html` (see below), so changing a title changes its URL.
- `f` — the fact rows, as `[label, value]` pairs
- `cta` — `{label, href}`. If `href` is empty the button falls back to an email link.
- `img` — path to the photo
- `picker` — only on the counselling chapter, see below
- `guides` — only on the guides chapter, makes it render from `content/guides.json`

## The counselling picker

The throat chapter (a single 60 to 90 minute session) has two Razorpay links behind one
offering, online or in person. The `picker` object is `{groups, prices}`: `groups` is an
ordered list of `{key, opts}` toggles to render, and `prices` maps the selected option
values, joined with `-` in group order, to a price and a link. With one group the key is
just that group's value, unjoined:

```
picker:{
  groups:[{key:"places",opts:[["online","Online"],["person","In person"]]}],
  prices:{
    online:{price:"₹8,000",  href:"https://rzp.io/rzp/JXSLclA"},
    person:{price:"₹10,000", href:"https://rzp.io/rzp/3BS7M02S"}
  }
}
```

Every combination the `groups` can produce must have a matching entry in `prices` or the
picker breaks. The displayed price and the link must agree with the Razorpay page.

Changing any price here means changing the matching `amount` in `api/lib/products.js` too,
and no two offerings may share a price. See "Booking automation" below for why.

| | Online | In person |
|---|---|---|
| 1 session | ₹8,000 · JXSLclA | ₹10,000 · 3BS7M02S |

## Events, guides and reviews come from Google Sheets

Devika edits these spreadsheets. The site reads them and updates within about a minute.
No deploy, no pull request, nothing for a developer to do.

| Sheet | Columns |
|---|---|
| Devika website — Events | Title, Date, Time, Place, Format, Price, Detail, Link, Image |
| Devika website — Guides | Title, Detail, Format, Length, Price, File, Link |
| Devika website — Reviews | Name, Review, Context, Rating |

`api/events.js`, `api/guides.js` and `api/reviews.js` read them through Google's gviz
endpoint and return clean JSON. The browser cannot call Google directly because Google
sends no CORS headers, which is the only reason these functions exist.

`Rating` is optional, 1 to 5; leaving it blank hides the stars for that review. `Context`
is a short line under the name, such as "Holistic counselling client". As with Events and
Guides, `SHEET_REVIEWS_ID` can be overridden with a Vercel environment variable if the
sheet is ever replaced, without touching the code.

Three things make this survive a spreadsheet being edited by a human:

- **Columns are matched by header name, not position.** Reordering or inserting a column
  changes nothing. Renaming a header does break that column, so do not rename them.
- **Dates come back typed**, as `Date(2026,9,6)` rather than a string, so there is no
  chance of reading 06/10 as either 6 October or 10 June. This is why the code uses the
  gviz JSON endpoint rather than CSV.
- **Only real date columns are parsed that way.** A time of day arrives as a datetime
  anchored to Google's 1899 epoch, so `11:00` in the Time column comes back as
  `Date(1899,11,30,11,0,0)`. Every column except a true date takes the cell's displayed
  value instead, which is what Devika sees in the sheet and expects on the page.
- **If a sheet is unreachable the page falls back** to the committed copy in `content/`.
  A broken sheet shows slightly stale content rather than an error.

Every sheet must stay shared as **Anyone with the link, Viewer**. If that is turned off,
Google answers 401 and the site silently drops back to `content/`.

Events with a date in the past are hidden automatically. Nothing needs deleting, so the
sheet doubles as her archive.

A guide with no usable `file` or `link` renders an "Ask for this" email button rather than
a dead download, so half-filled rows are safe.

Either column works. `File` is the intended home for a free guide and `Link` for a paid
one, but the code takes whichever actually holds an address, because that distinction
means nothing to the person filling in the sheet.

**File and Link must hold a pasted URL, not an inserted file.** Dropping a file into a
Sheets cell makes a chip, and the API returns only the chip's visible text, which is the
filename. There is no way to recover the Drive address from it, so `usableLink` in
`site.js` rejects anything without a scheme or a `files/`/`images/` path and the row
falls back to the email button. A Drive share link is accepted and rewritten to its
direct download form, so the button downloads rather than opening Drive's preview page.

**An event's `Image` column is optional and goes through that same `usableLink` check.**
Leave it blank and the event just shows without a photo, no fallback needed there since
it is not the only way to learn about the event. Paste a Drive share link, any direct
image URL, or a path to a photo already committed under `images/` (e.g.
`images/events/standing-tall.webp`, the convention for a flyer or "creative" made for one
specific event, alongside `images/gallery/` for general photos). Dropping an image file
straight into the cell produces the same unusable chip as above, so it is quietly ignored
rather than shown broken.

The sheet ids are in `api/events.js`, `api/guides.js` and `api/reviews.js`. They are not
secrets, since the sheets are link-readable anyway. `SHEET_EVENTS_ID`, `SHEET_GUIDES_ID`
and `SHEET_REVIEWS_ID` environment variables override them if the sheets are ever
replaced.

## Event, guide and offering detail pages

Every event, every guide, and every one of the six `CH` offerings also gets its own page,
so its title links to a URL that can be shared or dropped straight into an ad, an
Instagram bio, or a WhatsApp message, and opens straight to that one thing with its full
detail and its booking, buy or join button, rather than the visitor landing on the
homepage and having to scroll or click through to find it.

`event.html`, `guide.html` and `offering.html` are the three pages, one static template
each, reused for every row or entry. Which one to show comes from the URL:
`/event?e=<slug>`, `/guide?g=<slug>`, `/offering?o=<slug>`. `vercel.json`'s `cleanUrls`
is what turns `event.html` into `/event` on the live site; hitting `event.html` directly
also still works, which is how to test this locally with `python3 -m http.server`, since
clean URLs are a Vercel-only rewrite.

The slug is worked out from the title, not stored anywhere, so there is nothing to keep
in sync by hand. `assets/site.js` builds the link on the events and guides listings;
`assets/detail.js` (loaded by all three pages, and by `index.html`) rebuilds the same
slug from the data to find the matching row or `CH` entry. An event's slug also has its
date appended, since the same title can recur (a monthly circle), and would otherwise
collide; a guide's or offering's slug is just its title, since neither repeats. If a slug
matches nothing, the page shows a plain "not found" message with a link back to the site
rather than a broken page.

`event.html` and `guide.html` fetch the same `/api/events` and `/api/guides` the
homepage does, so they pick up a sheet edit within the same minute the homepage does,
and fall back to `content/events.json` / `content/guides.json` the same way if the sheet
is unreachable. There is nothing extra to maintain in the sheets themselves for this to
work. `offering.html` reads `CH` from `assets/data.js` directly, the same array the
homepage renders from, through the same `chapterHTML`/`wireChapter` functions in
`assets/chapter.js` that build and wire up each chapter on the homepage — so a chapter
looks and behaves identically whether it is seen embedded on the homepage or on its own
page, and there is only one place that knows how to render one, not two that can drift
apart.

Because the page is filled in by client-side JavaScript rather than rendered on the
server, a chat app or social network unfurling the link before a person opens it will
see the generic title and description in the page's `<head>`, not that specific item's.
Getting a specific event's, guide's or offering's own preview image and description into
a share card would need the page to be rendered server-side per slug, which is a bigger
change; ask before building that if it turns out to matter.

## Booking automation

After a Razorpay payment, Razorpay redirects the customer straight to `api/book.js`,
which shows them their Calendly link on the spot. No email carries the customer's booking
link; this replaced an earlier email-based version (which replaced Interakt, too
expensive for what it did) because the redirect page covers the same case for far less
to maintain. Devika books each package's later sessions herself off the Bookings sheet
rather than an automated follow-up.

Three parts, each doing one job:

1. **`api/book.js`** — where every Payment Page's "Redirect URL" setting points, as
   `https://<site>/api/book?p=<product key>` (the keys are in `api/lib/products.js`,
   e.g. `counsel-1-online`). Razorpay appends `razorpay_payment_id` to that URL itself.
   The page looks up the product from `p`, builds the Calendly link, and shows a button —
   a real page rather than an instant bounce, so someone who leaves the tab for their UPI
   app and comes back still finds it there.
2. **`api/webhooks/razorpay.js`** — Razorpay calls this on every captured payment
   (event `payment.captured`). It only records the payment in the Bookings sheet; nothing
   here reaches the customer, so it existing or failing is invisible to them.
3. **`api/webhooks/calendly.js`** — Calendly calls this when someone books
   (`invitee.created`) or cancels (`invitee.canceled`) a slot. A booking updates the
   sheet. A cancellation always updates the sheet, but only sends an email when Devika
   was the one who cancelled (a last-minute conflict on her side) — when a client
   cancels or reschedules themselves, Calendly already emails them, so a second email
   from us would be noise. This is the one email still sent automatically, because it is
   the one case Calendly has no wording of its own for.

**These are Payment Pages, not Payment Links.** They look alike and the distinction is
easy to miss, but it decides which webhook event to listen for. Payment Pages raise
`payment.captured` and never raise `payment_link.paid`. Subscribing to the wrong one fails
silently: nothing errors, the endpoint is simply never called. If payments stop showing up
in the Bookings sheet, check the event subscription in Razorpay before anything else.

**Which offering was bought is worked out from the amount**, both in the webhook and in
`api/book.js`'s `?p=` parameter, because a Payment Page payment carries nothing else that
identifies it. The dashboard displays a "Payment Page Title" and a `pl_...` id against
each payment, but neither is in the webhook payload, and `notes`, `description` and
`invoice_id` all arrive empty. So **every offering must keep a distinct price**. Two
offerings priced the same breaks the webhook silently, recording one under the wrong name.
A price in the `CH` array in `assets/data.js` and the matching `amount` in
`api/lib/products.js` have to be changed together, along with the Razorpay page itself.
An amount matching nothing is recorded and logged rather than guessed at.

**Each Payment Page needs its own Redirect URL set**, pointing `api/book.js` at the right
product — this is a Payment Page setting, separate from the webhook. Mixing up which `p`
goes on which page sends someone to the wrong Calendly event type after they have already
paid.

**Every Calendly link carries `utm_source` (the product key) and `utm_content`
(the Razorpay payment id).** Calendly passes both through to its webhook, which is how a
booking is matched back to the exact payment rather than guessed from a name or email the
person may have typed differently. `bookingUrl()` in `api/lib/products.js` builds this,
and every link handed out has to go through it, including the one Devika resends on a
cancellation.

`api/lib/products.js` holds the price, name, Calendly event type URL and session count for
each offering.

**Where bookings are recorded**: a Google Sheet named "Devika website — Bookings", one
"Bookings" tab, written to by an Apps Script Web App
(`sheets/bookings-webapp.gs` — paste it into the sheet's Extensions → Apps Script, deploy
as a Web App, put its `/exec` URL and your chosen shared secret into Vercel as
`BOOKINGS_SHEET_URL` / `BOOKINGS_SHEET_SECRET`, matching the same secret at the top of the
`.gs` file). This is a separate mechanism from `api/_sheet.js`: that one only *reads*
sheets through Google's public gviz endpoint, which cannot write. Devika can open this
sheet any time to see who paid, who is booked, and who still needs a nudge to book their
next package session.

**Environment variables** (`.env.example` lists all of them, set the real values only in
Vercel, never committed):

| Variable | Where it comes from |
|---|---|
| `RAZORPAY_WEBHOOK_SECRET` | Set when creating the webhook in Razorpay → Settings → Webhooks. No Razorpay API key is needed anywhere; the webhook payload carries the customer's name and email already |
| `CALENDLY_WEBHOOK_SIGNING_KEY` | Returned once when the webhook subscription is created via Calendly's API (most plans have no dashboard toggle for this — it is a one-off API call) |
| `HOST_EMAIL` | Devika's own email, used to tell "client rescheduled" apart from "Devika cancelled" |
| `RESEND_API_KEY` / `EMAIL_FROM` | resend.com — used only for the reschedule email above; `EMAIL_FROM` needs a domain verified there before it can send to real customers |
| `BOOKINGS_SHEET_URL` / `BOOKINGS_SHEET_SECRET` | From deploying `sheets/bookings-webapp.gs`, see above |

**Known gap**: `api/lib/products.js` has placeholder Calendly URLs (`REPLACE_ME`) until
the real Calendly event types exist and their booking page URLs are dropped in.

## Meditation Club membership (who's paid, who hasn't)

The Meditation Club (the `c6`/"crown" chapter) is a membership, not a booked session -
`meditation-monthly` and `meditation-annual` in `api/lib/products.js` have no Calendly
event, same as the guides. Same amount-keyed-product rule as everywhere else applies: the
monthly price (₹1,198) and the annual price (assumed ₹14,376 = 12 x ₹1,198, **confirm
with Devika before this goes live**) must each stay distinct from every other offering.

**Monthly is a real Razorpay subscription** (auto-charged, cancel anytime), already live
at the picker's `monthly` href. Each month's charge raises its own `payment.captured`,
so a fresh row lands in the Bookings sheet on its own roughly every 30 days - nothing
extra to build for that half.

**Annual doesn't exist in Razorpay yet.** Devika needs to create it herself (needs her own
OTP to log in) as a one-time Payment Page priced ₹14,376, no Redirect URL needed (there's
no Calendly step to send anyone to). Until she does, the site's `annual` option points at
a `mailto:` link instead of a Razorpay page, so the button still does something sane
rather than 404ing. Once she has the real `rzp.io` link, swap it into the `annual` entry
of the picker's `prices` in `assets/site.js` (see the `TODO` comment on that chapter) -
same golden-rule-1 care as any other payment link.

**Tracking who's lapsed**: every membership payment gets a `paid_through` date stamped
by the webhook (`paid_at` + 30 days for monthly, + 365 for annual - see
`product.membership.durationDays` in `products.js`), written to a `paid_through` column in
the Bookings sheet. `flagLapsedMembers_()` in `sheets/bookings-webapp.gs` finds each
member's most recent Meditation Club row by email and colours it red once that date has
passed. It needs to be scheduled once, by hand: open the sheet's Apps Script, click the
clock icon (Triggers), add a time-driven trigger for `flagLapsedMembers_`, monthly. After
that, Devika just scrolls the Bookings sheet once a month and drops the red rows from
WhatsApp.

Two things she needs to do manually for this to work, since neither is something a code
change alone can reach:

1. Add a `paid_through` header to row 1 of the live Bookings sheet (anywhere - columns
   are matched by name, not position).
2. Re-paste `sheets/bookings-webapp.gs` into the sheet's Apps Script (Deploy -> Manage
   deployments -> pencil -> Version "New version", **not** "New deployment" - keeps the
   same URL, see the gotcha under "Booking automation" above), then add the monthly
   trigger described above.

## Images

Source photos are HEIC or large JPEG. They are converted to 1200x1500 WebP before being
committed. Do not commit HEIC files, browsers other than Safari will not display them.

### The duotone

Photos are full colour on disk and toned in CSS, not baked. Two layers do it:
the image is desaturated with a `filter`, then `.shot::before` lays the hue over it with
`mix-blend-mode:color`, which keeps the photo's luminance and takes only colour from the
overlay. A `.warm` span adds a little soft-light warmth back so faces do not go grey.

`--tint` defaults to `var(--accent)`, so each photo is toned to its own chapter colour:
rose on the solar plexus, olive on the throat, and so on. That is what the original
artifact did, and it is why the images sit against their backgrounds rather than on top
of them. Changing a chapter's accent in `CH` retones its photo automatically.

Tune the strength with `--tint-mix` on `.shot`. It is deliberately below the point where
the hue reads as saturated; the reference images were dusty, not pink. The crown chapter
overrides it and lifts the brightness, because it sits on a cream ground.

The `contrast(.72) brightness(.82)` on `.shot img` is not a guess. The original images sat
in a tonal range of roughly 30 to 170 with about half the contrast of a straight
photograph, which is what makes them read as faded. Ours run the full 0 to 255, so those
two numbers were solved to map one onto the other. If you change them, change them
together, or the images stop matching each other across chapters.

Keeping this in CSS rather than in the files means the tone can be changed without
reprocessing anything, and the originals stay untouched. Note the stacking order inside
`.shot`: image, then the two tint layers, then `::after` which is the reveal curtain at
`z-index:2`. Anything new goes below that or the reveal breaks.

## Checking your work

There is no test suite. Run a local server and look at the page:

```bash
python3 -m http.server 4321
```

Then check the browser console is clean, the six chapters render, the picker still
produces the two correct prices and links, and the Gallery and Reviews sections render.

## Known gaps

- The guides are placeholder rows.
- Terms, privacy, refund and delivery policy pages do not exist yet. Razorpay requires
  them.

## Caching

`vercel.json` sets `must-revalidate` on `assets/` and `content/` so a deploy is picked up
immediately, and a long immutable cache on `images/`. If you rename or re-crop a photo,
give it a new filename rather than overwriting, or returning visitors keep the old one.

Locally, `python3 -m http.server` sends no cache headers and browsers hold on to
`styles.css` and `site.js`. If an edit does not seem to appear, hard reload.
