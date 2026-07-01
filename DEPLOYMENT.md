# Deploy: Vercel + Render

## 1. Render

Create a Blueprint from this repository using `render.yaml`. Before the first deploy, provide the environment values marked `sync: false`.

- `FRONTEND_URL`: temporarily use the planned Vercel production URL, for example `https://your-project.vercel.app`.
- `RESEND_API_KEY`: the Resend API key.
- `RESET_EMAIL_FROM`: an address on a verified Resend domain.
- `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD`: initial administrator credentials.

Render supplies `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`, and `PORT`. The pre-deploy command applies committed Prisma migrations without resetting the database.

After deployment, verify `https://YOUR-BACKEND.onrender.com/api/health`.

## 2. Vercel

Import the same Git repository and select `frontend` as the Root Directory. Add this Production environment variable before deploying:

```env
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND.onrender.com/api
```

`NEXT_PUBLIC_API_URL` is embedded during `next build`, so redeploy after changing it.

## 3. Connect both origins

Copy the final Vercel production URL into Render's `FRONTEND_URL`, without a trailing slash, then redeploy the backend.

## 4. Initial data

Do not run a reset. If the new production database needs the initial administrator, run `npm run seed` once from the Render Shell after migrations complete.

## 5. Final checks

- Open the Vercel URL and log in.
- Verify authenticated API calls and token refresh.
- Submit Forgot Password and confirm the reset URL uses the Vercel domain.
- Confirm Resend accepts the recipient; test-mode accounts only send to their owner until a domain is verified.
