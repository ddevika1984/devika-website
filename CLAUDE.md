# Working on this repo

This is the website for Dr. Devika Kamat. It is a **plain static site**. No framework, no
build step, no package.json. Vercel serves the files exactly as they sit here.

Read this before changing anything.

## The golden rules

1. **Never change a payment link without being asked to.** Every `rzp.io` URL in
   `assets/site.js` points at a live Razorpay page that takes real money. A wrong link
   sends someone to the wrong product, or to a 404 after they have decided to pay.
   If a price shown on the site and the price on the Razorpay page disagree, say so and
   stop. Do not "fix" it by guessing.
2. **Do not add a build step, framework, bundler or package manager.** If something seems
   to need one, it almost certainly does not. Ask first.
3. **Changes go through a pull request, not straight to `main`.** Pushing to `main`
   deploys to the live site immediately.
4. **Do not commit secrets.** There are none here today and it should stay that way.
   Anything sensitive belongs in Vercel's environment variables.

## Where things live

| I want to change... | Edit this |
|---|---|
| The seven offerings: titles, prices, descriptions, links | the `CH` array at the top of `assets/site.js` |
| The email address, the events source, the TEBA waitlist link | the `CONFIG` object at the top of `assets/site.js` |
| Hero copy, the About section, the footer, the disclaimer | `index.html` |
| Colours, spacing, layout, animation | `assets/styles.css` |
| Events shown in the Events section | `content/events.json` (until the Google Sheet is connected) |
| The downloadable guides | `content/guides.json` |
| Photos | `images/` |

## The `CH` array

One entry per offering, in the order they appear on the page. The order of this array
also drives the spine navigation and the Offerings dropdown, so reordering it reorders
the whole site.

Each entry:

- `id` — must stay unique and must not change (links point at it)
- `key`, `sans`, `en` — the chakra labelling
- `c`, `bg`, `fg` — accent, background and foreground colour for that chapter
- `t`, `for_`, `det`, `det2` — the copy
- `f` — the fact rows, as `[label, value]` pairs
- `cta` — `{label, href}`. If `href` is empty the button falls back to an email link.
- `img` — path to the photo, or `null` for the TEBA chapter which shows the letter panel
- `picker` — only on the counselling chapter, see below
- `guides` — only on the guides chapter, makes it render from `content/guides.json`

## The counselling picker

The throat chapter has four Razorpay links behind one offering. The `picker` object maps
a combination of sessions and place to a price and a link:

```
"4-person": {price:"₹35,000", href:"https://rzp.io/rzp/6fZnuhM"}
```

The key is `<sessions>-<place>`. All four combinations must exist or the picker breaks.
The displayed price and the link must agree with the Razorpay page. Verified as of the
first build:

| | Online | In person |
|---|---|---|
| 1 session | ₹8,000 · JXSLclA | ₹10,000 · 3BS7M02S |
| 4 sessions | ₹28,000 · H44bYeyF | ₹35,000 · 6fZnuhM |

## Events and guides

Both sections load JSON at runtime. Today they read the local files in `content/`.
When the Google Sheet is wired up, point `CONFIG.eventsUrl` at the sheet endpoint. The
code falls back to `content/events.json` if the request fails, so a broken sheet shows
slightly stale events rather than an error.

Events with a date in the past are hidden automatically. Nothing needs deleting.

A guide with no `file` and no `link` renders an "Ask for this" email button rather than a
dead download, so half-filled rows are safe.

## Images

Source photos are HEIC or large JPEG. They are converted to 1200x1500 WebP before being
committed. Do not commit HEIC files, browsers other than Safari will not display them.

## Checking your work

There is no test suite. Run a local server and look at the page:

```bash
python3 -m http.server 4321
```

Then check the browser console is clean, the seven chapters render, and the picker still
produces the four correct prices and links.

## Known gaps

- The TEBA waitlist link is empty, so that button currently opens an email instead.
- The guides are placeholder rows.
- Terms, privacy, refund and delivery policy pages do not exist yet. Razorpay requires
  them.
