import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Home, Users, Bed, CreditCard, Utensils, ClipboardList, MessageSquare, Bell, ShieldCheck, Wallet, Menu, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import ChangePasswordModal from './ChangePasswordModal';
import NotificationCenter from './NotificationCenter';

export default function Layout() {
  const { userProfile, logout } = useAuth();
  const location = useLocation();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const adminLinks = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Rooms', href: '/rooms', icon: Bed },
    { name: 'Rent', href: '/rent', icon: CreditCard },
    { name: 'Expenses', href: '/expenses', icon: Wallet },
    { name: 'Menu & Inventory', href: '/kitchen', icon: Utensils },
    { name: 'Complaints', href: '/complaints', icon: ClipboardList },
    { name: 'Notices', href: '/notices', icon: Bell },
  ];

  const wardenLinks = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Rooms', href: '/rooms', icon: Bed },
    { name: 'Expenses', href: '/expenses', icon: Wallet },
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="h-24 flex items-center px-8 border-b border-slate-200/60">
        <div className="bg-brand-600 p-2.5 rounded-2xl shadow-lg shadow-brand-500/30 mr-4">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Nestify</h1>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none">by Gurpinder Labs</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-8 px-4">
        <nav className="space-y-1.5">
          {links.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={clsx(
                  isActive
                    ? 'bg-brand-50 text-brand-700 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
                  'group flex items-center px-4 py-3.5 text-sm font-medium rounded-2xl transition-all duration-200'
                )}
              >
                <Icon
                  className={clsx(
                    isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600',
                    'mr-4 flex-shrink-0 h-5 w-5 transition-colors'
                  )}
                  aria-hidden="true"
                />
                <span className="flex-1">{item.name}</span>
                {isActive && <ChevronRight className="w-4 h-4 text-brand-400" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center mb-6 p-2 rounded-2xl bg-white shadow-sm border border-slate-100">
          <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
            {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-semibold text-slate-900 truncate">{userProfile?.name}</p>
            <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">{userProfile?.role}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex items-center justify-center p-3 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all duration-200 border border-transparent hover:border-brand-100"
            title="Change Password"
          >
            <ShieldCheck className="w-5 h-5" />
          </button>
          <button
            onClick={logout}
            className="flex items-center justify-center p-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 border border-transparent hover:border-red-100"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 flex font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-80 bg-white border-r border-slate-200/60 flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-white z-50 lg:hidden shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-4 sm:px-8 shrink-0 z-30">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2.5 mr-4 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="lg:hidden flex items-center">
              <div className="bg-brand-600 p-1.5 rounded-xl mr-2.5">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 font-display">Nestify</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <NotificationCenter />
            <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block" />
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Welcome back</span>
              <span className="text-sm font-semibold text-slate-900">{userProfile?.name?.split(' ')[0]}</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold shadow-sm">
              {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </div>
  );
}

