'use client';

import FlowCard from '@/components/FlowCard';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { formatMoney } from '@/lib/pay';

const SUPPORT_EMAIL = 'contact@lambrk.com';

interface Invoice {
  number: string;
  issuedAt: string;
  status: 'PAID' | 'PARTIAL';
  payee: { name: string; upiId: string | null };
  payer: { name: string };
  groupName: string;
  currency: string;
  items: { description: string; date: string; amount: string; paid: string }[];
  totalAmount: string;
  totalPaid: string;
  balance: string;
}

const day = (value: string) =>
  new Date(value.length === 10 ? `${value}T00:00:00` : value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/** A printable invoice (or receipt, if only part is paid). "Download PDF" uses the browser's Save as PDF. */
export default function InvoiceClient({ code, index }: { code: string; index: string }) {
  const [invoice, setInvoice] = useState<Invoice | null | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/pay/${encodeURIComponent(code)}/invoice/${encodeURIComponent(index)}`, { cache: 'no-store' })
      .then(async (response) => setInvoice(response.ok ? (await response.json()).invoice : null))
      .catch(() => setInvoice(null));
  }, [code, index]);

  if (invoice === undefined) return <FlowCard icon="link" label="Invoice" title="Preparing your invoice…"></FlowCard>;
  if (invoice === null) {
    return (
      <FlowCard icon="warning" label="Invoice" title="No invoice yet">
        <p className="lead">An invoice is available once {`the payer`} has confirmed your payment.</p>
        <div className="actions">
          <Link className="btn btn-ghost" href={`/p/${code}`}>
            Back to the split
          </Link>
        </div>
      </FlowCard>
    );
  }

  const paid = invoice.status === 'PAID';
  return (
    <div className="invoice-wrap">
      <article className="invoice" aria-label={`Invoice ${invoice.number}`}>
        <header className="invoice-head">
          <div className="invoice-brandrow">
            <BrandLogo size={48} />
            <div>
              <p className="invoice-brand">SplitEase</p>
              <p className="invoice-tag">Shared expenses, settled</p>
            </div>
          </div>
          <div className="invoice-titlebox">
            <h1>{paid ? 'Invoice' : 'Receipt'}</h1>
            <span className={`invoice-stamp ${paid ? 'paid' : 'partial'}`}>{paid ? 'PAID' : 'PART PAID'}</span>
          </div>
        </header>

        <dl className="invoice-meta">
          <div>
            <dt>Invoice no.</dt>
            <dd>{invoice.number}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{day(invoice.issuedAt)}</dd>
          </div>
          <div>
            <dt>Billed to</dt>
            <dd>{invoice.payer.name}</dd>
          </div>
          <div>
            <dt>Paid to</dt>
            <dd>
              {invoice.payee.name}
              {invoice.payee.upiId && <small>{invoice.payee.upiId}</small>}
            </dd>
          </div>
          {invoice.groupName && (
            <div>
              <dt>Group</dt>
              <dd>{invoice.groupName}</dd>
            </div>
          )}
        </dl>

        <table className="invoice-items">
          <thead>
            <tr>
              <th>Description</th>
              <th>Date</th>
              <th className="num">Share</th>
              <th className="num">Paid</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i}>
                <td>{item.description}</td>
                <td>{day(item.date)}</td>
                <td className="num">{formatMoney(item.amount, invoice.currency)}</td>
                <td className="num">{formatMoney(item.paid, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-total">
          <p>
            <span>Total</span>
            <strong>{formatMoney(invoice.totalAmount, invoice.currency)}</strong>
          </p>
          <p>
            <span>Paid</span>
            <strong>{formatMoney(invoice.totalPaid, invoice.currency)}</strong>
          </p>
          {!paid && (
            <p className="due">
              <span>Balance due</span>
              <strong>{formatMoney(invoice.balance, invoice.currency)}</strong>
            </p>
          )}
        </div>

        <footer className="invoice-foot">
          <p>
            Payment confirmed by <strong>{invoice.payee.name}</strong> on SplitEase. This is a record of money shared
            between friends, not a tax invoice.
          </p>
          <p className="invoice-help">
            Questions or a problem with this invoice? Contact us at{' '}
            <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Invoice ${invoice.number}`)}`}>{SUPPORT_EMAIL}</a> and
            quote invoice no. <strong>{invoice.number}</strong>.
          </p>
        </footer>
      </article>

      <div className="invoice-actions">
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          Download PDF
        </button>
        <Link className="btn btn-ghost" href={`/p/${code}`}>
          Back
        </Link>
      </div>
      <p className="note invoice-hint">In the print window choose “Save as PDF”.</p>
    </div>
  );
}
