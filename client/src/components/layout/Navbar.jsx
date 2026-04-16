import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  Bars3Icon,
  XMarkIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  Squares2X2Icon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const navLinks = [
  { to: '/',       label: 'Home'   },
  { to: '/events', label: 'Events' },
];

export default function Navbar() {
  const { user, isAuth, isOrganizer, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled ? 'bg-surface/90 backdrop-blur-xl border-b border-surface-border shadow-card' : 'bg-transparent'
      }`}
    >
      <div className="container-app">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow">
              <CalendarDaysIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg gradient-text">EventHub</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-600/20 text-primary-300'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right section */}
          <div className="hidden md:flex items-center gap-3">
            {!isAuth ? (
              <>
                {!isOrganizer && (
                  <Link to="/register" className="text-sm text-slate-400 hover:text-white transition-colors">
                    Become Organizer
                  </Link>
                )}
                <Link to="/login"    className="btn-sm btn-secondary">Sign In</Link>
                <Link to="/register" className="btn-sm btn-primary">Get Started</Link>
              </>
            ) : (
              <>
                {isOrganizer && (
                  <Link to="/dashboard" className="btn-sm btn-secondary gap-1.5">
                    <Squares2X2Icon className="w-4 h-4" /> Dashboard
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin" className="btn-sm btn-secondary gap-1.5">
                    <ShieldCheckIcon className="w-4 h-4" /> Admin
                  </Link>
                )}

                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/5 transition-colors">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-500/50" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-sm font-semibold text-white">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="text-sm text-slate-300 max-w-[120px] truncate">{user?.name}</span>
                  </Menu.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-48 glass-sm shadow-card focus:outline-none overflow-hidden">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <Link to="/profile" className={`flex items-center gap-2.5 px-4 py-2.5 text-sm ${active ? 'bg-white/5 text-white' : 'text-slate-300'}`}>
                              <UserCircleIcon className="w-4 h-4" /> My Profile
                            </Link>
                          )}
                        </Menu.Item>
                        <div className="border-t border-surface-border my-1" />
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={logout}
                              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 ${active ? 'bg-red-500/10' : ''}`}
                            >
                              Sign Out
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-white/5 text-slate-300"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-surface-border bg-surface/95 backdrop-blur-xl animate-slide-down">
          <div className="container-app py-4 flex flex-col gap-1">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-xl text-sm font-medium ${isActive ? 'bg-primary-600/20 text-primary-300' : 'text-slate-300'}`
                }
              >
                {label}
              </NavLink>
            ))}
            <div className="border-t border-surface-border my-2" />
            {!isAuth ? (
              <div className="flex flex-col gap-2">
                <Link to="/login"    onClick={() => setMobileOpen(false)} className="btn-md btn-secondary">Sign In</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-md btn-primary">Get Started</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {isOrganizer && <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="btn-md btn-secondary">Dashboard</Link>}
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="btn-md btn-secondary">Profile</Link>
                <button onClick={() => { logout(); setMobileOpen(false); }} className="btn-md btn-danger">Sign Out</button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
