# Sopaan Admin Console

React + Vite admin SPA for managing content, students, live classes, and platform settings.

## Local development

1. Start the API server (port 4000):

```bash
npm run dev -w @sopaan/server
```

2. Start the admin dev server (port 5173, hot reload):

```bash
npm run dev:admin
# or: npm run dev -w @sopaan/admin
```

3. Open [http://localhost:5173](http://localhost:5173) and sign in with a team account (`admin`, `creator`, or `moderator`).

The dev server proxies `/api`, `/socket.io`, `/uploads`, and `/admin/login-hint.json` to the API.

## Production / API-embedded admin

Build the admin into `server/public/admin` and serve it from the API at `/admin/`:

```bash
npm run build:admin
```

Then open [http://localhost:4000/admin/](http://localhost:4000/admin/) (with the API running).

## Environment

Copy `.env.example` to `.env` only if you need to point the admin at a remote API (`VITE_API_BASE`).

Admin credentials are provisioned via `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `server/.env`. Run `npm run ensure-admin -w @sopaan/server` after changing them.
