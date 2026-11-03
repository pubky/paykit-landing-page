# Discovery-layer illustration trial

The version before this trial is preserved in the pushed annotated tag
`illustration-before-discovery-layer` (commit `d7eb67e`). Its original asset,
`public/illustrations/contact-payment-v5.png`, remains in the repository.

The trial uses `public/illustrations/contact-payment-v7.png`, places Bitkit first,
and separates Paykit's discovery role from a direct wallet-to-wallet BTC payment.
The initial trial is tagged `illustration-discovery-layer-v1`. The subsequent
heading refinement, “I want to pay”, is tagged `illustration-discovery-layer-v2`.

To restore the previous illustration, responsive layout, and explanatory text
while keeping shared history, run from `main`:

```sh
git revert --no-commit illustration-before-discovery-layer..illustration-discovery-layer-v2
git commit -m "Restore previous Paykit illustration"
git push origin HEAD:refs/heads/main
```

Rebuild and redeploy using the [Docker deployment instructions](../README.md#deploy-with-docker),
then verify the result at `https://paykit.to/`. Reverting the trial restores the former
Bitkit position too; it can be moved first separately if preferred. Future edits
to the same files may require resolving a normal revert conflict.

## Four-step animation trial

The static discovery-layer version is preserved in the pushed annotated tag
`illustration-before-animation` (commit `c740723`). Its image,
`public/illustrations/contact-payment-v7.png`, remains available.

The animation shows the starting options, protocol discovery, selection of a
shared rail, and a direct wallet-to-wallet payment. The complete animation trial
is tagged `illustration-animation-v1`.

To return to the static version, use:

```sh
git revert --no-commit illustration-before-animation..illustration-animation-v1
git commit -m "Restore static Paykit payment illustration"
git push origin HEAD:refs/heads/main
```

This restores the static component, its styling, and its explanatory text while
preserving the earlier illustration history. Rebuild and redeploy using the
[Docker deployment instructions](../README.md#deploy-with-docker), then verify the result
at `https://paykit.to/`.

## Glass scene and looping autoplay

The first animation is preserved in the pushed tag
`illustration-before-lively-animation` (commit `9f9b039`). The subsequent glass
scene and looping autoplay version is tagged `illustration-lively-animation-v1`.

To restore the first animation:

```sh
git revert --no-commit illustration-before-lively-animation..illustration-lively-animation-v1
git commit -m "Restore first Paykit animation"
git push origin HEAD:refs/heads/main
```

Rebuild and redeploy using the [Docker deployment instructions](../README.md#deploy-with-docker),
then verify the result at `https://paykit.to/`.

To return all the way to the static image after this update, revert the complete
range `illustration-before-animation..illustration-lively-animation-v1` instead.
Future edits may require resolving a normal revert conflict.

## Compact payment options and five-stage walkthrough

The version immediately before this layout update is commit `91a2b58`. It preserves the refined header, four-stage animation, and the earlier compact Paykit logo summary. The next layout version narrows Alice and Bob’s panels, shows every provider’s payment options inside Paykit, and splits the payment instruction from rail discovery. Its stages are setup (0), Enter Paykit (1), instruct Bitkit (2), discover a shared rail (3), and direct payment (4). The automatic loop takes 50 seconds (8/10/10/10/12). Use normal revert commits to undo the layout update while preserving shared history; later unrelated edits may require resolving conflicts.

The next refinement starts from `fa53369`: the Paykit panel aligns with the side panels on desktop, stacks providers vertically, and disappears during payment. Query and response arrows connect directly to Bitkit. The shared BTC match appears after half of discovery has elapsed; pausing preserves that timing. Manual step selection shows each completed state. In the instruction stage, recipient and amount cues enter sequentially. Reverting the refinement commit restores the earlier layout and timing without rewriting branch history.

Playback was subsequently reduced to 80% speed: the same five stages now take 10/12.5/12.5/12.5/15 seconds (62.5 seconds per loop). Visual animation delays and durations scale with the playback rate; the shared-BTC reveal remains at the halfway point of discovery.
The active step title now sits centered inside the illustration, immediately above the people and Paykit scene, with its subtle progress line underneath. Captions and playback controls remain below the visual.

The central Paykit summary uses two person columns: Alice and Bob sit side by side, with each person's payment providers stacked vertically beneath their name. The column names are stronger headings. Step 1 is titled “Paykit indexes payment options”.

During the 12.5-second instruction step, “Bob” appears at about one third (4.17 seconds), followed by “$10” at about two thirds (8.33 seconds).

Step progress runs along the illustration section's upper border via a CSS pseudo-element; there is no separate progress-bar element below the title.
