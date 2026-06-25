# Deploy Dreamy Tales on 1-grid Plesk (Linux Medium)

This guide deploys the app on your existing **Plesk Linux Hosting** package using **MySQL**, **1-grid SMTP**, and **Plesk scheduled tasks** (no Vercel, Resend, or Inngest).

## What you need before starting

1. **Plesk login** for your 1-grid account  
2. **Domain** `dreamytales.co.za` added in Plesk (replace the parking page)  
3. **Mailbox** `Admin@dreamytales.co.za` created in Plesk → Mail  
4. **API keys** in hand: DeepSeek, OpenAI, PayFast (sandbox first)  
5. **GitHub repo** or ZIP upload of this project  

---

## Step 1 — MySQL database

1. Plesk → **Databases** → **Add Database**  
2. Name: e.g. `dreamytales`  
3. Create a database user with full access; note **username**, **password**, **database name**  
4. Your connection string (on the same server, host is usually `localhost`):

```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/DATABASE_NAME"
```

---

## Step 2 — Email (SMTP)

Create `Admin@dreamytales.co.za` in Plesk if it does not exist.

Typical 1-grid settings ([reference](https://1grid.co.za/knowledge/recommended-server-settings-for-email-encryption-ports/)):

| Setting | Value |
|---------|--------|
| SMTP host | `mail.dreamytales.co.za` |
| Port | `465` (SSL) or `587` (STARTTLS) |
| Username | Full address `Admin@dreamytales.co.za` |
| Password | Mailbox password |

```env
SMTP_HOST=mail.dreamytales.co.za
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=Admin@dreamytales.co.za
SMTP_PASS=your-mailbox-password
SMTP_FROM="Dreamy Tales <Admin@dreamytales.co.za>"
ADMIN_EMAIL=Admin@dreamytales.co.za
```

---

## Step 3 — Upload the app

**Option A — Git (recommended)**  
Plesk → domain → **Git** → add repo URL → deploy to `httpdocs` (or a subfolder).

**Option B — FTP / File Manager**  
Upload all project files except `node_modules`, `.next`, `dev.db`, `.env.local`.

Ensure these folders are **writable** by the Node process (for PDFs):

- `storage/stories`
- `storage/images`

Create them if missing: `mkdir -p storage/stories storage/images`

---

## Step 4 — Node.js in Plesk

1. Plesk → domain → **Node.js** → **Enable Node.js**  
2. **Node.js version:** 20.x or 22.x (Next.js 16 needs Node 20.9+)  
3. **Application mode:** Production  
4. **Application root:** `/httpdocs` (or your deploy folder)  
5. **Document root:** `/httpdocs/.next/static` (set **after** first build)  
6. **Application startup file:** `start.js`  
7. Click **NPM install**  
8. **Run script:** `build` (creates `.next`)  
9. Set document root to `.next/static` if not done yet  
10. **Restart** Node.js  

### Environment variables in Plesk

In the Node.js panel, add custom environment variables (same as `.env.example`):

```env
NEXT_PUBLIC_APP_URL=https://dreamytales.co.za
DEEPSEEK_API_KEY=...
OPENAI_API_KEY=...
PAYFAST_MERCHANT_ID=...
PAYFAST_MERCHANT_KEY=...
PAYFAST_PASSPHRASE=...
PAYFAST_SANDBOX=true
AUTH_SECRET=...
CRON_SECRET=...
DATABASE_URL=mysql://...
SMTP_HOST=mail.dreamytales.co.za
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=Admin@dreamytales.co.za
SMTP_PASS=...
SMTP_FROM=Dreamy Tales <Admin@dreamytales.co.za>
ADMIN_EMAIL=Admin@dreamytales.co.za
```

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run twice — once for `AUTH_SECRET`, once for `CRON_SECRET`.

### Create database tables

After env vars are set, in **Run Node.js commands**:

```bash
npx prisma db push
```

---

## Step 5 — DNS

Point `dreamytales.co.za` to this hosting subscription (Plesk shows the correct A record / nameservers). Remove or replace the 1-grid parking page DNS if needed.

Enable **SSL** (Let’s Encrypt) in Plesk before testing PayFast webhooks.

---

## Step 6 — Plesk scheduled tasks (cron)

Nightly stories run **one child per cron hit** to avoid timeouts on shared hosting.

### Nightly stories (6pm SAST = 16:00 UTC)

Plesk → **Scheduled Tasks** → Add task:

- **Schedule:** every 5 minutes from 16:00–20:00 UTC  
  Cron: `*/5 16-20 * * *`
- **Command:**

```bash
curl -fsS "https://dreamytales.co.za/api/cron/nightly-stories?secret=YOUR_CRON_SECRET"
```

Each run generates and emails **one** child’s story. With 3 children, schedule ~3 successful runs in the evening window.

### Process cancellations (hourly)

```bash
curl -fsS "https://dreamytales.co.za/api/cron/process-cancellations?secret=YOUR_CRON_SECRET"
```

Cron: `0 * * * *`

### Delete old PDFs (daily, 90-day retention)

Story PDFs on the server are removed after **90 days** (parents keep copies in email). Run once per day:

```bash
curl -fsS "https://dreamytales.co.za/api/cron/cleanup-pdfs?secret=YOUR_CRON_SECRET"
```

Cron: `15 3 * * *` (3:15 AM UTC daily)

Optional env vars: `PDF_RETENTION_DAYS=90`, `STORAGE_QUOTA_GB=25` (for admin dashboard estimates).

---

## Step 7 — Test before launch

### 1. Site loads

Open `https://dreamytales.co.za`

### 2. SMTP test

```bash
curl "https://dreamytales.co.za/api/cron/test-email?secret=YOUR_CRON_SECRET&to=Admin@dreamytales.co.za"
```

You should receive “Dreamy Tales SMTP test” in the mailbox.

### 3. Database

Sign up (PayFast sandbox) and confirm a user appears after payment ITN.

### 4. Manual story run (no active subscribers yet)

With at least one active trial subscription in the DB, trigger one story:

```bash
curl "https://dreamytales.co.za/api/cron/nightly-stories?secret=YOUR_CRON_SECRET"
```

Check response JSON and parent email with PDF attachment.

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| 502 / app not running | Node.js enabled, `start.js` set, Restart Node.js |
| Build fails | Node 20+, enough disk/RAM; run `npm run build` in Plesk commands |
| SMTP auth failed | Full email as username, port 465 + `SMTP_SECURE=true` |
| PayFast ITN fails | HTTPS live, `NEXT_PUBLIC_APP_URL` correct |
| Cron does nothing | `CRON_SECRET` matches URL; check Scheduled Tasks log |
| Story timeout | Normal on first child — cron processes **one child per run** |

Contact 1-grid support if Node.js extension is missing or Node version is below 20.

---

## Local development with MySQL

Use a local MySQL instance or Docker, or point `DATABASE_URL` at a dev database. Copy `.env.example` to `.env.local` and fill in values.

```bash
npm install
npm run db:push
npm run dev
```

For a quick local story test (logged-in dev user):

```bash
POST /api/dev/trigger-stories
```

(Development only — blocked in production.)
