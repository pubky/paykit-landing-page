# Paykit landing page: research and implementation plan

Research date: 20 October 2026. Code takes precedence over prose and discussion. The landing page presents Paykit as released; the Rust implementation released version 0.1.0 on 16 October 2026.

## Source hierarchy and snapshots

1. Executable protocol, SDK, and server code.
2. Tests and release metadata that establish implemented behavior.
3. Current Pubky documentation and public product/event sources.
4. Recent team discussion for intent and integration context, checked against code before becoming a product claim.

Pinned source snapshots:

- [`pubky/paykit-rs` at `a1f9b6b708ce123b50be02c64e8f61b765e4f298`](https://github.com/pubky/paykit-rs/commit/a1f9b6b708ce123b50be02c64e8f61b765e4f298), checked on 20 October; latest commit dated 19 October. [Release history](https://github.com/pubky/paykit-rs/blob/a1f9b6b708ce123b50be02c64e8f61b765e4f298/CHANGELOG.md) and [0.1.0 release](https://github.com/pubky/paykit-rs/releases/tag/v0.1.0).
- [`pubky/paykit-server` at `aa98a56d87ee0dff0d749029a10c10fd300f39db`](https://github.com/pubky/paykit-server/commit/aa98a56d87ee0dff0d749029a10c10fd300f39db).
- [`pubky/pubky-core` at `131370c0a19c343c5c3aa4b7414f77b01b5066ac`](https://github.com/pubky/pubky-core/commit/131370c0a19c343c5c3aa4b7414f77b01b5066ac), supplementary verification of routing and storage behavior.
- [Pubky documentation supplied for research](https://pubky.org/llms-full.txt).

Repository resource links should use the current default branch, `master`, or pinned commits rather than assuming a `main` branch. A changing default-branch document is useful for visitors; pinned links in this file preserve what was checked.

## What the code establishes

### Protocol and value proposition

Paykit associates payment receiving details with a Pubky public-key identity. A recipient can publish receiving details or share a private payment list with a particular counterparty. A sender's wallet discovers those details and checks which ones it can use. This removes the need to coordinate methods, handles, addresses, and invoices manually between compatible implementations.

Paykit is an open protocol and integration layer. It is not a wallet, a custodial service, or a new settlement network. The Rust crates use the MIT license. Wallets and services can adopt the protocol and implement their own supported payment methods.

Evidence:

- [Endpoint identifiers, payloads, and publication API](https://github.com/pubky/paykit-rs/blob/a1f9b6b708ce123b50be02c64e8f61b765e4f298/paykit-lib/src/payment_endpoint.rs).
- [App registry and canonical storage layout](https://github.com/pubky/paykit-rs/blob/a1f9b6b708ce123b50be02c64e8f61b765e4f298/paykit-lib/src/pubky_routing.rs#L35).
- [Public and private contact payment resolution](https://github.com/pubky/paykit-rs/blob/a1f9b6b708ce123b50be02c64e8f61b765e4f298/paykit-sdk/src/runtime/payment_resolution.rs).
- [Payment adapter boundaries](https://github.com/pubky/paykit-rs/blob/a1f9b6b708ce123b50be02c64e8f61b765e4f298/paykit-sdk/src/domain/adapters/mod.rs#L45).
- [Library manifest and MIT license declaration](https://github.com/pubky/paykit-rs/blob/a1f9b6b708ce123b50be02c64e8f61b765e4f298/paykit-lib/Cargo.toml).

The wallet chooses the final payment route and executes payment. Paykit supplies discovery, structured exchanges, and lifecycle state. Do not claim that Paykit picks the cheapest or best method, signs payments, holds funds, guarantees settlement, or eliminates rail-specific fees.

### Basic flow to explain on the page

1. Choose the contact you want to pay using a compatible wallet.
2. The wallet uses their Pubky identity to discover supported receiving details, or exchange details through an encrypted contact link.
3. Review the payment and pay. The wallet handles method-specific execution.

The illustration can simplify this to **Contact → Payment details → Review and pay**. It must not imply that the protocol can spend without wallet consent.

### Pubky, Mainline DHT, and homeservers

Pubky is the concrete network/storage foundation. Pkarr resolves a signed identity routing record to the identity's homeserver. Mainline DHT provides decentralized discovery; receiving payloads are stored on homeservers, not directly in the DHT.

Paykit public endpoints, app registry entries, encrypted messages, encrypted receipts, and optional encrypted SDK shared state use homeserver storage. Identity public keys address data independently of a conventional platform account. Homeservers can be operated independently, including by users.

Useful page wording: **“Built on Pubky. Your identity is discovered through Mainline DHT; your payment data lives on homeservers, including servers you can run yourself.”** Link to the Pubky explanation without putting storage internals into the introduction.

Evidence:

- [Paykit storage and message paths](https://github.com/pubky/paykit-rs/blob/a1f9b6b708ce123b50be02c64e8f61b765e4f298/paykit-lib/src/pubky_routing.rs).
- [Pubky Pkarr homeserver resolution](https://github.com/pubky/pubky-core/blob/131370c0a19c343c5c3aa4b7414f77b01b5066ac/pubky-sdk/src/actors/pkdns.rs#L143).
- [Pubky public storage requests](https://github.com/pubky/pubky-core/blob/131370c0a19c343c5c3aa4b7414f77b01b5066ac/pubky-sdk/src/actors/storage/core.rs#L181).
- [Pubky client uses public Mainline DHT and Pkarr relays](https://github.com/pubky/pubky-core/blob/131370c0a19c343c5c3aa4b7414f77b01b5066ac/pubky-sdk/src/client/core.rs).

Avoid saying that all data lives on the DHT, that the DHT is a blockchain, or that self-sovereignty means no infrastructure is required. Shared-state recovery has specific Homeserver 0.16.2+ and GCS behavior requirements; integration documentation is the right place for those operational details.

### Public and private data

Public payment details are visible to anyone who knows the recipient's public key. Private payment lists and requests travel over encrypted, per-counterparty links using `pubky-noise`. Receipts are encrypted locally before homeserver storage, and their access information is sent over the encrypted link.

- [Encrypted link handshake](https://github.com/pubky/paykit-rs/blob/a1f9b6b708ce123b50be02c64e8f61b765e4f298/paykit-lib/src/encrypted_link/handshake.rs).
- [Receipt encryption](https://github.com/pubky/paykit-rs/blob/a1f9b6b708ce123b50be02c64e8f61b765e4f298/paykit-lib/src/receipt/crypto.rs).
- [Encrypted shared-state behavior and limitations](https://github.com/pubky/paykit-rs/blob/a1f9b6b708ce123b50be02c64e8f61b765e4f298/paykit-sdk/src/storage/pubky_shared.rs#L104).

Encryption does not hide resource existence, size, or update timing. Do not promise anonymous payments or universally private payment data. “Public or privately shared payment details” is accurate.

### Requests, proofs, receipts, and allowances

The code implements private payment requests with acceptance, rejection, cancellation, conversion-quote, and proof messages, as well as encrypted receipts. Allowances add a scoped consent lifecycle and accounting. Automatic handling remains a wallet decision; the protocol does not autonomously debit funds.

- [Payment request message API](https://github.com/pubky/paykit-rs/blob/a1f9b6b708ce123b50be02c64e8f61b765e4f298/paykit-lib/src/payment_request/api.rs).
- [Allowance implementation](https://github.com/pubky/paykit-rs/tree/a1f9b6b708ce123b50be02c64e8f61b765e4f298/paykit-lib/src/allowance).
- [SDK allowance accounting](https://github.com/pubky/paykit-rs/tree/a1f9b6b708ce123b50be02c64e8f61b765e4f298/paykit-sdk/src/domain/allowance_accounting).

Recurring requests carry interval units from minutes through years, an anchor/start, and an optional end. Proofs for recurring requests reference a billing period. The SDK does not provide a background scheduler: the wallet supplies recurrence eligibility and executes each payment. See [recurrence types](https://github.com/pubky/paykit-rs/blob/a1f9b6b708ce123b50be02c64e8f61b765e4f298/paykit-lib/src/payment_request/types.rs#L53).

Allowance terms support per-payment amount bounds, period amount/count caps, a lifetime amount cap, active dates, expiry, and endpoint restrictions. They require an amount ceiling or an expiry. Either party can end accepted authority through the shared event lifecycle. Automatic handling remains subject to wallet policy and fresh execution checks. See [terms](https://github.com/pubky/paykit-rs/blob/a1f9b6b708ce123b50be02c64e8f61b765e4f298/paykit-lib/src/allowance/types.rs#L341), [lifecycle](https://github.com/pubky/paykit-rs/blob/a1f9b6b708ce123b50be02c64e8f61b765e4f298/paykit-sdk/src/runtime/allowances.rs#L85), and [execution reservation](https://github.com/pubky/paykit-rs/blob/a1f9b6b708ce123b50be02c64e8f61b765e4f298/paykit-sdk/src/runtime/allowance_accounting.rs#L165).

These capabilities belong in deeper resources, not the hero, where they would obscure the simpler contact-payment proposition.

### Payment methods and server implementation

The protocol carries opaque UTF-8 payloads under validated endpoint identifiers. Bitcoin, Lightning, bank accounts, and payment handles can be represented. Mentioned identifiers are interoperability examples, not proof that every current wallet implements them. Sender and recipient implementations must understand compatible identifiers and payloads.

[Endpoint implementation](https://github.com/pubky/paykit-rs/blob/a1f9b6b708ce123b50be02c64e8f61b765e4f298/paykit-lib/src/payment_endpoint.rs#L118) and [recommended identifier convention](https://github.com/pubky/paykit-rs/blob/a1f9b6b708ce123b50be02c64e8f61b765e4f298/specs/payment-endpoint-identifier.md).

Paykit Server implements receiver-side Bitcoin on-chain observation and optional USDT0 on Arbitrum One. It derives invoice-specific BIP84 P2WPKH receiving addresses from an approved account xpub, observes Bitcoin via Electrum, and can verify authenticated ERC-20 proofs when USDT is configured. It does not possess spending keys. Do not infer Lightning support in this server from protocol examples.

- [Bitcoin invoice address derivation](https://github.com/pubky/paykit-server/blob/aa98a56d87ee0dff0d749029a10c10fd300f39db/paykit-server/src/application/create_invoice.rs#L317).
- [Receiving details and USDT constants](https://github.com/pubky/paykit-server/blob/aa98a56d87ee0dff0d749029a10c10fd300f39db/paykit-server/src/domain/receiving.rs).
- [Bitcoin observation boundary](https://github.com/pubky/paykit-server/blob/aa98a56d87ee0dff0d749029a10c10fd300f39db/paykit-server/src/bitcoin.rs).
- [Market payment request preparation](https://github.com/pubky/paykit-server/blob/aa98a56d87ee0dff0d749029a10c10fd300f39db/paykit-server/src/application/marketplace_preparation.rs).

The server prepares/activates Market requests, observes payments, and exposes lifecycle/status endpoints. Source capability does not establish the exact configuration of a live deployment. Keep live-demo copy rail-neutral unless the deployed capability has also been verified.

## Bitkit Paykit payment methods verification — 20 October 2026

Checked native Android master `fe2c28c6667923cb890bd2d9935e8aa3bb42d6e5` and iOS master `a4c8b1b52d39b2904c7278e5abf3f86d5c8b29d2`. Both implementations support on-chain Bitcoin, Lightning BOLT11 and USDT through Paykit, in public and private/contact payment options. The earlier FAQ omitted USDT. This is a source-capability audit, not an independent verification of a particular app-store build.

- [Android public receive methods](https://github.com/synonymdev/bitkit-android/blob/fe2c28c6667923cb890bd2d9935e8aa3bb42d6e5/app/src/main/java/to/bitkit/repositories/PublicPaykitRepo.kt#L400-L443) construct all three methods. [Lightning publication](https://github.com/synonymdev/bitkit-android/blob/fe2c28c6667923cb890bd2d9935e8aa3bb42d6e5/app/src/main/java/to/bitkit/repositories/PublicPaykitRepo.kt#L461-L509) requires the wallet to be able to receive and the invoice to contain route hints. USDT publication is conditional on service configuration, wallet state/preferences and the payment-option switch.
- [Android private/contact options](https://github.com/synonymdev/bitkit-android/blob/fe2c28c6667923cb890bd2d9935e8aa3bb42d6e5/app/src/main/java/to/bitkit/repositories/PrivatePaykitRepo.kt#L1700-L1744) also include all three, omitting Lightning if routing hints are unavailable.
- [USDT constants](https://github.com/synonymdev/bitkit-android/blob/fe2c28c6667923cb890bd2d9935e8aa3bb42d6e5/app/src/main/java/to/bitkit/models/PaykitUsdt.kt#L14-L50) specify USDT0 on Arbitrum One (chain 42161), not unrestricted USDT support across networks. [USDT sending](https://github.com/synonymdev/bitkit-android/blob/fe2c28c6667923cb890bd2d9935e8aa3bb42d6e5/app/src/main/java/to/bitkit/repositories/PaykitUsdtPaymentRepo.kt#L251-L266) executes a payment; support is not merely endpoint parsing. [Lightning payment execution](https://github.com/synonymdev/bitkit-android/blob/fe2c28c6667923cb890bd2d9935e8aa3bb42d6e5/app/src/main/java/to/bitkit/viewmodels/AppViewModel.kt#L5918-L5959) follows Paykit authorization.
- iOS matches: [public methods](https://github.com/synonymdev/bitkit-ios/blob/a4c8b1b52d39b2904c7278e5abf3f86d5c8b29d2/Bitkit/Services/PublicPaykitService.swift#L573-L633), [private methods](https://github.com/synonymdev/bitkit-ios/blob/a4c8b1b52d39b2904c7278e5abf3f86d5c8b29d2/Bitkit/Services/PrivatePaykitService%2BEndpoints.swift#L52-L112), and [USDT network/token](https://github.com/synonymdev/bitkit-ios/blob/a4c8b1b52d39b2904c7278e5abf3f86d5c8b29d2/Bitkit/Models/PaykitUsdt.swift#L4-L25).

The FAQ now names all three rails, identifies the USDT network and notes that available options depend on wallet setup and the recipient. The animation's existing Bitkit BTC/Lightning/USDT examples are consistent with these capabilities.

## Openness section verification — 20 October 2026

The openness section follows the animated walkthrough directly. It replaces the redundant static three-step summary. The hero's secondary action links to that walkthrough, while the Pubky credit lives in the footer. The deeper data-control and privacy explanation remains after the practical demos. Pubky Market is the current product name supplied by the project owner; its staging URL is unchanged.

These claims were rechecked against current Paykit commit `84239143fa17a5a0b2ba0b13694ff6a6e68763df` and Pubky commit `4c713faafd57e3d74fa96a5102c3116e22d6925f`:

- **Open source:** [MIT license declaration](https://github.com/pubky/paykit-rs/blob/84239143fa17a5a0b2ba0b13694ff6a6e68763df/paykit-lib/Cargo.toml#L6).
- **Interoperable:** [Endpoint identifiers and UTF-8 payment payloads](https://github.com/pubky/paykit-rs/blob/84239143fa17a5a0b2ba0b13694ff6a6e68763df/paykit-lib/src/payment_endpoint.rs#L7). Wallets still need compatible implementations and a mutually supported method.
- **Decentralized and self-sovereign:** [PKARR homeserver resolution](https://github.com/pubky/pubky-core/blob/4c713faafd57e3d74fa96a5102c3116e22d6925f/pubky-sdk/src/actors/pkdns.rs#L143), [key-signed publication](https://github.com/pubky/pubky-core/blob/4c713faafd57e3d74fa96a5102c3116e22d6925f/pubky-sdk/src/actors/pkdns.rs#L442), and [independently runnable homeserver](https://github.com/pubky/pubky-core/blob/4c713faafd57e3d74fa96a5102c3116e22d6925f/pubky-homeserver/README.md). Mainline DHT carries discovery records; actual payment files live on homeservers. Reducing reliance on one gatekeeper supports censorship resistance as an architectural inference, not an immunity guarantee.
- **Privacy:** [Public endpoint access](https://github.com/pubky/paykit-rs/blob/84239143fa17a5a0b2ba0b13694ff6a6e68763df/paykit-lib/src/payment_endpoint.rs#L254) is deliberately readable. [Private messages](https://github.com/pubky/paykit-rs/blob/84239143fa17a5a0b2ba0b13694ff6a6e68763df/paykit-lib/src/encrypted_link/private_application_message.rs#L390) use encrypted links; [receipt cryptography](https://github.com/pubky/paykit-rs/blob/84239143fa17a5a0b2ba0b13694ff6a6e68763df/paykit-lib/src/receipt/crypto.rs#L23) uses XChaCha20-Poly1305. The [receipt preparation and validated upload path](https://github.com/pubky/paykit-rs/blob/84239143fa17a5a0b2ba0b13694ff6a6e68763df/paykit-lib/src/receipt/access.rs#L96) encrypts before storage and rejects inconsistent prepared ciphertext. Avoid claiming all payment data is private, hiding metadata, or anonymous settlement.

## Public links and practical destinations

- [Bitkit](https://bitkit.to/): present as a supporting wallet, use the official logo, and invite visitors to try contact payments. Do not imply all published Bitkit builds have identical protocol or asset support.
- [Payky](https://payky.app/): include as a practical destination without inventing product capabilities.
- [Pubky Market](https://staging.pubky.app/shop): use this exact product name. Individual shops are third-party stores within the Market. The supplied staging destination returned an access restriction during research; its access requirements are separate from this public landing page. Replace the link when the public destination is available.
- [Teaser](https://www.youtube.com/watch?v=cQi8QkG_y4Y): click to load an embedded player using `youtube-nocookie.com`; no video iframe before interaction.
- [Pubky](https://pubky.org/), [Paykit repository](https://github.com/pubky/paykit-rs), [SDK](https://github.com/pubky/paykit-rs/tree/master/paykit-sdk), [Swift/Kotlin bindings](https://github.com/pubky/paykit-rs/tree/master/paykit-ffi), and [Paykit Server](https://github.com/pubky/paykit-server): deeper resources.

Use a restrained “More wallets coming soon” placeholder as requested, without fabricated wallet names, logos, or integration commitments. Offer an integration contact action beside it.

## Lugano workshop

Public agenda evidence: [Plan ₿ Forum agenda](https://planb.lugano.ch/planb-forum/agenda/) and the event's [public Brella timeslots API](https://api.brella.io/api/public/events/PlanBLugano2026/timeslots?date=all).

Verified session ID `1039948`:

- **Paykit: A new Payment Protocol Paradigm**
- 24 October 2026, **16:15–17:00 CEST**
- **UTXO Room**
- **Ben Kaufman and Denys Zaliskyi**

Invite visitors to the workshop and to meet the team in Lugano. Link to the agenda as the authoritative schedule; check it again before publication if the deployment date changes. Once the event has passed, replace the invitation with an appropriate recording or resources link rather than retaining a future-tense invitation.

## Contact and interest capture

Use `info@synonym.to` for questions and integration interest, with a compact composer for wallet/service interest, contact details, and a message. The composer creates a mail draft; the visitor chooses whether to send it. No backend lead database, automatic email sending, analytics, or silent data collection is required for this implementation.

Be explicit that the visitor is opening their email app. A sent message supplies actionable integration interest; opening the composer alone does not record a lead. Link [Synonym's terms](https://synonym.to/terms-of-service), the verified public destination, without inventing an independent Paykit privacy policy.

## Visual and information plan

Direction: a cohesive graphite technology site, cool-white Geist typography, restrained orange accents, consistent borders and surface spacing. Body text stays at least 16px; labels and secondary links at least 14px on desktop and mobile. The brand is plain **Paykit** with an uppercase P, no symbol, and no period. Keep the messaging calm and avoid decorative motion, dashboard clutter, or repeated competing badges.

1. **Header:** plain Paykit name followed by “- the open payment coordination protocol” in smaller type, three short section links, a primary try action, and accessible mobile navigation. No protocol pill in the hero.
2. **Hero:** “Pay. Get paid. Skip the back-and-forth.” Explain the open protocol in a short supporting paragraph, with one primary try action and a secondary teaser action.
3. **Introductory teaser:** directly in the opening section, before the technical explanation. Use the actual video thumbnail and a clear play action. Load the YouTube player only on request.
4. **How it works:** one purpose-made payment illustration, with readable HTML labels and three short steps: choose a contact, exchange details, review/pay.
5. **Features:** four compact features: recurring payments, allowances, private receiving details, and requests/receipts. Wallets own scheduling, approval, and execution.
6. **Try Paykit:** original unfiltered Bitkit SVG, Payky, a future-wallet integration invitation, and Pubky Market with honest staging context.
7. **Pubky foundation:** compact explanation of identity, DHT routing, and chosen/self-hosted data storage, with a matching original illustration and links to the underlying infrastructure. Images are conceptual rather than topology specifications.
8. **Resources:** a consistent two-column grid of source, specifications, receiving server, and Pubky overview links.
9. **Lugano:** title “Meet us in Lugano”, subtitle “Let’s talk Paykit”, and “Find us at the Synonym booth” as requested by the user. Group verified workshop details with direct Google Calendar and `.ics` download actions. Keep accurate UTC times and the thirty-minute download reminder.
10. **FAQ/contact/footer:** short expandable answers, a straightforward integration-interest email composer, and direct email fallback.

Both conceptual illustrations were generated using the built-in image generation tool. The exact prompts, provenance, and project asset paths are documented in [illustration-prompts.md](illustration-prompts.md). The teaser poster is the supplied video’s [official YouTube thumbnail](https://i.ytimg.com/vi/cQi8QkG_y4Y/maxresdefault.jpg). Bitkit's original SVG preserves its white lettering, black outline, and orange mark; do not apply a monochrome brightness filter.

The payment illustration's current version shows two hypothetical profiles: PayPal / Bitkit with Bitcoin / Wise, and Ethereum / a WDK wallet with Bitcoin / Revolut. Only Bitcoin connects the profiles. The orange frame labels discovery and detail exchange as handled by Paykit; the caption retains wallet approval. Named methods illustrate matching rather than announcing integrations. WDK is a developer toolkit; its [official Bitcoin wallet module](https://docs.wdk.tether.io/sdk/wallet-modules/wallet-btc/) supports Bitcoin accounts, signing, and sending. On screens up to 900px, a responsive HTML equivalent replaces raster text so method names remain readable.

The FAQ is the main useful addition to the original brief: it reinforces that Paykit is an adoptable protocol and clarifies data control without lengthening the introduction.

## Public launch — 21 October 2026

The project owner authorized removing the temporary password gate. The landing page and workshop calendar are public, with no password, session cookie, or secret environment-variable requirement. The old access/logout routes and session helpers/tests have been removed. Search indexing is enabled; CSP and the other security headers remain in place. Sharing metadata and the preview image remain public.

The introductory video is now https://www.youtube.com/watch?v=cQi8QkG_y4Y, with its official local thumbnail and the same click-to-load privacy behavior.

Validation covers anonymous HTML/RSC/calendar access, retired endpoint responses, public sharing metadata, desktop/mobile layout, calendar actions, the new video embed and contact-draft behavior. Production URL: https://paykit.to.

The following delivery record describes the earlier gated preview, rather than the current public launch.

## Delivery verification — 20 October 2026

- Production build and TypeScript checking passed.
- Four session/calendar unit tests passed.
- Three browser tests passed locally and against the production URL: server access gate, desktop/mobile layout, actual calendar download, Google Calendar timestamps, click-to-load video, structured email draft, and logout.
- Unauthenticated HTML and RSC checks exposed no protected copy. Production sends no-store and noindex headers; session cookies are HTTP-only, Secure, and SameSite=Lax.
- Security reviews found no actionable or unresolved issues. Public client bundles were checked for protected copy and authentication identifiers. Production dependency audit reported zero vulnerabilities.
- All public resource links returned success. The supplied Market staging URL returned HTTP 401; no test purchase was claimed.
- Contact inquiries open a visitor-controlled email draft; the website does not deliver email or maintain a lead database.
