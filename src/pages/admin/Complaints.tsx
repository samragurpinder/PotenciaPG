import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import ConfirmModal from '../../components/ConfirmModal';

export default function Complaints() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'complaints'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const c: any[] = [];
      snapshot.forEach(doc => c.push({ id: doc.id, ...doc.data() }));
      // Sort by open first, then date
      c.sort((a, b) => {
        if (a.status === 'open' && b.status !== 'open') return -1;
        if (a.status !== 'open' && b.status === 'open') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setComplaints(c);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching complaints:", error);
      alert("Error fetching complaints: " + error.message);
    });

    return unsubscribe;
  }, []);

  const handleStatusChange = async (complaintId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'complaints', complaintId), { status: newStatus });
    } catch (error) {
      console.error("Error updating complaint status:", error);
      alert("Failed to update status");
    }
  };

  const handleReplyChange = async (complaintId: string, reply: string) => {
    try {
      await updateDoc(doc(db, 'complaints', complaintId), { adminReply: reply });
    } catch (error) {
      console.error("Error updating complaint reply:", error);
      alert("Failed to update reply");
    }
  };

  const confirmDelete = (complaintId: string) => {
    setComplaintToDelete(complaintId);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!complaintToDelete) return;
    try {
      await deleteDoc(doc(db, 'complaints', complaintToDelete));
    } catch (error) {
      console.error("Error deleting complaint:", error);
    } finally {
      setDeleteModalOpen(false);
      setComplaintToDelete(null);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Complaints</h1>
          <p className="mt-2 text-sm text-gray-700">Manage and resolve student complaints.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6">
        {complaints.map((complaint) => (
          <div key={complaint.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {complaint.category} - Room {complaint.roomNumber || 'N/A'}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Reported by {complaint.userName} on {new Date(complaint.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <select
                  value={complaint.status}
                  onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                  className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${
                    complaint.status === 'open' ? 'bg-red-50 text-red-700 font-semibold' :
                    complaint.status === 'in-progress' ? 'bg-yellow-50 text-yellow-700 font-semibold' : 'bg-green-50 text-green-700 font-semibold'
                  }`}
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{complaint.description}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Admin Reply</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <textarea
                      rows={2}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Add a reply..."
                      defaultValue={complaint.adminReply || ''}
                      onBlur={(e) => handleReplyChange(complaint.id, e.target.value)}
                    />
                  </dd>
                </div>
              </dl>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
              <button onClick={() => confirmDelete(complaint.id)} className="text-red-600 hover:text-red-900 text-sm font-medium">Delete Complaint</button>
            </div>
          </div>
        ))}
        {complaints.length === 0 && (
          <p className="text-gray-500 text-center py-4">No complaints found.</p>
        )}
      </div>
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Complaint"
        message="Are you sure you want to delete this complaint? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setComplaintToDelete(null);
        }}
      />
    </div>
  );
}
