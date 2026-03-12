import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Coffee, Utensils, UtensilsCrossed, Plus, Trash2, FileText } from 'lucide-react';

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
    }, (error) => {
      console.error("Error fetching menu:", error);
      toast.error("Failed to fetch menu");
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenu.date) {
      toast.error("Please select a date");
      return;
    }
    
    try {
      await setDoc(doc(db, 'menu', newMenu.date), {
        date: newMenu.date,
        breakfast: newMenu.breakfast,
        lunch: newMenu.lunch,
        dinner: newMenu.dinner,
        updatedBy: userProfile?.name || 'Unknown',
        updatedAt: new Date().toISOString()
      });
      toast.success("Menu updated successfully!");
      setNewMenu({ date: new Date().toISOString().slice(0, 10), breakfast: '', lunch: '', dinner: '' });
    } catch (error) {
      console.error("Error adding menu:", error);
      toast.error("Failed to update menu");
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
      toast.success("Menu deleted successfully");
    } catch (error) {
      console.error("Error deleting menu:", error);
      toast.error("Failed to delete menu");
    } finally {
      setDeleteModalOpen(false);
      setMenuToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Daily Menu</h1>
        <p className="mt-2 text-sm text-slate-500">Update the breakfast, lunch, and dinner menu.</p>
      </div>

      {/* Add Menu Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl shadow-sm border border-slate-200/60 rounded-3xl p-6 sm:p-8 mb-8"
      >
        <div className="md:grid md:grid-cols-3 md:gap-8">
          <div className="md:col-span-1">
            <h3 className="text-xl font-semibold text-slate-900">Update Menu</h3>
            <p className="mt-2 text-sm text-slate-500">Set the menu for a specific date.</p>
          </div>
          <div className="mt-6 md:mt-0 md:col-span-2">
            <form onSubmit={handleAddMenu} className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="date"
                      required
                      value={newMenu.date}
                      onChange={(e) => setNewMenu({ ...newMenu, date: e.target.value })}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white/50 backdrop-blur-sm transition-all duration-200"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Breakfast</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Coffee className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={newMenu.breakfast}
                      onChange={(e) => setNewMenu({ ...newMenu, breakfast: e.target.value })}
                      placeholder="e.g., Poha, Tea"
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white/50 backdrop-blur-sm transition-all duration-200"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Lunch</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Utensils className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={newMenu.lunch}
                      onChange={(e) => setNewMenu({ ...newMenu, lunch: e.target.value })}
                      placeholder="e.g., Dal, Rice, Roti, Sabzi"
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white/50 backdrop-blur-sm transition-all duration-200"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Dinner</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UtensilsCrossed className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={newMenu.dinner}
                      onChange={(e) => setNewMenu({ ...newMenu, dinner: e.target.value })}
                      placeholder="e.g., Paneer, Roti, Salad"
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white/50 backdrop-blur-sm transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Save Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>

      {/* Menu List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence>
          {menus.map((menu) => (
            <motion.div 
              key={menu.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/80 backdrop-blur-xl shadow-sm border border-slate-200/60 rounded-3xl p-6 hover:shadow-md transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
                    {new Date(menu.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Updated by {menu.updatedBy}
                  </p>
                </div>
                {userProfile?.role === 'admin' && (
                  <button 
                    onClick={() => confirmDelete(menu.id)} 
                    className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-2 rounded-xl transition-colors duration-200"
                    title="Delete Menu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="space-y-4 mt-6">
                <div className="flex items-start">
                  <div className="p-2 bg-amber-50 rounded-xl mr-3">
                    <Coffee className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Breakfast</p>
                    <p className="text-sm font-medium text-slate-900 mt-0.5">{menu.breakfast}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="p-2 bg-emerald-50 rounded-xl mr-3">
                    <Utensils className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lunch</p>
                    <p className="text-sm font-medium text-slate-900 mt-0.5">{menu.lunch}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="p-2 bg-indigo-50 rounded-xl mr-3">
                    <UtensilsCrossed className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dinner</p>
                    <p className="text-sm font-medium text-slate-900 mt-0.5">{menu.dinner}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {menus.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No menus recorded yet.</p>
            <p className="text-sm text-slate-400 mt-1">Add a menu using the form above.</p>
          </div>
        )}
      </motion.div>

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
