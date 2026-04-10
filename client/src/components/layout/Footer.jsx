import { Link } from 'react-router-dom';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

export default function Footer() {
  return (
    <footer className="bg-surface-card border-t border-surface-border mt-auto">
      <div className="container-app py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
                <CalendarDaysIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg gradient-text">EventHub</span>
            </div>
            <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
              Discover, create, and manage unforgettable events. Your all-in-one platform for event management and ticket booking.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/events',   label: 'Browse Events' },
                { to: '/register', label: 'Become Organizer' },
                { to: '/login',    label: 'Sign In' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-slate-400 hover:text-primary-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2.5">
              {['Help Center', 'Privacy Policy', 'Terms of Service', 'Contact Us'].map((item) => (
                <li key={item}>
                  <span className="text-sm text-slate-400 cursor-pointer hover:text-primary-400 transition-colors">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="divider" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} EventHub. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-slate-500 text-sm">
            Built with <span className="text-red-400 mx-1">♥</span> for creators
          </div>
        </div>
      </div>
    </footer>
  );
}
