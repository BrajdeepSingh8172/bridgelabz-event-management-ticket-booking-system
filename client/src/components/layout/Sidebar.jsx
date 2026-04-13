import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Squares2X2Icon,
  CalendarDaysIcon,
  PlusCircleIcon,
  QrCodeIcon,
  UsersIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const organizerLinks = [
  { to: '/dashboard',            icon: Squares2X2Icon,   label: 'Overview'       },
  { to: '/dashboard/events',     icon: CalendarDaysIcon, label: 'My Events'      },
  { to: '/dashboard/events/new', icon: PlusCircleIcon,   label: 'Create Event'   },
  { to: '/dashboard/scanner',    icon: QrCodeIcon,       label: 'QR Scanner'     },
];

const adminLinks = [
  { to: '/admin',         icon: ShieldCheckIcon, label: 'Admin Overview' },
  { to: '/admin/users',   icon: UsersIcon,       label: 'Manage Users'   },
  { to: '/admin/events',  icon: CalendarDaysIcon, label: 'Manage Events' },
];

export default function Sidebar({ onClose }) {
  const { isAdmin, isOrganizer } = useAuth();
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
        {links.map(({ to, icon: Icon, label }) => (
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
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
