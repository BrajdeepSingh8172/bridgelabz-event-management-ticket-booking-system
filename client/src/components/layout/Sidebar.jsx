import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useGetPendingCancellationsQuery } from '../../features/bookings/bookingsApi';
import {
  Squares2X2Icon,
  CalendarDaysIcon,
  PlusCircleIcon,
  QrCodeIcon,
  UsersIcon,
  ShieldCheckIcon,
  XMarkIcon,
  ReceiptRefundIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';

const organizerLinks = [
  { to: '/profile',              icon: TicketIcon,       label: 'My Bookings'    },
  { to: '/dashboard',            icon: Squares2X2Icon,   label: 'Overview'       },
  { to: '/dashboard/events',     icon: CalendarDaysIcon, label: 'My Events'      },
  { to: '/dashboard/events/new', icon: PlusCircleIcon,   label: 'Create Event'   },
  { to: '/dashboard/scanner',    icon: QrCodeIcon,       label: 'QR Scanner'     },
];

const staticAdminLinks = [
  { to: '/admin',                  icon: ShieldCheckIcon,    label: 'Admin Overview'       },
  { to: '/admin/users',            icon: UsersIcon,          label: 'Manage Users'         },
  { to: '/admin/events',           icon: CalendarDaysIcon,   label: 'Manage Events'        },
  { to: '/admin/cancellations',    icon: ReceiptRefundIcon,  label: 'Cancellation Requests', badge: true },
];

export default function Sidebar({ onClose }) {
  const { isAdmin } = useAuth();

  // Fetch pending cancellations count for admin badge (skip if not admin)
  const { data: pendingRequests } = useGetPendingCancellationsQuery(undefined, {
    skip: !isAdmin,
    pollingInterval: 60000, // refresh every 60s
  });
  const pendingCount = pendingRequests?.length ?? 0;

  const adminLinks = staticAdminLinks;
  const links = isAdmin ? [...organizerLinks, ...adminLinks] : organizerLinks;

  return (
    <aside className="flex flex-col h-full w-64 bg-surface-card border-r border-surface-border">
      <div className="flex items-center justify-between p-5 border-b border-surface-border">
        <span className="font-display font-bold gradient-text text-lg">Dashboard</span>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-slate-400">
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {links.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard' || to === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-600/20 text-primary-300 shadow-glow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {badge && pendingCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

