import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import Users from './pages/admin/Users';
import Rooms from './pages/admin/Rooms';
import Rent from './pages/admin/Rent';
import Complaints from './pages/admin/Complaints';
import Notices from './pages/admin/Notices';
import Expenses from './pages/admin/Expenses';
import StudentDashboard from './pages/student/StudentDashboard';
import MyRent from './pages/student/MyRent';
import MyComplaints from './pages/student/MyComplaints';
import CookDashboard from './pages/cook/CookDashboard';
import Menu from './pages/cook/Menu';
import Inventory from './pages/cook/Inventory';
import Chat from './pages/Chat';
import Layout from './components/Layout';
import WardenDashboard from './pages/warden/WardenDashboard';

function PrivateRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) return null; // Handled by AuthProvider
  if (!currentUser) return <Navigate to="/login" />;
  
  // If we have a user but no profile yet, show loading
  if (!userProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-t-4 border-brand-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-4 border-indigo-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          <div className="absolute inset-4 rounded-full border-b-4 border-rose-500 animate-spin" style={{ animationDuration: '2s' }}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-brand-600 animate-pulse" />
          </div>
        </div>
        <h2 className="mt-6 text-2xl font-bold text-slate-900 font-display tracking-tight">Nestify</h2>
        <p className="text-sm text-slate-500 font-medium mt-2 animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  if (userProfile && !allowedRoles.includes(userProfile.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50">
        <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-slate-500 mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { currentUser, userProfile } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
      
      <Route path="/" element={
        <PrivateRoute allowedRoles={['admin', 'warden', 'cook', 'student', 'cleaner']}>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={
          !userProfile ? null :
          userProfile.role === 'admin' ? <AdminDashboard /> :
          userProfile.role === 'warden' ? <WardenDashboard /> :
          userProfile.role === 'cook' ? <CookDashboard /> :
          userProfile.role === 'student' ? <StudentDashboard /> :
          <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
            <p className="text-slate-500 mt-2">Dashboard not available for this role.</p>
          </div>
        } />
        
        {/* Admin Routes */}
        <Route path="users" element={<PrivateRoute allowedRoles={['admin']}><Users /></PrivateRoute>} />
        <Route path="rent" element={<PrivateRoute allowedRoles={['admin']}><Rent /></PrivateRoute>} />
        
        {/* Admin & Warden Routes */}
        <Route path="rooms" element={<PrivateRoute allowedRoles={['admin', 'warden']}><Rooms /></PrivateRoute>} />
        <Route path="complaints" element={<PrivateRoute allowedRoles={['admin', 'warden']}><Complaints /></PrivateRoute>} />
        <Route path="notices" element={<PrivateRoute allowedRoles={['admin', 'warden']}><Notices /></PrivateRoute>} />
        <Route path="expenses" element={<PrivateRoute allowedRoles={['admin', 'warden']}><Expenses /></PrivateRoute>} />
        
        {/* Cook & Admin Routes */}
        <Route path="kitchen" element={<PrivateRoute allowedRoles={['admin', 'cook']}><Menu /></PrivateRoute>} />
        <Route path="menu" element={<PrivateRoute allowedRoles={['admin', 'cook']}><Menu /></PrivateRoute>} />
        <Route path="inventory" element={<PrivateRoute allowedRoles={['admin', 'cook']}><Inventory /></PrivateRoute>} />

        {/* Student Routes */}
        <Route path="my-rent" element={<PrivateRoute allowedRoles={['student']}><MyRent /></PrivateRoute>} />
        <Route path="my-complaints" element={<PrivateRoute allowedRoles={['student']}><MyComplaints /></PrivateRoute>} />
        
        {/* Shared Routes */}
        <Route path="chat" element={<PrivateRoute allowedRoles={['admin', 'warden', 'student']}><Chat /></PrivateRoute>} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#0f172a',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              borderRadius: '1rem',
              border: '1px solid #f1f5f9',
              padding: '16px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
          }}
        />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
