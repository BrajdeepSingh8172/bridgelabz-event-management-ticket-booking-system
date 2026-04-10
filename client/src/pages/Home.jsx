import { Link } from 'react-router-dom';
import { useGetFeaturedEventsQuery } from '../features/events/eventsApi';
import EventGrid from '../components/events/EventGrid';
import Button    from '../components/ui/Button';
import { CalendarDaysIcon, TicketIcon, UsersIcon, StarIcon } from '@heroicons/react/24/outline';

const STATS = [
  { icon: CalendarDaysIcon, label: 'Events Hosted',   value: '2,400+' },
  { icon: TicketIcon,       label: 'Tickets Sold',    value: '180K+'  },
  { icon: UsersIcon,        label: 'Happy Attendees', value: '95K+'   },
  { icon: StarIcon,         label: 'Avg Rating',      value: '4.9 ⭐'  },
];

export default function Home() {
  const { data, isLoading, error } = useGetFeaturedEventsQuery();
  const featured = Array.isArray(data) ? data : data?.events ?? [];

  return (
    <div className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-hero-glow pt-24 pb-20 px-4">
        {/* Background blobs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="container-app relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-sm text-xs font-medium text-primary-300 mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            Live events happening near you
          </div>

          <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl text-white leading-tight mb-6 animate-slide-up">
            Discover &amp;{' '}
            <span className="gradient-text">Experience</span>
            <br />Unforgettable Events
          </h1>

          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10 animate-fade-in">
            From concerts and tech conferences to food festivals — find, book, and manage
            events all in one place.
          </p>

          <div className="flex flex-wrap justify-center gap-4 animate-slide-up">
            <Link to="/events" className="btn-lg btn-primary">
              Browse Events →
            </Link>
            <Link to="/register" className="btn-lg btn-secondary">
              Become an Organizer
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <section className="container-app -mt-8 relative z-10 mb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(({ icon: Icon, label, value }) => (
            <div key={label} className="glass p-5 text-center hover:border-primary-500/40 transition-all">
              <Icon className="w-6 h-6 text-primary-400 mx-auto mb-2" />
              <p className="font-display font-bold text-2xl text-white">{value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Events ───────────────────────────────────────── */}
      <section className="container-app mb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-3xl text-white">Featured Events</h2>
            <p className="text-slate-400 mt-1">Hand-picked experiences you'll love</p>
          </div>
          <Link to="/events" className="btn-md btn-ghost text-primary-400 hover:text-primary-300">
            View all →
          </Link>
        </div>
        <EventGrid events={featured} isLoading={isLoading} error={error} />
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="container-app mb-20">
        <div className="relative glass overflow-hidden p-10 text-center rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/40 to-violet-900/40 pointer-events-none" />
          <div className="relative">
            <h2 className="font-display font-bold text-3xl text-white mb-3">
              Ready to host your own event?
            </h2>
            <p className="text-slate-400 max-w-md mx-auto mb-7">
              Create, promote, and manage your events with powerful tools built for organizers.
            </p>
            <Link to="/register" className="btn-lg btn-accent">
              Start for Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
