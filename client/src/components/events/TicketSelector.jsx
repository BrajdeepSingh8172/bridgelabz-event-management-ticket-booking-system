import { useState, useEffect, useRef } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function TicketSelector({ ticketTypes = [], onChange }) {
  const [selections, setSelections] = useState(
    () => Object.fromEntries(ticketTypes.map((t) => [t._id, 0])),
  );

  // Fire onChange whenever selections change — useEffect avoids the
  // "cannot update during render" warning while keeping parent in sync.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    onChange?.(selections);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selections]);

  const update = (id, delta) => {
    setSelections((prev) => {
      const ticket    = ticketTypes.find((t) => t._id === id);
      const remaining = (ticket?.totalQuantity ?? 0) - (ticket?.soldQuantity ?? 0);
      const next      = Math.max(0, Math.min((prev[id] ?? 0) + delta, remaining, 10));
      return { ...prev, [id]: next };
    });
  };

  const total = ticketTypes.reduce(
    (sum, t) => sum + (selections[t._id] ?? 0) * t.price,
    0,
  );

  return (
    <div className="space-y-3">
      {ticketTypes.map((ticket) => {
        const qty       = selections[ticket._id] ?? 0;
        const remaining = ticket.totalQuantity - ticket.soldQuantity;
        const soldOut   = remaining <= 0;

        return (
          <div
            key={ticket._id}
            className={`glass-sm p-4 flex items-center justify-between gap-4 transition-all ${
              soldOut ? 'opacity-50' : 'hover:border-primary-500/40'
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm">{ticket.name}</p>
              {ticket.description && (
                <p className="text-xs text-slate-400 truncate">{ticket.description}</p>
              )}
              <div className="flex items-center gap-3 mt-1">
                <span className="text-primary-300 font-semibold text-sm">
                  {ticket.price === 0 ? 'Free' : formatCurrency(ticket.price)}
                </span>
                <span className={`text-xs ${remaining < 10 ? 'text-amber-400' : 'text-slate-500'}`}>
                  {soldOut ? 'Sold out' : `${remaining} left`}
                </span>
              </div>
            </div>

            {!soldOut && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => update(ticket._id, -1)}
                  disabled={qty === 0}
                  className="w-7 h-7 rounded-lg bg-surface-border hover:bg-primary-600/30 disabled:opacity-30 flex items-center justify-center transition-colors"
                >
                  <MinusIcon className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-medium text-white">{qty}</span>
                <button
                  onClick={() => update(ticket._id, 1)}
                  disabled={qty >= remaining || qty >= 10}
                  className="w-7 h-7 rounded-lg bg-surface-border hover:bg-primary-600/30 disabled:opacity-30 flex items-center justify-center transition-colors"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      })}

      {total > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-surface-border">
          <span className="text-sm text-slate-400">Subtotal</span>
          <span className="font-display font-bold text-white">{formatCurrency(total)}</span>
        </div>
      )}
    </div>
  );
}
