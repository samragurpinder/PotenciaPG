import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';

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

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.category || !newExpense.amount) return;

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
      
      setNewExpense({
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().slice(0, 16),
        useCurrentTime: true
      });
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Failed to add expense");
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
    } catch (error) {
      console.error("Error deleting expense:", error);
    } finally {
      setDeleteModalOpen(false);
      setExpenseToDelete(null);
    }
  };

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const totalEarnings = userProfile?.role === 'admin' ? rents.filter(r => r.status === 'paid').reduce((sum, r) => sum + Number(r.amount), 0) : 0;
  const profitOrLoss = totalEarnings - totalExpenses;

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">PG Expenses & Financials</h1>
          <p className="mt-2 text-sm text-gray-700">Track all PG expenditures, building rent, cook salary, and view overall profit/loss.</p>
        </div>
      </div>

      {userProfile?.role === 'admin' && (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Earnings (Paid Rent)</dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">₹{totalEarnings.toLocaleString()}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Expenses</dt>
              <dd className="mt-1 text-3xl font-semibold text-red-600">₹{totalExpenses.toLocaleString()}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Net Profit / Loss</dt>
              <dd className={`mt-1 text-3xl font-semibold ${profitOrLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profitOrLoss >= 0 ? '+' : '-'}₹{Math.abs(profitOrLoss).toLocaleString()}
              </dd>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Form */}
      <div className="mt-8 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Add Expenditure</h3>
            <p className="mt-1 text-sm text-gray-500">Record money spent on PG maintenance, salaries, groceries, etc.</p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <form onSubmit={handleAddExpense}>
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    required
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
                <div className="col-span-6 sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <div className="col-span-6">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <input
                    type="text"
                    required
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder="Brief description of the expense"
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="col-span-6">
                  <div className="flex items-center mb-2">
                    <input
                      id="useCurrentTime"
                      type="checkbox"
                      checked={newExpense.useCurrentTime}
                      onChange={(e) => setNewExpense({ ...newExpense, useCurrentTime: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="useCurrentTime" className="ml-2 block text-sm text-gray-900">
                      Mark date and time as right now
                    </label>
                  </div>
                  {!newExpense.useCurrentTime && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date and Time of Payment</label>
                      <input
                        type="datetime-local"
                        required={!newExpense.useCurrentTime}
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Date & Time</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Added By</th>
                    {userProfile?.role === 'admin' && (
                      <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                        {new Date(expense.date).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{expense.category}</td>
                      <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate" title={expense.description}>{expense.description}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-red-600">₹{expense.amount}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{expense.addedBy}</td>
                      {userProfile?.role === 'admin' && (
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button onClick={() => confirmDelete(expense.id)} className="text-red-600 hover:text-red-900">Delete</button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={userProfile?.role === 'admin' ? 6 : 5} className="py-4 text-center text-sm text-gray-500">
                        No expenses recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
