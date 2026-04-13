import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';
import { UsersIcon, CalendarDaysIcon, CurrencyRupeeIcon, TicketIcon } from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axiosClient.get('/api/admin/stats');
        // ApiResponse shape: { success, data: { totalUsers, ... }, message }
        setStats(data?.data ?? data);
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>;

  const statCards = [
    { label: 'Total Users',     value: stats?.totalUsers    ?? '–', icon: UsersIcon,         color: 'text-blue-400'    },
    { label: 'Total Events',    value: stats?.totalEvents   ?? '–', icon: CalendarDaysIcon,   color: 'text-primary-400' },
    { label: 'Total Bookings',  value: stats?.totalBookings ?? '–', icon: TicketIcon,         color: 'text-violet-400'  },
    { label: 'Platform Revenue',value: stats?.totalRevenue != null ? `₹${Number(stats.totalRevenue).toLocaleString('en-IN')}` : '–', icon: CurrencyRupeeIcon, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview and statistics</p>
      </div>

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

      {/* placeholder for recent activity if needed */}
      <div className="glass p-6 text-center text-slate-400">
        Use the sidebar to navigate and manage platform resources.
      </div>
    </div>
  );
}
