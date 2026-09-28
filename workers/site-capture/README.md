# Automatic website screenshots

This internal Worker renders an anonymous public homepage at 1280 × 800 using Cloudflare Browser Run. It is called by the Pages `/api/website-screenshot` endpoint. No cookies, credentials, path or query parameters from the visitor are forwarded.

## Enable

1. Deploy this Worker with `npx wrangler deploy --config workers/site-capture/wrangler.jsonc`. Keep `workers_dev` and `preview_urls` disabled and do not add a public route.
2. In the `orka` Pages project, add a **Service binding** named `SITE_CAPTURE` pointing to `orka-site-capture`, for Production and Preview, then redeploy. If using Wrangler as the binding source, add `services: [{ binding: "SITE_CAPTURE", service: "orka-site-capture" }]` to the Pages configuration after the Worker exists.
3. Test the preview with a public site that sets `X-Frame-Options: SAMEORIGIN`. It should automatically switch from the blocked iframe to the screenshot. Also test the “Take a screenshot” control, closing during capture and switching to the sample while capture is pending.

The client only enables automatic capture when the deployed Pages service binding exists. Without it, the existing local image-upload fallback remains available. Do not claim automatic screenshots are active before testing the deployed Browser Run binding.

## Limits

- Only public HTTPS homepages; public DNS validation, no caller headers forwarded, reject literal-IP/local network browser URLs.
- 15-second browser navigation timeout; 25-second Pages deadline; 30-second client deadline.
- JPEG images only, maximum 3 MiB; cached at the edge for at most 24 hours.
- Best-effort per-isolate limits: 3 uncached attempts per IP per 10 minutes, 20 per minute overall. These are not a distributed billing cap. Cloudflare account limits still apply; check the account plan before activation and do not upgrade it implicitly.
- Some sites block automated browsers, so automatic screenshots cannot be guaranteed. Uploaded screenshots and the sample remain available.
