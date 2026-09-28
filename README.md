# FileShare

Private, WeTransfer-style file sharing on Next.js and Cloudflare R2.

Files upload from the browser to a private R2 bucket using short-lived presigned URLs. Share metadata is stored as JSON objects in the same bucket. The Vercel filesystem is never used for persistent storage.

## Local development

1. Copy `.env.example` to `.env.local` and fill in R2 values.
2. Install and run:

```bash
npm install
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000).
4. Apply R2 CORS after credentials are in `.env.local`:

```bash
npm run r2:cors
```

Object Read & Write tokens cannot change CORS. If that command returns Access Denied, set CORS in the Cloudflare dashboard: bucket → Settings → CORS.

## Free-tier cap

The app refuses uploads that would push the bucket over `R2_FREE_TIER_STORAGE_GB` (default 9 GB, below R2's 10 GB included storage). Share links expire in 5 minutes, 15 minutes, 30 minutes, or 1 hour — never longer. Expired files are deleted. Cloudflare's "R2 Paid" label is pay-as-you-go with included free usage; the app cap is what keeps storage from billing overage. A $1 Billing Budget Alert is an email warning only — it does not hard-stop Cloudflare charges.

## Environment variables

| Name | Where it is used |
| --- | --- |
| `R2_ACCOUNT_ID` | Server only |
| `R2_ACCESS_KEY_ID` | Server only |
| `R2_SECRET_ACCESS_KEY` | Server only |
| `R2_BUCKET_NAME` | Server only |
| `R2_ENDPOINT` | Server only |
| `MAX_FILE_SIZE_MB` | Server (default `2048`) |
| `R2_FREE_TIER_STORAGE_GB` | Server hard cap (default `9`, never above 9) |
| `NEXT_PUBLIC_APP_URL` | Public app origin for share links |
| `CORS_ALLOWED_ORIGINS` | Optional extra origins for `npm run r2:cors` |

Never put R2 secrets in `NEXT_PUBLIC_*` variables.

## Vercel

1. Import this Next.js project.
2. Set the environment variables above.
3. Set `NEXT_PUBLIC_APP_URL` to the production URL.
4. Deploy.
5. Run `npm run r2:cors` with the production origin included.

## Cleanup expired files

```bash
npm run cleanup:expired
```

This can be scheduled later as a cron job.

## Changing the R2 bucket

1. Create a new private bucket.
2. Create least-privilege R2 access keys for that bucket.
3. Update `R2_BUCKET_NAME`, keys, and endpoint.
4. Run `npm run r2:cors`.
5. Redeploy so serverless functions pick up the new values.
