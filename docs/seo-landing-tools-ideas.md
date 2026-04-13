# SEO + landing-linked tools (Wreny)

Ideas for public tools users open from the landing page. Good for long-tail search, backlinks, and signup funnels.

## High-value public tools

- **ATS / keyword gap checker** — Paste job URL + resume text → missing keywords, density hints. Targets queries like “ATS resume checker”, “keywords for [role]”.
- **Resume readability score** — Grade level, bullet length, weak verbs. Targets “resume tips”; consider session-based or `noindex` on heavy duplicate result URLs.
- **Job description → bullet generator (lite)** — One JD in, a few bullets out. Targets “resume bullet examples [title]”.
- **Cover letter opener by role** — A few variants + copy. Targets “cover letter opening [role]”.
- **Salary / title normalizer** — Consistent naming (e.g. “Senior Software Engineer” vs “Sr SWE”) using rules or public data.

## Trust + E-E-A-T

- **Template gallery** — Live preview pages; add structured data (`Product`, `HowTo` where it fits).
- **Public changelog / what’s new** — Dated posts; internal links into the product.
- **Glossary** — Terms like ATS, STAR method, functional resume; pages cross-link to product.

## Technical SEO (link from footer or site map page)

- **`/sitemap.xml`** and **`robots.txt`** — Discoverable for crawlers.
- **Canonical URLs** — Clear split between marketing and app routes.
- **Open Graph / Twitter cards** — Unique title, description, image per tool page.
- **JSON-LD on homepage** — `Organization`, `WebSite`; optional `SearchAction` if site search exists.

## Tool hub on landing

- Section: **Free tools** → cards to `/tools/…` routes.
- Each tool = one primary keyword cluster; fast LCP; **no login wall for step 1** when possible.

## Distribution / off-site (optional)

- **Embeddable badge** — e.g. “Checked with [Brand]” for backlinks from portfolios.
- **Shareable PDF report** (watermarked) — Natural links and shares.

## Measurement (internal)

- **Google Search Console** + **Bing Webmaster** — Submit sitemap early.
- **Analytics** — Funnel: tool start → signup.

## MVP suggestion

Ship **2–3 tools** first: e.g. ATS keyword checker + resume score + one generative lite (bullets or cover opener). Expand after traction.
