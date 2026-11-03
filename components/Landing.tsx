import type { ReactNode } from "react";
import Image from "next/image";
import { InquiryForm, Teaser } from "./Interactions";
import Features from "./Features";
import PaymentIllustration from "./PaymentIllustration";

function Arrow({
  diagonal = false,
  className = "",
}: {
  diagonal?: boolean;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Icon({ kind, size = 24 }: { kind: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    person: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
      </>
    ),
    discover: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5M8 10.5h5m-2.5-2.5v5" />
      </>
    ),
    exchange: (
      <>
        <path d="M3 7h17m-5-5 5 5-5 5M21 17H4m5-5-5 5 5 5" />
      </>
    ),
    check: <path d="m5 12 4.5 4.5L19 7" />,
    code: (
      <>
        <path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <ellipse cx="12" cy="12" rx="4" ry="9" />
        <path d="M3 12h18" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    pin: (
      <>
        <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[kind] ?? paths.code}
    </svg>
  );
}

const links = {
  github: "https://github.com/pubky/paykit-rs",
  specs: "https://github.com/pubky/paykit-rs/tree/master/specs",
  conference: "https://planb.sv/",
};

function Contact({
  contactEmail,
  showConference,
}: {
  contactEmail: string;
  showConference: boolean;
}) {
  return (
    <section
      className="contact section-pad"
      id="contact"
      aria-labelledby="contact-title"
    >
      <div className="contact-copy">
        <p className="eyebrow">
          <span className="status-dot" /> LET’S CONNECT
        </p>
        <h2 id="contact-title">
          Your next payment
          <br />
          <span className="title-accent">idea starts here.</span>
        </h2>
        <p>
          Building a wallet? Adding payments to a service? Or just curious? We’d
          love to hear what you have in mind.
        </p>
        <a className="text-link" href={`mailto:${contactEmail}`}>
          <Icon kind="mail" size={20} /> {contactEmail} <Arrow diagonal />
        </a>
      </div>
      <InquiryForm contactEmail={contactEmail}>
        <div className="form-row">
          <label>
            Your name
            <input
              name="name"
              autoComplete="name"
              placeholder="Alex Rivera"
              required
              maxLength={120}
            />
          </label>
          <label>
            Email address
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="alex@example.com"
              required
              maxLength={254}
            />
          </label>
        </div>
        <label>
          Organization <span className="optional">(optional)</span>
          <input
            name="organization"
            autoComplete="organization"
            placeholder="Your company or project"
            maxLength={160}
          />
        </label>
        <label>
          I’m interested in
          <select name="interest" defaultValue="Wallet integration">
            <option>Wallet integration</option>
            <option>Service integration</option>
            <option>A question about Paykit</option>
            {showConference && <option>Meeting in El Salvador</option>}
          </select>
        </label>
        <label>
          Tell us a little more
          <textarea
            name="message"
            rows={4}
            placeholder="What would you like to build, ask, or explore?"
            required
            maxLength={4000}
          />
        </label>
        <button className="button button-dark" type="submit">
          Open email draft <Arrow />
        </button>
        <p className="form-explainer">
          Opens your email app. Send the draft there to reach us. This website
          doesn’t store your inquiry.
        </p>
      </InquiryForm>
    </section>
  );
}

export default function Landing({
  contactEmail,
  showConference,
}: {
  contactEmail: string;
  showConference: boolean;
}) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a
            href="#"
            className="brand-lockup"
            aria-label="Paykit — the open payment coordination protocol"
          >
            <span className="wordmark">Paykit</span>
            <span className="brand-tagline title-accent">
              the open payment coordination protocol
            </span>
          </a>
          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="#how-it-works">How it works</a>
          </nav>
          <a href="#try-paykit" className="button button-orange header-cta">
            Try Paykit <Arrow />
          </a>
          <details className="mobile-menu">
            <summary aria-label="Open navigation">
              <span />
              <span />
            </summary>
            <nav className="mobile-nav" aria-label="Mobile navigation">
              <a href="#how-it-works">How it works</a>
              <a href="#try-paykit">Try Paykit</a>
            </nav>
          </details>
        </div>
      </header>
      <main id="main">
        <section className="hero section-pad" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">
              Pay. Get paid.
              <br />
              <span className="title-accent">
                Leave the <em>how</em> to Paykit.
              </span>
            </h1>
            <p className="hero-intro">
              Paykit is an open protocol for coordinating payments across
              existing payment rails. Users choose <em>who</em> to pay. Paykit
              figures out <em>how</em> — finding shared payment rails.
            </p>
          </div>
          <div className="hero-video" id="watch">
            <Teaser>
              <img
                className="teaser-image"
                src="/teaser-poster.jpg"
                alt=""
                width="1280"
                height="720"
              />
              <span className="video-shade" />
              <span className="video-play">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="m9 5 11 7-11 7V5Z" fill="currentColor" />
                </svg>
              </span>
              <span className="poster-caption">
                <span>
                  <strong>Meet Paykit</strong>
                  <span>Watch the introduction</span>
                </span>
                <Arrow diagonal />
              </span>
            </Teaser>
          </div>
        </section>

        <section
          className="how section-pad"
          id="how-it-works"
          aria-labelledby="how-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">ANIMATED ILLUSTRATION</p>
              <h2 id="how-title">
                Pay a person.
                <span className="muted title-accent">
                  Let your wallet handle the payment logistics.
                </span>
              </h2>
            </div>
            <p>
              “How can I pay you?” shouldn’t be a conversation. Paykit lets your
              wallet figure out these details for you.
            </p>
          </div>
          <PaymentIllustration />
        </section>

        <section
          className="openness section-pad"
          id="open-protocol"
          aria-labelledby="openness-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">OPEN IN EVERY WAY</p>
              <h2 id="openness-title">
                Open <span className="title-accent">by design.</span>
              </h2>
            </div>
          </div>
          <div className="openness-grid">
            <article>
              <Icon kind="code" size={28} />
              <h3>Open source.</h3>
              <p>
                Read the code, build on it, or create your own implementation.
                Paykit’s Rust libraries are MIT-licensed.
              </p>
              <a
                className="text-link"
                href={links.github}
                target="_blank"
                rel="noreferrer"
              >
                Explore the code <Arrow diagonal />
              </a>
            </article>
            <article>
              <Icon kind="exchange" size={28} />
              <h3>Interoperable.</h3>
              <p>
                Paykit is an open protocol. Any wallet, payment provider,
                point-of-sale system, online store, or service can integrate it
                and coordinate payments with other compatible apps.
              </p>
              <a
                className="text-link"
                href={links.specs}
                target="_blank"
                rel="noreferrer"
              >
                Read the protocol <Arrow diagonal />
              </a>
            </article>
            <article>
              <Icon kind="globe" size={28} />
              <h3>Decentralized.</h3>
              <p>
                Paykit runs on{" "}
                <a href="https://pubky.org/" target="_blank" rel="noreferrer">
                  Pubky
                </a>
                , so you can host your own data and stay fully in control.{" "}
                <a
                  href="https://github.com/pubky/pkarr"
                  target="_blank"
                  rel="noreferrer"
                >
                  PKARR
                </a>{" "}
                keeps you discoverable—no registration or permission required.
              </p>
              <a className="text-link" href="#foundation-title">
                Your data, your choice <Arrow />
              </a>
            </article>
          </div>
          <p className="openness-note">
            Self-sovereign by design. Decentralized discovery and independently
            operated homeservers reduce reliance on a single gatekeeper, helping
            Paykit resist censorship.
          </p>
        </section>

        <Features />

        <section
          className="try section-pad"
          id="try-paykit"
          aria-labelledby="try-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                <span className="status-dot" /> TAKE IT FOR A SPIN
              </p>
              <h2 id="try-title">
                See Paykit <span className="title-accent">in action.</span>
              </h2>
              <p className="try-intro">
                Pick up a compatible wallet, create a payment page, or try a
                purchase. Meet the apps bringing Paykit to life.
              </p>
            </div>
          </div>
          <div className="app-grid">
            <a
              className="app-card bitkit-card"
              href="https://bitkit.to/"
              target="_blank"
              rel="noreferrer"
            >
              <div className="app-card-top">
                <span className="app-category">THE REFERENCE WALLET</span>
                <Arrow diagonal />
              </div>
              <div className="app-logo">
                <img
                  src="/bitkit-logo.svg"
                  alt="Bitkit"
                  width="163"
                  height="48"
                />
              </div>
              <h3>Pay your contacts with Bitkit.</h3>
              <p>
                Try Paykit with Bitkit, the self-custodial Bitcoin, Lightning and
                Tether wallet. Paykit support is available from version 3.0.
              </p>
              <span className="card-link">
                Get Bitkit <Arrow />
              </span>
            </a>
            <a
              className="app-card payky-card"
              href="https://payky.app/"
              target="_blank"
              rel="noreferrer"
            >
              <div className="app-card-top">
                <span className="app-category">RECEIVE PAYMENTS</span>
                <Arrow diagonal />
              </div>
              <div className="payky-wordmark">
                Payky<span>.</span>
              </div>
              <h3>One link. Every way to pay you.</h3>
              <p>
                Bring your payment methods together on a page built on your
                Pubky identity. Set it up, then share your link.
              </p>
              <span className="card-link">
                Create your Payky page <Arrow />
              </span>
            </a>
            <a className="app-card future-card" href="#contact">
              <div className="app-card-top">
                <span className="app-category">MORE INTEGRATIONS AHEAD</span>
                <Arrow diagonal />
              </div>
              <div className="future-logo">
                <span>+</span>
                <span>+</span>
                <span>+</span>
              </div>
              <h3>Your wallet could be here.</h3>
              <p>
                An open protocol has room for everyone. Bring Paykit to your
                wallet or service and help connect the ecosystem.
              </p>
              <span className="card-link">
                Let’s build together <Arrow />
              </span>
            </a>
          </div>
          <a
            className="marketplace-card"
            href="https://staging.pubky.app/shop"
            target="_blank"
            rel="noreferrer"
          >
            <div className="marketplace-icon">
              <svg
                width="55"
                height="55"
                viewBox="0 0 56 56"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="m13 19 4-11h22l4 11M12 26v22h32V26M8 19h40v5a5 5 0 0 1-10 0 5 5 0 0 1-10 0 5 5 0 0 1-10 0 5 5 0 0 1-10 0v-5ZM22 48V34h12v14M28 8v11M18 19l3-11m17 11L35 8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <span className="app-category">PUT IT TO WORK</span>
              <h3>Meet the Pubky Market.</h3>
              <p>
                Explore stores run by independent sellers and try a purchase
                with Bitkit.
              </p>
              <span className="marketplace-access">
                Temporary demo URL · Access may be required
              </span>
            </div>
            <span className="marketplace-action">
              Explore Pubky Market <Arrow diagonal />
            </span>
          </a>
        </section>

        <section className="foundation" aria-labelledby="foundation-title">
          <div className="foundation-inner section-pad">
            <div className="foundation-copy">
              <p className="eyebrow">
                <span className="status-dot" /> DATA YOU CONTROL
              </p>
              <h2 id="foundation-title">
                Your data.
                <br />
                <span className="title-accent">Your choice.</span>
              </h2>
              <p>
                Convenient payments shouldn’t need a central address book.
                Paykit builds on Pubky, a decentralized protocol that puts
                identity and data in your hands.
              </p>
              <p>
                Keep payment data on a homeserver you choose—or run yourself.
                Your public-key identity stays yours, independently of a wallet
                provider.
              </p>
              <p>
                Publish the payment options you want people to find, or share
                private details through encrypted channels. Paykit also encrypts
                receipts before storing them on a homeserver.
              </p>
              <a
                href="https://pubky.org/overview/"
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                Explore Pubky <Arrow diagonal />
              </a>
            </div>
            <div className="foundation-visual">
              <div className="foundation-art">
                <Image
                  src="/illustrations/pubky-homeserver-network-v4.png"
                  alt="A decentralized peer network extending beyond the frame, connected to a homeserver inside a home."
                  width={1536}
                  height={1024}
                  sizes="(max-width: 800px) 100vw, 50vw"
                />
              </div>
              <div className="foundation-route">
                <span>Pubky identity</span>
                <Arrow />
                <a
                  href="https://pubky.org/mainline-dht/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Mainline DHT
                </a>
                <Arrow />
                <a
                  href="https://pubky.org/homeserver/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Your Homeserver
                </a>
              </div>
              <p className="foundation-caption">
                Decentralized discovery. A homeserver you choose—or run yourself.
              </p>
            </div>
          </div>
        </section>

        {showConference && (
          <section className="conference" aria-labelledby="conference-title">
            <div className="conference-inner section-pad">
              <div className="conference-copy">
                <p className="eyebrow">
                  <Icon kind="pin" size={17} /> SAN SALVADOR, EL SALVADOR · 29–30 JAN
                  2027
                </p>
                <h2 id="conference-title">Meet us in El Salvador</h2>
                <p className="conference-subtitle title-accent">Let’s talk Paykit.</p>
                <p>
                  We’re heading to Plan ₿ Forum El Salvador. Come say hello,
                  bring your questions, and talk payments with us in San Salvador.
                </p>
                <a href="#contact" className="button button-dark">
                  Get in touch <Arrow />
                </a>
                <a
                  className="conference-forum-link"
                  href={links.conference}
                  target="_blank"
                  rel="noreferrer"
                >
                  Explore Plan ₿ Forum <Arrow diagonal />
                </a>
              </div>
              <div className="conference-card">
                <div className="conference-card-top">
                  <span>OUR NEXT STOP</span>
                  <span className="conference-badge">CONFERENCE</span>
                </div>
                <h3>Plan ₿ Forum El Salvador</h3>
                <div className="conference-details">
                  <div>
                    <span>WHEN</span>
                    <b>29–30 January 2027</b>
                    <p>Two days of Bitcoin conversations</p>
                  </div>
                  <div>
                    <span>WHERE</span>
                    <b>San Salvador</b>
                    <p>El Salvador</p>
                  </div>
                </div>
                <p className="conference-note">
                  Details about our talks and where to find us will follow.
                  Want to meet? Get in touch and let’s make a plan.
                </p>
                <div className="calendar-actions">
                  <a href="/api/calendar" download className="calendar-download">
                    Save the dates <Arrow />
                  </a>
                  <a
                    href="https://calendar.google.com/calendar/render?action=TEMPLATE&amp;text=Plan%20%E2%82%BF%20Forum%20El%20Salvador&amp;dates=20270129%2F20270131&amp;details=Meet%20the%20Paykit%2FPubky%20team%20%28Synonym%29.%20Details%20about%20our%20talks%20and%20where%20to%20find%20us%20will%20follow.%20https%3A%2F%2Fplanb.sv%2F&amp;location=San%20Salvador%2C%20El%20Salvador"
                    target="_blank"
                    rel="noreferrer"
                    className="calendar-google"
                  >
                    Google Calendar <Arrow diagonal />
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="faq section-pad" aria-labelledby="faq-title">
          <div>
            <p className="eyebrow">A FEW GOOD QUESTIONS</p>
            <h2 id="faq-title">
              Clear <span className="title-accent">things up.</span>
            </h2>
          </div>
          <div className="faq-list">
            <details>
              <summary>
                Is Paykit a wallet?<span>+</span>
              </summary>
              <p>
                Paykit is an open payment coordination protocol. Wallets and
                services integrate it to discover someone’s payment methods and
                exchange the details needed to pay them. You keep using your
                wallet to approve and send payments.
              </p>
            </details>
            <details>
              <summary>
                Does Paykit hold my money?<span>+</span>
              </summary>
              <p>
                No. Paykit coordinates payment information. Funds move through
                the payment method your wallet uses, and your wallet handles
                your keys and payment approval.
              </p>
            </details>
            <details>
              <summary>
                Which payment methods can I use?<span>+</span>
              </summary>
              <p>
                That depends on the wallet or service you use and the methods
                the recipient accepts. Bitkit’s Paykit integration supports
                on-chain Bitcoin, Lightning and USDT on Arbitrum One. Available
                options depend on wallet setup and the recipient. Paykit’s
                endpoint format can describe other payment methods, so apps can
                add support for their own use cases.
              </p>
            </details>
            <details>
              <summary>
                Are all my payment details public?<span>+</span>
              </summary>
              <p>
                You can publish payment methods for others to discover. Paykit
                also supports exchanging private details through encrypted
                channels. What is published or shared depends on the app and how
                you use it.
              </p>
            </details>
            <details>
              <summary>
                Can anyone integrate Paykit?<span>+</span>
              </summary>
              <p>
                Yes. It’s an open protocol with open-source implementations.
                Explore the specifications and code, or get in touch about
                adding Paykit to your wallet, service, or application.
              </p>
            </details>
          </div>
        </section>
        <Contact contactEmail={contactEmail} showConference={showConference} />
      </main>
      <footer className="site-footer">
        <div className="footer-top">
          <a href="#" className="wordmark" aria-label="Paykit home">
            Paykit
          </a>
          <p>
            Good payments start
            <br />
            with a connection.
          </p>
          <div className="footer-links">
            <a href={links.github} target="_blank" rel="noreferrer">
              GitHub <Arrow diagonal />
            </a>
            <a href="https://pubky.org/" target="_blank" rel="noreferrer">
              Pubky <Arrow diagonal />
            </a>
            <a href="https://pubky.app/" target="_blank" rel="noreferrer">
              Community <Arrow diagonal />
            </a>
            <a href="#contact">
              Get in touch <Arrow />
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            Built on{" "}
            <a href="https://pubky.org/" target="_blank" rel="noreferrer">
              Pubky
            </a>
            .
          </span>
          <a href="#">Back to top ↑</a>
        </div>
      </footer>
    </>
  );
}
