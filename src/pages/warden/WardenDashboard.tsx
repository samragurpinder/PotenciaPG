import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Users, Bed, AlertCircle } from 'lucide-react';

export default function WardenDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    availableRooms: 0,
    openComplaints: 0,
  });

  useEffect(() => {
    // Listen to users
    const qUsers = query(collection(db, 'users'), where('role', '==', 'student'), where('status', '==', 'active'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      setStats(s => ({ ...s, totalStudents: snapshot.size }));
    });

    // Listen to rooms
    const qRooms = query(collection(db, 'rooms'), where('status', '==', 'available'));
    const unsubRooms = onSnapshot(qRooms, (snapshot) => {
      setStats(s => ({ ...s, availableRooms: snapshot.size }));
    });

    // Listen to complaints
    const qComplaints = query(collection(db, 'complaints'), where('status', 'in', ['open', 'in-progress']));
    const unsubComplaints = onSnapshot(qComplaints, (snapshot) => {
      setStats(s => ({ ...s, openComplaints: snapshot.size }));
    });

    return () => {
      unsubUsers();
      unsubRooms();
      unsubComplaints();
    };
  }, []);

  const cards = [
    { name: 'Total Students', value: stats.totalStudents, icon: Users, color: 'bg-blue-500' },
    { name: 'Available Rooms', value: stats.availableRooms, icon: Bed, color: 'bg-green-500' },
    { name: 'Open Complaints', value: stats.openComplaints, icon: AlertCircle, color: 'bg-yellow-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Warden Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`rounded-md p-3 ${card.color}`}>
                    <card.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{card.name}</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{card.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
