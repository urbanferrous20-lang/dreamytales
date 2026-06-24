# Dreamy Tales — Custom Bedtime Short Story Subscription

Nightly personalised illustrated PDF bedtime short stories for South African families.

## Features

- Marketing landing page with pricing and parent-focused sales copy
- Multi-child signup questionnaire
- PayFast subscription (7-day free trial → R99/month first child, R50/additional, or annual with 1 month free)
- DeepSeek for story text + OpenAI for illustrations (server-side only)
- PDF delivery via email at 6pm SAST
- Parent dashboard with story archive
- 1-month notice cancellation with automatic PayFast billing stop

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

**Never commit `.env.local`.** API keys stay server-side only.

| Variable | Purpose |
|----------|---------|
| `DEEPSEEK_API_KEY` | Story text generation |
| `OPENAI_API_KEY` | Illustrations only |
| `PAYFAST_*` | Payment gateway (use sandbox first) |
| `RESEND_API_KEY` | Email with PDF attachments |
| `AUTH_SECRET` | Session encryption (random 32+ char string) |
| `DATABASE_URL` | `file:./dev.db` for local SQLite |

### 3. Set up database

```bash
npm run db:push
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. PayFast sandbox

1. Create account at [sandbox.payfast.co.za](https://sandbox.payfast.co.za)
2. Set merchant ID, key, and passphrase in `.env.local`
3. For ITN webhooks locally, use [ngrok](https://ngrok.com) to expose `/api/webhooks/payfast/itn`
4. Set `NEXT_PUBLIC_APP_URL` to your ngrok URL during testing

### 6. Nightly stories (Inngest)

Stories run on cron at **16:00 UTC (18:00 SAST)** via Inngest.

For local dev, run the Inngest dev server:

```bash
npx inngest-cli@latest dev
```

## Publishing to dreamytales.co.za

Production domain: **https://dreamytales.co.za** (`www` redirects to the apex domain).

The app is configured for this domain in `lib/site.ts`. Set:

```env
NEXT_PUBLIC_APP_URL=https://dreamytales.co.za
```

PayFast return and ITN URLs are built automatically from that value.

### Deploy to Vercel

1. Push the project to GitHub and import it at [vercel.com](https://vercel.com)
2. Add custom domains **dreamytales.co.za** and **www.dreamytales.co.za** in Vercel → Project → Settings → Domains
3. At your domain registrar, add the DNS records Vercel shows (usually `A`/`CNAME` for apex and `CNAME` for `www`)
4. In Vercel → Settings → Environment Variables, add all values from `.env.local` (use **Postgres** for `DATABASE_URL`, not SQLite)
5. Set `PAYFAST_SANDBOX=false` and live PayFast credentials when going live
6. Deploy — Vercel runs `npm run build` (includes `prisma generate`)

Optional: set Vercel function region to **Cape Town (`cpt1`)** in Project Settings for lower latency in SA (Pro plan).

### Local development

Use a separate override in `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Before launch checklist

1. **Deploy** — Vercel (recommended for Next.js) or similar host
2. **DNS** — Point `dreamytales.co.za` to your host (Vercel gives A/CNAME records at your registrar)
3. **Environment** — Set production env vars on the host (not in `.env.local`):
   - `NEXT_PUBLIC_APP_URL=https://dreamytales.co.za`
   - `PAYFAST_SANDBOX=false` + live PayFast merchant credentials
   - `RESEND_FROM_EMAIL=Dreamy Tales <Admin@dreamytales.co.za>` (verify domain in Resend)
   - `DATABASE_URL` — use Postgres (Supabase/Neon), not SQLite
   - All API keys (`DEEPSEEK`, `OPENAI`, `RESEND`, `INNGEST`, `AUTH_SECRET`)
4. **PayFast** — ITN notify URL becomes `https://dreamytales.co.za/api/webhooks/payfast/itn` (built from `NEXT_PUBLIC_APP_URL`)
5. **Email** — Set up `Admin@dreamytales.co.za` at your registrar or Google Workspace for contact and story delivery; verify the domain in Resend
6. **Inngest** — Connect production app URL for nightly story cron
7. **Legal** — Have Terms & Privacy reviewed by a SA attorney before taking payments

Keep a local-only override in `.env.local` when developing:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Estimated AI cost per customer

~**R7–15/month per child** (30 stories):

- DeepSeek text: ~R0.50–1.50/month
- OpenAI images: ~R6/month
- Buffer for retries: ~R2–8

## Project structure

```
app/           # Pages and API routes
components/    # UI components
lib/           # Business logic, AI clients, PayFast, email
inngest/       # Scheduled jobs (nightly stories, cancellation)
prisma/        # Database schema
storage/       # Generated PDFs and images (gitignored)
```

## Security

- All API keys are server-only (no `NEXT_PUBLIC_` prefix)
- Passwords hashed with bcrypt
- Sessions via signed JWT cookies
- PayFast ITN signature verification

## Legal

Terms and Privacy pages are templates — have a South African attorney review before launch.
