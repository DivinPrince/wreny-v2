# Wreny — Pricing, free trial, and AI billing

Single source of truth for **plan positioning**, **prices**, **free trial rules**, and **how AI usage maps to limits and optional overages**. Implementation (**Polar** products, checkout, webhooks, metering in API) should follow this document unless deliberately changed.

---

## 1. Product snapshot

- **Audience:** Individual job seekers (B2C).
- **Core value:** AI-assisted **resumes** (all plans that include resumes) and **cover letters** (paid plans only), job pipeline, imports, PDF export, document-scoped agent sessions.
- **Primary cost driver:** LLM usage (agent turns, tool calls, long contexts).

---

## 2. Plans and list prices

| Plan | Monthly | Annual | Annual note |
|------|---------|--------|-------------|
| **Free** | $0 | — | — |
| **Pro** | **$29** | **$279** | ~**20% off** vs 12× monthly (~$23.25/mo effective) |
| **Max** | **$59** | **$549** | Anchor tier; ~**22% off** vs 12× monthly |

**Pricing page psychology**

- Highlight **Pro** as **Most popular**.
- Show **Max** as the **anchor** (full power, higher price) so **$29** feels like the rational choice.
- Lead with **monthly**; show **annual savings** clearly (dollar amount saved, not only “% off”).

---

## 3. Free trial (Pro)

**Goal:** Let a serious user experience **full Pro** (especially AI + imports) without committing, then convert to **$29/mo** or **$279/yr**.

| Rule | Recommendation |
|------|----------------|
| **What’s trialed** | **Pro** plan — same feature flags and **same monthly AI credit pool as Pro** (see §5). |
| **Length** | **7 days** from trial start. |
| **Eligibility** | **Once per user account** (by user id / email fingerprint). No repeated trials on new workspaces for the same person. |
| **Payment method** | **Recommended: no credit card** to maximize signups. **Optional:** card required on day 0 if abuse or cost spikes force it — document the switch in this file if you change it. |
| **After trial** | **Downgrade to Free** (with Free limits) until user subscribes; **do not** silently charge unless you explicitly adopt a card-on-file model. |
| **Communication** | Email or in-app notice at **day 5** and **day 7**; clear CTA to subscribe with annual option. |

**Abuse controls (if trial is no-card)**

- Same caps as Pro during trial (credits already bound the worst case).
- Rate limits per IP / account on **signup** and **agent** endpoints if needed.

---

## 4. What each plan includes (features)

Numbers below are **defaults** for product and billing; tune after you have usage metrics.

**Freemium shape (Rezi-inspired, not a copy):** Rezi’s free tier caps **resume count** and **PDF downloads** while still letting users feel the product. Wreny’s free tier is **resume-first**: **no cover letter product surface on Free** (builder, agent scoped to CL, CL PDF, etc.), and **resume PDF download is capped** so export is a clear upgrade lever—similar in *spirit* to [Rezi’s pricing](https://www.rezi.ai/pricing) (e.g. **3 PDF downloads** on free).

| Capability | Free | Pro | Max |
|------------|------|-----|-----|
| **Job / posting import** | **1 lifetime import** | Unlimited | Unlimited |
| **Resume import (PDF)** | **1 lifetime** (separate from LinkedIn) | Unlimited | Unlimited |
| **Resume import (LinkedIn)** | **1 lifetime** (separate from PDF) | Unlimited | Unlimited |
| **Resumes** | Low cap (e.g. **1 resume**) | High or unlimited (choose one) | Unlimited |
| **Cover letters** | **Not included** — no CL builder, no CL agent, no CL PDF | Included | Included |
| Job tracker | Low cap (e.g. ≤25 active jobs) | Unlimited or high cap | Unlimited |
| **Resume PDF download** | **3 downloads total** (lifetime cap per account; tune if you prefer monthly reset) | Unlimited | Unlimited |
| **Cover letter PDF download** | — (no CL on Free) | Unlimited | Unlimited |
| Agent (resume / general) | Yes, within AI credits (**resume scope only** on Free) | Yes, within AI credits (resume + CL + general) | Yes, within larger AI credits |
| `proposeDocumentChanges` / approvals | Resume only, within AI credits | Within AI credits | Within AI credits |

**Import limits (Free)** — upgrading removes these caps:

- **Job / posting:** 1 lifetime import (table above).
- **Resume:** **Two separate allowances** — **1 lifetime PDF resume import** and **1 lifetime LinkedIn resume import**. Using one path does **not** consume the other. (Not a single combined “free import” across both.)

**PDF download limit (Free):** Each successful **resume PDF** download counts toward **3 total** on Free. Failed/aborted generations should not consume (define in implementation). Paid plans: unlimited resume + cover letter PDFs.

---

## 5. How we charge for AI usage

### 5.1 Principle

- **Subscription** covers **platform + a fair monthly amount of AI**.
- **AI has marginal cost** → we sell **included credits per billing period**; **overage** is optional but recommended once usage is measurable.

This keeps **$29** economically sane and avoids “unlimited AI” promises that burn margin.

### 5.2 Billable unit: **AI credits**

Use a single customer-facing name: **AI credits** (or “coach credits” in UI if you prefer softer copy).

**Definition (for product + engineering)**

- **1 AI credit** is consumed for **each user-initiated agent request** that **starts a new model run** in response to the user’s message (normal chat send, or equivalent “run agent” action).
- **Within that single user turn**, the model may call tools multiple times (e.g. `getResume`, `proposeDocumentChanges`). **That whole turn counts as 1 credit**, not one credit per tool call — unless you later split “heavy” operations (see §5.4).

**Does not consume a credit (recommended)**

- Loading session history, opening the UI, or **failed requests** where the server returns an error before any successful model completion (define precisely in implementation).

**Rationale:** One credit ≈ one “thing the user asked the coach to do,” which is easy to explain and roughly tracks cost without surprising users with 5 charges for one question.

### 5.3 Included credits per plan (monthly)

Reset **each billing period** (subscription anniversary). **Trial uses Pro’s pool** for 7 days (prorate optional; simplest is **full Pro monthly pool** for the week — acceptable cost for conversion).

| Plan | Included AI credits / month |
|------|-----------------------------|
| **Free** | **20** (tunable 15–30) |
| **Pro** | **200** (tunable 150–300) |
| **Max** | **500** (tunable 400–800) |

**After credits are exhausted**

- **Phase 1 (simple):** Hard stop with message: *“You’ve used your AI credits for this period. Upgrade or wait until [date], or buy an add-on.”*
- **Phase 2 (revenue):** **Overage** — see §5.5.

### 5.4 Optional: “Heavy” operations (future)

If some flows are **much** more expensive (e.g. bulk job tailoring, huge pasted JDs, premium model):

- Either **multiplier** (e.g. counts as **2 credits**) or **separate “premium action”** bucket — document here before shipping.

### 5.5 Overage (optional, recommended when stable)

- **Polar** usage-based or add-on products (metered / credit packs per [Polar docs](https://docs.polar.sh)), or **pre-purchased credit packs** you define (e.g. +100 credits for $X).
- **Price overage** so **gross margin** on extra usage stays positive vs your **Gemini (or other) cost** + PDF + infra.

**Until overage exists:** enforce **hard cap** only; show **credits remaining** in the agent UI.

### 5.6 Internal cost check (operations)

Periodically compute:

- Average **tokens in + out** per credit (per plan / feature).
- **Cost per credit** ≈ model $ + small overhead.
- Adjust **included credits** or **Pro price** if margins drift.

---

## 6. Polar / billing implementation checklist

- [ ] **Polar** organization, products, and prices: **Pro** ($29/mo), **Pro annual** ($279/yr), **Max** ($59/mo), **Max annual** ($549/yr) — configured in Polar dashboard (or via API).
- [ ] **Checkout:** Polar Checkout / customer portal links or embedded flow; map Polar **subscription** (or order) state to internal `plan`.
- [ ] **Trial:** 7 days on **Pro** — Polar trial where supported, or **app-managed** `trialEndsAt` + feature flags until billing is wired.
- [ ] **Entitlements** on user: `plan`, `trialEndsAt`, `aiCreditsIncluded`, `aiCreditsUsed`, `billingPeriodStart` (derive from Polar subscription webhooks + your DB). For Free: **separate** resume import counters (e.g. `resumePdfImportsUsed`, `resumeLinkedInImportsUsed`) and **`resumePdfDownloadsCount`** (cap at **3** until upgrade).
- [ ] **Middleware** on agent routes: decrement or check credits per §5.2.
- [ ] **Webhooks:** verify with `POLAR_WEBHOOK_SECRET`; handle Polar subscription lifecycle events to sync plan, renewals, and credit period resets (exact event names per current [Polar webhooks](https://docs.polar.sh/developers/webhooks)).
- [ ] **Free:** no Polar customer required; enforce limits in app.
- [ ] **Server env:** `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET` (see `@repo/env`).

---

## 7. Copy snippets (pricing page / upgrade)

- **Pro headline:** *Everything you need for an active job search — unlimited imports, **cover letters**, unlimited PDFs, full tracker, and **200 AI coach credits** every month.*
- **Free tier one-liner:** *Build your resume with AI — **3 resume PDF downloads**, then upgrade for unlimited exports and **cover letters**.*
- **Free job import:** *Try **1 free job import** — upgrade for unlimited imports and full AI.*
- **Free resume imports:** *On Free you get **1 PDF resume import** and **1 LinkedIn resume import** — counted **separately**, not as one shared import.*
- **Free PDF cap:** *Free includes **3 resume PDF downloads** — enough to try exports; upgrade for unlimited PDFs (and cover letters).*
- **Cover letters (upgrade):** *Cover letter builder and exports are **included on Pro and Max** — not on Free.*
- **Credits:** *Each time you send a message to the coach, it uses **1 AI credit** (including the tools it runs for that answer).*
- **Trial:** *7-day **Pro** trial — full Pro features and **same monthly AI credits**; no credit card required.*

---

## 8. Revision log

| Date | Change |
|------|--------|
| 2025-03-22 | Initial doc: $29 Pro, $59 Max, annual prices, 7-day Pro trial, 1 free job import, AI credit model. |
| 2025-03-22 | Free resume imports: **1× PDF + 1× LinkedIn** (separate lifetime counters), distinct from job/posting import. |
| 2025-03-22 | Free: **no cover letter features**; **3 resume PDF downloads** (Rezi-inspired cap); paid = unlimited resume + CL PDFs. |
| 2025-03-22 | **Billing:** **Polar** (not Stripe) — checkout, subscriptions, webhooks; env: `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`. |

Update this table when prices, credit counts, or trial rules change.
