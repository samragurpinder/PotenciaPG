import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Utensils, CreditCard, Bell } from 'lucide-react';

export default function StudentDashboard() {
  const { userProfile } = useAuth();
  const [todayMenu, setTodayMenu] = useState<any>(null);
  const [rentStatus, setRentStatus] = useState<any>(null);
  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    if (!userProfile) return;

    // Today's Menu
    const today = new Date().toISOString().slice(0, 10);
    const unsubMenu = onSnapshot(doc(db, 'menu', today), (doc) => {
      if (doc.exists()) {
        setTodayMenu(doc.data());
      } else {
        setTodayMenu(null);
      }
    });

    // Rent Status
    const currentMonth = new Date().toISOString().slice(0, 7);
    const qRent = query(collection(db, 'rent'), where('userId', '==', userProfile.uid), where('month', '==', currentMonth));
    const unsubRent = onSnapshot(qRent, (snapshot) => {
      if (!snapshot.empty) {
        setRentStatus(snapshot.docs[0].data());
      } else {
        setRentStatus(null);
      }
    });

    // Notices
    const qNotices = query(collection(db, 'notices'));
    const unsubNotices = onSnapshot(qNotices, (snapshot) => {
      const n: any[] = [];
      snapshot.forEach(doc => n.push({ id: doc.id, ...doc.data() }));
      setNotices(n);
    });

    return () => {
      unsubMenu();
      unsubRent();
      unsubNotices();
    };
  }, [userProfile]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Welcome, {userProfile?.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Menu */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Utensils className="h-6 w-6 text-indigo-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Today's Menu</h2>
          </div>
          {todayMenu ? (
            <div className="space-y-3">
              <p><span className="font-medium text-gray-700">Breakfast:</span> {todayMenu.breakfast}</p>
              <p><span className="font-medium text-gray-700">Lunch:</span> {todayMenu.lunch}</p>
              <p><span className="font-medium text-gray-700">Dinner:</span> {todayMenu.dinner}</p>
            </div>
          ) : (
            <p className="text-gray-500">Menu not updated for today.</p>
          )}
        </div>

        {/* Rent Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <CreditCard className="h-6 w-6 text-green-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Rent Status ({new Date().toLocaleString('default', { month: 'long' })})</h2>
          </div>
          {rentStatus ? (
            <div className="space-y-3">
              <p><span className="font-medium text-gray-700">Amount:</span> ₹{rentStatus.amount}</p>
              <p>
                <span className="font-medium text-gray-700">Status:</span>{' '}
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rentStatus.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {rentStatus.status.toUpperCase()}
                </span>
              </p>
              <p><span className="font-medium text-gray-700">Due Date:</span> {new Date(rentStatus.dueDate).toLocaleDateString()}</p>
            </div>
          ) : (
            <p className="text-gray-500">No rent record found for this month.</p>
          )}
        </div>

        {/* Notice Board */}
        <div className="bg-white shadow rounded-lg p-6 md:col-span-2">
          <div className="flex items-center mb-4">
            <Bell className="h-6 w-6 text-yellow-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Notice Board</h2>
          </div>
          {notices.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {notices.map(notice => (
                <li key={notice.id} className="py-4">
                  <p className="text-sm font-medium text-gray-900">{notice.title}</p>
                  <p className="text-sm text-gray-500">{notice.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(notice.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No new notices.</p>
          )}
        </div>
      </div>
    </div>
  );
}
