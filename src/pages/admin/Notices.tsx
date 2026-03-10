import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function Notices() {
  const { userProfile } = useAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNotice, setNewNotice] = useState({ title: '', content: '' });

  useEffect(() => {
    const q = query(collection(db, 'notices'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const n: any[] = [];
      snapshot.forEach(doc => n.push({ id: doc.id, ...doc.data() }));
      n.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotices(n);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.content) return;
    
    try {
      const noticeId = Date.now().toString();
      await setDoc(doc(db, 'notices', noticeId), {
        title: newNotice.title,
        content: newNotice.content,
        createdAt: new Date().toISOString(),
        createdBy: userProfile?.name || 'Admin'
      });
      setNewNotice({ title: '', content: '' });
    } catch (error) {
      console.error("Error adding notice:", error);
      alert("Failed to add notice");
    }
  };

  const handleDelete = async (noticeId: string) => {
    if (window.confirm("Are you sure you want to delete this notice?")) {
      try {
        await deleteDoc(doc(db, 'notices', noticeId));
      } catch (error) {
        console.error("Error deleting notice:", error);
        alert("Failed to delete notice");
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Notices</h1>
          <p className="mt-2 text-sm text-gray-700">Post announcements to all students.</p>
        </div>
      </div>

      {/* Add Notice Form */}
      <div className="mt-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Create Notice</h3>
            <p className="mt-1 text-sm text-gray-500">Broadcast a message to everyone.</p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <form onSubmit={handleAddNotice}>
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6">
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    required
                    value={newNotice.title}
                    onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <div className="col-span-6">
                  <label className="block text-sm font-medium text-gray-700">Content</label>
                  <textarea
                    rows={4}
                    required
                    value={newNotice.content}
                    onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Post Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Notices List */}
      <div className="mt-8 grid gap-6">
        {notices.map((notice) => (
          <div key={notice.id} className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">{notice.title}</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Posted by {notice.createdBy} on {new Date(notice.createdAt).toLocaleString()}
                </p>
              </div>
              <button onClick={() => handleDelete(notice.id)} className="text-red-600 hover:text-red-900 text-sm font-medium">Delete</button>
            </div>
            <div className="mt-4 text-sm text-gray-900 whitespace-pre-wrap">
              {notice.content}
            </div>
          </div>
        ))}
        {notices.length === 0 && (
          <p className="text-gray-500 text-center py-4">No notices found.</p>
        )}
      </div>
    </div>
  );
}
