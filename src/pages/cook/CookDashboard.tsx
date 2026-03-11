import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Utensils, ClipboardList, Bell, ShoppingCart, Coffee } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function CookDashboard() {
  const { userProfile } = useAuth();
  const [todayMenu, setTodayMenu] = useState<any>(null);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [inventoryRequest, setInventoryRequest] = useState({ itemName: '', quantity: '', unit: 'kg' });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [teaRequests, setTeaRequests] = useState<any[]>([]);

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

    return () => {
      unsubMenu();
      unsubInventory();
      unsubTea();
    };
  }, []);

  const handleMarkReady = async (meal: string) => {
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
      
      alert(`${meal} marked as ready. Notifications sent!`);
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("Failed to send notification.");
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
      
      alert("Inventory request sent to Warden and Admin!");
      setInventoryRequest({ itemName: '', quantity: '', unit: 'kg' });
    } catch (error) {
      console.error("Error requesting inventory:", error);
      alert("Failed to request inventory.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const updateTeaRequestStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'teaRequests', id), { status });
    } catch (error) {
      console.error("Error updating tea request:", error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Cook Dashboard</h1>
      
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

        {/* Low Stock Alerts */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <ClipboardList className="h-6 w-6 text-red-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Low Stock Alerts</h2>
          </div>
          {lowStockItems.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {lowStockItems.map(item => (
                <li key={item.id} className="py-3 flex justify-between">
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  <span className="text-sm text-red-600 font-semibold">{item.quantity} {item.unit} left</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">All stock levels are good.</p>
          )}
        </div>
        {/* Mark Food Ready */}
        <div className="bg-white shadow rounded-lg p-6 md:col-span-2">
          <div className="flex items-center mb-4">
            <Bell className="h-6 w-6 text-yellow-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Notify Students & Warden</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">Click a button below to send a notification to all students and the warden that the food is ready.</p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => handleMarkReady('Breakfast')} className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md font-medium hover:bg-yellow-200 transition-colors">
              Breakfast Ready
            </button>
            <button onClick={() => handleMarkReady('Lunch')} className="px-4 py-2 bg-green-100 text-green-800 rounded-md font-medium hover:bg-green-200 transition-colors">
              Lunch Ready
            </button>
            <button onClick={() => handleMarkReady('Tea')} className="px-4 py-2 bg-orange-100 text-orange-800 rounded-md font-medium hover:bg-orange-200 transition-colors">
              Tea Ready
            </button>
            <button onClick={() => handleMarkReady('Dinner')} className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-md font-medium hover:bg-indigo-200 transition-colors">
              Dinner Ready
            </button>
          </div>
        </div>

        {/* Tea Requests */}
        <div className="bg-white shadow rounded-lg p-6 md:col-span-2">
          <div className="flex items-center mb-4">
            <Coffee className="h-6 w-6 text-orange-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Active Tea Requests</h2>
          </div>
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
                    {req.status === 'pending' && (
                      <button 
                        onClick={() => updateTeaRequestStatus(req.id, 'accepted')}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        Accept
                      </button>
                    )}
                    {req.status === 'accepted' && (
                      <button 
                        onClick={() => updateTeaRequestStatus(req.id, 'completed')}
                        className="text-green-600 hover:text-green-900 text-sm font-medium"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No active tea requests.</p>
          )}
        </div>

        {/* Request Inventory */}
        <div className="bg-white shadow rounded-lg p-6 md:col-span-2">
          <div className="flex items-center mb-4">
            <ShoppingCart className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Request Inventory Items</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">Need more supplies? Request them here.</p>
          <form onSubmit={handleRequestInventory} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Item Name</label>
              <input 
                type="text" 
                required
                value={inventoryRequest.itemName}
                onChange={e => setInventoryRequest({...inventoryRequest, itemName: e.target.value})}
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Rice, Milk, Sugar"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <input 
                type="number" 
                min="1"
                required
                value={inventoryRequest.quantity}
                onChange={e => setInventoryRequest({...inventoryRequest, quantity: e.target.value})}
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit</label>
              <select 
                value={inventoryRequest.unit}
                onChange={e => setInventoryRequest({...inventoryRequest, unit: e.target.value})}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="kg">kg</option>
                <option value="liters">liters</option>
                <option value="packets">packets</option>
                <option value="pieces">pieces</option>
              </select>
            </div>
            <div className="sm:col-span-4 mt-2">
              <button 
                type="submit"
                disabled={isSubmittingRequest}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmittingRequest ? 'Requesting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
