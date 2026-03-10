import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Rent() {
  const [rentRecords, setRentRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRent, setNewRent] = useState({ userId: '', month: new Date().toISOString().slice(0, 7), amount: 5000, dueDate: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    // Fetch students
    const qStudents = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      const s: any[] = [];
      snapshot.forEach(doc => s.push({ id: doc.id, ...doc.data() }));
      setStudents(s);
    });

    // Fetch rent records
    const qRent = query(collection(db, 'rent'));
    const unsubRent = onSnapshot(qRent, (snapshot) => {
      const r: any[] = [];
      snapshot.forEach(doc => r.push({ id: doc.id, ...doc.data() }));
      setRentRecords(r);
      setLoading(false);
    });

    return () => {
      unsubStudents();
      unsubRent();
    };
  }, []);

  const handleAddRent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRent.userId) {
      alert("Please select a student");
      return;
    }
    
    const student = students.find(s => s.id === newRent.userId);
    if (!student) return;

    try {
      const rentId = `${newRent.userId}_${newRent.month}`;
      await setDoc(doc(db, 'rent', rentId), {
        userId: newRent.userId,
        userName: student.name,
        month: newRent.month,
        amount: Number(newRent.amount),
        status: 'pending',
        dueDate: new Date(newRent.dueDate).toISOString()
      });
      setNewRent({ ...newRent, userId: '' });
    } catch (error) {
      console.error("Error adding rent:", error);
      alert("Failed to add rent record");
    }
  };

  const handleStatusChange = async (rentId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'paid') {
        updateData.paidDate = new Date().toISOString();
      }
      await updateDoc(doc(db, 'rent', rentId), updateData);
    } catch (error) {
      console.error("Error updating rent status:", error);
      alert("Failed to update status");
    }
  };

  const handleDelete = async (rentId: string) => {
    if (window.confirm("Are you sure you want to delete this rent record?")) {
      try {
        await deleteDoc(doc(db, 'rent', rentId));
      } catch (error) {
        console.error("Error deleting rent:", error);
        alert("Failed to delete rent record");
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Rent Management</h1>
          <p className="mt-2 text-sm text-gray-700">Manage monthly rent, track payments, and update status.</p>
        </div>
      </div>

      {/* Add Rent Form */}
      <div className="mt-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Generate Rent</h3>
            <p className="mt-1 text-sm text-gray-500">Create a new rent record for a student.</p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <form onSubmit={handleAddRent}>
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Student</label>
                  <select
                    required
                    value={newRent.userId}
                    onChange={(e) => setNewRent({ ...newRent, userId: e.target.value })}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">Select a student</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Month (YYYY-MM)</label>
                  <input
                    type="month"
                    required
                    value={newRent.month}
                    onChange={(e) => setNewRent({ ...newRent, month: e.target.value })}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newRent.amount}
                    onChange={(e) => setNewRent({ ...newRent, amount: parseInt(e.target.value) })}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newRent.dueDate}
                    onChange={(e) => setNewRent({ ...newRent, dueDate: e.target.value })}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Generate Rent
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Rent Records List */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Student</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Month</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Due Date</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {rentRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{record.userName}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{record.month}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">₹{record.amount}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(record.dueDate).toLocaleDateString()}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <select
                          value={record.status}
                          onChange={(e) => handleStatusChange(record.id, e.target.value)}
                          className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${
                            record.status === 'paid' ? 'text-green-600 font-semibold' :
                            record.status === 'overdue' ? 'text-red-600 font-semibold' : 'text-yellow-600 font-semibold'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button onClick={() => handleDelete(record.id)} className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
