# Dreamy Tales — Facebook & Instagram A/B Test Plan

**Website:** https://dreamytales.co.za  
**Signup URL:** https://dreamytales.co.za/signup  
**Offer:** 7-day free trial · R99/month (1 child) · Stories at 6pm SAST nightly

---

## Generated creative assets

Ready-to-upload images are in [`docs/marketing/assets/`](assets/):

| File | Format | Use for |
|------|--------|---------|
| `dreamytales-ad-feed-bedtime.png` | Square | Facebook/Instagram Feed — Variant A |
| `dreamytales-ad-meme-dinosaur.png` | Landscape 1.91:1 | Facebook Feed — Variant B |
| `dreamytales-ad-languages.png` | Square | Facebook/Instagram Feed — Variant C |
| `dreamytales-ad-reels-cover.png` | Vertical 9:16 | Reels/T Stories cover & video end card |

**Also use on ads:** Your live sample story pages from the site (`/samples/story-page-1.png` etc.) once deployed — real product proof converts better than generic art.

> **Language update (2025):** Product now offers **English & Afrikaans** only. Update `dreamytales-ad-languages.png` and GIF frame `05-11-languages.png` in Canva before running Variant C — replace "11 languages" copy with "English & Afrikaans".

---

## Phase 1 — A/B test (Week 1)

### Goal
Find the best **hook + creative** combination before scaling budget.

### Budget
- **Total:** R150–250/day for 7 days (~R1,050–1,750)
- Split evenly across 3 ad sets until Day 4, then move 70% budget to the winner

### Campaign structure (Meta Ads Manager)

```
Campaign: Dreamy Tales — Signups — A/B Test
├── Objective: Sales or Leads (Conversions → Complete Registration)
├── Conversion event: Landing page view OR signup submit (if Meta Pixel installed)
│
├── Ad Set A — "Tired parent" (Broad SA parents)
├── Ad Set B — "Dinosaur meme" (Broad SA parents)
└── Ad Set C — "English & Afrikaans" (Broad SA parents + Afrikaans/bilingual interests)
```

**Why same audience for all 3?** Isolates the creative/message variable. Audience tests come in Phase 2.

### Audience (all ad sets)

| Setting | Value |
|---------|-------|
| Location | South Africa |
| Age | 28–44 |
| Gender | All (optional: 80% women after Week 1 data) |
| Detailed targeting | Parenting, Bedtime, Children's books, Early childhood education |
| Placements | Advantage+ placements ON (or manual: FB Feed, IG Feed, IG Reels, IG Stories) |
| Exclusions | Existing customers (upload email list if you have one) |

**Start narrow geography (optional):** Gauteng + Western Cape for first 3 days if budget is tight.

---

## Ad variants — copy & creative pairing

### Variant A — “Tired parent” (control)

**Creative:** `dreamytales-ad-feed-bedtime.png`  
**Headline:** Personalised bedtime stories every night  
**Primary text:**

```
Read "Goodnight Moon" for the 400th time? 😴

Dreamy Tales sends a brand-new personalised bedtime story to your inbox every night at 6pm — with your child's name, interests, and hometown.

✨ 30+ illustrated stories per month
🌍 English & Afrikaans bedtime stories
💛 From R99/month (less than R3.50 per story)
🎁 7-day free trial

Start tonight 👇
```

**Link description:** 7-day free trial · From R99/mo  
**CTA button:** Sign Up  
**URL:** `https://dreamytales.co.za/signup?utm_source=facebook&utm_medium=paid&utm_campaign=ab_test&utm_content=variant_a`

---

### Variant B — “Dinosaur meme” (humour)

**Creative:** `dreamytales-ad-meme-dinosaur.png`  
**Headline:** 30+ stories. You're welcome.  
**Primary text:**

```
You: "One more story."
Us: "Here's 30. You're welcome." 📚

Dreamy Tales = a fresh illustrated bedtime short story every night at 6pm. Written for YOUR child — their name, age, interests, and SA hometown.

R99/month · 7-day free trial · Cancel anytime
```

**Link description:** New story every night at 6pm  
**CTA button:** Learn More  
**URL:** `https://dreamytales.co.za/signup?utm_source=facebook&utm_medium=paid&utm_campaign=ab_test&utm_content=variant_b`

---

### Variant C — “English & Afrikaans” (SA differentiator)

**Creative:** `dreamytales-ad-languages.png` *(update image copy in Canva — see note below)*  
**Headline:** Bedtime stories in English or Afrikaans  
**Primary text:**

```
Bedtime stories in English or Afrikaans — written for YOUR child. 🇿🇦

Every evening at 6pm, a new illustrated PDF lands in your inbox. Personalised for kids aged 3–12.

🎁 Try free for 7 days
From R99/month after trial
```

**Link description:** English & Afrikaans · Free trial  
**CTA button:** Sign Up  
**URL:** `https://dreamytales.co.za/signup?utm_source=facebook&utm_medium=paid&utm_campaign=ab_test&utm_content=variant_c`

---

## Success metrics

Track in Meta Ads Manager + your admin dashboard (`/admin`).

| Metric | Target (Week 1) | Action if below |
|--------|-----------------|-----------------|
| **CTR (link)** | > 1.2% | Swap headline or image |
| **CPC (link click)** | < R3 | Tighten audience or improve hook |
| **Landing page views** | 200+ / week | Increase budget on winner |
| **Signup submits** | 5+ / week | Fix site funnel first (PayFast/db) |
| **Cost per signup** | < R150 | Scale winner; pause losers |

**Primary KPI:** Cost per completed signup (not just clicks).

---

## Decision rules (Day 4 & Day 7)

### Day 4 checkpoint
- Pause any variant with **CTR < 0.6%** after 1,500+ impressions
- Allocate **70% budget** to best CTR variant
- Allocate **30%** to second place

### Day 7 winner
Scale the variant with the **lowest cost per signup** (or highest signup rate if volume is low).

**Document results:**

| Variant | Impressions | CTR | Clicks | Signups | Cost/signup | Winner? |
|---------|-------------|-----|--------|---------|-------------|---------|
| A | | | | | | |
| B | | | | | | |
| C | | | | | | |

---

## Phase 2 — Scale winner (Week 2–3)

1. **Duplicate winning ad** into 2 new ad sets:
   - Lookalike 1% — website visitors (needs Meta Pixel)
   - Interest stack — parenting + children's literacy + South Africa

2. **Add Reels placement** using the video script below (same copy as winner)

3. **Retargeting ad set** (after 100+ visitors):
   - Audience: Visited site, did not sign up, last 14 days
   - Copy: "Still thinking? Your child's first story could arrive tonight at 6pm. 7-day free trial."
   - Creative: sample story page screenshot + `dreamytales-ad-reels-cover.png`

4. **Budget ramp:** +20% every 3 days if cost/signup stays on target

---

## Phase 3 — Audience tests (Week 4)

Test these against your winning creative (one variable at a time):

| Test | Audience tweak |
|------|------------------|
| A | Cape Town + Johannesburg only |
| B | Afrikaans interest + SA |
| C | Ages 32–40 only |
| D | Parents with preschoolers (if available) |

---

## Instagram Reels — 30-second ad

**Format:** 1080×1920 · 30 sec · Captions ON · Trending soft lullaby or calm acoustic (royalty-free)

**Cover / end card:** `dreamytales-ad-reels-cover.png`

### Storyboard

| Time | Visual | On-screen text |
|------|--------|----------------|
| 0:00–0:03 | Parent exhausted, same book | "That dinosaur book… again?" |
| 0:03–0:07 | Phone buzzes, lock screen 6:00 PM | "6pm. New story. Every night." |
| 0:07–0:12 | Scroll sample story page — child's name visible | "Your child's name. Their world." |
| 0:12–0:18 | Quick cuts: illustration, SA skyline hint, moon | "Illustrated · Personalised · SA-made" |
| 0:18–0:24 | Happy bedtime read on tablet | "30+ stories a month" |
| 0:24–0:30 | Logo + CTA on navy background | "7-day FREE trial → link in bio" |

### Voiceover script (warm, conversational — female or male, SA accent)

```
[0:00] If bedtime feels like déjà vu… you're not alone.

[0:04] Every night at six, Dreamy Tales sends a brand-new bedtime story to your inbox.

[0:09] Your child's name. Their interests. Even their hometown.

[0:13] Fully illustrated. Written for kids three to twelve.

[0:17] In English or Afrikaans — your choice at signup.

[0:21] That's thirty-plus fresh stories a month… for less than three rand fifty a night.

[0:26] Try Dreamy Tales free for seven days. Link in bio. Tonight could be the easiest bedtime yet.
```

**Reels caption (post text):**

```
7pm stress? We deliver at 6pm. 🌙

Personalised bedtime stories for SA families — your child's name, language & hometown in every story.

🎁 7-day FREE trial
💛 From R99/month

dreamytales.co.za/signup

#DreamyTales #BedtimeStories #SouthAfricanParents #ParentingSA #KidsBooks #BedtimeRoutine #PersonalisedStories #MomLifeSA #DadLifeSA
```

---

## Reels — 15-second cut (Stories / low-attention scroll)

**Voiceover:**

```
Same bedtime book every night? Dreamy Tales sends a new personalised story to your inbox at six pm — every single night. Your child's name. Custom illustrations. Try free for seven days. Dreamy Tales — link in bio.
```

---

## DIY video assembly (no videographer needed)

1. **CapCut** (free) or **Canva Video**
2. Import: `dreamytales-ad-reels-cover.png` + sample story screenshots from your site
3. Add voiceover (record on phone using script above, quiet room)
4. Auto-captions → fix spelling of "Dreamy Tales" and "R99"
5. Export 1080×1920, upload as Reels ad in same campaign as Feed winner

**Screen recording option (high trust):**
- Record phone: notification → open email → open PDF story
- 20 seconds, no voiceover needed — use text overlays only

---

## Carousel ad (optional Week 2)

Use 4 slides in one ad (high engagement on Facebook):

| Slide | Image | Text overlay |
|-------|-------|--------------|
| 1 | Sample story page 1 | "Opens in your child's hometown" |
| 2 | Sample story illustration | "Fully illustrated every page" |
| 3 | Sample story ending | "Calm endings for bedtime" |
| 4 | `dreamytales-ad-feed-bedtime.png` | "7-day free trial → Sign up" |

---

## Compliance checklist (Meta + SA consumer)

- [ ] Primary text mentions **subscription**: "R99/month after 7-day free trial"
- [ ] **Cancel policy** visible on landing page (already on `/signup` and homepage)
- [ ] No guaranteed sleep/medical claims
- [ ] PayFast checkout disclosed (users know card is required for trial)
- [ ] UTM links on every ad for tracking

---

## Meta Pixel (recommended before spending)

Install Meta Pixel on `dreamytales.co.za` to track:
- `PageView` — homepage
- `Lead` or custom event — `/signup` form submit
- `Purchase` — PayFast success page

Enables retargeting and lookalike audiences in Phase 2.

---

## Quick launch checklist

- [ ] Upload 4 images from `docs/marketing/assets/`
- [ ] Create campaign with 3 ad sets (A, B, C)
- [ ] Set daily budget R50–80 per ad set
- [ ] Point all ads to `/signup` with UTM tags
- [ ] Publish Reels organic post + boost best performer
- [ ] Check `/admin` daily for signup submits vs ad spend
- [ ] Day 4: pause loser, scale winner
- [ ] Day 7: document results and start Phase 2

---

## Afrikaans ad variant (optional test)

**Headline:** `'n Nuwe bedtydverhaal elke aand`

**Primary text:**

```
Moeg vir dieselfde boek elke aand? 😴

Dreamy Tales stuur elke aand om 6pm 'n nuwe persoonlike bedtydverhaal na jou inbox — met jou kind se naam, belangstellings en selfs hulle tuisdorp.

✨ 30+ stories per maand · Engels & Afrikaans
🎁 7 dae gratis · R99/maand daarna

Probeer gratis → dreamytales.co.za/signup
```

Pair with `dreamytales-ad-languages.png` or sample story in Afrikaans if available.
