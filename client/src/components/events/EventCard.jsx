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

  const minPrice = event.ticketTypes?.length
    ? Math.min(...event.ticketTypes.map((t) => t.price))
    : event.price ?? 0;

  const color = categoryColors[event.category?.toLowerCase()] ?? categoryColors.default;
  const totalCapacity  = event.ticketTypes?.reduce((s, t) => s + t.capacity, 0)  ?? event.capacity  ?? 0;
  const totalRemaining = event.ticketTypes?.reduce((s, t) => s + (t.remaining ?? t.capacity), 0) ?? event.capacity ?? 0;
  const soldOut = totalRemaining <= 0;

  return (
    <Link
      to={`/events/${event._id}`}
      className="group glass hover:border-primary-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow overflow-hidden flex flex-col"
    >
      {/* Banner */}
      <div className="relative h-44 overflow-hidden rounded-t-2xl bg-surface-border">
        {event.banner ? (
          <img
            src={event.banner}
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
          {event.city && (
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="w-3.5 h-3.5 text-accent-400 flex-shrink-0" />
              <span className="truncate">{event.city}</span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <UsersIcon className="w-3.5 h-3.5" />
            <span>{totalRemaining} left</span>
          </div>
          <span className="font-display font-bold text-primary-300 text-sm">
            {minPrice === 0 ? 'Free' : `from ${formatCurrency(minPrice)}`}
          </span>
        </div>
      </div>
    </Link>
  );
}
