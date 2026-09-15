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
assets/styles.css     all styling
assets/site.js        the seven offerings (CH), config, and behaviour
api/                  reads the Google Sheets behind Events and Guides
content/events.json   fallback copy, used only if the sheet is unreachable
content/guides.json   fallback copy, used only if the sheet is unreachable
images/               photos and brand marks
files/                the guide PDFs and audio
```

## Making a change

Most edits are to the `CH` array or the `CONFIG` object at the top of `assets/site.js`.
See [CLAUDE.md](CLAUDE.md) for what lives where and what must not be touched without
checking first.

Open a pull request rather than pushing to `main`. Vercel builds a preview URL for every
pull request, so the change can be looked at before it goes live.

## Still to do

- [ ] Real content and files for the guides (add rows to the Guides sheet)
- [ ] TEBA cohort waitlist form link
- [ ] Terms, privacy, refund and delivery policy pages (required by Razorpay)
- [ ] Point the domain at Vercel without breaking the Google Workspace email
