# American Soft Water LLC website

Static site (HTML/CSS/JS, no build step on Cloudflare): a homepage plus five service pages served by a **Cloudflare Worker** with static assets, plus two small API routes: the water test form and Google reviews. Same setup as MyCleaners (`wrangler.jsonc` + `worker/` + `public/`); the form backend is the New Beginnings one, adapted.

```
wrangler.jsonc            Worker config: name, ./public as assets, worker/index.ts as main
worker/index.ts           routes /api/inquiry and /api/reviews; everything else is a static file
worker/inquiry.ts         emails water test requests to Dan through Resend
worker/screen.ts          tags likely spam and sales pitches in the subject (never blocks)
worker/reviews.ts         Dan's Google rating and reviews from the Places API, cached 6 hours
public/                   the static site
  index.html              homepage; holds the shared header, sprite, form and footer (@shared markers)
  water-softener.html,    service pages at the old Wix addresses (/water-softener, /iron-filters,
  iron-filters.html, ...  /reverse-osmosis, /water-filtration, /free-water-test). GENERATED, don't edit.
  404.html                shown (with a real 404) for unknown URLs
  css/styles.css          all styles; design tokens at the top
  js/main.js              mobile nav, "What's your water doing?" finder, form
  assets/img/             optimized install photos (Dan's and the old Wix site's)
  assets/logo/            original drop-and-flag mark (transparent PNG, 512/1024/favicon),
                          horizontal lockup and 400×400 social profile (SVG + PNG)
  _redirects              old Wix page URLs -> matching section (301)
  _headers                security headers, asset caching
  robots.txt, sitemap.xml
tools/build_pages.py      builds the service pages and sitemap.xml from index.html + the content in the script
source/                   original photos, not committed (gitignored)
```

## Editing

- **Service page content:** edit `PAGES` in `tools/build_pages.py`, then run `python tools/build_pages.py`.
- **Header, nav, form or footer:** edit them in `public/index.html` (between the `<!-- @shared:... -->` markers), then run `python tools/build_pages.py` so the service pages match.
- **After editing CSS or JS:** bump the `?v=` number in `index.html` and `CSS_V` / `JS_V` in the build script, then rebuild.
- Commit the generated `.html` files and `sitemap.xml`; Cloudflare doesn't run the script.

## The water test form

`public/index.html` (`#test-form`) → `public/js/main.js` → `worker/inquiry.ts` → Resend → **americansoftwater@gmail.com**.

Set these in Cloudflare (Workers & Pages → american-soft-water → Settings → Variables and Secrets), or `npx wrangler secret put RESEND_API_KEY`:

| Variable | |
|---|---|
| `RESEND_API_KEY` | **Required**, as a secret. From resend.com. |
| `INQUIRY_TO` | Optional, comma-separated. Defaults to americansoftwater@gmail.com. |
| `INQUIRY_FROM` | Optional. Defaults to `website@americansoftwater.com`; must be on a domain verified in Resend. |

Until the key exists, or if Resend fails, the endpoint returns an error and **the page opens the visitor's email app with everything they typed**, so no request is lost.

The sender address only works once `americansoftwater.com` is verified in Resend (step 5 below). Until then, delivery fails and the email fallback takes over.

## Spam and sales pitches (never blocked)

**Rule from Kirk, 2026-11-24: no submission is ever blocked or limited.** Every request with a name and phone number reaches Dan. `worker/screen.ts` only adds a subject tag and a "why" line:

- `[Flagged: likely spam]` — a hidden honeypot field filled in, sent within 3 seconds, or Cloudflare Turnstile didn't confirm a real browser, **and** no water problem checked and no address given.
- `[Flagged: sales pitch]` — the message mentions SEO, marketing, web design and similar, or contains a link, **and** no water problem is checked.

Anyone who checks a water problem is never tagged as a pitch. Dan's Gmail has a filter on `subject:"[Flagged"` that skips the inbox and applies a label, so tagged mail is moved, not lost.

**Turnstile** (Cloudflare's invisible bot check) is optional. Set the site key in `data-turnstile-sitekey` on `#test-form` in `index.html` (then run the build script), and the secret as the Worker secret `TURNSTILE_SECRET`. With either missing, the check is skipped and nothing is tagged for it. If the script fails to load, the form still sends.

## Google reviews

`worker/reviews.ts` (`GET /api/reviews`) asks the Google Places API (New) for the listing's rating, review count and up to 5 reviews, keeps the 4 and 5 star ones with real text, and caches the answer for 6 hours. `public/js/main.js` puts the longest Google review in the large quote and the next ones beside it; the built-in Nextdoor and Yelp quotes fill any empty slots and stay as the fallback if Google doesn't answer.

Needs a runtime secret **`GOOGLE_PLACES_KEY`** (Google Cloud API key with "Places API (New)" enabled; the MyCleaners key works). Optional `PLACE_ID` var skips the name lookup. With the cache, usage is a few calls a day, well inside Google's free monthly allowance.

Google's terms: reviewer name and profile link, "Google review" credit, no storing review text beyond 30 days (the 6-hour cache is fine).

## Going live (done October 2026)

DNS moves to Cloudflare (free plan), because a Worker can only take over `americansoftwater.com` when Cloudflare runs the domain's DNS. The domain itself stays registered at Squarespace.

1. **Worker:** Workers & Pages → `american-soft-water` (connected to `KirkVantine/american-soft-water`). Settings → Build: build command empty, deploy command `npx wrangler deploy`. Add the `RESEND_API_KEY` secret. Check the `american-soft-water.<account>.workers.dev` address.
2. **Add the domain to Cloudflare:** Add a domain → `americansoftwater.com` → Free. On the review screen, delete the imported Wix records (the `A` records on `@` and the `www` CNAME). There is no email on this domain, so nothing else needs keeping.
3. **Squarespace Domains:** DNS → Domain Nameservers → use custom nameservers → paste the two Cloudflare gives you (replacing `ns10/ns11.wixdns.net`).
4. **Attach the domain** once Cloudflare shows the domain Active: Worker → Settings → Domains & Routes → Add → Custom domain → `www.americansoftwater.com`, then again for `americansoftwater.com`. Then in the domain's Rules → Redirect Rules, send `americansoftwater.com` to `https://www.americansoftwater.com` (301, keep the path).
5. **Resend:** add domain `americansoftwater.com`; with DNS on Cloudflare, Resend can add its records automatically. Then send a test request through the live form.
6. **Code:** remove the `<meta name="robots" content="noindex, nofollow">` line from `public/index.html`, and set `"workers_dev": false` in `wrangler.jsonc`.
7. **After it's confirmed live:** delete `.github/workflows/pages.yml` and turn off GitHub Pages; export anything needed from Wix, disconnect the domain there, and cancel the Wix plan.

The domain is registered at Squarespace (formerly Google Domains), registered 2019-12-05, renews 2027-12-05.

## Facts confirmed by Dan (Oct 2026)

- Hours: Mon–Fri 8–5, Sat 9–1. Sunday closed, emergencies answered 24/7.
- Main number 734-878-2572: business line, takes texts, forwards to his cell.
- Form email: americansoftwater@gmail.com.
- Twin-tank softener = one valve across two tanks. Iron filter + softener = a valve on each tank.

## Still open

- **Photo of Dan or the van** for the About section.
