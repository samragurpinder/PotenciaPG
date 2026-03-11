import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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

  if (loading) return <div>Loading...</div>;
  if (!currentUser) return <Navigate to="/login" />;
  if (userProfile && !allowedRoles.includes(userProfile.role)) {
    return <div>Unauthorized Access</div>;
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
          userProfile?.role === 'admin' ? <AdminDashboard /> :
          userProfile?.role === 'warden' ? <WardenDashboard /> :
          userProfile?.role === 'cook' ? <CookDashboard /> :
          userProfile?.role === 'student' ? <StudentDashboard /> :
          <div>Dashboard not available for this role.</div>
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
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
