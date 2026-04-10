import { useGetEventsQuery, useDeleteEventMutation } from '../../features/events/eventsApi';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { formatDate } from '../../utils/formatDate';
import { TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ManageEvents() {
  const { data, isLoading } = useGetEventsQuery({});
  const [deleteEvent] = useDeleteEventMutation();
  const events = Array.isArray(data) ? data : data?.events ?? [];

  const handleDelete = async (id, title) => {
    if (!confirm(`Force delete event "${title}"?`)) return;
    try {
      await deleteEvent(id).unwrap();
      toast.success('Event deleted');
    } catch {
      toast.error('Failed to delete event');
    }
  };

  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Manage Events</h1>
        <p className="page-subtitle">Platform-wide event moderation</p>
      </div>

      <div className="glass overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-surface-border text-slate-400">
              <th className="px-5 py-3 font-medium">Event Name</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Organizer</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev._id} className="border-b border-surface-border/50 hover:bg-white/3">
                <td className="px-5 py-4">
                  <p className="font-medium text-white truncate max-w-[250px]">{ev.title}</p>
                  <p className="text-xs text-slate-500">{formatDate(ev.startDate)}</p>
                </td>
                <td className="px-4 py-4 text-slate-300 hidden sm:table-cell">{ev.organizer?.name ?? 'Unknown'}</td>
                <td className="px-4 py-4 hidden md:table-cell">
                   <Badge variant={ev.status === 'published' ? 'success' : 'warning'}>
                      {ev.status ?? 'draft'}
                    </Badge>
                </td>
                <td className="px-4 py-4 text-right">
                  <button onClick={() => handleDelete(ev._id, ev.title)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/20">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
