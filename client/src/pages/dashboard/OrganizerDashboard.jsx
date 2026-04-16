import { useGetEventsQuery }   from '../../features/events/eventsApi';
import { useGetUserBookingsQuery } from '../../features/bookings/bookingsApi';
import { useAuth }              from '../../hooks/useAuth';
import RevenueChart   from '../../components/charts/RevenueChart';
import AttendeeChart  from '../../components/charts/AttendeeChart';
import { Link }       from 'react-router-dom';
import { 
  CalendarDaysIcon, 
  TicketIcon, 
  CurrencyRupeeIcon, 
  PlusCircleIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';
import BookingCard from '../../components/bookings/BookingCard';
import Spinner from '../../components/ui/Spinner';

export default function OrganizerDashboard() {
  const { user }  = useAuth();
  
  // Data for events organized by the user
  const { data: eventsData, isLoading: eventsLoading } = useGetEventsQuery({ organizer: 'me' });
  const events = Array.isArray(eventsData) ? eventsData : eventsData?.events ?? [];

  // Data for bookings made by the user
  const { data: bookingsData, isLoading: bookingsLoading } = useGetUserBookingsQuery();
  const bookings = (Array.isArray(bookingsData) ? bookingsData : bookingsData?.bookings ?? []).slice(0, 3);

  const totalRevenue = events.reduce((s, e) => s + (e.revenue ?? 0), 0);
  const totalAttendees = events.reduce((s, e) => s + (e.attendeeCount ?? 0), 0);

  // Build chart data from events
  const revenueData   = events.slice(0, 7).map((e) => ({ label: e.title?.slice(0, 10), revenue: e.revenue ?? 0 }));
  const attendeeData  = events.slice(0, 7).map((e) => ({ event: e.title?.slice(0, 10), attendees: e.attendeeCount ?? 0 }));

  const stats = [
    { label: 'Total Events',    value: events.length,   icon: CalendarDaysIcon,    color: 'text-primary-400' },
    { label: 'Total Attendees', value: totalAttendees,  icon: TicketIcon,          color: 'text-violet-400'  },
    { label: 'Total Revenue',   value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: CurrencyRupeeIcon, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name} 👋</p>
        </div>
        <Link to="/dashboard/events/new" className="btn-md btn-primary gap-1.5 shadow-glow-sm">
          <PlusCircleIcon className="w-4 h-4" /> New Event
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass group p-6 hover:border-white/10 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">{label}</span>
            </div>
            <p className="font-display font-bold text-3xl text-white tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Charts Section (LHS) */}
        <div className="xl:col-span-2 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart  data={revenueData}  />
            <AttendeeChart data={attendeeData} />
          </div>
        </div>

        {/* My Recent Personal Bookings (RHS Sidebar) */}
        <div className="xl:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TicketIcon className="w-5 h-5 text-emerald-400" />
              My Recent Bookings
            </h2>
            <Link to="/profile" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View All <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {bookingsLoading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : bookings.length === 0 ? (
              <div className="glass p-8 text-center">
                <p className="text-slate-500 text-sm">No personal bookings yet.</p>
                <Link to="/events" className="text-primary-400 text-xs mt-2 inline-block">Explore Events</Link>
              </div>
            ) : (
              bookings.map((bk) => (
                <div key={bk._id} className="scale-95 origin-top">
                   <BookingCard 
                     booking={bk} 
                     // Pass minimal handlers since this is an overview
                     onViewQr={() => {}} 
                   />
                </div>
              ))
            )}
          </div>

          {events.length === 0 && !eventsLoading && (
            <div className="glass p-10 mt-8 text-center border-dashed border-2 border-white/5">
              <CalendarDaysIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg mb-2">Host your first event!</h3>
              <p className="text-slate-400 text-sm mb-6">Create an event and start selling tickets today.</p>
              <Link to="/dashboard/events/new" className="btn-md btn-primary">Get Started</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
