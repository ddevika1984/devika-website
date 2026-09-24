# drddevikakamat.com

Website for Dr. Devika Kamat. Integrative nutrition, lifestyle medicine and energy work.

Plain static HTML, CSS and JavaScript. No build step. Deployed on Vercel.

## Running it locally

```bash
python3 -m http.server 4321
```

Then open http://localhost:4321.

## Structure

```
index.html            the page
event.html             one event's own page, at /event?e=<slug>
guide.html             one guide's own page, at /guide?g=<slug>
offering.html          one offering's own page, at /offering?o=<slug>
assets/styles.css     all styling
assets/data.js         the six offerings (CH) and config
assets/detail.js       slug/link helpers shared by every page above
assets/chapter.js      renders one CH entry, shared by index.html and offering.html
assets/site.js         homepage-only behaviour
api/                  reads the Google Sheets behind Events, Guides and Reviews
content/events.json   fallback copy, used only if the sheet is unreachable
content/guides.json   fallback copy, used only if the sheet is unreachable
content/reviews.json  fallback copy, used only if the sheet is unreachable
images/               photos and brand marks
files/                the guide PDFs and audio
```

## Making a change

Most edits are to the `CH` array or the `CONFIG` object in `assets/data.js`.
See [CLAUDE.md](CLAUDE.md) for what lives where and what must not be touched without
checking first.

Open a pull request rather than pushing to `main`. Vercel builds a preview URL for every
pull request, so the change can be looked at before it goes live.

## Still to do

- [ ] Real content and files for the guides (add rows to the Guides sheet)
- [ ] Fill the marked placeholders in terms, privacy, refunds and delivery (address, refund windows, delivery times)
- [ ] Point the domain at Vercel without breaking the Google Workspace email
