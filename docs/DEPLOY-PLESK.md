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

**Recommended: use the deploy ZIP script (avoids corrupted files)**

On your PC, in the project folder:

```bash
npm run package:plesk
```

This creates **`dreamytales-deploy.zip`** in the project root with the correct folder structure.

Upload steps in Plesk:

1. **File Manager** → `httpdocs` → **delete everything** inside (old broken upload)
2. Upload **`dreamytales-deploy.zip`**
3. **Extract** the zip **into `httpdocs` directly** — you should see `package.json`, `prisma/`, `app/` at the top level, NOT inside a `dreamytales-main` subfolder
4. In **Run Node.js commands**, verify before install:

```bash
node scripts/verify-deploy-files.js
```

You must see `All checks passed`. If `prisma/schema.prisma` mentions `JsonLd`, the upload is still wrong — delete and re-extract.

5. Then run `npm install`

**Option A — GitHub ZIP (manual)**  
Download https://github.com/urbanferrous20-lang/dreamytales/archive/refs/heads/main.zip — extract on PC, upload contents of the inner folder to `httpdocs`.

**Option B — Git in Plesk** (needs GitHub token or deploy key — see README)

**Do NOT** upload files one-by-one from random folders on your PC — this causes `prisma/schema.prisma` to contain wrong file content.

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

**Important:** On many 1-grid/Plesk setups, variables in the Node.js panel are **only** passed to the running app (`start.js`), **not** to **Run script** / **Run Node.js commands**. If `db:push` or `build` says `DATABASE_URL not found`, use a **`.env` file** in `httpdocs` (see below).

Add variables in the Node.js panel **and** create **`httpdocs/.env`** (File Manager → enable “show hidden files” → create file named `.env`):

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
DATABASE_URL=mysql://USER:PASSWORD@localhost:3306/DATABASE_NAME
SMTP_HOST=mail.dreamytales.co.za
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=Admin@dreamytales.co.za
SMTP_PASS=...
SMTP_FROM=Dreamy Tales <Admin@dreamytales.co.za>
ADMIN_EMAIL=Admin@dreamytales.co.za
ADMIN_PASSWORD_HASH_B64=...
PDF_RETENTION_DAYS=90
STORAGE_QUOTA_GB=25
```

Use your real MySQL user, password, and database name from Plesk → **Databases**. **Do not commit `.env`** — it stays on the server only.

Then run **`db:push`** again (Run script). Prisma reads `.env` from the project root automatically.

**Verify `.env` is visible to Node** (Run Node.js commands):

```bash
node -e "const fs=require('fs'); console.log(fs.existsSync('.env')?' .env exists':'MISSING .env file'); console.log(process.env.DATABASE_URL?'DATABASE_URL in env':'no DATABASE_URL in process.env (OK if .env exists for prisma)')"
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
| `schema.prisma` / `JsonLd` Prisma error | Run `node scripts/verify-deploy-files.js` — re-upload ZIP; delete all of `httpdocs` first |
| 502 / app not running | Node.js enabled, `start.js` set, Restart Node.js |
| Build fails | Node 20+, enough disk/RAM; run `npm run build` in Plesk commands |
| SMTP auth failed | Full email as username, port 465 + `SMTP_SECURE=true` |
| PayFast ITN fails | HTTPS live, `NEXT_PUBLIC_APP_URL` correct |
| Cron does nothing | `CRON_SECRET` matches URL; check Scheduled Tasks log |
| Story timeout | Normal on first child — cron processes **one child per run** |
| `nodenv: node: command not found` (npm error 127) | Enable Node.js in Plesk, pick version **22**, use **NPM install** button — not SSH. Delete `node_modules` first if partial install. See below. |

Contact 1-grid support if Node.js extension is missing or Node version is below 20.

### `nodenv: node: command not found` (npm error 127)

This means npm ran in a shell where **Node.js is not activated**. Common on 1-grid Plesk when you run `npm install` from SSH or a generic terminal instead of the **Node.js** panel.

**Fix (in order):**

1. Plesk → **dreamytales.co.za** → **Node.js**
2. **Enable Node.js** (if not already)
3. Set **Node.js version** to **22.x** (or 20.x)
4. Set **Application root** to `/httpdocs`
5. Click **Apply** / save
6. In **File Manager**, delete the **`node_modules`** folder inside `httpdocs` (leftover from the failed install)
7. Back in **Node.js**, click the **NPM install** button (do **not** use SSH or a separate terminal)
8. When that finishes, use **Run script** → `build`

**Do not** run `npm install` from:
- Plesk **SSH Terminal** (unless you know how to activate nodenv)
- A generic shell without Node in PATH

**Optional:** the repo includes a `.node-version` file (set to `22`) so nodenv picks the right version when Plesk runs commands from the app root.

To confirm Node works, in **Node.js → Run Node.js commands** (not SSH):

```bash
node -v
```

You should see `v22.x.x`. If that fails, Node.js is not enabled correctly — contact 1-grid support.

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
