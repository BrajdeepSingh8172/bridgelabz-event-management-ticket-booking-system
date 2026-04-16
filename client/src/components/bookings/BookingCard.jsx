import { useState } from 'react';
import { formatDate }      from '../../utils/formatDate';
import { formatCurrency }  from '../../utils/formatCurrency';
import { canCancelBooking, getRefundAmount } from '../../utils/cancellationPolicy';
import Badge  from '../ui/Badge';
import Button from '../ui/Button';
import { 
  CalendarDaysIcon, 
  MapPinIcon, 
  TicketIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

const statusVariant = {
  confirmed: 'success',
  pending:   'warning',
  cancelled: 'danger',
  refunded:  'neutral',
};

export default function BookingCard({ booking, onRequestCancel, onDirectCancel, onViewQr }) {
  const [cancellingLocal, setCancellingLocal] = useState(false);
  const event = booking?.event || {};

  const isPending    = booking?.status === 'pending';
  const isConfirmed  = booking?.status === 'confirmed';
  const isCancelled  = booking?.status === 'cancelled';
  const isRefunded   = booking?.status === 'refunded';

  const isCancelRequested = booking?.cancellationStatus === 'requested';
  const isCancelApproved  = booking?.cancellationStatus === 'approved';

  // ── Policy check (only relevant for confirmed bookings) ───────────────────
  const policy     = canCancelBooking(event.startDate, booking?.status);
  const refundInfo = policy.canCancel
    ? getRefundAmount(booking?.totalAmount ?? 0, policy.hoursUntilEvent)
    : null;

  const handleDirectCancel = async () => {
    if (!confirm('Cancel this booking? (No payment was taken for pending bookings.)')) return;
    setCancellingLocal(true);
    try {
      await onDirectCancel?.(booking._id);
    } finally {
      setCancellingLocal(false);
    }
  };

  return (
    <div className="glass p-5 flex flex-col sm:flex-row gap-4 hover:border-white/10 transition-colors">
      {/* Event banner thumb */}
      {event.bannerImage ? (
        <img
          src={event.bannerImage}
          alt={event.title}
          className="w-full sm:w-28 h-24 sm:h-20 object-cover rounded-xl flex-shrink-0"
        />
      ) : (
        <div className="w-full sm:w-28 h-24 sm:h-20 bg-surface-border rounded-xl flex items-center justify-center flex-shrink-0">
          <CalendarDaysIcon className="w-8 h-8 text-primary-400/40" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Title & status badge */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <h3 className="font-semibold text-white truncate text-base">{event.title || 'Event'}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={statusVariant[booking?.status] ?? 'neutral'}>
              {booking?.status}
            </Badge>
            {booking?.bookingRef && (
              <span className="font-mono text-[10px] text-slate-500 uppercase">#{booking.bookingRef}</span>
            )}
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-col gap-1 mt-1.5 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CalendarDaysIcon className="w-3.5 h-3.5 text-primary-400" />
            {event.startDate ? formatDate(event.startDate) : 'Date TBD'}
          </div>
          {(event.venue?.city || event.venue?.name) && (
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="w-3.5 h-3.5 text-accent-400" />
              {event.venue?.city || event.venue?.name}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <TicketIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300 font-medium">
              {booking?.tickets?.length ?? 1} ticket(s) · {formatCurrency(booking?.totalAmount ?? 0)}
            </span>
          </div>
        </div>

        {/* ── Status-specific conditional messages ─────────────────────────── */}

        {/* Pending booking hint */}
        {isPending && (
          <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
            <ClockIcon className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] text-amber-400">
              Payment not yet verified. Complete payment or cancel this reservation.
            </span>
          </div>
        )}

        {/* Policy-based info */}
        {isConfirmed && !isCancelRequested && (
          <>
            {policy.canCancel && refundInfo && (
              <p className="text-[11px] text-emerald-400 mt-2.5 flex items-center gap-1 italic">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                {refundInfo.label} eligible if cancelled now
              </p>
            )}
            {!policy.canCancel && policy.reason === 'within_48_hours' && (
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-400/80 bg-amber-400/5 p-2 rounded-lg border border-amber-400/10">
                <XCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Cancellation locked — event starts in less than 48 hours</span>
              </div>
            )}
          </>
        )}

        {/* Cancellation pending status details */}
        {isCancelRequested && (
          <div className="mt-3 p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
             <p className="text-[11px] text-indigo-300 flex items-center gap-1.5">
               <ArrowPathIcon className="w-3.5 h-3.5 animate-spin-slow" />
               Cancellation request is being reviewed by admin
             </p>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex gap-2.5 mt-4 flex-wrap items-center">
          {/* View QR — Primary action if confirmed */}
          <Button size="sm" variant="secondary" onClick={() => onViewQr?.(booking)}>
            View QR
          </Button>

          {/* ── Cancellation Button Logic ──────────────────────────────────── */}

          {isCancelled ? (
            <Badge variant="danger" className="py-1 px-3">
              {isCancelApproved ? 'Cancelled (Refund Pending)' : 'Cancelled'}
            </Badge>

          ) : isCancelRequested ? (
            <Badge variant="ghost" className="text-indigo-400 border-indigo-500/30">
              Awaiting Admin Review
            </Badge>

          ) : isPending ? (
            /* Pending bookings can be cancelled immediately */
            <Button
              size="sm"
              variant="danger"
              loading={cancellingLocal}
              onClick={handleDirectCancel}
              className="text-xs px-4"
            >
              Cancel Reservation
            </Button>

          ) : policy.canCancel ? (
            /* Confirmed bookings follow the request flow if > 48h */
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRequestCancel?.(booking)}
              className="text-red-400 border border-red-500/20 hover:bg-red-500/10 hover:text-red-300 text-xs px-4"
            >
              Request Cancellation
            </Button>

          ) : null}
        </div>
      </div>
    </div>
  );
}
