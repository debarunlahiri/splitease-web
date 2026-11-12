/**
 * Pay links look like /pay#<payload>. The payload is base64url JSON kept in the URL fragment, so it
 * never reaches a server or a log, and the page works for people who haven't installed the app.
 */
export interface PayPerson {
  /** Name */
  n: string;
  /** Amount they owe */
  a: string;
  /** Their own due date, YYYY-MM-DD */
  d?: string;
  /** Live state from the server: unpaid, said they paid, confirmed paid, or the payer says it hasn't arrived */
  s?: 'UNPAID' | 'CLAIMED' | 'PAID' | 'NOT_RECEIVED';
  /** Amount still unpaid */
  l?: string;
  /** Amount confirmed paid */
  p?: string;
}

export interface PayPayload {
  v: 1;
  /** Description of the expense */
  d: string;
  /** Currency code */
  c: string;
  /** Name of the person who paid and should be paid back */
  n: string;
  /** Their UPI ID (INR only) */
  u?: string;
  /** Who owes what */
  t: PayPerson[];
  /** Pay-by date, YYYY-MM-DD */
  b?: string;
  /** The server can pass "I've paid" on to the payer (only for links made by the app). */
  claims?: boolean;
}

const UPI_ID = /^[a-z0-9][a-z0-9._-]{1,99}@[a-z][a-z0-9]{1,31}$/i;
const AMOUNT = /^\d{1,12}(\.\d{1,2})?$/;

export function decodePayload(fragment: string): PayPayload | null {
  try {
    const base64 = fragment.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (data?.v !== 1 || typeof data.d !== 'string' || typeof data.n !== 'string') return null;
    if (typeof data.c !== 'string' || !/^[A-Z]{3}$/.test(data.c) || !Array.isArray(data.t)) return null;
    const people: PayPerson[] = data.t
      .filter((p: PayPerson) => typeof p?.n === 'string' && typeof p?.a === 'string' && AMOUNT.test(p.a))
      .slice(0, 50)
      .map((p: PayPerson) => ({
        n: p.n.slice(0, 100),
        a: p.a,
        d: typeof p.d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.d) ? p.d : undefined,
        s: ['UNPAID', 'CLAIMED', 'PAID', 'NOT_RECEIVED'].includes(p.s as string) ? p.s : undefined,
        l: typeof p.l === 'string' && AMOUNT.test(p.l) ? p.l : undefined,
        p: typeof p.p === 'string' && AMOUNT.test(p.p) ? p.p : undefined,
      }));
    return {
      v: 1,
      d: data.d.slice(0, 160),
      c: data.c,
      n: data.n.slice(0, 100),
      u: typeof data.u === 'string' && UPI_ID.test(data.u) ? data.u : undefined,
      t: people,
      claims: data.claims === true,
      b: typeof data.b === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.b) ? data.b : undefined,
    };
  } catch {
    return null;
  }
}

/** A upi://pay deep link that opens the visitor's UPI app with everything filled in. */
export function upiLink(payload: PayPayload, amount: string): string {
  const params = new URLSearchParams({
    pa: payload.u ?? '',
    pn: payload.n,
    am: amount,
    cu: 'INR',
    tn: payload.d.slice(0, 50),
  });
  return `upi://pay?${params.toString().replace(/\+/g, '%20')}`;
}

export function formatMoney(amount: string, currency: string): string {
  try {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : undefined, {
      style: 'currency',
      currency,
    }).format(Number(amount));
  } catch {
    return `${currency} ${amount}`;
  }
}

/** Re-encodes a payload fetched from the server so it goes through the same validation as fragment links. */
export function encodeBase64Url(payload: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** "Due 15 Nov", "Due today" or "Overdue since 12 Nov" for a YYYY-MM-DD date. */
export function dueLabel(date: string): { text: string; overdue: boolean } {
  const today = new Date().toISOString().slice(0, 10);
  const pretty = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  if (date < today) return { text: `Overdue since ${pretty}`, overdue: true };
  if (date === today) return { text: 'Due today', overdue: false };
  return { text: `Due ${pretty}`, overdue: false };
}
