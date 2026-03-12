import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDocs, where, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import ConfirmModal from '../../components/ConfirmModal';
import { motion } from 'motion/react';
import { CreditCard, Search, Filter, Trash2, Plus, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export default function Rent() {
  const [rentRecords, setRentRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRent, setNewRent] = useState({ 
    userId: '', 
    month: new Date().toISOString().slice(0, 7), 
    basicRent: 5000,
    electricity: 0,
    otherAmount: 0,
    otherDescription: '',
    dueDate: new Date().toISOString().slice(0, 10) 
  });
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [rentToDelete, setRentToDelete] = useState<string | null>(null);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [confirmAddModalOpen, setConfirmAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch students
    const qStudents = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      const s: any[] = [];
      snapshot.forEach(doc => s.push({ id: doc.id, ...doc.data() }));
      setStudents(s);
    }, (error) => {
      console.error("Error fetching students:", error);
    });

    // Fetch rent records
    const qRent = query(collection(db, 'rent'));
    const unsubRent = onSnapshot(qRent, (snapshot) => {
      const r: any[] = [];
      snapshot.forEach(doc => r.push({ id: doc.id, ...doc.data() }));
      // Sort by due date descending
      r.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
      setRentRecords(r);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching rent:", error);
      toast.error("Error fetching rent: " + error.message);
    });

    return () => {
      unsubStudents();
      unsubRent();
    };
  }, []);

  const handleAddRentClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRent.userId) {
      toast.error("Please select a student");
      return;
    }
    setConfirmAddModalOpen(true);
  };

  const handleConfirmAddRent = async () => {
    setConfirmAddModalOpen(false);
    setIsSubmitting(true);
    
    const student = students.find(s => s.id === newRent.userId);
    if (!student) {
      setIsSubmitting(false);
      return;
    }

    try {
      const rentId = `${newRent.userId}_${newRent.month}`;
      const basic = Number.isNaN(Number(newRent.basicRent)) ? 0 : Number(newRent.basicRent);
      const elec = Number.isNaN(Number(newRent.electricity)) ? 0 : Number(newRent.electricity);
      const other = Number.isNaN(Number(newRent.otherAmount)) ? 0 : Number(newRent.otherAmount);
      
      const totalAmount = basic + elec + other;
      await setDoc(doc(db, 'rent', rentId), {
        userId: newRent.userId,
        userName: student.name,
        month: newRent.month,
        amount: totalAmount,
        basicRent: basic,
        electricity: elec,
        otherAmount: other,
        otherDescription: newRent.otherDescription || '',
        status: 'pending',
        dueDate: new Date(newRent.dueDate).toISOString()
      });

      // Send notification
      await addDoc(collection(db, 'notifications'), {
        title: `New Rent Generated`,
        message: `Rent for ${newRent.month} (₹${totalAmount}) has been generated. Due date: ${new Date(newRent.dueDate).toLocaleDateString()}`,
        type: 'rent_generated',
        targetRole: ['student'],
        targetUserId: newRent.userId,
        createdAt: new Date().toISOString(),
        readBy: []
      });

      toast.success(`Rent generated for ${student.name}`);
      setNewRent({ ...newRent, userId: '' });
    } catch (error) {
      console.error("Error adding rent:", error);
      toast.error("Failed to add rent record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (rentId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'paid') {
        updateData.paidDate = new Date().toISOString();
      }
      await updateDoc(doc(db, 'rent', rentId), updateData);
      toast.success("Rent status updated");
    } catch (error) {
      console.error("Error updating rent status:", error);
      toast.error("Failed to update status");
    }
  };

  const confirmDelete = (rentId: string) => {
    setRentToDelete(rentId);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!rentToDelete) return;
    try {
      await deleteDoc(doc(db, 'rent', rentToDelete));
      toast.success("Rent record deleted");
    } catch (error) {
      console.error("Error deleting rent:", error);
      toast.error("Failed to delete rent record");
    } finally {
      setDeleteModalOpen(false);
      setRentToDelete(null);
    }
  };

  const confirmDeleteAll = () => {
    if (!selectedStudentFilter) return;
    setDeleteAllModalOpen(true);
  };

  const handleDeleteAllForStudent = async () => {
    if (!selectedStudentFilter) return;
    try {
      const studentRecords = rentRecords.filter(r => r.userId === selectedStudentFilter);
      for (const record of studentRecords) {
        await deleteDoc(doc(db, 'rent', record.id));
      }
      toast.success("All rent history deleted for student");
    } catch (error) {
      console.error("Error deleting rent history:", error);
      toast.error("Failed to delete rent history");
    } finally {
      setDeleteAllModalOpen(false);
    }
  };

  const filteredRecords = selectedStudentFilter 
    ? rentRecords.filter(r => r.userId === selectedStudentFilter)
    : rentRecords;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-4xl font-bold text-slate-900 font-display tracking-tight">Rent Management</h1>
        <p className="text-slate-500 mt-2">Generate rent, track payments, and update statuses.</p>
      </header>

      {/* Add Rent Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-[2rem]"
      >
        <div className="flex items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mr-4 shadow-sm">
            <Plus className="h-6 w-6 text-brand-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display">Generate Rent</h2>
            <p className="text-sm text-slate-500">Create a new rent record for a student</p>
          </div>
        </div>

        <form onSubmit={handleAddRentClick} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Student</label>
            <select
              required
              value={newRent.userId}
              onChange={(e) => setNewRent({ ...newRent, userId: e.target.value })}
              className="modern-input"
            >
              <option value="">Select a student</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} (Room {s.roomNumber || 'N/A'})</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Month</label>
            <input
              type="month"
              required
              value={newRent.month}
              onChange={(e) => setNewRent({ ...newRent, month: e.target.value })}
              className="modern-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Due Date</label>
            <input
              type="date"
              required
              value={newRent.dueDate}
              onChange={(e) => setNewRent({ ...newRent, dueDate: e.target.value })}
              className="modern-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Basic Rent (₹)</label>
            <input
              type="number"
              min="0"
              required
              value={Number.isNaN(newRent.basicRent) ? '' : newRent.basicRent}
              onChange={(e) => setNewRent({ ...newRent, basicRent: parseInt(e.target.value) })}
              className="modern-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Electricity (₹)</label>
            <input
              type="number"
              min="0"
              required
              value={Number.isNaN(newRent.electricity) ? '' : newRent.electricity}
              onChange={(e) => setNewRent({ ...newRent, electricity: parseInt(e.target.value) })}
              className="modern-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Other Amount (₹)</label>
            <input
              type="number"
              min="0"
              required
              value={Number.isNaN(newRent.otherAmount) ? '' : newRent.otherAmount}
              onChange={(e) => setNewRent({ ...newRent, otherAmount: parseInt(e.target.value) })}
              className="modern-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Other Description</label>
            <input
              type="text"
              value={newRent.otherDescription}
              onChange={(e) => setNewRent({ ...newRent, otherDescription: e.target.value })}
              placeholder="e.g., Maintenance, Fine"
              className="modern-input"
            />
          </div>

          <div className="lg:col-span-4 flex justify-end mt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="modern-button-primary px-8"
            >
              {isSubmitting ? 'Generating...' : 'Generate Rent'}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Rent Records List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass p-8 rounded-[2rem]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mr-4 shadow-sm">
              <CreditCard className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">Rent Records</h2>
              <p className="text-sm text-slate-500">View and manage all rent entries</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={selectedStudentFilter}
                onChange={(e) => setSelectedStudentFilter(e.target.value)}
                className="modern-input pl-10 py-2 w-full sm:w-64"
              >
                <option value="">All Students</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            {selectedStudentFilter && (
              <button
                onClick={confirmDeleteAll}
                className="modern-button bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 px-4 py-2"
              >
                <Trash2 className="w-4 h-4 mr-2 inline" />
                Clear History
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => (
              <div key={record.id} className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-slate-900">{record.userName}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{record.month}</span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-3xl font-bold text-slate-900 font-display">₹{record.amount.toLocaleString()}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-slate-500 flex justify-between"><span>Basic:</span> <span className="font-medium text-slate-700">₹{record.basicRent || 0}</span></p>
                      <p className="text-xs text-slate-500 flex justify-between"><span>Electricity:</span> <span className="font-medium text-slate-700">₹{record.electricity || 0}</span></p>
                      {record.otherAmount > 0 && (
                        <p className="text-xs text-slate-500 flex justify-between">
                          <span>Other ({record.otherDescription}):</span> 
                          <span className="font-medium text-slate-700">₹{record.otherAmount}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Due Date</span>
                    <span className="text-sm font-medium text-slate-700">{new Date(record.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <select
                      value={record.status}
                      onChange={(e) => handleStatusChange(record.id, e.target.value)}
                      className={clsx(
                        "modern-input py-1.5 text-xs font-bold uppercase tracking-widest flex-1",
                        record.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        record.status === 'overdue' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                    
                    <button 
                      onClick={() => confirmDelete(record.id)} 
                      className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <CreditCard className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No rent records found.</p>
            </div>
          )}
        </div>
      </motion.div>

      <ConfirmModal
        isOpen={confirmAddModalOpen}
        title="Confirm Rent Generation"
        message={`Are you sure you want to generate rent for ${students.find(s => s.id === newRent.userId)?.name} for ${newRent.month}?`}
        onConfirm={handleConfirmAddRent}
        onCancel={() => setConfirmAddModalOpen(false)}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Rent Record"
        message="Are you sure you want to delete this rent record? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setRentToDelete(null);
        }}
      />

      <ConfirmModal
        isOpen={deleteAllModalOpen}
        title="Delete All Rent History"
        message="Are you sure you want to delete ALL rent history for this student? This action cannot be undone."
        onConfirm={handleDeleteAllForStudent}
        onCancel={() => setDeleteAllModalOpen(false)}
      />
    </div>
  );
}
