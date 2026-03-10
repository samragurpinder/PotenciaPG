import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Home, Users, Bed, CreditCard, Utensils, ClipboardList, MessageSquare, Bell } from 'lucide-react';
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
                userProfile?.role === 'student' ? studentLinks :
                userProfile?.role === 'cook' ? cookLinks : [];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-indigo-600">Smart PG</h1>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2 space-y-1">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    location.pathname === item.href
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                  )}
                >
                  <Icon
                    className={clsx(
                      location.pathname === item.href ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 flex-shrink-0 h-5 w-5'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{userProfile?.name}</p>
              <p className="text-xs font-medium text-gray-500 capitalize">{userProfile?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
