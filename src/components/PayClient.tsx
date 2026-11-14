'use client';

import FlowCard from '@/components/FlowCard';
import Icon from '@/components/Icon';
import Link from 'next/link';
import QRCode from 'qrcode';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GET_APP_HREF } from '@/lib/config';
import { detectPlatform } from '@/lib/device';
import { decodePayload, dueLabel, encodeBase64Url, formatMoney, type PayPayload, type PayPerson, upiLink } from '@/lib/pay';

type Marks = Record<string, string>; // person index -> amount they said they paid

/** What a friend sees when someone shares a split: find your name, pay by UPI, say you've paid. */
export default function PayClient({ code }: { code?: string }) {
  // undefined = not read yet, null = missing or malformed
  const [payload, setPayload] = useState<PayPayload | null | undefined>(undefined);
  const [hash, setHash] = useState('');
  const [marks, setMarks] = useState<Marks>({});
  const [open, setOpen] = useState<number[] | null>(null);
  // A link made for one person (?p=2) highlights their row instead of opening a payment by itself.
  const [mine, setMine] = useState<number | null>(null);
  const personalHandled = useRef(false);
  // The first thing a visitor sees is the "get the app" sheet; payment comes after they continue on the web.
  const [promptDone, setPromptDone] = useState(true);

  useEffect(() => {
    // The app is Android-only, so iPhone visitors go straight to paying.
    if (detectPlatform(navigator.userAgent) === 'ios') return;
    let seen = false;
    try {
      seen = sessionStorage.getItem('splitease-app-prompt') === '1';
    } catch {
      // Storage can be blocked; the sheet is shown.
    }
    if (!seen) setPromptDone(false);
  }, []);

  function continueOnWeb() {
    setPromptDone(true);
    try {
      sessionStorage.setItem('splitease-app-prompt', '1');
    } catch {
      // Not remembered; fine.
    }
  }

  useEffect(() => {
    // Short links (/p/<code>) load the split from the server; old /pay#... links carry it in the URL.
    const key = code ?? window.location.hash.slice(1);
    setHash(key);
    try {
      setMarks(JSON.parse(localStorage.getItem(`splitease-paid:${key.slice(0, 40)}`) ?? '{}'));
    } catch {
      // Storage can be blocked; marking as paid just won't be remembered.
    }
    if (!code) {
      setPayload(decodePayload(key));
      return;
    }
    void load();
    // The payer confirms or rejects from the app, so keep checking while this page is open.
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, 15000);
    const onFocus = () => void load();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // A link made for one person (?p=2) opens that person's payment sheet (after the app prompt) and marks their row.
  useEffect(() => {
    if (!payload || personalHandled.current) return;
    personalHandled.current = true;
    const param = new URLSearchParams(window.location.search).get('p');
    // No ?p= means a link for everyone: Number(null) would be 0 and wrongly pick the first person.
    if (param === null || !/^\d{1,3}$/.test(param)) return;
    const wanted = Number(param);
    if (!Number.isInteger(wanted) || wanted < 0 || wanted >= payload.t.length) return;
    setMine(wanted);
    const person = payload.t[wanted];
    const state = payload.claims ? (person.s ?? 'UNPAID') : 'UNPAID';
    if (payload.c === 'INR' && payload.u && (state === 'UNPAID' || state === 'NOT_RECEIVED')) setOpen([wanted]);
    window.setTimeout(() => document.getElementById(`pay-person-${wanted}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
  }, [payload]);

  /** Fetches the split and each person's live state from the server. */
  async function load() {
    if (!code) return;
    try {
      const response = await fetch(`/api/pay/${encodeURIComponent(code)}`, { cache: 'no-store' });
      if (response.status === 404) return setPayload(null);
      if (!response.ok) return;
      const data = await response.json();
      if (data?.payload) setPayload(decodePayload(encodeBase64Url(data.payload)));
    } catch {
      // Keep showing what we have; the next check tries again.
    }
  }

  /** Tells the payer (through the server) that these people paid, when the link supports it. */
  async function sendClaims(entries: [number, string][], full: boolean) {
    if (!code || !payload?.claims) return;
    for (const [index, amount] of entries) {
      try {
        await fetch(`/api/pay/${encodeURIComponent(code)}/claim`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ index, amount: full ? null : amount }),
        });
      } catch {
        // The page still shows it as marked; the payer can also be told directly.
      }
    }
    await load();
  }

  function mark(entries: [number, string][]) {
    const next = { ...marks, ...Object.fromEntries(entries) };
    setMarks(next);
    try {
      localStorage.setItem(`splitease-paid:${hash.slice(0, 40)}`, JSON.stringify(next));
    } catch {
      // See above.
    }
  }

  if (payload === undefined) {
    return <FlowCard icon="link" label="Split" title="Opening your split…"></FlowCard>;
  }
  if (payload === null) {
    return (
      <FlowCard icon="warning" label="Split" title={code ? 'This link has expired' : 'This link is incomplete'}>
        <p className="lead">Ask your friend to share the split again.</p>
        <div className="actions">
          <Link className="btn btn-ghost" href="/">
            Back to SplitEase
          </Link>
        </div>
      </FlowCard>
    );
  }

  const upi = payload.c === 'INR' ? payload.u : undefined;
  const live = Boolean(payload.claims);
  type State = 'UNPAID' | 'CLAIMED' | 'PAID' | 'NOT_RECEIVED';
  // With a server-backed link the server is the truth; otherwise only what this phone marked.
  const stateOf = (i: number): State =>
    live ? (payload.t[i].s ?? 'UNPAID') : marks[i] !== undefined ? 'CLAIMED' : 'UNPAID';
  const owedNow = (i: number) => (live && payload.t[i].l !== undefined ? payload.t[i].l! : payload.t[i].a);
  const total = payload.t.reduce((sum, p) => sum + Number(p.a), 0);
  const paidCount = payload.t.filter((_, i) => stateOf(i) === 'PAID').length;
  const collected = live
    ? payload.t.reduce((sum, p) => sum + Number(p.p ?? 0), 0)
    : Object.values(marks).reduce((sum, a) => sum + Number(a), 0);
  // People who can still pay: not settled and not already waiting for the payer to confirm.
  const unpaid = payload.t.map((_, i) => i).filter((i) => ['UNPAID', 'NOT_RECEIVED'].includes(stateOf(i)));
  const sumOf = (indexes: number[]) =>
    (indexes.reduce((sum, i) => sum + Math.round(Number(owedNow(i)) * 100), 0) / 100).toFixed(2);
  const progress = total > 0 ? Math.min(100, Math.round((collected / total) * 100)) : 0;
  const notReceived = payload.t.filter((_, i) => stateOf(i) === 'NOT_RECEIVED').length;

  return (
    <div className="pay-page">
      <section className="pay-hero">
        <p className="pay-hero-label">{payload.n} is asking for</p>
        <p className="pay-hero-amount">{formatMoney(total.toFixed(2), payload.c)}</p>
        <p className="pay-hero-for">for {payload.d || 'a shared split'}</p>
        <div className="pay-chips">
          <span>
            {payload.t.length} {payload.t.length === 1 ? 'person' : 'people'}
          </span>
          {payload.b && (
            <span>
              Pay by {new Date(`${payload.b}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        <div className="pay-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className="pay-progress-text">
          {paidCount} of {payload.t.length} paid · {formatMoney(collected.toFixed(2), payload.c)} received
        </p>
      </section>

      {upi && (
        <section className="pay-safe">
          <Icon name="check" size={18} />
          <p>
            Check your UPI app shows <strong>{payload.n}</strong> before you pay. We never ask for your
            OTP, PIN or bank details.
          </p>
        </section>
      )}

      {notReceived > 0 && (
        <section className="pay-alert" role="alert">
          <strong>{payload.n} hasn&apos;t received {notReceived === 1 ? 'a payment' : 'some payments'} yet.</strong>
          <span>Check your UPI app and bank, then pay again or tell them it went through.</span>
        </section>
      )}

      <div className="pay-titlebar">
        <h2 className="pay-title">{upi ? 'Tap your name to pay' : 'Who owes what'}</h2>
      </div>
      <ul className="pay-people">
        {payload.t.map((person, index) => {
          const state = stateOf(index);
          const paid = state === 'PAID';
          const waiting = state === 'CLAIMED';
          const rejected = state === 'NOT_RECEIVED';
          const canPay = state === 'UNPAID' || rejected;
          const caption = paid
            ? live
              ? `Paid · ${payload.n} has confirmed`
              : `Marked paid · ${formatMoney(marks[index] ?? person.a, payload.c)}`
            : waiting
              ? live
                ? `Told ${payload.n} · waiting for them to confirm`
                : `Marked paid on this phone · ${formatMoney(marks[index], payload.c)}`
              : rejected
                ? `${payload.n} hasn't received this yet. Check and pay again.`
                : person.d
                  ? dueLabel(person.d).text
                  : 'Not paid yet';
          const content = (
            <>
              <span
                className="pay-avatar"
                style={{ background: rejected ? 'hsl(8 62% 40%)' : avatarColor(person.n) }}
                aria-hidden
              >
                {paid ? <Icon name="check" size={18} /> : waiting ? <Icon name="clock" size={18} /> : rejected ? <Icon name="warning" size={18} /> : person.n.slice(0, 1).toUpperCase()}
              </span>
              <span className="pay-name">
                {person.n}
                {mine === index && <em className="pay-you">Your share</em>}
                <small className={rejected || (canPay && person.d && dueLabel(person.d).overdue) ? 'is-overdue' : ''}>
                  {caption}
                </small>
              </span>
              <span className="pay-amount">{formatMoney(paid ? person.a : owedNow(index), payload.c)}</span>
              {upi && canPay && <Icon name="arrow" size={16} />}
            </>
          );
          return (
            <li
              key={`${person.n}-${index}`}
              id={`pay-person-${index}`}
              className={`${paid ? 'is-paid' : ''} ${rejected ? 'is-rejected' : ''} ${mine === index ? 'is-mine' : ''}`}
            >
              {upi && canPay ? (
                <button type="button" className="pay-main" onClick={() => setOpen([index])}>
                  {content}
                </button>
              ) : (
                <div className="pay-row">{content}</div>
              )}
              {live && code && payload.invoices !== false && (state === 'PAID' || Number(person.p ?? 0) > 0) && (
                <a className="pay-invoice" href={`/p/${encodeURIComponent(code)}/invoice/${index}`}>
                  {paid ? 'Download invoice' : 'Download receipt'}
                </a>
              )}
            </li>
          );
        })}
      </ul>

      <p className="pay-foot">
        Share costs with friends and pay back in one tap. <Link href={GET_APP_HREF}>Get SplitEase</Link>
      </p>

      {!promptDone && <AppPromptSheet onContinue={continueOnWeb} />}

      {promptDone && upi && open !== null && (
        <PaySheet
          payload={payload}
          upi={upi}
          who={open.map((i) => payload.t[i].n)}
          lines={open.flatMap((i) => (payload.t[i].i ?? []).map((item) => ({ ...item, who: payload.t[i].n })))}
          amount={sumOf(open)}
          single={open.length === 1}
          again={open.some((i) => stateOf(i) === 'NOT_RECEIVED')}
          onClose={() => setOpen(null)}
          onPaid={(amount) => {
            // One person can pay a different amount; for several people each share is marked paid in full.
            const entries: [number, string][] =
              open.length === 1 ? [[open[0], amount]] : open.map((i): [number, string] => [i, owedNow(i)]);
            void sendClaims(entries, open.length > 1 || amount === owedNow(open[0]));
            mark(entries);
            setOpen(null);
          }}
        />
      )}
    </div>
  );
}

/** A stable soft colour per name, so people are easy to tell apart. */
function avatarColor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return `hsl(${hash} 38% 34%)`;
}

/** Shown first: nudges people to the app, with the web page one tap away. */
function AppPromptSheet({ onContinue }: { onContinue: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onContinue();
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onContinue]);
  return (
    <div className="sheet-backdrop" onClick={onContinue}>
      <div className="sheet sheet-app" role="dialog" aria-modal="true" aria-label="Get the SplitEase app" onClick={(e) => e.stopPropagation()}>
        <span className="sheet-grabber" aria-hidden />
        <div className="sheet-body">
          <span className="sheet-app-icon" aria-hidden>
            <Icon name="phone" size={28} />
          </span>
          <h2 className="sheet-app-title">Pay faster in the app</h2>
          <p className="sheet-app-sub">Everything in one place, free on Android.</p>
          <ul className="sheet-app-perks">
            <li>
              <Icon name="check" size={16} /> Pay in one tap
            </li>
            <li>
              <Icon name="check" size={16} /> Keep track of every shared cost
            </li>
            <li>
              <Icon name="check" size={16} /> Get reminders before it&apos;s due
            </li>
          </ul>
        </div>
        <div className="sheet-actions sheet-app-actions">
          <Link className="btn btn-primary" href={GET_APP_HREF}>
            Download app
          </Link>
          <button type="button" className="sheet-app-web" onClick={onContinue}>
            Continue on web
          </button>
        </div>
      </div>
    </div>
  );
}

function PaySheet({
  payload,
  upi,
  who,
  lines,
  amount,
  single,
  again,
  onClose,
  onPaid,
}: {
  payload: PayPayload;
  upi: string;
  who: string[];
  /** The splits this payment covers (whole-group links). */
  lines: { who: string; d: string; a: string; t?: string }[];
  amount: string;
  single: boolean;
  again: boolean;
  onClose: () => void;
  onPaid: (amount: string) => void;
}) {
  // The sheet pays one amount: one person's share, or several shares added together.
  const person: PayPerson = { n: single ? who[0] : `${who.length} people`, a: amount };
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState('');
  const [other, setOther] = useState(false);
  const [custom, setCustom] = useState('');
  const link = useMemo(() => upiLink(payload, person.a), [payload, person.a]);

  useEffect(() => {
    QRCode.toDataURL(link, { margin: 1, width: 440 }).then(setQr).catch(() => setQr(''));
  }, [link]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    // Keep the page behind the sheet from scrolling.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  async function copy(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(''), 2000);
    } catch {
      // The value is visible on the page.
    }
  }

  const valid = /^\d{1,12}(\.\d{1,2})?$/.test(custom) && Number(custom) > 0;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={`Pay ${person.n}'s share`} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <p className="sheet-who">
            {single ? (
              `${person.n} pays ${payload.n}`
            ) : (
              <>
                {who.join(', ')} <Icon name="arrow" size={14} inline />
                {payload.n}
              </>
            )}
          </p>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
          <p className="sheet-amount">{formatMoney(person.a, payload.c)}</p>
        </div>
        <div className="sheet-body">
          {again && (
            <p className="sheet-warn">
              {payload.n} hasn&apos;t received your last payment. Check your UPI app and bank first, then pay again if needed.
            </p>
          )}
          {lines.length > 0 && (
            <div className="sheet-items">
              <p className="sheet-items-title">
                Paying for {lines.length} {lines.length === 1 ? 'split' : 'splits'}
              </p>
              <ul>
                {lines.map((line, index) => (
                  <li key={`${line.who}-${line.d}-${index}`}>
                    <span>
                      {line.d}
                      <small>
                        {[!single ? line.who : '', line.t ? new Date(`${line.t}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '']
                          .filter(Boolean)
                          .join(' · ')}
                      </small>
                    </span>
                    <strong>{formatMoney(line.a, payload.c)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <a className="btn btn-primary sheet-open" href={link}>
            Open UPI app
          </a>
          <p className="sheet-hint">Opens GPay, PhonePe, Paytm or any UPI app with everything filled in.</p>

          <div className="sheet-divider">
            <span>or scan on another phone</span>
          </div>
          <div className="sheet-qr">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} width={208} height={208} alt={`UPI QR code to pay ${formatMoney(person.a, payload.c)}`} />
            ) : (
              <div className="sheet-qr-empty" />
            )}
            {qr && (
              <a className="pay-pill" href={qr} download={`pay-${payload.n}.png`}>
                Save QR
              </a>
            )}
          </div>

          <div className="sheet-upi">
            <span>UPI ID</span>
            <code>{upi}</code>
          </div>
          <div className="sheet-grid">
            <button type="button" className="btn btn-ghost" onClick={() => copy('id', upi)}>
              {copied === 'id' ? (
                <>
                  <Icon name="check" size={16} inline />
                  Copied
                </>
              ) : (
                'Copy UPI ID'
              )}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => copy('amount', person.a)}>
              {copied === 'amount' ? (
                <>
                  <Icon name="check" size={16} inline />
                  Copied
                </>
              ) : (
                'Copy amount'
              )}
            </button>
          </div>
          <p className="sheet-note">
            {payload.claims
              ? `${payload.n} is told you paid, and confirms it once the money reaches them.`
              : `Marking it paid only saves it on your phone. ${payload.n} confirms once the money reaches them.`}
          </p>
        </div>

        <div className="sheet-actions">
          {!other ? (
            <>
              <button type="button" className="btn btn-primary" onClick={() => onPaid(person.a)}>
                I&apos;ve paid
              </button>
              {single && (
                <button type="button" className="sheet-link" onClick={() => setOther(true)}>
                  I paid a different amount
                </button>
              )}
            </>
          ) : (
            <>
              <label className="sheet-field">
                Amount you paid ({payload.c})
                <input inputMode="decimal" value={custom} onChange={(e) => setCustom(e.target.value.trim())} placeholder={person.a} autoFocus />
              </label>
              <button type="button" className="btn btn-primary" disabled={!valid} onClick={() => onPaid(Number(custom).toFixed(2))}>
                Confirm
              </button>
              <button type="button" className="sheet-link" onClick={() => setOther(false)}>
                Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
