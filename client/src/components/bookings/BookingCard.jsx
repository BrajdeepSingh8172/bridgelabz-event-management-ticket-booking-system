import { formatDate }      from '../../utils/formatDate';
import { formatCurrency }  from '../../utils/formatCurrency';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { CalendarDaysIcon, MapPinIcon, TicketIcon } from '@heroicons/react/24/outline';

const statusVariant = {
  confirmed: 'success',
  pending:   'warning',
  cancelled: 'danger',
};

export default function BookingCard({ booking, onCancel, onViewQr }) {
  const event = booking?.event || {};
  const canCancel = booking?.status === 'confirmed' || booking?.status === 'pending';

  return (
    <div className="glass p-5 flex flex-col sm:flex-row gap-4">
      {/* Event banner thumb */}
      {event.banner ? (
        <img
          src={event.banner}
          alt={event.title}
          className="w-full sm:w-28 h-24 sm:h-20 object-cover rounded-xl flex-shrink-0"
        />
      ) : (
        <div className="w-full sm:w-28 h-24 sm:h-20 bg-surface-border rounded-xl flex items-center justify-center flex-shrink-0">
          <CalendarDaysIcon className="w-8 h-8 text-primary-400/40" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <h3 className="font-semibold text-white truncate">{event.title || 'Event'}</h3>
          <Badge variant={statusVariant[booking?.status] ?? 'neutral'}>
            {booking?.status}
          </Badge>
        </div>

        <div className="flex flex-col gap-1 mt-1.5 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CalendarDaysIcon className="w-3.5 h-3.5 text-primary-400" />
            {formatDate(event.startDate)}
          </div>
          {event.city && (
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="w-3.5 h-3.5 text-accent-400" />
              {event.city}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <TicketIcon className="w-3.5 h-3.5 text-emerald-400" />
            {booking?.tickets?.length ?? 1} ticket(s) · {formatCurrency(booking?.totalAmount ?? 0)}
          </div>
        </div>

        <div className="flex gap-2 mt-3 flex-wrap">
          <Button size="sm" variant="secondary" onClick={() => onViewQr?.(booking)}>
            View QR
          </Button>
          {canCancel && (
            <Button size="sm" variant="danger" onClick={() => onCancel?.(booking._id)}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
