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

## Quick start (local)

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
| `SMTP_*` | 1-grid outgoing mail (story PDFs) |
| `AUTH_SECRET` | Session encryption (random 32+ char string) |
| `CRON_SECRET` | Protects scheduled task URLs |
| `DATABASE_URL` | MySQL connection string |

### 3. Set up database

Requires MySQL (local install, Docker, or your 1-grid database):

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

### 6. Nightly stories (Plesk cron in production)

Stories run at **6pm SAST** via Plesk scheduled tasks calling `/api/cron/nightly-stories` (one child per run).

For local dev, POST to `/api/dev/trigger-stories` while logged in.

## Production: 1-grid Plesk

**Recommended hosting:** your existing **1-grid Plesk Linux Medium** package.

Full step-by-step guide: **[docs/DEPLOY-PLESK.md](docs/DEPLOY-PLESK.md)**

Summary:

1. Create **MySQL** database and `Admin@dreamytales.co.za` mailbox in Plesk  
2. Enable **Node.js** (20+), set startup file to `start.js`  
3. Add env vars from `.env.example` in Plesk Node.js settings  
4. Run `npm install`, `npm run build`, `npx prisma db push`  
5. Enable **SSL** for `dreamytales.co.za`  
6. Add **Scheduled Tasks** for nightly stories and cancellations  
7. Test SMTP: `/api/cron/test-email?secret=...`

Production domain: **https://dreamytales.co.za**

```env
NEXT_PUBLIC_APP_URL=https://dreamytales.co.za
```

PayFast return and ITN URLs are built automatically from that value.

### Before launch checklist

1. **Deploy** on 1-grid Plesk (see `docs/DEPLOY-PLESK.md`)
2. **DNS** — Point `dreamytales.co.za` to Plesk (replace parking page)
3. **Environment** — All production env vars in Plesk Node.js panel
4. **PayFast** — ITN at `https://dreamytales.co.za/api/webhooks/payfast/itn`
5. **Cron** — Nightly stories + cancellation processing scheduled
6. **Legal** — Have Terms & Privacy reviewed by a SA attorney before taking payments

## Admin dashboard

Owner metrics at **`/admin`** (not indexed by search engines).

1. Set admin credentials in `.env.local` / Plesk:
   ```bash
   npm run admin:hash-password -- "your-secure-password"
   ```
   Use `ADMIN_PASSWORD=...` for local dev, or `ADMIN_PASSWORD_HASH_B64=...` on Plesk (Next.js cannot read bcrypt `$` hashes in `.env` files).
2. Add to `.env.local` / Plesk:
   ```env
   ADMIN_EMAIL=Admin@dreamytales.co.za
   ADMIN_PASSWORD=your-secure-password
   ```
3. Sign in at [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

Tracks visitors, signup funnel, subscriptions, revenue (from PayFast payments), unsubscribes, reviews, and **storage usage** (with 90-day PDF retention).

Schedule daily PDF cleanup on Plesk: `GET /api/cron/cleanup-pdfs?secret=...` (see `docs/DEPLOY-PLESK.md`).

## Estimated AI cost per customer

~**R7–15/month per child** (30 stories):

- DeepSeek text: ~R0.50–1.50/month
- OpenAI images: ~R6/month
- Buffer for retries: ~R2–8

## Project structure

```
app/           # Pages and API routes
components/    # UI components
lib/           # Business logic, AI clients, PayFast, email, cron jobs
prisma/        # Database schema (MySQL)
storage/       # Generated PDFs and images (gitignored)
docs/          # Deployment guides
start.js       # Plesk Node.js startup file
```

## Security

- All API keys are server-only (no `NEXT_PUBLIC_` prefix)
- Passwords hashed with bcrypt
- Sessions via signed JWT cookies
- PayFast ITN signature verification
- Cron endpoints protected by `CRON_SECRET`

## Legal

Terms and Privacy pages are templates — have a South African attorney review before launch.
