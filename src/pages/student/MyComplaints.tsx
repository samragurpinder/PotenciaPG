import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function MyComplaints() {
  const { userProfile } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComplaint, setNewComplaint] = useState({ category: 'water', description: '' });

  useEffect(() => {
    if (!userProfile) return;

    const q = query(collection(db, 'complaints'), where('userId', '==', userProfile.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const c: any[] = [];
      snapshot.forEach(doc => c.push({ id: doc.id, ...doc.data() }));
      c.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setComplaints(c);
      setLoading(false);
    });

    return unsubscribe;
  }, [userProfile]);

  const handleAddComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaint.description || !userProfile) return;
    
    try {
      const complaintId = Date.now().toString();
      await setDoc(doc(db, 'complaints', complaintId), {
        userId: userProfile.uid,
        userName: userProfile.name,
        roomNumber: userProfile.roomNumber || '',
        category: newComplaint.category,
        description: newComplaint.description,
        status: 'open',
        createdAt: new Date().toISOString()
      });
      setNewComplaint({ category: 'water', description: '' });
    } catch (error) {
      console.error("Error adding complaint:", error);
      alert("Failed to submit complaint");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">My Complaints</h1>
          <p className="mt-2 text-sm text-gray-700">Report issues and track their resolution status.</p>
        </div>
      </div>

      {/* Add Complaint Form */}
      <div className="mt-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">New Complaint</h3>
            <p className="mt-1 text-sm text-gray-500">Submit a new issue to the PG admin.</p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <form onSubmit={handleAddComplaint}>
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    required
                    value={newComplaint.category}
                    onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="water">Water</option>
                    <option value="electricity">Electricity</option>
                    <option value="wifi">WiFi</option>
                    <option value="food">Food Quality</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="col-span-6">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={4}
                    required
                    value={newComplaint.description}
                    onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Submit Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Complaints List */}
      <div className="mt-8 grid gap-6">
        {complaints.map((complaint) => (
          <div key={complaint.id} className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 capitalize">{complaint.category}</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Submitted on {new Date(complaint.createdAt).toLocaleString()}
                </p>
              </div>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                complaint.status === 'open' ? 'bg-red-100 text-red-800' :
                complaint.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                {complaint.status.toUpperCase()}
              </span>
            </div>
            <div className="mt-4 text-sm text-gray-900">
              <p className="font-medium">Description:</p>
              <p className="mt-1">{complaint.description}</p>
            </div>
            {complaint.adminReply && (
              <div className="mt-4 bg-gray-50 p-4 rounded-md">
                <p className="text-sm font-medium text-gray-900">Admin Reply:</p>
                <p className="mt-1 text-sm text-gray-700">{complaint.adminReply}</p>
              </div>
            )}
          </div>
        ))}
        {complaints.length === 0 && (
          <p className="text-gray-500 text-center py-4">No complaints submitted.</p>
        )}
      </div>
    </div>
  );
}
