# American Soft Water LLC website

Static one-page site (HTML/CSS/JS, no build step) hosted on **Cloudflare Pages**, with one Pages Function for the water test form. Same setup as the New Beginnings site.

```
public/                   everything Cloudflare publishes
  index.html              the site
  css/styles.css          all styles; design tokens at the top
  js/main.js              mobile nav, "What's your water doing?" finder, form
  assets/img/             optimized install photos (Dan's and the old Wix site's)
  assets/logo/            original drop-and-flag mark (transparent PNG, 512/1024/favicon),
                          horizontal lockup and 400×400 social profile (SVG + PNG)
  _redirects              old Wix page URLs -> matching section (301)
  _headers                security headers; noindex on the *.pages.dev address
  robots.txt, sitemap.xml
functions/api/inquiry.ts  POST /api/inquiry -> emails Dan through Resend
source/                   original photos, not committed (gitignored)
.github/workflows/        temporary: keeps the github.io preview alive until cutover
```

After editing CSS or JS, bump the `?v=` number on their links in `index.html` so browsers pick up the change.

## The water test form

`public/index.html` (`#test-form`) → `public/js/main.js` → `functions/api/inquiry.ts` → Resend → **americansoftwater@gmail.com**.

Set these in Cloudflare (Workers & Pages → the project → Settings → Variables and Secrets, Production):

| Variable | |
|---|---|
| `RESEND_API_KEY` | **Required**, as a secret. From resend.com. |
| `INQUIRY_TO` | Optional, comma-separated. Defaults to americansoftwater@gmail.com. |
| `INQUIRY_FROM` | Optional. Defaults to `website@americansoftwater.com`; must be on a domain verified in Resend. |

Until the key exists, or if Resend fails, the endpoint returns an error and **the page opens the visitor's email app with everything they typed**, so no request is lost. Spam handling is a hidden honeypot field plus a 3-second minimum fill time; both answer `200` so bots don't retry. Nothing is stored or logged except Resend's own error text.

The sender address only works once `americansoftwater.com` is verified in Resend (step 5 below). Until then, delivery fails and the email fallback takes over.

## Going live

Same path as New Beginnings: DNS moves to Cloudflare (free plan), because Pages can only serve the bare `americansoftwater.com` when Cloudflare runs the domain's DNS. The domain itself stays registered at Squarespace.

1. **Cloudflare Pages:** Workers & Pages → Create → Pages → Connect to Git → `KirkVantine/american-soft-water`. Framework preset: None. Build command: empty. Build output directory: `public`. Add the variables above. Check the `*.pages.dev` address works.
2. **Add the domain to Cloudflare:** Add a site → `americansoftwater.com` → Free. On the review screen, delete the imported Wix records (the `A` records on `@` and the `www` CNAME). There is no email on this domain, so nothing else needs keeping.
3. **Squarespace Domains:** DNS → Domain Nameservers → use custom nameservers → paste the two Cloudflare gives you (replacing `ns10/ns11.wixdns.net`).
4. **Attach the domain:** Pages project → Custom domains → add `www.americansoftwater.com` and `americansoftwater.com`. Cloudflare creates the records and the certificate. Make the bare domain redirect to `www` (a Redirect Rule, or Bulk Redirects).
5. **Resend:** add domain `americansoftwater.com`; with DNS on Cloudflare, Resend can add its records automatically, or add them by hand in Cloudflare DNS. Then send a test request through the live form.
6. **Code:** remove the `<meta name="robots" content="noindex, nofollow">` line from `public/index.html`.
7. **After it's confirmed live:** delete `.github/workflows/pages.yml` and turn off GitHub Pages; export anything needed from Wix, disconnect the domain there, and cancel the Wix plan.

The domain is registered at Squarespace (formerly Google Domains), registered 2019-12-05, renews 2027-12-05.

## Facts confirmed by Dan (Oct 2026)

- Hours: Mon–Fri 8–5, Sat 9–1. Sunday closed, emergencies answered 24/7.
- Main number 734-878-2572: business line, takes texts, forwards to his cell.
- Form email: americansoftwater@gmail.com.
- Twin-tank softener = one valve across two tanks. Iron filter + softener = a valve on each tank.

## Still open

- **Google reviews:** paste real review text into `#reviews` (see the comment there). Current quotes are word for word from Nextdoor and Yelp and labeled with their source.
- **Photo of Dan or the van** for the About section.
