# Cloudflare Deployment Guide (PlayCoinKrazy.com + Neon PostgreSQL)

This guide deploys CoinKrazy with:

- **Frontend** on Cloudflare Pages (`https://playcoinkrazy.com`)
- **API server** on a Node host (Render/Railway/Fly/VM) at `https://api.playcoinkrazy.com`
- **DNS + SSL + custom domain** managed in Cloudflare
- **Neon Postgres** for login/auth storage via `DATABASE_URL`

> Why this setup? This codebase uses an Express + Node server (`server/index.ts`) and `pg` for PostgreSQL, so the API should run in a Node runtime. Cloudflare Pages is ideal for the Vite SPA frontend.

---

## 1) Security first (important)

You shared a real Neon connection string. Treat it as **compromised** now and rotate the password in Neon before production use.

- In Neon console, create a new database password.
- Build a new connection string.
- Use the new value as `DATABASE_URL` in your API host's environment variables.
- Never commit credentials to git.

---

## 2) Prepare environment variables

### API server (Node host) required

Set these on your API hosting provider:

- `NODE_ENV=production`
- `PORT=8080` (or your provider's injected port)
- `JWT_SECRET=<long-random-secret>`
- `DATABASE_URL=<your-rotated-neon-url>`
- `ALLOWED_ORIGINS=https://playcoinkrazy.com,https://www.playcoinkrazy.com`

Optional but recommended:

- `FRONTEND_URL=https://playcoinkrazy.com`

### Frontend (Cloudflare Pages) required

Set this in Cloudflare Pages **Environment Variables**:

- `VITE_API_BASE_URL=https://api.playcoinkrazy.com/api`

This project already supports that variable in `client/lib/api.ts`.

---

## 3) Deploy backend API (Node runtime)

Use any Node host (Render, Railway, Fly.io, VPS, etc.).

Build command:

```bash
pnpm install --frozen-lockfile
pnpm build
```

Start command:

```bash
pnpm start
```

Health check after deploy:

```bash
curl -i https://api.playcoinkrazy.com/api/ping
```

You should receive a 200 response.

---

## 4) Deploy frontend to Cloudflare Pages

1. Push this repository to GitHub.
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → connect repo.
3. Configure:
   - Framework preset: **Vite**
   - Build command: `pnpm build:client`
   - Build output directory: `dist/spa`
4. Add env var:
   - `VITE_API_BASE_URL=https://api.playcoinkrazy.com/api`
5. Deploy.

---

## 5) Connect custom domain in Cloudflare

### Root domain (frontend)

In Cloudflare Pages project:

- **Custom domains** → add `playcoinkrazy.com`
- Add `www.playcoinkrazy.com` and redirect to apex or vice versa (your choice)

### API subdomain

In Cloudflare DNS:

- Add `CNAME` record: `api` → your backend host target (e.g. `your-api.onrender.com`)
- Enable orange-cloud proxy unless your host requires DNS-only

Once SSL is active, your API should be available at:

- `https://api.playcoinkrazy.com/api/*`

---

## 6) Verify login end-to-end

1. Open `https://playcoinkrazy.com/login`.
2. Attempt register/login.
3. In browser DevTools:
   - Request goes to `https://api.playcoinkrazy.com/api/auth/login`
   - Response sets `auth_token` cookie
   - `GET /api/auth/profile` returns logged-in user

If login fails, check:

- `ALLOWED_ORIGINS` includes `https://playcoinkrazy.com`
- `VITE_API_BASE_URL` points to `/api` path on API domain
- API host has correct `DATABASE_URL`
- Neon allows network access from API host

---

## 7) Production hardening checklist

- [ ] Rotate leaked DB credentials
- [ ] Set strong `JWT_SECRET`
- [ ] Ensure HTTPS-only endpoints
- [ ] Restrict CORS with exact origins only
- [ ] Enable database backups in Neon
- [ ] Add uptime monitoring for `/api/ping`

