import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { 
  IndianRupee, 
  Plus, 
  Trash2, 
  Calendar, 
  Tag, 
  FileText, 
  User, 
  TrendingDown, 
  TrendingUp, 
  Wallet,
  Clock,
  Receipt
} from 'lucide-react';
import clsx from 'clsx';

export default function Expenses() {
  const { userProfile } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [rents, setRents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().slice(0, 16),
    useCurrentTime: true
  });
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    const qExpenses = query(collection(db, 'expenses'));
    const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
      const exp: any[] = [];
      snapshot.forEach(doc => exp.push({ id: doc.id, ...doc.data() }));
      // Sort by date descending
      exp.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setExpenses(exp);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to fetch expenses");
      setLoading(false);
    });

    let unsubRents: (() => void) | null = null;
    if (userProfile?.role === 'admin') {
      const qRents = query(collection(db, 'rent'));
      unsubRents = onSnapshot(qRents, (snapshot) => {
        const r: any[] = [];
        snapshot.forEach(doc => r.push({ id: doc.id, ...doc.data() }));
        setRents(r);
      }, (error) => {
        console.error("Error fetching rents:", error);
      });
    }

    return () => {
      unsubExpenses();
      if (unsubRents) unsubRents();
    };
  }, [userProfile]);

  const handleAddExpenseClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.category || !newExpense.amount) {
      toast.error("Please fill in all required fields");
      return;
    }
    setAddModalOpen(true);
  };

  const confirmAddExpense = async () => {
    try {
      const expenseId = `exp_${Date.now()}`;
      const expenseDate = newExpense.useCurrentTime ? new Date().toISOString() : new Date(newExpense.date).toISOString();
      
      await setDoc(doc(db, 'expenses', expenseId), {
        category: newExpense.category,
        amount: Number(newExpense.amount),
        description: newExpense.description,
        date: expenseDate,
        addedBy: userProfile?.name || 'Unknown'
      });
      
      toast.success("Expense added successfully!");
      setNewExpense({
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().slice(0, 16),
        useCurrentTime: true
      });
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Failed to add expense");
    } finally {
      setAddModalOpen(false);
    }
  };

  const confirmDelete = (id: string) => {
    setExpenseToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!expenseToDelete) return;
    try {
      await deleteDoc(doc(db, 'expenses', expenseToDelete));
      toast.success("Expense deleted successfully");
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    } finally {
      setDeleteModalOpen(false);
      setExpenseToDelete(null);
    }
  };

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const totalEarnings = userProfile?.role === 'admin' ? rents.filter(r => r.status === 'paid').reduce((sum, r) => sum + Number(r.amount), 0) : 0;
  const profitOrLoss = totalEarnings - totalExpenses;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-4xl font-bold text-slate-900 font-display tracking-tight">PG Expenses & Financials</h1>
        <p className="text-slate-500 mt-2">Track all PG expenditures, building rent, cook salary, and view overall profit/loss.</p>
      </header>

      {userProfile?.role === 'admin' && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass overflow-hidden p-6 rounded-[2rem]"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest truncate">Total Earnings (Paid Rent)</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 font-display">₹{totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass overflow-hidden p-6 rounded-[2rem]"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-600">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest truncate">Total Expenses</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 font-display">₹{totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass overflow-hidden p-6 rounded-[2rem]"
          >
            <div className="flex items-center">
              <div className={clsx(
                "p-3 rounded-2xl",
                profitOrLoss >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
              )}>
                <Wallet className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest truncate">Net Profit / Loss</p>
                <p className={clsx(
                  "mt-1 text-2xl font-bold font-display",
                  profitOrLoss >= 0 ? "text-emerald-600" : "text-rose-600"
                )}>
                  {profitOrLoss >= 0 ? '+' : '-'}₹{Math.abs(profitOrLoss).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Expense Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass p-8 rounded-[2rem]"
      >
        <div className="flex items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mr-4 shadow-sm">
            <Plus className="h-6 w-6 text-brand-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display">Add Expenditure</h2>
            <p className="text-sm text-slate-500">Record money spent on PG maintenance, salaries, groceries, etc.</p>
          </div>
        </div>

        <form onSubmit={handleAddExpenseClick} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Category</label>
            <select
              required
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
              className="modern-input"
            >
              <option value="">Select Category</option>
              <option value="Building Rent">Building Rent</option>
              <option value="Cook Salary">Cook Salary</option>
              <option value="Groceries">Groceries</option>
              <option value="Electricity Bill">Electricity Bill</option>
              <option value="Water Bill">Water Bill</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Amount (₹)</label>
            <input
              type="number"
              min="0"
              required
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              className="modern-input"
              placeholder="0.00"
            />
          </div>

          <div className="lg:col-span-4">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</label>
            <input
              type="text"
              required
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              placeholder="Brief description of the expense"
              className="modern-input"
            />
          </div>
          
          <div className="lg:col-span-4">
            <div className="flex items-center mb-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <input
                id="useCurrentTime"
                type="checkbox"
                checked={newExpense.useCurrentTime}
                onChange={(e) => setNewExpense({ ...newExpense, useCurrentTime: e.target.checked })}
                className="h-5 w-5 text-brand-600 focus:ring-brand-500 border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="useCurrentTime" className="ml-3 block text-sm font-bold text-slate-700 cursor-pointer">
                Mark date and time as right now
              </label>
            </div>
            
            <AnimatePresence>
              {!newExpense.useCurrentTime && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Date and Time of Payment</label>
                  <input
                    type="datetime-local"
                    required={!newExpense.useCurrentTime}
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="modern-input"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="lg:col-span-4 flex justify-end mt-2">
            <button
              type="submit"
              className="modern-button-primary px-8"
            >
              Add Expense
            </button>
          </div>
        </form>
      </motion.div>

      {/* Expenses List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass p-8 rounded-[2rem]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mr-4 shadow-sm">
              <Receipt className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">Expense History</h2>
              <p className="text-sm text-slate-500">View and manage all expense entries</p>
            </div>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 uppercase tracking-widest">
            {expenses.length} Records
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {expenses.map((expense) => (
              <motion.div 
                key={expense.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-800 uppercase tracking-widest">
                      {expense.category}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-3xl font-bold text-rose-600 font-display">₹{Number(expense.amount).toLocaleString()}</p>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2" title={expense.description}>
                      {expense.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Added By</span>
                    <div className="flex items-center text-sm font-medium text-slate-700">
                      <User className="w-3 h-3 mr-1 text-slate-400" />
                      {expense.addedBy}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center text-xs font-medium text-slate-500">
                      <Clock className="w-3 h-3 mr-1 text-slate-400" />
                      {new Date(expense.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {userProfile?.role === 'admin' && (
                      <button 
                        onClick={() => confirmDelete(expense.id)} 
                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {expenses.length === 0 && (
            <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No expenses recorded yet.</p>
            </div>
          )}
        </div>
      </motion.div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setExpenseToDelete(null);
        }}
      />

      <ConfirmModal
        isOpen={addModalOpen}
        title="Confirm Expense"
        message={`Are you sure you want to add an expense of ₹${newExpense.amount} for ${newExpense.category}?`}
        onConfirm={confirmAddExpense}
        onCancel={() => setAddModalOpen(false)}
        confirmText="Add Expense"
      />
    </div>
  );
}
