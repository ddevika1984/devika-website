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

## Events and guides come from Google Sheets

Devika edits two spreadsheets. The site reads them and updates within about five minutes.
No deploy, no pull request, nothing for a developer to do.

| Sheet | Columns |
|---|---|
| Devika website — Events | Title, Date, Time, Place, Format, Price, Detail, Link |
| Devika website — Guides | Title, Detail, Format, Length, Price, File, Link |

`api/events.js` and `api/guides.js` read them through Google's gviz endpoint and return
clean JSON. The browser cannot call Google directly because Google sends no CORS headers,
which is the only reason these functions exist.

Three things make this survive a spreadsheet being edited by a human:

- **Columns are matched by header name, not position.** Reordering or inserting a column
  changes nothing. Renaming a header does break that column, so do not rename them.
- **Dates come back typed**, as `Date(2026,9,6)` rather than a string, so there is no
  chance of reading 06/10 as either 6 October or 10 June. This is why the code uses the
  gviz JSON endpoint rather than CSV.
- **If a sheet is unreachable the page falls back** to the committed copy in `content/`.
  A broken sheet shows slightly stale content rather than an error.

Both sheets must stay shared as **Anyone with the link, Viewer**. If that is turned off,
Google answers 401 and the site silently drops back to `content/`.

Events with a date in the past are hidden automatically. Nothing needs deleting, so the
sheet doubles as her archive.

A guide with no `file` and no `link` renders an "Ask for this" email button rather than a
dead download, so half-filled rows are safe.

The sheet ids are in `api/events.js` and `api/guides.js`. They are not secrets, since
the sheets are link-readable anyway. `SHEET_EVENTS_ID` and `SHEET_GUIDES_ID` environment
variables override them if the sheets are ever replaced.

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

Then check the browser console is clean, the seven chapters render, and the picker still
produces the four correct prices and links.

## Known gaps

- The TEBA waitlist link is empty, so that button currently opens an email instead.
- The guides are placeholder rows.
- Terms, privacy, refund and delivery policy pages do not exist yet. Razorpay requires
  them.

## Caching

`vercel.json` sets `must-revalidate` on `assets/` and `content/` so a deploy is picked up
immediately, and a long immutable cache on `images/`. If you rename or re-crop a photo,
give it a new filename rather than overwriting, or returning visitors keep the old one.

Locally, `python3 -m http.server` sends no cache headers and browsers hold on to
`styles.css` and `site.js`. If an edit does not seem to appear, hard reload.
