import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function MyRent() {
  const { userProfile } = useAuth();
  const [rentRecords, setRentRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;

    const q = query(collection(db, 'rent'), where('userId', '==', userProfile.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const r: any[] = [];
      snapshot.forEach(doc => r.push({ id: doc.id, ...doc.data() }));
      r.sort((a, b) => b.month.localeCompare(a.month)); // Sort by month descending
      setRentRecords(r);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching my rent:", error);
      alert("Error fetching my rent: " + error.message);
    });

    return unsubscribe;
  }, [userProfile]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">My Rent</h1>
          <p className="mt-2 text-sm text-gray-700">View your rent history and current dues.</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Month</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Due Date</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {rentRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{record.month}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        ₹{record.amount}
                        <div className="text-xs text-gray-400">
                          Basic: ₹{record.basicRent || 0} | Elec: ₹{record.electricity || 0}
                          {record.otherAmount ? ` | Other: ₹${record.otherAmount} (${record.otherDescription})` : ''}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(record.dueDate).toLocaleDateString()}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'paid' ? 'bg-green-100 text-green-800' :
                          record.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rentRecords.length === 0 && (
                <div className="text-center py-4 text-gray-500">No rent records found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
