import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar  from '../components/layout/Navbar';
import { Bars3Icon } from '@heroicons/react/24/outline';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Navbar />

      <div className="flex flex-1 pt-16">
        {/* Desktop sidebar */}
        <div className="hidden lg:block sticky top-16 h-[calc(100vh-4rem)]">
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0">
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex-1 overflow-auto">
          {/* Mobile sidebar toggle */}
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-surface-border">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-white/5 text-slate-400"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            <span className="text-sm text-slate-400">Dashboard</span>
          </div>

          <div className="container-app py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
