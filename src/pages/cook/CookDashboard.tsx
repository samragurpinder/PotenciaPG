import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Utensils, ClipboardList } from 'lucide-react';

export default function CookDashboard() {
  const [todayMenu, setTodayMenu] = useState<any>(null);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  useEffect(() => {
    // Today's Menu
    const today = new Date().toISOString().slice(0, 10);
    const unsubMenu = onSnapshot(doc(db, 'menu', today), (doc) => {
      if (doc.exists()) {
        setTodayMenu(doc.data());
      } else {
        setTodayMenu(null);
      }
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
    });

    return () => {
      unsubMenu();
      unsubInventory();
    };
  }, []);

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
      </div>
    </div>
  );
}
