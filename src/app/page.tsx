import type { ReactNode } from 'react';
import Icon from '@/components/Icon';
import { BrandLogo } from '@/components/BrandLogo';
import { IosAvailability } from '@/components/IosUpdates';
import { GET_APP_HREF } from '@/lib/config';

function FeatureIcon({ children }: { children: ReactNode }) {
  return (
    <span className="icon" aria-hidden="true">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </span>
  );
}

const features: { title: string; text: string; icon: ReactNode }[] = [
  {
    title: 'A group for every circle',
    text: 'Create a group for a trip, your flat or a dinner, pick its currency and bring everyone in.',
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    title: 'Invite by link or email',
    text: 'Share an invite link on WhatsApp or send an email invitation. Lost it? Resend with one tap.',
    icon: (
      <>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </>
    ),
  },
  {
    title: 'Split it your way',
    text: 'Divide a bill equally, by exact amounts or by percentage, between exactly the people involved.',
    icon: (
      <>
        <line x1="19" y1="5" x2="5" y2="19" />
        <circle cx="6.5" cy="6.5" r="2.5" />
        <circle cx="17.5" cy="17.5" r="2.5" />
      </>
    ),
  },
  {
    title: 'Pay back with fewer payments',
    text: 'See who gets money back and who needs to pay, and get the shortest list of payments that squares everyone up.',
    icon: (
      <>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </>
    ),
  },
  {
    title: 'Works when you are offline',
    text: 'Add a split without internet. It stays on your phone and goes online when you’re connected.',
    icon: (
      <>
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </>
    ),
  },
  {
    title: 'Clear history and updates',
    text: 'See every change to a split, and get a message when something is added or someone pays.',
    icon: (
      <>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
  },
];

const faqs: { question: string; answer: string }[] = [
  {
    question: 'Does SplitEase move money?',
    answer:
      'No. SplitEase helps you keep track of who owes what. You pay each other yourselves, in cash or with any payment app. No money moves through SplitEase.',
  },
  {
    question: 'Which phones does it run on?',
    answer: 'SplitEase is available for Android phones. The iPhone and iPad app is in development.',
  },
  {
    question: 'How do invitations work?',
    answer:
      'Share an invite link or send an email invitation. Opening the link on your phone takes you straight into the app. If you do not have the app yet, install it and open the link again.',
  },
  {
    question: 'Can I add splits without internet?',
    answer:
      'Yes. Splits you add offline are saved on your phone and go online automatically once you’re connected.',
  },
  {
    question: 'Does it cost anything?',
    answer:
      'SplitEase is free to use with ads. An optional No Ads plan removes them for ₹49 a month or ₹399 a year.',
  },
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <BrandLogo size={20} /> Sharing costs, made simple
            </span>
            <h1>
              Split costs.
              <br />
              <span>Keep it easy.</span>
            </h1>
            <p className="lead">
              SplitEase keeps track of who paid, who owes and the fewest payments needed to pay everyone back
              up. Made for trips, flatmates, dinners and everything you share.
            </p>
            <div className="actions">
              <a className="btn btn-primary" href={GET_APP_HREF}>
                Get the app <Icon name="arrow" size={18} />
              </a>
              <a className="btn btn-ghost" href="#how-it-works">
                See how it works <Icon name="down" size={17} />
              </a>
            </div>
            <IosAvailability>
              <p className="hero-note">
                <Icon name="phone" size={16} /> Available for Android
              </p>
            </IosAvailability>
          </div>

          <figure className="preview">
            <div className="preview-art">
              <div className="screen">
                <div className="screen-top">
                  <span className="group-icon">
                    <Icon name="suitcase" size={20} />
                  </span>
                  <div>
                    <strong>Goa weekend</strong>
                    <small>3 members · INR</small>
                  </div>
                </div>
                <div className="screen-hero">
                  <small>Where you stand</small>
                  <strong>₹1,250.00</strong>
                  <span>You get back</span>
                </div>
                <p className="screen-title">Group balances</p>
                <div className="screen-rows">
                  {[
                    {
                      name: 'Asha (you)',
                      initial: 'A',
                      status: 'Gets back',
                      amount: '₹1,250.00',
                      positive: true,
                    },
                    {
                      name: 'Ravi',
                      initial: 'R',
                      status: 'Owes',
                      amount: '₹900.00',
                      positive: false,
                    },
                    {
                      name: 'Meera',
                      initial: 'M',
                      status: 'Owes',
                      amount: '₹350.00',
                      positive: false,
                    },
                  ].map(({ name, initial, status, amount, positive }) => (
                    <div className="screen-row" key={name}>
                      <span className="avatar" aria-hidden="true">
                        {initial}
                      </span>
                      <div>
                        {name}
                        <small>{status}</small>
                      </div>
                      <span className={positive ? 'pos' : 'neg'}>{amount}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="preview-sticker">
                <span>
                  <Icon name="check" size={17} />
                </span>{' '}
                Just two payments to pay everyone back
              </div>
            </div>
            <figcaption>Example Splits with sample amounts</figcaption>
          </figure>
        </div>
      </section>

      <section id="features" className="section section-alt">
        <div className="container">
          <p className="kicker">Features</p>
          <h2>Everything a shared budget needs</h2>
          <p className="section-intro">
            No spreadsheets and no awkward reminders. Just a clear picture of where everyone stands.
          </p>
          <div className="grid-3">
            {features.map((feature) => (
              <article className="feature" key={feature.title}>
                <FeatureIcon>{feature.icon}</FeatureIcon>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section">
        <div className="container">
          <p className="kicker">The process</p>
          <h2>How it works</h2>
          <p className="section-intro">From the first bill to everyone settled in three steps.</p>
          <ol className="grid-3 steps">
            <li className="step">
              <h3>Create Splits</h3>
              <p>Give it a name, pick a currency and invite your friends with a link or email.</p>
            </li>
            <li className="step">
              <h3>Add a split</h3>
              <p>Say who paid and how to share it. Everyone sees the same amounts.</p>
            </li>
            <li className="step">
              <h3>Pay back</h3>
              <p>Follow the suggested payments, then mark them as paid.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="pricing">
            <div>
              <p className="kicker">Pricing</p>
              <h2>Free to use</h2>
            </div>
            <p>
              SplitEase is free with ads. Want them gone? The No Ads plan is ₹49 a month or ₹399 a
              year.
            </p>
          </div>
        </div>
      </section>

      <section id="faq" className="section">
        <div className="container faq-layout">
          <div>
            <p className="kicker">FAQ</p>
            <h2>Good to know</h2>
            <p className="section-intro">Answers to common questions about SplitEase.</p>
          </div>
          <div className="faq">
            {faqs.map((item) => (
              <details key={item.question}>
                <summary>
                  {item.question}
                  <Icon name="chevron" size={18} />
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section cta">
        <div className="container">
          <div className="cta-box">
            <h2>Ready to split smarter?</h2>
            <p>Create your first group in a minute and invite your friends.</p>
            <a className="btn" href={GET_APP_HREF}>
              Get the app <Icon name="arrow" size={18} />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
