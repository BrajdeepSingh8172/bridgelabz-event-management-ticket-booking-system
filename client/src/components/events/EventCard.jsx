import { Link } from 'react-router-dom';
import { CalendarDaysIcon, MapPinIcon, TicketIcon, UsersIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import Badge from '../ui/Badge';

const categoryColors = {
  music:       'primary',
  tech:        'success',
  sports:      'accent',
  food:        'warning',
  art:         'neutral',
  business:    'primary',
  education:   'success',
  default:     'neutral',
};

export default function EventCard({ event }) {
  if (!event) return null;

  // Use ticket types if available (detail page), otherwise fall back to event-level capacity
  const hasTicketTypes = event.ticketTypes?.length > 0;

  const minPrice = hasTicketTypes
    ? Math.min(...event.ticketTypes.map((t) => t.price))
    : 0; // events without tickets are free to browse

  const color = categoryColors[event.category?.toLowerCase()] ?? categoryColors.default;

  // Remaining seats: prefer ticket-level data, fall back to event totalCapacity - soldCount
  const totalRemaining = hasTicketTypes
    ? event.ticketTypes.reduce((s, t) => s + (t.totalQuantity - (t.soldQuantity ?? 0)), 0)
    : Math.max(0, (event.totalCapacity ?? 0) - (event.soldCount ?? 0));

  // Only show "sold out" when capacity is known AND exhausted
  const soldOut = event.totalCapacity > 0 && totalRemaining <= 0;

  return (
    <Link
      to={`/events/${event._id}`}
      className="group glass hover:border-primary-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow overflow-hidden flex flex-col"
    >
      {/* Banner */}
      <div className="relative h-44 overflow-hidden rounded-t-2xl bg-surface-border">
        {event.bannerImage ? (
          <img
            src={event.bannerImage}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-900/60 to-violet-900/60 flex items-center justify-center">
            <CalendarDaysIcon className="w-12 h-12 text-primary-400/40" />
          </div>
        )}
        {/* overlay badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {event.isFeatured && <Badge variant="primary">⭐ Featured</Badge>}
          {soldOut && <Badge variant="danger">Sold Out</Badge>}
        </div>
        {event.category && (
          <div className="absolute top-3 right-3">
            <Badge variant={color}>{event.category}</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-display font-semibold text-white line-clamp-2 group-hover:text-primary-300 transition-colors">
          {event.title}
        </h3>

        <div className="flex flex-col gap-1.5 text-sm text-slate-400">
          <div className="flex items-center gap-1.5">
            <CalendarDaysIcon className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
            <span>{formatDate(event.startDate)}</span>
          </div>
          {(event.venue?.city || event.venue?.name) && (
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="w-3.5 h-3.5 text-accent-400 flex-shrink-0" />
              <span className="truncate">{event.venue?.city || event.venue?.name}</span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <UsersIcon className="w-3.5 h-3.5" />
            <span>
              {event.totalCapacity > 0
                ? `${totalRemaining} left`
                : 'Open'}
            </span>
          </div>
          <span className="font-display font-bold text-primary-300 text-sm">
            {minPrice === 0 ? 'Free' : `from ${formatCurrency(minPrice)}`}
          </span>
        </div>
      </div>
    </Link>
  );
}
