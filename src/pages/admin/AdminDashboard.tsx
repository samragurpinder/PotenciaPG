import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, onSnapshot, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Users, CreditCard, AlertCircle, Utensils, Activity, Star, ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    rentCollected: 0,
    pendingRent: 0,
    openComplaints: 0,
    foodBudget: 0
  });
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [foodRatings, setFoodRatings] = useState<any[]>([]);
  const [inventoryRequests, setInventoryRequests] = useState<any[]>([]);

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

    // Listen to rent for current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const qRent = query(collection(db, 'rent'), where('month', '==', currentMonth));
    const unsubRent = onSnapshot(qRent, (snapshot) => {
      let collected = 0;
      let pending = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === 'paid') collected += data.amount;
        else pending += data.amount;
      });
      setStats(s => ({ ...s, rentCollected: collected, pendingRent: pending }));
    }, (error) => {
      console.error("Error fetching rent:", error);
    });

    // Listen to complaints
    const qComplaints = query(collection(db, 'complaints'), where('status', 'in', ['open', 'in-progress']));
    const unsubComplaints = onSnapshot(qComplaints, (snapshot) => {
      setStats(s => ({ ...s, openComplaints: snapshot.size }));
    }, (error) => {
      console.error("Error fetching complaints:", error);
    });

    // Listen to expenses for current month
    const qExpenses = query(collection(db, 'expenses'), where('date', '>=', currentMonth + '-01T00:00:00.000Z'));
    const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
      let total = 0;
      snapshot.forEach(doc => {
        total += doc.data().amount;
      });
      setStats(s => ({ ...s, foodBudget: total }));
    }, (error) => {
      console.error("Error fetching expenses:", error);
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

    return () => {
      unsubUsers();
      unsubRent();
      unsubComplaints();
      unsubExpenses();
      unsubActivity();
      unsubRatings();
      unsubInventory();
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
    { name: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { name: 'Rent Collected', value: `₹${stats.rentCollected.toLocaleString()}`, icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { name: 'Pending Rent', value: `₹${stats.pendingRent.toLocaleString()}`, icon: CreditCard, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
    { name: 'Open Complaints', value: stats.openComplaints, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { name: 'Monthly Expenses', value: `₹${stats.foodBudget.toLocaleString()}`, icon: Utensils, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
  ];

  return (
    <div className="space-y-10 pb-12">
      <header>
        <h1 className="text-4xl font-bold text-slate-900 font-display tracking-tight">Admin Dashboard</h1>
        <p className="text-slate-500 mt-2">Overview of Nestify operations and performance.</p>
      </header>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card, index) => (
          <motion.div 
            key={card.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`glass p-6 rounded-3xl border ${card.border} card-hover`}
          >
            <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center mb-4 shadow-sm`}>
              <card.icon className={`h-6 w-6 ${card.color}`} aria-hidden="true" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{card.name}</p>
            <p className="text-3xl font-bold text-slate-900 font-display">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inventory Requests */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="glass p-8 rounded-[2rem] lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mr-4 shadow-sm">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Inventory Requests</h2>
                <p className="text-sm text-slate-500">Items needed for the kitchen</p>
              </div>
            </div>
            <span className="px-4 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
              {inventoryRequests.length} Active
            </span>
          </div>

          {inventoryRequests.length > 0 ? (
            <div className="space-y-4">
              {inventoryRequests.map(req => (
                <div key={req.id} className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-lg hover:border-brand-100 transition-all duration-300">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mr-4 shadow-sm border border-slate-100">
                      <ShoppingCart className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900">{req.itemName}</p>
                      <p className="text-sm text-slate-500 font-medium">
                        {req.quantity} {req.unit} <span className="text-slate-300 mx-1">•</span> Requested by {req.requestedByName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${
                      req.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {req.status}
                    </span>
                    {req.status === 'pending' && (
                      <button 
                        onClick={() => updateInventoryRequestStatus(req.id, 'ordered')}
                        className="modern-button-secondary py-2 px-4 text-xs font-bold"
                      >
                        Order
                      </button>
                    )}
                    {req.status === 'ordered' && (
                      <button 
                        onClick={() => updateInventoryRequestStatus(req.id, 'fulfilled')}
                        className="modern-button-primary py-2 px-4 text-xs font-bold"
                      >
                        Fulfill
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No active inventory requests.</p>
            </div>
          )}
        </motion.div>

        {/* Activity Log */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="glass p-8 rounded-[2rem]"
        >
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mr-4 shadow-sm">
              <Activity className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">Recent Activity</h2>
              <p className="text-sm text-slate-500">Live PG updates</p>
            </div>
          </div>

          {activityLogs.length > 0 ? (
            <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
              {activityLogs.map(log => (
                <div key={log.id} className="relative pl-10">
                  <div className="absolute left-0 top-1.5 w-10 h-10 rounded-full bg-white border-4 border-slate-50 flex items-center justify-center z-10 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 leading-tight">{log.action}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">by {log.performedBy} <span className="text-slate-300 mx-1">•</span> {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 font-medium text-center py-8">No recent activity.</p>
          )}
        </motion.div>

        {/* Food Ratings */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="glass p-8 rounded-[2rem] lg:col-span-3"
        >
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mr-4 shadow-sm">
              <Star className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">Food Ratings</h2>
              <p className="text-sm text-slate-500">Student feedback on meals</p>
            </div>
          </div>

          {foodRatings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {foodRatings.map(rating => (
                <div key={rating.id} className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center mr-3 shadow-sm border border-slate-100">
                        <Utensils className="w-4 h-4 text-slate-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-900 capitalize">{rating.mealType}</p>
                    </div>
                    <div className="flex items-center bg-amber-50 px-2 py-1 rounded-lg">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-current" />
                      <span className="ml-1.5 text-xs font-bold text-amber-700">{rating.rating}/5</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mb-2">by {rating.userName} <span className="text-slate-300 mx-1">•</span> {new Date(rating.createdAt).toLocaleDateString()}</p>
                  {rating.feedback && (
                    <div className="relative p-3 bg-white rounded-xl border border-slate-100 italic text-sm text-slate-600">
                      "{rating.feedback}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 font-medium text-center py-8">No recent ratings.</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
