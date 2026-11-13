# Social preview v4

The card uses the existing [social network globe v1](social-network-globe-v1.md) artwork and the project's native HTML/CSS renderer. No new generated artwork was needed.

- Output: `public/social-preview-v4.jpg`, 1200 × 630 pixels.
- Copy: “Paykit”, “Pay people, not addresses”, and the retained secondary line “The open payment coordination protocol”.
- Render: `scripts/render-social-preview.mjs`, using Playwright Chromium. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` optionally selects an already installed Chromium executable, matching the browser-test configuration.
- Compression: sharp 0.35.5, mozjpeg quality 85, progressive JPEG, full 4:4:4 chroma, trellis quantisation, overshoot deringing, and optimized scans. Metadata is stripped by sharp's default output behavior.
- Final size: **85,883 bytes**, compared with v3's 348,419-byte PNG: **75.35% smaller**. The image retains its 1200 × 630 dimensions.
- Visual review: both taglines remain legible, neither overlaps the globe, and the new headline has room at social-card display sizes. All original PNG assets are preserved.

Regenerate after installing project dependencies:

```sh
node scripts/render-social-preview.mjs
```

For an existing Chromium installation:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chrome node scripts/render-social-preview.mjs
```

The versioned JPEG URL prevents the previous card image from being reused solely because its image URL stayed the same. Compression improves payload size; it does not repair the production server's separate large-response truncation defect.
