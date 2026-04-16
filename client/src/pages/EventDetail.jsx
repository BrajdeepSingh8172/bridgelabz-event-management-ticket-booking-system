import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGetEventByIdQuery } from '../features/events/eventsApi';
import { useAuth }              from '../hooks/useAuth';
import { useSocket }            from '../hooks/useSocket';
import TicketSelector           from '../components/events/TicketSelector';
import CountdownTimer           from '../components/events/CountdownTimer';
import Badge   from '../components/ui/Badge';
import Button  from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { formatDateTime } from '../utils/formatDate';
import { CalendarDaysIcon, MapPinIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function EventDetail() {
  const { id }    = useParams();
  const navigate   = useNavigate();
  const { isAuth, isOrganizer, user } = useAuth();
  const { data: event, isLoading, error } = useGetEventByIdQuery(id);
  const [selections, setSelections] = useState(() => {
    // Restore saved selections for this event (survives login redirect)
    try {
      const saved = sessionStorage.getItem(`sel_${id}`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  useSocket(); // real-time seat updates

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error || !event)
    return (
      <div className="container-app py-20 text-center">
        <p className="text-red-400 mb-4">Event not found.</p>
        <Link to="/events" className="btn-md btn-secondary">← Back to Events</Link>
      </div>
    );

  const tickets    = event.ticketTypes ?? [];
  const totalLeft  = tickets.reduce((s, t) => s + (t.totalQuantity - t.soldQuantity), 0);
  const soldOut    = tickets.length > 0 && totalLeft <= 0;
  const hasSelected = Object.values(selections).some((q) => q > 0);

  const handleBook = () => {
    if (!isAuth) {
      // Save selections so they survive the login redirect
      try { sessionStorage.setItem(`sel_${id}`, JSON.stringify(selections)); } catch { /* ignore */ }
      navigate(`/login?next=/events/${id}`);
      return;
    }
    // Clear saved selections once we navigate to checkout
    try { sessionStorage.removeItem(`sel_${id}`); } catch { /* ignore */ }
    navigate(`/checkout/${id}`, { state: { selections, event } });
  };

  return (
    <div className="container-app py-10">
      {/* Banner */}
      <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-8 bg-surface-border">
        {event.bannerImage ? (
          <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-900/60 to-violet-900/60 flex items-center justify-center">
            <CalendarDaysIcon className="w-20 h-20 text-primary-400/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />
        <div className="absolute bottom-4 left-4 flex gap-2 flex-wrap">
          {event.category && <Badge variant="primary">{event.category}</Badge>}
          {event.isFeatured && <Badge variant="success">⭐ Featured</Badge>}
          {soldOut && <Badge variant="danger">Sold Out</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="font-display font-black text-3xl md:text-4xl text-white">{event.title}</h1>

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-400">
              <div className="flex items-center gap-1.5">
                <CalendarDaysIcon className="w-4 h-4 text-primary-400" />
                {formatDateTime(event.startDate)}
                {event.endDate && ` — ${formatDateTime(event.endDate)}`}
              </div>
              {event.venue && (
                <div className="flex items-center gap-1.5">
                  <MapPinIcon className="w-4 h-4 text-accent-400" />
                  {event.venue?.name}{event.venue?.city ? `, ${event.venue.city}` : ''}
                </div>
              )}
              {event.organizer && (
                <div className="flex items-center gap-1.5">
                  <UserCircleIcon className="w-4 h-4 text-violet-400" />
                  By {event.organizer?.name ?? 'Organizer'}
                </div>
              )}
            </div>

            {event.startDate && new Date(event.startDate) > new Date() && (
              <div className="mt-4">
                <CountdownTimer targetDate={event.startDate} />
              </div>
            )}
          </div>

          <div className="glass-sm p-5">
            <h2 className="font-semibold text-white mb-3">About this event</h2>
            <p className="text-slate-300 leading-relaxed whitespace-pre-line">{event.description}</p>
          </div>
        </div>

        {/* Ticket sidebar */}
        <div className="space-y-4">
          <div className="glass p-5 sticky top-20">
            <h2 className="font-semibold text-white mb-4">Select Tickets</h2>

            {tickets.length > 0 ? (
              <TicketSelector ticketTypes={tickets} onChange={setSelections} />
            ) : (
              <div className="text-center py-2">
                <p className="text-slate-400 text-sm mb-3">No tickets available yet.</p>
                {isOrganizer && event.organizer?._id === (user?.id ?? user?._id) && (
                  <Link
                    to={`/dashboard/events/${id}/tickets`}
                    className="btn-sm btn-secondary text-xs"
                  >
                    + Add Tickets
                  </Link>
                )}
              </div>
            )}

            {/* Helper hint */}
            {tickets.length > 0 && !hasSelected && !soldOut && (
              <p className="text-xs text-amber-400/80 text-center mt-3">
                ☝️ Select at least 1 ticket above to continue
              </p>
            )}

            <Button
              onClick={handleBook}
              disabled={soldOut || tickets.length === 0 || (!hasSelected && tickets.length > 0)}
              className={`w-full btn-lg mt-4 ${
                soldOut || tickets.length === 0
                  ? 'btn-secondary opacity-60 cursor-not-allowed'
                  : hasSelected
                  ? 'btn-primary'
                  : 'btn-secondary opacity-70'
              }`}
            >
              {soldOut
                ? '🚫 Sold Out'
                : tickets.length === 0
                ? '⏳ Tickets Coming Soon'
                : !hasSelected
                ? 'Select Tickets Above'
                : '🎟️ Book Now →'}
            </Button>

            {!isAuth && !soldOut && tickets.length > 0 && (
              <p className="text-center text-xs text-slate-500 mt-2">
                You'll be asked to sign in
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
