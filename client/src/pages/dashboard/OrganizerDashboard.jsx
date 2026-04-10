import { useGetEventsQuery }   from '../../features/events/eventsApi';
import { useGetUserBookingsQuery } from '../../features/bookings/bookingsApi';
import { useAuth }              from '../../hooks/useAuth';
import RevenueChart   from '../../components/charts/RevenueChart';
import AttendeeChart  from '../../components/charts/AttendeeChart';
import { Link }       from 'react-router-dom';
import { CalendarDaysIcon, TicketIcon, CurrencyRupeeIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

export default function OrganizerDashboard() {
  const { user }  = useAuth();
  const { data: eventsData } = useGetEventsQuery({ organizer: 'me' });
  const events = Array.isArray(eventsData) ? eventsData : eventsData?.events ?? [];

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
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name} 👋</p>
        </div>
        <Link to="/dashboard/events/new" className="btn-md btn-primary gap-1.5">
          <PlusCircleIcon className="w-4 h-4" /> New Event
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass p-5">
            <div className="flex items-center gap-3 mb-2">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-sm text-slate-400">{label}</span>
            </div>
            <p className="font-display font-bold text-2xl text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart  data={revenueData}  />
        <AttendeeChart data={attendeeData} />
      </div>
    </div>
  );
}
