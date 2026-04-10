import { Link } from 'react-router-dom';
import { useGetEventsQuery, useDeleteEventMutation } from '../../features/events/eventsApi';
import { useAuth }   from '../../hooks/useAuth';
import Badge   from '../../components/ui/Badge';
import Button  from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { formatDate } from '../../utils/formatDate';
import { PlusCircleIcon, PencilSquareIcon, TrashIcon, TicketIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function MyEvents() {
  const { data, isLoading } = useGetEventsQuery({ organizer: 'me' });
  const [deleteEvent] = useDeleteEventMutation();
  const events = Array.isArray(data) ? data : data?.events ?? [];

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await deleteEvent(id).unwrap();
      toast.success('Event deleted.');
    } catch {
      toast.error('Failed to delete event.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">My Events</h1>
          <p className="page-subtitle">{events.length} event{events.length !== 1 ? 's' : ''} created</p>
        </div>
        <Link to="/dashboard/events/new" className="btn-md btn-primary gap-1.5">
          <PlusCircleIcon className="w-4 h-4" /> Create Event
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : events.length === 0 ? (
        <div className="glass p-16 text-center">
          <div className="text-5xl mb-4">🎭</div>
          <h3 className="font-semibold text-white mb-2">No events yet</h3>
          <p className="text-slate-400 mb-6">Create your first event and start selling tickets.</p>
          <Link to="/dashboard/events/new" className="btn-md btn-primary">Create Event</Link>
        </div>
      ) : (
        <div className="glass overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-slate-400">
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev._id} className="border-b border-surface-border/50 hover:bg-white/3 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-white truncate max-w-[200px]">{ev.title}</p>
                    {ev.city && <p className="text-xs text-slate-500">{ev.city}</p>}
                  </td>
                  <td className="px-4 py-4 text-slate-400 hidden sm:table-cell">{formatDate(ev.startDate)}</td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <Badge variant={ev.status === 'published' ? 'success' : 'warning'}>
                      {ev.status ?? 'draft'}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/dashboard/events/${ev._id}/edit`} className="p-1.5 rounded-lg hover:bg-primary-600/20 text-slate-400 hover:text-primary-300 transition-colors">
                        <PencilSquareIcon className="w-4 h-4" />
                      </Link>
                      <Link to={`/dashboard/events/${ev._id}/tickets`} className="p-1.5 rounded-lg hover:bg-violet-600/20 text-slate-400 hover:text-violet-300 transition-colors">
                        <TicketIcon className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(ev._id, ev.title)} className="p-1.5 rounded-lg hover:bg-red-600/20 text-slate-400 hover:text-red-400 transition-colors">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
