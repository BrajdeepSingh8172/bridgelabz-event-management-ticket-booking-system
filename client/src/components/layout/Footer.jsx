import { Link } from 'react-router-dom';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

export default function Footer() {
  const techStack = [
    'MongoDB Atlas', 'Express.js', 'React.js', 'Node.js', 
    'Razorpay', 'JWT Auth', 'Cloudinary', 'Socket.IO'
  ];

  return (
    <footer className="bg-surface-card border-t border-surface-border mt-auto">
      <div className="container-app py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
                <CalendarDaysIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg gradient-text">EventHub</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Discover, create, and manage unforgettable events. Your all-in-one platform for event management and ticket booking.
            </p>
            <div className="text-sm text-slate-400">
              Built by Brajdeep Singh <span className="text-red-400 mx-1">❤️</span>
            </div>
            <a 
              href="https://github.com/BrajdeepSingh8172/bridgelabz-event-management-ticket-booking-system" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300 text-sm mt-1 transition-colors inline-block"
            >
              View on GitHub &rarr;
            </a>
          </div>

          {/* Column 2: Platform */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Platform</h4>
            <ul className="space-y-3">
              {[
                { to: '/events', label: 'Browse Events' },
                { to: '/register', label: 'Become Organizer' },
                { to: '/login', label: 'Sign In' },
                { to: '/dashboard/events/new', label: 'Create Event' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-slate-400 hover:text-primary-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Tech Stack */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Built With</h4>
            <div className="flex flex-wrap gap-2 text-sm text-slate-400">
              {techStack.map((tech) => (
                <span 
                  key={tech} 
                  className="px-2.5 py-1 border border-surface-border rounded-lg bg-surface/50 text-xs text-slate-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Column 4: Connect */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Connect</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                <a 
                  href="https://github.com/BrajdeepSingh8172" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary-400 transition-colors"
                >
                  github.com/BrajdeepSingh8172
                </a>
              </li>
              <li>
                <a 
                  href="mailto:brajdeepsingh8172@gmail.com" 
                  className="hover:text-primary-400 transition-colors"
                >
                  brajdeepsingh8172@gmail.com
                </a>
              </li>
              <li className="text-slate-400">
                GLA University, Mathura, U.P.
              </li>
              <li>
                <a 
                  href="#" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary-400 transition-colors"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="divider mt-12 mb-8 border-t border-surface-border" />
        
        {/* Bottom Bar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center lg:text-left">
          <p>© 2026 EventHub. All rights reserved.</p>
          <p className="font-medium text-slate-400">
            B.Tech CSE <span className="mx-1.5 opacity-50">|</span> 
            GLA University <span className="mx-1.5 opacity-50">|</span> 
            BridgeLab Mini Project
          </p>
          <p>
            Built with <span className="text-red-400 mx-1">❤️</span> by Brajdeep Singh
          </p>
        </div>
      </div>
    </footer>
  );
}
