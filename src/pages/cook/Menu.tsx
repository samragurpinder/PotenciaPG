import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';

export default function Menu() {
  const { userProfile } = useAuth();
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMenu, setNewMenu] = useState({ date: new Date().toISOString().slice(0, 10), breakfast: '', lunch: '', dinner: '' });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'menu'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const m: any[] = [];
      snapshot.forEach(doc => m.push({ id: doc.id, ...doc.data() }));
      m.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMenus(m);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenu.date) return;
    
    try {
      await setDoc(doc(db, 'menu', newMenu.date), {
        date: newMenu.date,
        breakfast: newMenu.breakfast,
        lunch: newMenu.lunch,
        dinner: newMenu.dinner,
        updatedBy: userProfile?.name || 'Unknown',
        updatedAt: new Date().toISOString()
      });
      setNewMenu({ date: new Date().toISOString().slice(0, 10), breakfast: '', lunch: '', dinner: '' });
    } catch (error) {
      console.error("Error adding menu:", error);
      alert("Failed to update menu");
    }
  };

  const confirmDelete = (date: string) => {
    setMenuToDelete(date);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!menuToDelete) return;
    try {
      await deleteDoc(doc(db, 'menu', menuToDelete));
    } catch (error) {
      console.error("Error deleting menu:", error);
    } finally {
      setDeleteModalOpen(false);
      setMenuToDelete(null);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Daily Menu</h1>
          <p className="mt-2 text-sm text-gray-700">Update the breakfast, lunch, and dinner menu.</p>
        </div>
      </div>

      {/* Add Menu Form */}
      <div className="mt-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Update Menu</h3>
            <p className="mt-1 text-sm text-gray-500">Set the menu for a specific date.</p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <form onSubmit={handleAddMenu}>
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    required
                    value={newMenu.date}
                    onChange={(e) => setNewMenu({ ...newMenu, date: e.target.value })}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <div className="col-span-6">
                  <label className="block text-sm font-medium text-gray-700">Breakfast</label>
                  <input
                    type="text"
                    required
                    value={newMenu.breakfast}
                    onChange={(e) => setNewMenu({ ...newMenu, breakfast: e.target.value })}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <div className="col-span-6">
                  <label className="block text-sm font-medium text-gray-700">Lunch</label>
                  <input
                    type="text"
                    required
                    value={newMenu.lunch}
                    onChange={(e) => setNewMenu({ ...newMenu, lunch: e.target.value })}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <div className="col-span-6">
                  <label className="block text-sm font-medium text-gray-700">Dinner</label>
                  <input
                    type="text"
                    required
                    value={newMenu.dinner}
                    onChange={(e) => setNewMenu({ ...newMenu, dinner: e.target.value })}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Save Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {menus.map((menu) => (
          <div key={menu.id} className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">{new Date(menu.date).toLocaleDateString()}</h3>
                <p className="mt-1 max-w-2xl text-xs text-gray-500">
                  Updated by {menu.updatedBy}
                </p>
              </div>
              {userProfile?.role === 'admin' && (
                <button onClick={() => confirmDelete(menu.id)} className="text-red-600 hover:text-red-900 text-sm font-medium">Delete</button>
              )}
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-900">
              <p><span className="font-semibold">Breakfast:</span> {menu.breakfast}</p>
              <p><span className="font-semibold">Lunch:</span> {menu.lunch}</p>
              <p><span className="font-semibold">Dinner:</span> {menu.dinner}</p>
            </div>
          </div>
        ))}
        {menus.length === 0 && (
          <p className="text-gray-500 text-center py-4 col-span-full">No menus found.</p>
        )}
      </div>
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Menu"
        message="Are you sure you want to delete this menu? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setMenuToDelete(null);
        }}
      />
    </div>
  );
}
