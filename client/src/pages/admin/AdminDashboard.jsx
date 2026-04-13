import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { useGetFraudReportQuery } from '../../features/tickets/ticketsApi';
import Spinner from '../../components/ui/Spinner';
import {
  UsersIcon, CalendarDaysIcon, CurrencyRupeeIcon, TicketIcon,
  ExclamationTriangleIcon, QrCodeIcon, ShieldExclamationIcon,
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventId, setEventId] = useState('');
  const [queryEventId, setQueryEventId] = useState('');

  useEffect(() => {
    axiosClient.get('/api/admin/stats')
      .then(({ data }) => setStats(data?.data ?? data))
      .catch((err) => console.error('Failed to load admin stats', err))
      .finally(() => setLoading(false));
  }, []);

  const {
    data: fraudData,
    isLoading: fraudLoading,
    isFetching: fraudFetching,
    error: fraudError,
  } = useGetFraudReportQuery(queryEventId, { skip: !queryEventId });

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>;

  const statCards = [
    { label: 'Total Users',      value: stats?.totalUsers    ?? '–', icon: UsersIcon,           color: 'text-blue-400'    },
    { label: 'Total Events',     value: stats?.totalEvents   ?? '–', icon: CalendarDaysIcon,     color: 'text-primary-400' },
    { label: 'Total Bookings',   value: stats?.totalBookings ?? '–', icon: TicketIcon,           color: 'text-violet-400'  },
    {
      label: 'Platform Revenue',
      value: stats?.totalRevenue != null
        ? `₹${Number(stats.totalRevenue).toLocaleString('en-IN')}`
        : '–',
      icon: CurrencyRupeeIcon,
      color: 'text-emerald-400',
    },
  ];

  const summary    = fraudData?.summary ?? {};
  const suspicious = fraudData?.suspicious ?? [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview, statistics, and fraud detection</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass p-5">
            <div className="flex items-center gap-3 mb-2">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-sm text-slate-400">{label}</span>
            </div>
            <p className="font-display font-bold text-2xl text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Fraud Detection Section ───────────────────────────────────────── */}
      <div className="glass p-6 space-y-5">
        <div className="flex items-center gap-2">
          <ShieldExclamationIcon className="w-5 h-5 text-amber-400" />
          <h2 className="font-display font-semibold text-white text-lg">QR Fraud Detection</h2>
        </div>
        <p className="text-slate-400 text-sm">
          Enter an Event ID to see suspicious scan activity — tickets attempted more than once.
        </p>

        {/* Event ID input */}
        <div className="flex gap-3">
          <input
            type="text"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            placeholder="Paste Event ID (MongoDB ObjectId)…"
            className="input flex-1 font-mono text-sm"
          />
          <button
            onClick={() => setQueryEventId(eventId.trim())}
            disabled={!eventId.trim() || fraudLoading || fraudFetching}
            className="btn-md btn-primary"
          >
            {fraudLoading || fraudFetching ? '…' : 'Analyze'}
          </button>
        </div>

        {fraudError && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <ExclamationTriangleIcon className="w-4 h-4" />
            {fraudError?.data?.message ?? 'Failed to fetch fraud report'}
          </div>
        )}

        {/* Summary cards */}
        {queryEventId && !fraudLoading && !fraudError && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Tickets',  value: summary.total      ?? 0, color: 'text-white'      },
                { label: 'Used',           value: summary.used       ?? 0, color: 'text-emerald-400' },
                { label: 'Fraud Attempts', value: summary.fraudulent ?? 0, color: 'text-red-400'    },
                { label: 'Avg Scans',      value: summary.avgScans   != null ? Number(summary.avgScans).toFixed(2) : '0', color: 'text-amber-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="glass-sm p-4 rounded-xl text-center">
                  <p className={`font-bold text-xl ${color}`}>{value}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Suspicious tickets table */}
            {suspicious.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm py-2">
                <QrCodeIcon className="w-4 h-4" />
                No suspicious activity found for this event. ✅
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-surface-border">
                      <th className="pb-3 pr-4">Ticket Code</th>
                      <th className="pb-3 pr-4">Holder</th>
                      <th className="pb-3 pr-4">Email</th>
                      <th className="pb-3 pr-4 text-center">Scan Attempts</th>
                      <th className="pb-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suspicious.map((t) => (
                      <tr key={t._id} className="border-b border-surface-border/50 hover:bg-white/2">
                        <td className="py-3 pr-4 font-mono text-xs text-primary-300">{t.ticketCode}</td>
                        <td className="py-3 pr-4 text-white">{t.user?.name ?? '—'}</td>
                        <td className="py-3 pr-4 text-slate-400">{t.user?.email ?? '—'}</td>
                        <td className="py-3 pr-4 text-center">
                          <span className={`font-bold ${t.scanAttempts > 3 ? 'text-red-400' : 'text-amber-400'}`}>
                            {t.scanAttempts}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          {t.isUsed ? (
                            <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">Used</span>
                          ) : (
                            <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Valid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sidebar hint */}
      <div className="glass p-5 text-center text-slate-400 text-sm">
        Use the sidebar to navigate and manage platform resources.
      </div>
    </div>
  );
}
