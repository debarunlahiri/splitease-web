'use client';

import Icon from '@/components/Icon';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/* ------------------------------------------------------------------ Modal */

export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const first = panel.current?.querySelector<HTMLElement>('input, textarea, select, button:not([data-close])');
    (first ?? panel.current)?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panel.current) return;
      const items = Array.from(
        panel.current.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input, textarea, select'),
      );
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="adm-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panel} tabIndex={-1}>
        <div className="adm-modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="adm-icon-btn" aria-label="Close" data-close onClick={onClose}>
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="adm-modal-body">{children}</div>
        {footer && <div className="adm-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------- Toasts + confirm */

type Tone = 'ok' | 'bad';
interface ToastItem {
  id: number;
  tone: Tone;
  text: string;
}

interface ConfirmOptions {
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  /** The admin must type this exact text before the button works. */
  requireText?: string;
}

interface Feedback {
  toast: (text: string, tone?: Tone) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const Ctx = createContext<Feedback | null>(null);

export function useFeedback(): Feedback {
  const value = useContext(Ctx);
  if (!value) throw new Error('useFeedback must be used inside FeedbackProvider');
  return value;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pending, setPending] = useState<{ options: ConfirmOptions; resolve: (ok: boolean) => void } | null>(null);
  const counter = useRef(0);

  const toast = useCallback((text: string, tone: Tone = 'ok') => {
    const id = ++counter.current;
    setToasts((list) => [...list.slice(-3), { id, tone, text }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), tone === 'bad' ? 7000 : 4000);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ options, resolve })),
    [],
  );

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  function settle(ok: boolean) {
    pending?.resolve(ok);
    setPending(null);
  }

  return (
    <Ctx.Provider value={value}>
      {children}
      {pending && <ConfirmDialog options={pending.options} onSettle={settle} />}
      <div className="adm-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`adm-toast adm-toast-${t.tone}`} role={t.tone === 'bad' ? 'alert' : 'status'}>
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

function ConfirmDialog({ options, onSettle }: { options: ConfirmOptions; onSettle: (ok: boolean) => void }) {
  const [typed, setTyped] = useState('');
  const ready = !options.requireText || typed.trim() === options.requireText;
  return (
    <Modal
      title={options.title}
      onClose={() => onSettle(false)}
      footer={
        <>
          <button type="button" className="adm-btn" onClick={() => onSettle(false)}>
            Cancel
          </button>
          <button
            type="button"
            className={`adm-btn ${options.danger ? 'adm-btn-danger' : 'adm-btn-primary'}`}
            disabled={!ready}
            onClick={() => onSettle(true)}
          >
            {options.confirmLabel ?? 'Confirm'}
          </button>
        </>
      }
    >
      {options.body && <div className="adm-modal-text">{options.body}</div>}
      {options.requireText && (
        <label className="adm-field">
          Type <strong>{options.requireText}</strong> to confirm
          <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
        </label>
      )}
    </Modal>
  );
}

/** Runs an action, shows a toast with the outcome, and tracks whether one is in flight. */
export function useAction() {
  const { toast } = useFeedback();
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async <T,>(work: () => Promise<T>, success: string | ((result: T) => string)): Promise<boolean> => {
      setBusy(true);
      try {
        const result = await work();
        toast(typeof success === 'function' ? success(result) : success);
        return true;
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Something went wrong', 'bad');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [toast],
  );
  return { run, busy };
}
