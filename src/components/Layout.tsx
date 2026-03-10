import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Home, Users, Bed, CreditCard, Utensils, ClipboardList, MessageSquare, Bell, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
  const { userProfile, logout } = useAuth();
  const location = useLocation();

  const adminLinks = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Rooms', href: '/rooms', icon: Bed },
    { name: 'Rent', href: '/rent', icon: CreditCard },
    { name: 'Menu & Inventory', href: '/kitchen', icon: Utensils },
    { name: 'Complaints', href: '/complaints', icon: ClipboardList },
    { name: 'Notices', href: '/notices', icon: Bell },
  ];

  const wardenLinks = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Rooms', href: '/rooms', icon: Bed },
    { name: 'Complaints', href: '/complaints', icon: ClipboardList },
    { name: 'Notices', href: '/notices', icon: Bell },
  ];

  const studentLinks = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'My Rent', href: '/my-rent', icon: CreditCard },
    { name: 'Complaints', href: '/my-complaints', icon: ClipboardList },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
  ];

  const cookLinks = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Menu', href: '/menu', icon: Utensils },
    { name: 'Inventory', href: '/inventory', icon: ClipboardList },
  ];

  const links = userProfile?.role === 'admin' ? adminLinks :
                userProfile?.role === 'warden' ? wardenLinks :
                userProfile?.role === 'student' ? studentLinks :
                userProfile?.role === 'cook' ? cookLinks : [];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <div className="w-72 bg-indigo-900 text-white shadow-xl flex flex-col">
        <div className="h-20 flex items-center px-8 border-b border-indigo-800">
          <ShieldCheck className="w-8 h-8 text-indigo-400 mr-3" />
          <h1 className="text-2xl font-bold tracking-tight">Smart PG</h1>
        </div>
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="px-4 space-y-2">
            {links.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    isActive
                      ? 'bg-indigo-800 text-white shadow-sm'
                      : 'text-indigo-200 hover:bg-indigo-800/50 hover:text-white',
                    'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200'
                  )}
                >
                  <Icon
                    className={clsx(
                      isActive ? 'text-indigo-300' : 'text-indigo-400 group-hover:text-indigo-300',
                      'mr-4 flex-shrink-0 h-5 w-5 transition-colors'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-6 border-t border-indigo-800 bg-indigo-950/30">
          <div className="flex items-center mb-6">
            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
              {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-white">{userProfile?.name}</p>
              <p className="text-xs font-medium text-indigo-300 capitalize">{userProfile?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2.5 border border-indigo-700 rounded-xl shadow-sm text-sm font-medium text-indigo-100 bg-indigo-800 hover:bg-indigo-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-indigo-900 transition-all"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

