"""Build the service pages from shared parts of public/index.html.

    python tools/build_pages.py

Writes public/<slug>.html for each page in PAGES. Cloudflare serves them at
/<slug> (no .html), which are the same addresses the old Wix site used, so
links and search results that point at them keep working.

The header, icon sprite, water test form and footer are copied from
public/index.html, between its <!-- @shared:NAME --> markers. Edit those parts
in index.html, then re-run this script; never edit the generated files by hand.

Content rule: everything on these pages comes from the old Wix site, Dan, or
facts he confirmed. No prices, guarantees, response times or claims he hasn't
made.
"""

import json
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
SITE = "https://www.americansoftwater.com"
CSS_V = "11"
JS_V = "11"

home = (PUBLIC / "index.html").read_text(encoding="utf-8")


def shared(name: str) -> str:
    m = re.search(rf"<!-- @shared:{name} -->\n(.*?)\n\s*<!-- /@shared:{name} -->", home, re.S)
    if not m:
        raise SystemExit(f"index.html is missing the @shared:{name} markers")
    return m.group(1)


SPRITE = shared("sprite")
# On other pages, "Book a free water test" goes to the booking page.
HEADER = shared("header").replace('href="#water-test"', 'href="/free-water-test"')
BOOKING = shared("booking")
FOOTER = shared("footer")
FONTS = re.search(r'<link href="https://fonts\.googleapis\.com/css2[^"]*" rel="stylesheet">', home).group(0)

PHONE = '<a href="tel:+17348782572">734-878-2572</a>'


def ticks(items):
    return '<ul class="ticks">' + "".join(f"<li>{i}</li>" for i in items) + "</ul>"


def photo(src, w, h, alt, cls=""):
    return (f'<figure class="strip__item{cls}"><img src="/assets/img/{src}" width="{w}" height="{h}" '
            f'loading="lazy" alt="{escape(alt)}"></figure>')


PAGES = [
    {
        "slug": "water-softener",
        "nav": "Water softeners",
        "title": "Water Softeners in Pinckney & Livingston County, MI | American Soft Water",
        "description": "Water softener installation, repair and salt delivery in Pinckney and Livingston County. Free in-home water test first, then a single-tank, twin-tank or refurbished softener sized for your water.",
        "h1": "Water softeners for Pinckney and Livingston County homes",
        "lede": "Hard water leaves scale in your pipes, water heater and dishwasher, and makes soap work harder. Dan tests your water first, then sizes and programs a softener for your home, whether you’re on a private well or city water.",
        "hero": ("install-twin-tank.jpg", 900, 1187, "Twin-tank water softener with the American Soft Water sticker, brine tank and sediment pre-filter"),
        "caption": "A twin-tank softener we installed",
        "service_type": "Water softener installation and repair",
        "body": f"""
          <h2>Signs you have hard water</h2>
          <p>Hard water carries extra calcium and magnesium. It’s generally safe to drink, but it’s hard on your home.</p>
          {ticks([
              "White crust on faucets and showerheads",
              "Spots on glasses and dishes",
              "Soap and shampoo that won’t lather, so you use more",
              "Dry skin, dull hair and stiff, dingy laundry",
              "Scale that shortens the life of water heaters, washers and dishwashers",
          ])}

          <h2>How a softener works</h2>
          <p>A softener tank is filled with resin beads. As water passes through, the beads hold on to the calcium and magnesium and swap them for sodium or potassium. Every so often the system cleans itself by rinsing the beads with salt water from the brine tank, then goes back to softening.</p>

          <h2>Single-tank or twin-tank</h2>
          <p>A single-tank softener regenerates on a schedule, usually overnight while nobody’s using water. A twin-tank softener runs two tanks from one valve, so one tank is always in service while the other regenerates. That means soft water around the clock, which suits bigger households and very hard water.</p>
          <p>We also offer refurbished softeners when budget matters. Whichever you choose, it’s set up for your water test results rather than a factory default.</p>

          <h2>Iron in your water too?</h2>
          <p>A softener can handle a little iron. When there’s more, or a rotten-egg smell, an <a href="/iron-filters">iron and sulfur filter</a> goes in ahead of the softener so the softener can do its job. Most of the well-water systems we install are an iron filter and a softener together.</p>

          <h2>Salt, service and repairs</h2>
          {ticks([
              "Salt delivery, carried to your brine tank",
              "Resin cleaning, salt level checks and performance checks",
              "Repairs on most brands, including systems we didn’t install",
          ])}
          <p>Not sure if your softener is worth fixing? Text a picture of it to Dan at {PHONE}. He can come out and evaluate the unit to see if it’s repairable or not. Depending on the issue, sometimes all it needs is a little cleaning.</p>
        """,
        "photos": [
            ("install-twin-tank-tall.jpg", 900, 1464, "Twin-tank softener with two tanks sharing one lit digital valve"),
            ("install-basement.jpg", 562, 743, "Single-tank softener and brine tank on a basement floor"),
            ("install-laundry.jpg", 562, 744, "Softener and brine tank installed in a finished laundry room"),
        ],
        "faq": [
            ("How long does a softener install take?", "It depends on your plumbing and the system, but most installs are done the same day with only a short water shutoff."),
            ("Can I install a softener myself?", "You can, but sizing and programming the valve for your water’s hardness and iron is where most DIY systems fall short. A professional install also keeps product and workmanship warranties intact."),
            ("How often does a softener need maintenance?", "Keep the brine tank stocked with salt (we can deliver it), and have the system checked periodically. We clean resin, check salt levels, and confirm it’s regenerating correctly."),
            ("Do you repair softeners you didn’t install?", f"Yes. We work on most brands. You can text a picture to Dan at {PHONE} and he can come out and evaluate the unit to see if it’s repairable or not."),
        ],
        "related": ["iron-filters", "water-filtration", "free-water-test"],
    },
    {
        "slug": "iron-filters",
        "nav": "Iron & sulfur filters",
        "title": "Iron & Sulfur Filters for Well Water in Livingston County, MI | American Soft Water",
        "description": "Air-injection iron filters that remove rust stains and rotten-egg smell from well water in Pinckney and Livingston County. Free in-home water test, installation and service.",
        "h1": "Iron and sulfur filters for well water",
        "lede": "Orange stains in the sink, a metallic taste, or water that smells like rotten eggs are signs of iron and hydrogen sulfide, which are common in private wells around Pinckney. An iron filter takes them out before they reach your fixtures, your laundry or your softener.",
        "hero": ("install-iron-softener-well.jpg", 900, 1469, "Iron filter and water softener side by side, each with its own digital valve, next to a pre-filter and well pressure tank"),
        "caption": "An iron filter and softener on a private well",
        "hero_top": True,
        "service_type": "Iron and sulfur filter installation",
        "body": f"""
          <h2>Signs of iron and sulfur</h2>
          {ticks([
              "Reddish-brown stains on sinks, tubs, toilets and fixtures",
              "Rust stains on clothes and linens that won’t wash out",
              "A metallic taste in drinking water and coffee",
              "A rotten-egg smell, often strongest from hot water",
              "Iron buildup in pipes and appliances that slows water flow",
          ])}
          <figure class="prose__photo"><img src="/assets/img/problem-rust.jpg" width="800" height="600" loading="lazy" alt="Bathroom sink with heavy orange iron staining around the drain"></figure>

          <h2>How an air-injection iron filter works</h2>
          <p>The filter keeps a bubble of air at the top of the tank, compressed by your well pressure. As water passes through the air, iron and hydrogen sulfide turn into particles that the filter media traps.</p>
          <p>When it regenerates, the filter backwashes to flush out what it caught, then draws in fresh air to rebuild the bubble before going back into service. There are no chemicals to add.</p>
          <p>Depending on your water, other media can be the better choice, such as manganese greensand or Birm. Your water test decides which.</p>

          <h2>Usually paired with a softener</h2>
          <p>An iron filter removes iron, manganese and hydrogen sulfide, but not hardness. Most wells with iron also have hard water, so the iron filter goes in first and a <a href="/water-softener">water softener</a> after it. Keeping iron out of the softener also helps it last longer.</p>

          <h2>Installation and service</h2>
          {ticks([
              "Sized and set up for your water test results",
              "Warranties on both the equipment and our workmanship",
              "Checks and adjustments if your water changes",
              "Repairs on most brands",
          ])}
        """,
        "photos": [
            ("install-iron-softener-closet.jpg", 900, 1187, "Iron filter and softener fitted into a utility closet"),
            ("install-iron-softener-basement.jpg", 900, 1725, "Iron filter and softener with a brine tank in an unfinished basement"),
            ("install-iron-softener-blue.jpg", 562, 744, "Blue iron filter and softener tanks with lit digital valves"),
        ],
        "faq": [
            ("Are iron filters only for well water?", "Mostly. City water is treated before it reaches you, so iron and sulfur problems usually come from private wells. A water test tells you for sure."),
            ("Can an iron filter remove more than iron?", "Yes. It also removes manganese and hydrogen sulfide, the cause of the rotten-egg smell."),
            ("Do I still need a softener?", "An iron filter doesn’t remove hardness. If your water is hard as well, which most iron water is, you’ll want both."),
            ("Do you service iron filters you didn’t install?", f"Yes. We work on most brands. Text a picture of the system to Dan at {PHONE} and he can come out and take a look."),
        ],
        "related": ["water-softener", "water-filtration", "free-water-test"],
    },
    {
        "slug": "reverse-osmosis",
        "nav": "Reverse osmosis",
        "title": "Reverse Osmosis Drinking Water Systems in Pinckney, MI | American Soft Water",
        "description": "Under-sink reverse osmosis systems that reduce lead, arsenic, nitrates and chlorine taste in your drinking water. Installed and serviced around Pinckney and Livingston County. Free water test.",
        "h1": "Reverse osmosis drinking water systems",
        "lede": "A reverse osmosis (RO) system sits under your kitchen sink and gives you clean drinking water from its own faucet. It’s the most thorough option for the water you drink and cook with.",
        "hero": ("install-ro.jpg", 1000, 999, "PuROMax four-stage reverse osmosis unit and white storage tank under a kitchen sink"),
        "caption": "A four-stage RO system under a kitchen sink",
        "service_type": "Reverse osmosis system installation",
        "body": f"""
          <h2>What it removes</h2>
          <p>RO reduces a wide range of contaminants, including:</p>
          {ticks([
              "Lead and other heavy metals",
              "Arsenic and nitrates",
              "Dissolved solids, sediment and cysts",
              "Bacteria and many chemicals, including pesticides",
              "Chlorine taste and odor",
          ])}

          <h2>How it works</h2>
          <p>Water is pushed under pressure through a series of filters:</p>
          <ol class="steps">
            <li><strong>Pre-filter.</strong> Catches larger particles, chlorine and other substances that would damage the membrane.</li>
            <li><strong>Membrane.</strong> A semi-permeable membrane lets water through and holds back finer contaminants.</li>
            <li><strong>Carbon filter.</strong> Activated carbon takes care of any remaining taste and odor.</li>
          </ol>
          <p>The clean water is stored in a small tank and comes out of a dedicated faucet at your sink, so it’s there when you want it.</p>

          <h2>Upkeep</h2>
          <p>The pre-filter, membrane and carbon filter need replacing from time to time. How often depends on your water and how much you use. Dan can set a schedule for your system and do the filter changes for you.</p>
          <p>On hard or iron water, a <a href="/water-softener">softener</a> or <a href="/iron-filters">iron filter</a> ahead of the RO helps protect the membrane.</p>
        """,
        "photos": [],
        "faq": [
            ("How often should I replace the filters?", "It depends on your water quality and how much you use. Dan can look at your system and give you a replacement schedule."),
            ("Can I install an RO system myself?", "An RO install means precise plumbing connections and adjustments, and some manufacturers void the warranty if it isn’t installed by a professional."),
            ("Is reverse osmosis the most effective filter?", "For drinking water, it removes the widest range of contaminants. It treats the water at one faucet, though, not the whole house. For whole-house problems, see softeners, iron filters and filtration."),
        ],
        "related": ["water-filtration", "water-softener", "free-water-test"],
    },
    {
        "slug": "water-filtration",
        "nav": "Whole-house filtration",
        "title": "Whole-House Water Filtration in Pinckney, MI | American Soft Water",
        "description": "Sediment pre-filters, carbon filters for chlorine and arsenic removal units for homes in Pinckney and Livingston County. Free water test, installation and service.",
        "h1": "Whole-house water filtration",
        "lede": "Some things a softener isn’t built to remove. A whole-house filter catches sand, grit and chlorine before they reach the rest of your plumbing, so every tap in the house gets cleaner water.",
        "hero": ("install-prefilter.jpg", 562, 744, "Sediment pre-filter plumbed ahead of a water softener in a basement"),
        "caption": "A sediment pre-filter ahead of a softener",
        "service_type": "Whole-house water filtration installation",
        "body": f"""
          <h2>Filters we install</h2>
          <dl class="defs">
            <dt>Sediment pre-filters</dt>
            <dd>Catch sand, silt and grit that make water cloudy and wear out fixtures and appliances.</dd>
            <dt>Carbon filters</dt>
            <dd>Remove the chlorine taste and smell from city water, plus other organic contaminants.</dd>
            <dt>Arsenic removal units</dt>
            <dd>For wells where a test shows arsenic.</dd>
          </dl>

          <h2>A good partner for a softener</h2>
          <p>A pre-filter is often recommended with a water softener. That’s not because the softener can’t do its job, but because your water may carry things a softener isn’t made to remove. Catching them first also helps the softener last.</p>

          <h2>Drinking water only?</h2>
          <p>If the concern is just the water you drink, a <a href="/reverse-osmosis">reverse osmosis system</a> under the kitchen sink may be the better fit. A water test shows which makes sense.</p>
        """,
        "photos": [
            ("install-twin-tank-prefilter.jpg", 900, 934, "Twin-tank softener with two pre-filters and copper plumbing on a basement wall"),
            ("install-twin-tank.jpg", 900, 1187, "Softener with a blue sediment pre-filter on the wall beside it"),
        ],
        "faq": [
            ("Do I need a pre-filter with my softener?", "Often, yes. It catches sediment a softener isn’t built for and helps the softener last. Your water test tells you whether you need one."),
            ("What’s the difference between this and reverse osmosis?", "A whole-house filter treats all the water coming into the house. Reverse osmosis treats drinking water at one faucet, and removes more."),
        ],
        "related": ["water-softener", "reverse-osmosis", "free-water-test"],
    },
    {
        "slug": "free-water-test",
        "nav": "Free water test",
        "title": "Free In-Home Water Testing in Pinckney & Livingston County | American Soft Water",
        "description": "Book a free in-home water test in Pinckney, Livingston, Washtenaw or Oakland County. Dan tests for hardness, iron, sulfur and more, explains the results, and there’s no obligation to buy.",
        "h1": "Free water testing at your home",
        "lede": "Dan comes to your home, tests your water and tells you what he finds. There’s no charge and no obligation to buy anything. Sometimes the answer is that your water, or the system you already have, is fine.",
        "hero": ("install-iron-softener-blue.jpg", 562, 744, "Blue iron filter and softener tanks with lit digital valves"),
        "caption": "An iron filter and softener we installed",
        "service_type": "Residential water testing",
        "is_booking": True,
        "body": f"""
          <h2>What we test for</h2>
          {ticks([
              "Hardness, the cause of scale and spots",
              "Iron, behind rust stains and metallic taste",
              "Hydrogen sulfide, the rotten-egg smell",
              "pH and chlorine",
              "Nitrates, sediment and bacteria, with lab testing when needed",
          ])}

          <h2>How it works</h2>
          <ol class="steps">
            <li><strong>Request a test</strong> with the form below, or call or text {PHONE}.</li>
            <li><strong>Dan sets a time</strong> that works for you.</li>
            <li><strong>He tests at your tap</strong> and walks you through the results.</li>
            <li><strong>You get a straight answer</strong> on what, if anything, your water needs.</li>
          </ol>

          <h2>When to test</h2>
          <p>Test once a year if you’re on a well, and any time you notice a change in taste, smell or staining. City water is treated, but it can still be hard or carry chlorine you’d rather not taste.</p>
        """,
        "photos": [],
        "faq": [
            ("How often should I test my water?", "Once a year, especially if you’re on a well, and any time you notice a change in taste, smell, or staining."),
            ("Is the water test really free?", "Yes. Dan tests at your home and explains the results on the spot. There’s no obligation to buy anything."),
            ("Can I test my water myself?", "Home test kits are available, but a professional test is more accurate and comes with someone who can tell you what the numbers mean."),
        ],
        "related": ["water-softener", "iron-filters", "reverse-osmosis"],
    },
]

BY_SLUG = {p["slug"]: p for p in PAGES}

RELATED_BLURB = {
    "water-softener": "Ends scale, spots and dry skin.",
    "iron-filters": "Stops rust stains and the rotten-egg smell.",
    "reverse-osmosis": "Cleaner drinking water at your kitchen sink.",
    "water-filtration": "Sediment, chlorine and arsenic, whole house.",
    "free-water-test": "Find out what’s in your water first.",
}


def render(page: dict) -> str:
    url = f"{SITE}/{page['slug']}"
    src, w, h, alt = page["hero"]
    booking = page.get("is_booking", False)
    test_href = "#water-test" if booking else "/free-water-test"

    ld = [
        {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": page["nav"],
            "serviceType": page["service_type"],
            "url": url,
            "provider": {"@id": f"{SITE}/#business"},
            "areaServed": ["Livingston County, MI", "Washtenaw County, MI", "Oakland County, MI"],
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE}/"},
                {"@type": "ListItem", "position": 2, "name": page["nav"], "item": url},
            ],
        },
    ]

    strip = ""
    if page["photos"]:
        strip = ('<section class="strip" aria-label="Recent installs">\n        <div class="wrap strip__grid">\n          '
                 + "\n          ".join(photo(*p) for p in page["photos"]) + "\n        </div>\n      </section>")

    faq = "\n".join(
        f"""            <details>
              <summary>{q}<svg class="ico" aria-hidden="true"><use href="#i-plus"/></svg></summary>
              <p>{a}</p>
            </details>""" for q, a in page["faq"])

    related = "\n".join(
        f'            <li><a href="/{s}"><strong>{escape(BY_SLUG[s]["nav"])}</strong><span>{RELATED_BLURB[s]}</span></a></li>'
        for s in page["related"])

    aside = f"""
          <aside class="page-aside" aria-label="Contact">
            <div class="page-aside__card">
              <h2>Talk to Dan</h2>
              <p>Call or text <a href="tel:+17348782572">734-878-2572</a></p>
              <p class="page-aside__hours">Mon–Fri 8–5, Sat 9–1<br>Emergencies answered 24/7</p>
              <a class="btn btn--red btn--block" href="{test_href}">Book a free water test</a>
            </div>
          </aside>"""

    tail = BOOKING if booking else f"""
    <section class="cta-band" aria-labelledby="cta-title">
      <div class="wrap cta-band__inner">
        <div>
          <h2 id="cta-title">Start with a free water test</h2>
          <p>Dan tests your water at home and tells you exactly what it needs, and what it doesn’t.</p>
        </div>
        <div class="cta-band__actions">
          <a class="btn btn--red btn--lg" href="/free-water-test">Book a free water test</a>
          <a class="btn btn--ghost-dark btn--lg" href="tel:+17348782572"><svg class="ico" aria-hidden="true"><use href="#i-phone"/></svg>Call 734-878-2572</a>
        </div>
      </div>
    </section>"""

    footer = FOOTER.replace('href="#water-test">Free water test', f'href="{test_href}">Free water test')
    header = HEADER.replace('href="/free-water-test"', f'href="{test_href}"')

    return f"""<!doctype html>
<html lang="en">
<head>
  <!-- Generated by tools/build_pages.py from public/index.html. Edit the script, not this file. -->
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{escape(page['title'])}</title>
  <meta name="description" content="{escape(page['description'])}">
  <link rel="canonical" href="{url}">
  <link rel="icon" href="/assets/logo/favicon-64.png" type="image/png">
  <link rel="apple-touch-icon" href="/assets/logo/mark.png">
  <meta property="og:title" content="{escape(page['h1'])}">
  <meta property="og:description" content="{escape(page['description'])}">
  <meta property="og:image" content="{SITE}/assets/img/{src}">
  <meta property="og:url" content="{url}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  {FONTS}
  <link rel="stylesheet" href="/css/styles.css?v={CSS_V}">
  <script type="application/ld+json">
{json.dumps(ld, indent=2, ensure_ascii=False)}
  </script>
</head>
<body>
{SPRITE}

  <a class="skip-link" href="#main">Skip to content</a>

{header}

  <main id="main">
    <section class="page-hero">
      <div class="wrap page-hero__grid">
        <div class="page-hero__copy">
          <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">{escape(page['nav'])}</span></nav>
          <h1>{page['h1']}</h1>
          <p class="page-hero__lede">{page['lede']}</p>
          <div class="hero__actions">
            <a class="btn btn--red btn--lg" href="{test_href}">Book a free water test</a>
            <a class="btn btn--ghost btn--lg" href="tel:+17348782572"><svg class="ico" aria-hidden="true"><use href="#i-phone"/></svg>Call 734-878-2572</a>
          </div>
        </div>
        <figure class="page-hero__photo{' page-hero__photo--top' if page.get('hero_top') else ''}">
          <img src="/assets/img/{src}" width="{w}" height="{h}" alt="{escape(alt)}">
          <figcaption>{page['caption']}</figcaption>
        </figure>
      </div>
    </section>

    <div class="wrap page-layout">
      <article class="prose">
{page['body']}
      </article>
{aside}
    </div>

    {strip}

    <section class="faq" id="faq" aria-labelledby="faq-title">
      <div class="wrap faq__grid">
        <h2 id="faq-title">Common questions</h2>
        <div class="faq__list">
{faq}
        </div>
      </div>
    </section>

    <section class="related" aria-labelledby="related-title">
      <div class="wrap">
        <h2 id="related-title">Related</h2>
        <ul class="related__list">
{related}
        </ul>
      </div>
    </section>
{tail}
  </main>

{footer}

  <script src="/js/main.js?v={JS_V}" defer></script>
</body>
</html>
"""


def main():
    for page in PAGES:
        out = PUBLIC / f"{page['slug']}.html"
        out.write_text(render(page), encoding="utf-8")
        print("wrote", out.relative_to(ROOT))

    # Keep the sitemap in step with the pages.
    urls = [f"{SITE}/"] + [f"{SITE}/{p['slug']}" for p in PAGES]
    sitemap = ('<?xml version="1.0" encoding="UTF-8"?>\n'
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
               + "".join(f"  <url>\n    <loc>{u}</loc>\n  </url>\n" for u in urls)
               + "</urlset>\n")
    (PUBLIC / "sitemap.xml").write_text(sitemap, encoding="utf-8")
    print("wrote public/sitemap.xml with", len(urls), "URLs")


if __name__ == "__main__":
    main()
