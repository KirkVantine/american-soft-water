# American Soft Water LLC website

Static site (HTML/CSS/JS, no build step). Open `index.html` through any web server, or deploy the folder as-is to Netlify, Cloudflare Pages, GitHub Pages, or regular hosting.

```
index.html            single-page site
css/styles.css        all styles; design tokens at the top
js/main.js            mobile nav, "What's your water doing?" finder, booking form
assets/img/           optimized photos from the old Wix site (letterbox bars cropped)
assets/source/        untouched originals downloaded from americansoftwater.com
assets/logo/          original drop-and-flag mark (transparent PNG, 512/1024/favicon),
                      horizontal lockup and 400×400 social profile (SVG + PNG)
```

## Before launch

- **Google reviews**: add the real Google review text in the `#reviews` section (see the comment in `index.html`). Reviews on the page now are real, word for word, from Nextdoor and Yelp and are labeled with their source.
- **Form delivery**: the booking form opens the visitor's email app (mailto). To receive submissions directly, point the form at Formspree, Netlify Forms, or similar.
- **Confirm facts**: hours (Google/Yelp say M–F 8–6, Sat 9–3; the old site said M–F 8–5, Sat 9–1), and which phone is primary (734-878-2572 is on Google; 734-845-6494 is on Nextdoor and the old site header).
- **Photos of Dan or the van** would strengthen the About section. None were available publicly.
- Bump the `?v=` number on the CSS/JS links in `index.html` after edits so browsers pick up changes.
