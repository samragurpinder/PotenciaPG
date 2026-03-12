import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, where, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Utensils, ClipboardList, Bell, ShoppingCart, Coffee, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export default function CookDashboard() {
  const { userProfile } = useAuth();
  const [todayMenu, setTodayMenu] = useState<any>(null);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [inventoryRequest, setInventoryRequest] = useState({ itemName: '', quantity: '', unit: 'kg' });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [teaRequests, setTeaRequests] = useState<any[]>([]);
  const [mealCounts, setMealCounts] = useState<Record<string, number>>({
    Breakfast: 0,
    Lunch: 0,
    Tea: 0,
    Dinner: 0
  });

  useEffect(() => {
    // Today's Menu
    const today = new Date().toISOString().slice(0, 10);
    const unsubMenu = onSnapshot(doc(db, 'menu', today), (doc) => {
      if (doc.exists()) {
        setTodayMenu(doc.data());
      } else {
        setTodayMenu(null);
      }
    }, (error) => {
      console.error("Error fetching menu:", error);
    });

    // Low Stock Inventory
    const qInventory = query(collection(db, 'inventory'));
    const unsubInventory = onSnapshot(qInventory, (snapshot) => {
      const lowStock: any[] = [];
      snapshot.forEach(doc => {
        const item = doc.data();
        if (item.quantity <= item.lowStockThreshold) {
          lowStock.push({ id: doc.id, ...item });
        }
      });
      setLowStockItems(lowStock);
    }, (error) => {
      console.error("Error fetching inventory:", error);
    });

    // Tea Requests
    const qTea = query(collection(db, 'teaRequests'), where('status', 'in', ['pending', 'accepted']));
    const unsubTea = onSnapshot(qTea, (snapshot) => {
      const requests: any[] = [];
      snapshot.forEach(doc => requests.push({ id: doc.id, ...doc.data() }));
      setTeaRequests(requests);
    }, (error) => {
      console.error("Error fetching tea requests:", error);
    });

    // Meal Readiness Counts
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const qActivity = query(
      collection(db, 'activityLog'),
      where('role', '==', 'cook'),
      where('timestamp', '>=', startOfDay.toISOString())
    );
    const unsubActivity = onSnapshot(qActivity, (snapshot) => {
      const counts: Record<string, number> = { Breakfast: 0, Lunch: 0, Tea: 0, Dinner: 0 };
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.action === 'Marked Breakfast as ready') counts.Breakfast++;
        if (data.action === 'Marked Lunch as ready') counts.Lunch++;
        if (data.action === 'Marked Tea as ready') counts.Tea++;
        if (data.action === 'Marked Dinner as ready') counts.Dinner++;
      });
      setMealCounts(counts);
    });

    return () => {
      unsubMenu();
      unsubInventory();
      unsubTea();
      unsubActivity();
    };
  }, []);

  const handleMarkReady = async (meal: string) => {
    if (meal !== 'Tea' && mealCounts[meal] >= 1) {
      toast.error(`${meal} can only be marked ready once per day.`);
      return;
    }
    if (meal === 'Tea' && mealCounts[meal] >= 3) {
      toast.error(`Tea can only be marked ready 3 times per day.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to mark ${meal} as ready? This action cannot be undone.`)) {
      return;
    }

    try {
      await addDoc(collection(db, 'notifications'), {
        title: `${meal} is Ready!`,
        message: `The cook has marked ${meal} as ready. Please come to the dining area.`,
        type: 'food_ready',
        targetRole: ['student', 'warden', 'admin'],
        createdAt: new Date().toISOString(),
        readBy: []
      });
      
      await addDoc(collection(db, 'activityLog'), {
        action: `Marked ${meal} as ready`,
        performedBy: userProfile?.name || 'Cook',
        role: 'cook',
        timestamp: new Date().toISOString()
      });

      // Update menu prepared status
      const today = new Date().toISOString().slice(0, 10);
      const menuRef = doc(db, 'menu', today);
      await setDoc(menuRef, {
        [`${meal.toLowerCase()}Prepared`]: true
      }, { merge: true });
      
      toast.success(`${meal} marked as ready. Notifications sent!`);
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification.");
    }
  };

  const handleRequestInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setIsSubmittingRequest(true);
    try {
      await addDoc(collection(db, 'inventoryRequests'), {
        itemName: inventoryRequest.itemName,
        quantity: Number(inventoryRequest.quantity),
        unit: inventoryRequest.unit,
        requestedBy: userProfile.uid,
        requestedByName: userProfile.name,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      
      await addDoc(collection(db, 'notifications'), {
        title: `New Inventory Request`,
        message: `Cook ${userProfile.name} requested ${inventoryRequest.quantity} ${inventoryRequest.unit} of ${inventoryRequest.itemName}.`,
        type: 'inventory_request',
        targetRole: ['warden', 'admin'],
        createdAt: new Date().toISOString(),
        readBy: []
      });
      
      toast.success("Inventory request sent to Warden and Admin!");
      setInventoryRequest({ itemName: '', quantity: '', unit: 'kg' });
    } catch (error) {
      console.error("Error requesting inventory:", error);
      toast.error("Failed to request inventory.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const updateTeaRequestStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'teaRequests', id), { status });
      toast.success(`Tea request ${status}.`);
    } catch (error) {
      console.error("Error updating tea request:", error);
      toast.error("Failed to update tea request.");
    }
  };

  return (
    <div className="space-y-10 pb-12">
      <header>
        <h1 className="text-4xl font-bold text-slate-900 font-display tracking-tight">Cook Dashboard</h1>
        <p className="text-slate-500 mt-2">Manage kitchen operations and meal readiness.</p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Menu */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-[2rem] lg:col-span-2 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Utensils className="w-32 h-32 text-slate-900" />
          </div>
          
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mr-4 shadow-sm">
              <Utensils className="h-6 w-6 text-brand-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">Today's Menu</h2>
              <p className="text-sm text-slate-500">Meal preparation plan</p>
            </div>
          </div>

          {todayMenu ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { label: 'Breakfast', value: todayMenu.breakfast, icon: '🍳' },
                { label: 'Lunch', value: todayMenu.lunch, icon: '🥗' },
                { label: 'Dinner', value: todayMenu.dinner, icon: '🍲' }
              ].map((item) => (
                <div key={item.label} className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100">
                  <span className="text-2xl mb-3 block">{item.icon}</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-base font-bold text-slate-900 leading-tight">{item.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Utensils className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Menu not updated for today.</p>
            </div>
          )}
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-8 rounded-[2rem]"
        >
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center mr-4 shadow-sm">
              <AlertTriangle className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">Stock Alerts</h2>
              <p className="text-sm text-slate-500">Items running low</p>
            </div>
          </div>

          {lowStockItems.length > 0 ? (
            <div className="space-y-4">
              {lowStockItems.map(item => (
                <div key={item.id} className="p-4 rounded-xl bg-rose-50/50 border border-rose-100 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900">{item.name}</span>
                  <span className="text-xs font-bold text-rose-600 bg-white px-3 py-1 rounded-full shadow-sm border border-rose-100">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">All stock levels are good.</p>
            </div>
          )}
        </motion.div>

        {/* Mark Food Ready */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass p-8 rounded-[2rem] lg:col-span-2"
        >
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mr-4 shadow-sm">
              <Bell className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">Notify Readiness</h2>
              <p className="text-sm text-slate-500">Alert students when food is served</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Breakfast', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', hover: 'hover:bg-amber-100' },
              { label: 'Lunch', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', hover: 'hover:bg-emerald-100' },
              { label: 'Tea', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', hover: 'hover:bg-orange-100' },
              { label: 'Dinner', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', hover: 'hover:bg-indigo-100' }
            ].map((meal) => (
              <button 
                key={meal.label}
                onClick={() => handleMarkReady(meal.label)} 
                className={clsx(
                  "p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-3 group",
                  meal.bg, meal.text, meal.border, meal.hover
                )}
              >
                <Bell className="w-6 h-6 group-hover:animate-bounce" />
                <span className="text-xs font-bold uppercase tracking-widest">{meal.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tea Requests */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass p-8 rounded-[2rem] lg:col-span-3"
        >
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mr-4 shadow-sm">
              <Coffee className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">Active Tea Requests</h2>
              <p className="text-sm text-slate-500">Prepare tea for these students</p>
            </div>
          </div>

          {teaRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teaRequests.map(req => (
                <div key={req.id} className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 flex flex-col justify-between group hover:bg-white hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-3 text-orange-600 font-bold">
                        {req.userName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{req.userName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Room {req.roomNumber}</p>
                      </div>
                    </div>
                    <span className={clsx(
                      "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full",
                      req.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    )}>
                      {req.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <div className="flex space-x-2">
                      {req.status === 'pending' && (
                        <button 
                          onClick={() => updateTeaRequestStatus(req.id, 'accepted')}
                          className="text-brand-600 hover:text-brand-700 text-[10px] font-bold uppercase tracking-widest"
                        >
                          Accept
                        </button>
                      )}
                      {req.status === 'accepted' && (
                        <button 
                          onClick={() => updateTeaRequestStatus(req.id, 'completed')}
                          className="text-emerald-600 hover:text-emerald-700 text-[10px] font-bold uppercase tracking-widest"
                        >
                          Complete
                        </button>
                      )}
                    </div>
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

        {/* Request Inventory */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass p-8 rounded-[2rem] lg:col-span-3"
        >
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mr-4 shadow-sm">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">Request Supplies</h2>
              <p className="text-sm text-slate-500">Submit requests for kitchen inventory</p>
            </div>
          </div>

          <form onSubmit={handleRequestInventory} className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Item Name</label>
              <input 
                type="text" 
                required
                value={inventoryRequest.itemName}
                onChange={e => setInventoryRequest({...inventoryRequest, itemName: e.target.value})}
                className="modern-input"
                placeholder="e.g., Basmati Rice, Full Cream Milk"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Quantity</label>
              <input 
                type="number" 
                min="1"
                required
                value={inventoryRequest.quantity}
                onChange={e => setInventoryRequest({...inventoryRequest, quantity: e.target.value})}
                className="modern-input"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Unit</label>
              <select 
                value={inventoryRequest.unit}
                onChange={e => setInventoryRequest({...inventoryRequest, unit: e.target.value})}
                className="modern-input"
              >
                <option value="kg">kg</option>
                <option value="liters">liters</option>
                <option value="packets">packets</option>
                <option value="pieces">pieces</option>
              </select>
            </div>
            <div className="sm:col-span-4">
              <button 
                type="submit"
                disabled={isSubmittingRequest}
                className="modern-button-primary w-full flex items-center justify-center gap-2"
              >
                {isSubmittingRequest ? 'Submitting...' : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Inventory Request
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
