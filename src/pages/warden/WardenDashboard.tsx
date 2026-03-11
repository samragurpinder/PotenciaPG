import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Users, Bed, AlertCircle, Activity, Star, ShoppingCart, Coffee } from 'lucide-react';

export default function WardenDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    availableRooms: 0,
    openComplaints: 0,
  });
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [foodRatings, setFoodRatings] = useState<any[]>([]);
  const [inventoryRequests, setInventoryRequests] = useState<any[]>([]);
  const [teaRequests, setTeaRequests] = useState<any[]>([]);

  useEffect(() => {
    // Listen to users
    const qUsers = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      let count = 0;
      snapshot.forEach(doc => {
        if (doc.data().status === 'active') count++;
      });
      setStats(s => ({ ...s, totalStudents: count }));
    }, (error) => {
      console.error("Error fetching users:", error);
    });

    // Listen to rooms
    const qRooms = query(collection(db, 'rooms'), where('status', '==', 'available'));
    const unsubRooms = onSnapshot(qRooms, (snapshot) => {
      setStats(s => ({ ...s, availableRooms: snapshot.size }));
    }, (error) => {
      console.error("Error fetching rooms:", error);
    });

    // Listen to complaints
    const qComplaints = query(collection(db, 'complaints'), where('status', 'in', ['open', 'in-progress']));
    const unsubComplaints = onSnapshot(qComplaints, (snapshot) => {
      setStats(s => ({ ...s, openComplaints: snapshot.size }));
    }, (error) => {
      console.error("Error fetching complaints:", error);
    });

    // Listen to activity logs
    const qActivity = query(collection(db, 'activityLog'), orderBy('timestamp', 'desc'), limit(10));
    const unsubActivity = onSnapshot(qActivity, (snapshot) => {
      const logs: any[] = [];
      snapshot.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));
      setActivityLogs(logs);
    }, (error) => {
      console.error("Error fetching activity logs:", error);
    });

    // Listen to food ratings
    const qRatings = query(collection(db, 'foodRatings'), orderBy('createdAt', 'desc'), limit(10));
    const unsubRatings = onSnapshot(qRatings, (snapshot) => {
      const ratings: any[] = [];
      snapshot.forEach(doc => ratings.push({ id: doc.id, ...doc.data() }));
      setFoodRatings(ratings);
    }, (error) => {
      console.error("Error fetching food ratings:", error);
    });

    // Listen to inventory requests
    const qInventory = query(collection(db, 'inventoryRequests'), where('status', 'in', ['pending', 'ordered']));
    const unsubInventory = onSnapshot(qInventory, (snapshot) => {
      const requests: any[] = [];
      snapshot.forEach(doc => requests.push({ id: doc.id, ...doc.data() }));
      setInventoryRequests(requests);
    }, (error) => {
      console.error("Error fetching inventory requests:", error);
    });

    // Listen to tea requests
    const qTea = query(collection(db, 'teaRequests'), where('status', 'in', ['pending', 'accepted']));
    const unsubTea = onSnapshot(qTea, (snapshot) => {
      const requests: any[] = [];
      snapshot.forEach(doc => requests.push({ id: doc.id, ...doc.data() }));
      setTeaRequests(requests);
    }, (error) => {
      console.error("Error fetching tea requests:", error);
    });

    return () => {
      unsubUsers();
      unsubRooms();
      unsubComplaints();
      unsubActivity();
      unsubRatings();
      unsubInventory();
      unsubTea();
    };
  }, []);

  const updateInventoryRequestStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'inventoryRequests', id), { status });
    } catch (error) {
      console.error("Error updating inventory request:", error);
    }
  };

  const cards = [
    { name: 'Total Students', value: stats.totalStudents, icon: Users, color: 'bg-blue-500' },
    { name: 'Available Rooms', value: stats.availableRooms, icon: Bed, color: 'bg-green-500' },
    { name: 'Open Complaints', value: stats.openComplaints, icon: AlertCircle, color: 'bg-yellow-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Warden Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tea Requests */}
        <div className="bg-white shadow rounded-lg p-6 md:col-span-2">
          <div className="flex items-center mb-4">
            <Coffee className="h-6 w-6 text-orange-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Active Tea Requests</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">Provide milk to the cook for these requests.</p>
          {teaRequests.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {teaRequests.map(req => (
                <li key={req.id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{req.userName} (Room: {req.roomNumber})</p>
                    <p className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                      {req.status.toUpperCase()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No active tea requests.</p>
          )}
        </div>

        {/* Inventory Requests */}
        <div className="bg-white shadow rounded-lg p-6 md:col-span-2">
          <div className="flex items-center mb-4">
            <ShoppingCart className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Inventory Requests</h2>
          </div>
          {inventoryRequests.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {inventoryRequests.map(req => (
                <li key={req.id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{req.itemName}</p>
                    <p className="text-sm text-gray-500">Requested: {req.quantity} {req.unit} by {req.requestedByName}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(req.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                      {req.status.toUpperCase()}
                    </span>
                    {req.status === 'pending' && (
                      <button 
                        onClick={() => updateInventoryRequestStatus(req.id, 'ordered')}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        Mark Ordered
                      </button>
                    )}
                    {req.status === 'ordered' && (
                      <button 
                        onClick={() => updateInventoryRequestStatus(req.id, 'fulfilled')}
                        className="text-green-600 hover:text-green-900 text-sm font-medium"
                      >
                        Mark Fulfilled
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No active inventory requests.</p>
          )}
        </div>

        {/* Activity Log */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Activity className="h-6 w-6 text-indigo-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          </div>
          {activityLogs.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {activityLogs.map(log => (
                <li key={log.id} className="py-3">
                  <p className="text-sm font-medium text-gray-900">{log.action}</p>
                  <p className="text-sm text-gray-500">by {log.performedBy} ({log.role})</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No recent activity.</p>
          )}
        </div>

        {/* Food Ratings */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Star className="h-6 w-6 text-yellow-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Recent Food Ratings</h2>
          </div>
          {foodRatings.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {foodRatings.map(rating => (
                <li key={rating.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 capitalize">{rating.mealType}</p>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm font-medium text-gray-700">{rating.rating}/5</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">by {rating.userName}</p>
                  {rating.feedback && <p className="text-sm text-gray-700 mt-1 italic">"{rating.feedback}"</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(rating.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No recent ratings.</p>
          )}
        </div>
      </div>
    </div>
  );
}
