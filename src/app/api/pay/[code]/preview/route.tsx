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
  const total = payment ? payment.t.reduce((sum, p) => (p.s === 'PAID' ? sum : sum + Number(p.l ?? p.a)), 0) : 0;
  const rows = payment ? (person ? [person] : payment.t.slice(0, 4)) : [];
  const more = payment && !person ? Math.max(0, payment.t.length - rows.length) : 0;

  const title = payment ? payment.d : 'Pay your share';
  const headline = person ? (person.l ?? person.a) : payment ? total.toFixed(2) : '';
  const caption = person ? `${person.n}, your share` : payment ? 'Still to be paid' : 'Open the link to see your split';

  const cut = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}...` : text);
  const count = payment ? payment.t.length : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: `linear-gradient(135deg, #14684a 0%, ${GREEN} 55%, #2d9467 100%)`,
          fontFamily: 'sans-serif',
          padding: 56,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', width: 520, color: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {logo && (
              <div style={{ display: 'flex', background: '#ffffff', borderRadius: 16, padding: 6, marginRight: 16 }}>
                <img src={logo} width={52} height={52} style={{ borderRadius: 12 }} alt="" />
              </div>
            )}
            <div style={{ display: 'flex', fontSize: 34, fontWeight: 700 }}>SplitEase</div>
          </div>

          <div style={{ display: 'flex', flex: 1 }} />

          <div style={{ display: 'flex', fontSize: 52, fontWeight: 700, lineHeight: 1.1 }}>{cut(title, 34)}</div>
          {payment && (
            <div style={{ display: 'flex', marginTop: 12, fontSize: 28, color: 'rgba(255,255,255,0.78)' }}>
              {`Paid by ${cut(payment.n, 24)}`}
            </div>
          )}
          {headline && payment && (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 34 }}>
              <div style={{ display: 'flex', fontSize: 24, color: 'rgba(255,255,255,0.78)' }}>{caption}</div>
              <div style={{ display: 'flex', marginTop: 6 }}>
                <Amount value={headline} currency={payment.c} size={92} color="#ffffff" />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flex: 1 }} />

          <div style={{ display: 'flex' }}>
            <div
              style={{
                display: 'flex',
                background: '#ffffff',
                color: GREEN,
                fontSize: 28,
                fontWeight: 700,
                padding: '16px 34px',
                borderRadius: 40,
              }}
            >
              Tap to view and pay
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
          <div
            style={{
              width: 500,
              display: 'flex',
              flexDirection: 'column',
              background: PAPER,
              borderRadius: 28,
              padding: '36px 40px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
              transform: 'rotate(2deg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 20, color: MUTED }}>
              <div style={{ display: 'flex' }}>{person ? 'Your share' : 'Split between'}</div>
              {!person && count > 0 && (
                <div style={{ display: 'flex', marginLeft: 'auto' }}>{`${count} ${count === 1 ? 'person' : 'people'}`}</div>
              )}
            </div>
            <div style={{ display: 'flex', borderTop: '2px dashed #cfd6cf', marginTop: 16, marginBottom: 8 }} />

            {rows.map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', marginTop: 14 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    background: '#dcebdf',
                    color: GREEN,
                    fontSize: 22,
                    fontWeight: 700,
                    marginRight: 14,
                  }}
                >
                  {(row.n.trim()[0] ?? '?').toUpperCase()}
                </div>
                <div style={{ display: 'flex', fontSize: 26, color: INK }}>{cut(row.n, 14)}</div>
                <div style={{ display: 'flex', marginLeft: 'auto' }}>
                  {row.s === 'PAID' ? (
                    <div style={{ display: 'flex', fontSize: 24, color: GREEN, fontWeight: 700 }}>Paid</div>
                  ) : (
                    <Amount value={row.l ?? row.a} currency={payment!.c} size={26} color={INK} />
                  )}
                </div>
              </div>
            ))}
            {more > 0 && (
              <div style={{ display: 'flex', marginTop: 16, fontSize: 20, color: MUTED }}>{`and ${more} more`}</div>
            )}
            {!payment && (
              <div style={{ display: 'flex', fontSize: 24, color: MUTED, marginTop: 14 }}>Open the link to see your split</div>
            )}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } },
  );
}
