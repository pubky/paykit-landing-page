# Paykit landing page

A public Paykit landing page built with Next.js 16 App Router, React, and TypeScript. Research and source checks are in [docs/research.md](docs/research.md).

Production URL: [paykit.to](https://paykit.to).

The design uses graphite surfaces, Geist typography, serif title accents, and orange highlights. The introduction includes a click-to-load video. The five-state payment animation explains payment options, registration, choosing a contact, discovering a shared rail, and direct wallet payment. Its copy and profiles stay in server components; the client controller handles playback. Visitors can select steps or pause. Autoplay runs while the scene is visible and respects reduced-motion preferences.

## Run locally

Use Node.js 22 or newer. No environment variables or preview password are required.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. For a production run:

```sh
npm run build
npm start
```

## Checks

```sh
npm test
npm run typecheck
npm run build
npm run test:browser
```

Install Chromium with `npx playwright install chromium` if needed. Browser checks start the production server automatically after a build. Set `PLAYWRIGHT_BASE_URL` to test an existing deployment. Tests cover anonymous access, sharing metadata, calendar downloads, desktop/mobile layout, the payment animation, click-to-load video, and the email-draft composer.

## Deploy with Docker

Build and run the production image from the repository root:

```sh
docker build -t paykit-landing .
docker run -d --name paykit-landing --restart unless-stopped \
  -p 127.0.0.1:3000:3000 paykit-landing
```

Open `http://localhost:3000` to check the running app. Put an HTTPS reverse proxy in front of port 3000 for public deployment. The example binds the host port to loopback for a proxy running on the host; for a proxy in Docker, attach both containers to a shared network and forward to `paykit-landing:3000` instead.

The multi-stage image uses Node.js 22 and Next.js standalone output. It runs as the non-root `node` user and serves the app, static assets, and `/api/calendar` on `0.0.0.0:3000` inside the container. No application environment variables, secrets, database, or persistent volumes are required. The image cache is disposable and writable by the runtime user. Container logs go to stdout/stderr (`docker logs paykit-landing`).

For an alternate public deployment, add `-e PAYKIT_SITE_URL=https://your-test-host.example` to `docker run`. This optional runtime setting changes the canonical URL, Open Graph URL, and social-image URLs to that origin; it defaults to `https://paykit.to`. Use an absolute HTTP or HTTPS URL (any path is discarded). Set it when starting the container, so the same Docker image can serve a new test hostname without rebuilding.

When testing through a public tunnel, use its assigned HTTPS origin for `PAYKIT_SITE_URL` and keep the tunnel running while the social platform fetches the page and image. Without this setting, the test page still advertises the image hosted on `paykit.to`.

To verify a deployment's advertised image as well as its metadata, run the browser check with both `PLAYWRIGHT_BASE_URL` and `PLAYWRIGHT_EXPECTED_SITE_URL` set to its public origin.

Building requires network access to npm and Google Fonts; the generated fonts are served locally at runtime. Local environment files, credentials, dependencies, and build output are excluded by `.dockerignore`.

Keep requests routed to the Node server and honor its cache headers: the conference section is evaluated on every page request, and `/api/calendar` returns `410 Gone` after the conference expiry. This deployment requires a running server rather than a static file export.

The temporary password gate and its login/session endpoints have been removed. Public pages allow indexing. CSP, MIME sniffing protection, framing restrictions, and the other security headers remain configured in `next.config.ts`.

## Media and visitor actions

The introductory video is [Paykit on YouTube](https://www.youtube.com/watch?v=cQi8QkG_y4Y). Its official thumbnail is stored locally; the `youtube-nocookie.com` player loads only after the visitor chooses to watch.

The contact form creates an email draft to `info@synonym.to` in the visitor's mail app. It does not submit or store leads on this server. Review [Synonym's terms](https://synonym.to/terms-of-service) for linked contact/privacy information.

The Pubky Market link uses the supplied staging address, which may require separate access. Update it when a public destination is available.

The Plan ₿ Forum El Salvador section includes Google Calendar and a public `.ics` download for January 29–30, 2027, in San Salvador. Both save the conference as a two-day, all-day event; Paykit talks and where to find us will be announced. The section and its contact option automatically disappear at midnight on February 14, 2027 in San Salvador (06:00 UTC), two weeks after the conference ends. The page checks the server clock on every request; the calendar endpoint returns `410 Gone` after the same cutoff.

Sharing previews use the Paykit wordmark, “Pay people, not addresses”, the secondary line “The open payment coordination protocol”, and a generated network globe. The versioned `social-preview-v4.jpg` uses a quality-85 progressive JPEG with 4:4:4 color sampling and mozjpeg optimization for faster downloads and crisp text. Regenerate the card with `node scripts/render-social-preview.mjs`. Generated artwork provenance is recorded under [docs/design](docs/design), with earlier prompts in [docs/illustration-prompts.md](docs/illustration-prompts.md). Previous animation assets and [rollback instructions](docs/illustration-rollback.md) are preserved.
