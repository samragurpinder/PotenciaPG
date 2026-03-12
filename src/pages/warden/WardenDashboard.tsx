import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Users, Bed, AlertCircle, Activity, Star, ShoppingCart, Coffee, CheckCircle2, Clock, Utensils } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';

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
    { name: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Available Rooms', value: stats.availableRooms, icon: Bed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Open Complaints', value: stats.openComplaints, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-10 pb-12">
      <header>
        <h1 className="text-4xl font-bold text-slate-900 font-display tracking-tight">Warden Dashboard</h1>
        <p className="text-slate-500 mt-2">Manage daily operations and student requests.</p>
      </header>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, idx) => (
          <motion.div 
            key={card.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass p-8 rounded-[2rem] group hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={clsx("p-4 rounded-2xl shadow-sm", card.bg)}>
                <card.icon className={clsx("h-6 w-6", card.color)} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live</span>
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{card.name}</p>
            <p className="text-4xl font-bold text-slate-900 font-display">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tea Requests */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-8 rounded-[2rem] lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mr-4 shadow-sm">
                <Coffee className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Active Tea Requests</h2>
                <p className="text-sm text-slate-500">Provide milk to the cook for these requests</p>
              </div>
            </div>
          </div>
          
          {teaRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teaRequests.map(req => (
                <div key={req.id} className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all duration-300">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-4 text-orange-600 font-bold">
                      {req.userName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{req.userName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Room {req.roomNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={clsx(
                      "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full",
                      req.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    )}>
                      {req.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Coffee className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No active tea requests.</p>
            </div>
          )}
        </motion.div>

        {/* Inventory Requests */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass p-8 rounded-[2rem] lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mr-4 shadow-sm">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Inventory Requests</h2>
                <p className="text-sm text-slate-500">Manage kitchen and supply needs</p>
              </div>
            </div>
          </div>

          {inventoryRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-100">
                    <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item</th>
                    <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quantity</th>
                    <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requested By</th>
                    <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {inventoryRequests.map(req => (
                    <tr key={req.id} className="group hover:bg-slate-50/30 transition-colors">
                      <td className="py-4">
                        <p className="text-sm font-bold text-slate-900">{req.itemName}</p>
                        <p className="text-[10px] text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="py-4">
                        <span className="text-sm font-medium text-slate-600">{req.quantity} {req.unit}</span>
                      </td>
                      <td className="py-4">
                        <span className="text-sm font-medium text-slate-600">{req.requestedByName}</span>
                      </td>
                      <td className="py-4">
                        <span className={clsx(
                          "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full",
                          req.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        )}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {req.status === 'pending' && (
                          <button 
                            onClick={() => updateInventoryRequestStatus(req.id, 'ordered')}
                            className="text-brand-600 hover:text-brand-700 text-xs font-bold uppercase tracking-wider"
                          >
                            Mark Ordered
                          </button>
                        )}
                        {req.status === 'ordered' && (
                          <button 
                            onClick={() => updateInventoryRequestStatus(req.id, 'fulfilled')}
                            className="text-emerald-600 hover:text-emerald-700 text-xs font-bold uppercase tracking-wider"
                          >
                            Mark Fulfilled
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No active inventory requests.</p>
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-8 rounded-[2rem]"
        >
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mr-4 shadow-sm">
              <Activity className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">Recent Activity</h2>
              <p className="text-sm text-slate-500">System-wide updates</p>
            </div>
          </div>

          {activityLogs.length > 0 ? (
            <div className="space-y-6">
              {activityLogs.map((log, idx) => (
                <div key={log.id} className="flex items-start">
                  <div className="relative mr-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                      <Clock className="w-5 h-5 text-slate-400" />
                    </div>
                    {idx !== activityLogs.length - 1 && (
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-6 bg-slate-100" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{log.action}</p>
                    <p className="text-xs text-slate-500 mt-0.5">by {log.performedBy} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No recent activity.</p>
            </div>
          )}
        </motion.div>

        {/* Food Ratings */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-8 rounded-[2rem]"
        >
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mr-4 shadow-sm">
              <Star className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">Food Feedback</h2>
              <p className="text-sm text-slate-500">Student meal ratings</p>
            </div>
          </div>

          {foodRatings.length > 0 ? (
            <div className="space-y-6">
              {foodRatings.map(rating => (
                <div key={rating.id} className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center mr-3 shadow-sm border border-slate-100">
                        <Utensils className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-sm font-bold text-slate-900 capitalize">{rating.mealType}</span>
                    </div>
                    <div className="flex items-center bg-amber-50 px-2 py-1 rounded-lg">
                      <Star className="h-3 w-3 text-amber-500 fill-current" />
                      <span className="ml-1 text-xs font-bold text-amber-700">{rating.rating}/5</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">by {rating.userName}</p>
                  {rating.feedback && (
                    <div className="p-3 rounded-xl bg-white border border-slate-100">
                      <p className="text-xs text-slate-700 italic leading-relaxed">"{rating.feedback}"</p>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-3 uppercase tracking-widest font-bold">{new Date(rating.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Star className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No recent ratings.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
