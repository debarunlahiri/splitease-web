import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { formatMoney } from '@/lib/pay';
import { loadPayment } from '@/lib/pay-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The bundled preview font has no rupee sign, so it is drawn instead of typed. */
function Amount({ value, currency, size, color }: { value: string; currency: string; size: number; color: string }) {
  if (currency !== 'INR') {
    return <div style={{ display: 'flex', fontSize: size, color }}>{formatMoney(value, currency)}</div>;
  }
  const digits = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
  return (
    <div style={{ display: 'flex', alignItems: 'center', fontSize: size, color }}>
      <svg width={size * 0.62} height={size * 0.72} viewBox="0 0 24 28" style={{ marginRight: size * 0.08 }}>
        <path d="M5 4h15M5 11h15M5 4h5a7 7 0 0 1 0 14H5l11 9" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {digits}
    </div>
  );
}

const INK = '#1c2420';
const MUTED = '#6b7670';
const GREEN = '#1f7a4d';
const PAPER = '#fffdf8';

/** The picture shown when a pay link is shared (WhatsApp, Telegram, iMessage...): a small bill of the split. */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const pick = new URL(request.url).searchParams.get('p');
  const payment = await loadPayment(code);

  const logo = await readFile(path.join(process.cwd(), 'public', 'splitease-logo.png'))
    .then((buffer) => `data:image/png;base64,${buffer.toString('base64')}`)
    .catch(() => null);

  const index = pick !== null && /^\d{1,2}$/.test(pick) ? Number(pick) : -1;
  const person = payment && index >= 0 ? payment.t[index] : undefined;
  const total = payment ? payment.t.reduce((sum, p) => sum + Number(p.l ?? p.a), 0) : 0;
  const rows = payment ? (person ? [person] : payment.t.slice(0, 4)) : [];
  const more = payment && !person ? Math.max(0, payment.t.length - rows.length) : 0;

  const title = payment ? payment.d : 'Pay your share';
  const headline = person ? (person.l ?? person.a) : payment ? total.toFixed(2) : '';
  const caption = person ? `${person.n}, your share` : payment ? 'Still to be paid' : 'Open the link to see your split';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#e6efe6',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            width: 520,
            height: 590,
            display: 'flex',
            flexDirection: 'column',
            background: PAPER,
            borderRadius: 22,
            padding: '34px 40px',
            boxShadow: '0 18px 40px rgba(28,36,32,0.18)',
            borderTop: `10px solid ${GREEN}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {logo && <img src={logo} width={40} height={40} style={{ borderRadius: 10, marginRight: 12 }} alt="" />}
            <div style={{ display: 'flex', fontSize: 26, fontWeight: 700, color: INK }}>SplitEase</div>
            <div style={{ display: 'flex', marginLeft: 'auto', fontSize: 18, color: MUTED }}>Bill</div>
          </div>

          <div style={{ display: 'flex', marginTop: 22, fontSize: 32, fontWeight: 700, color: INK, lineHeight: 1.15 }}>
            {title.length > 44 ? `${title.slice(0, 43)}...` : title}
          </div>
          {payment && (
            <div style={{ display: 'flex', marginTop: 6, fontSize: 20, color: MUTED }}>Paid by {payment.n}</div>
          )}

          <div style={{ display: 'flex', borderTop: `2px dashed #cfd6cf`, marginTop: 20, marginBottom: 14 }} />

          {rows.map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, color: INK, marginTop: i ? 10 : 0 }}>
              <div style={{ display: 'flex' }}>{row.n.length > 18 ? `${row.n.slice(0, 17)}...` : row.n}</div>
              {row.s === 'PAID' ? (
                <div style={{ display: 'flex', color: GREEN }}>Paid</div>
              ) : (
                <Amount value={row.l ?? row.a} currency={payment!.c} size={24} color={INK} />
              )}
            </div>
          ))}
          {more > 0 && (
            <div style={{ display: 'flex', marginTop: 10, fontSize: 20, color: MUTED }}>{`and ${more} more`}</div>
          )}

          <div style={{ display: 'flex', flex: 1 }} />
          <div style={{ display: 'flex', borderTop: `2px dashed #cfd6cf`, marginBottom: 14 }} />
          <div style={{ display: 'flex', fontSize: 20, color: MUTED }}>{caption}</div>
          {headline && payment && (
            <div style={{ display: 'flex', marginTop: 4 }}>
              <Amount value={headline} currency={payment.c} size={64} color={GREEN} />
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } },
  );
}
