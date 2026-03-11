import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, useAuth, Role } from '../../contexts/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';
import SuccessModal from '../../components/SuccessModal';

export default function Users() {
  const { registerUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newUser, setNewUser] = useState({
    name: '',
    mobile: '',
    role: 'student' as Role,
    roomNumber: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdUserDetails, setCreatedUserDetails] = useState<{ username: string; pass: string } | null>(null);

  useEffect(() => {
    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const usersData: UserProfile[] = [];
      snapshot.forEach((doc) => {
        usersData.push(doc.data() as UserProfile);
      });
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
    });

    const qRooms = query(collection(db, 'rooms'));
    const unsubRooms = onSnapshot(qRooms, (snapshot) => {
      const roomsData: any[] = [];
      snapshot.forEach((doc) => {
        roomsData.push({ id: doc.id, ...doc.data() });
      });
      setRooms(roomsData);
    }, (error) => {
      console.error("Error fetching rooms:", error);
    });

    return () => {
      unsubUsers();
      unsubRooms();
    };
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.mobile || newUser.mobile.length < 5) {
      alert("Please provide a valid name and mobile number (at least 5 digits).");
      return;
    }
    
    if (!/^\d{4}$/.test(newUser.password)) {
      alert("Password must be exactly 4 numeric digits.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (newUser.role === 'student' && newUser.roomNumber) {
        const room = rooms.find(r => r.roomNumber === newUser.roomNumber);
        if (room && (room.occupants || []).length >= room.capacity) {
          alert("Selected room is already full. Please select another room.");
          setIsSubmitting(false);
          return;
        }
      }

      const baseName = newUser.name.toLowerCase().replace(/\s+/g, '');
      let username = '';
      
      // Find highest running number for this base name across all users
      const similarUsers = users.filter(u => u.email.startsWith(baseName) && u.email.includes('@'));
      let maxNum = 0;
      similarUsers.forEach(u => {
        const match = u.email.match(new RegExp(`^${baseName}(\\d+)@`));
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        } else if (u.email === `${baseName}@smartpg.com`) {
          if (maxNum === 0) maxNum = 1; // Base name exists without number
        }
      });
      
      const password = newUser.password;
      let uid = '';
      let currentMaxNum = maxNum;
      
      while (!uid) {
        if (currentMaxNum > 0 || newUser.role === 'student') {
          const nextNum = (currentMaxNum + 1).toString().padStart(3, '0');
          username = `${baseName}${nextNum}@smartpg.com`;
        } else {
          username = `${baseName}@smartpg.com`;
        }
        
        try {
          uid = await registerUser(username, password, newUser.name, newUser.role, newUser.roomNumber, newUser.mobile);
        } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
            currentMaxNum++;
            if (currentMaxNum > maxNum + 20) {
              throw new Error("Could not generate a unique username. Please try a different name.");
            }
          } else {
            throw error;
          }
        }
      }
      
      if (newUser.role === 'student' && newUser.roomNumber) {
        const roomRef = doc(db, 'rooms', newUser.roomNumber);
        const room = rooms.find(r => r.roomNumber === newUser.roomNumber);
        if (room) {
          const newOccupants = [...(room.occupants || []), uid];
          await updateDoc(roomRef, { 
            occupants: newOccupants,
            status: newOccupants.length >= room.capacity ? 'full' : 'available'
          });
        }
      }

      const displayUsername = username.split('@')[0];
      setCreatedUserDetails({ username: displayUsername, pass: password });
      setSuccessModalOpen(true);
      setNewUser({ name: '', mobile: '', role: 'student', roomNumber: '', password: '' });
    } catch (error: any) {
      console.error("Error adding user:", error);
      alert(error.message || "Failed to add user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (uid: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role");
    }
  };

  const handleStatusChange = async (uid: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const confirmDelete = (uid: string) => {
    setUserToDelete(uid);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    const uid = userToDelete;
    
    try {
      const user = users.find(u => u.uid === uid);
      if (user?.roomNumber) {
        const roomRef = doc(db, 'rooms', user.roomNumber);
        const room = rooms.find(r => r.roomNumber === user.roomNumber);
        if (room) {
          const newOccupants = (room.occupants || []).filter((id: string) => id !== uid);
          await updateDoc(roomRef, { 
            occupants: newOccupants,
            status: newOccupants.length >= room.capacity ? 'full' : 'available'
          });
        }
      }
      await deleteDoc(doc(db, 'users', uid));
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="mt-2 text-sm text-gray-700">A list of all users in the PG including their name, role, and status.</p>
        </div>
      </div>
      <div className="mt-8 bg-white shadow sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Add New User</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Student username will be auto-generated as: [name in lowercase] + [001, 002, etc].</p>
            <p>Please create a 4-digit numeric password for the user.</p>
          </div>
          <form onSubmit={handleAddUser} className="mt-5">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={newUser.mobile}
                    onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value })}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <div className="mt-1">
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as Role })}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="student">Student</option>
                    <option value="warden">Warden</option>
                    <option value="cook">Cook</option>
                    <option value="cleaner">Cleaner</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Password (4 Digits)</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="e.g. 1234"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {newUser.role === 'student' && (
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Assign Room</label>
                  <div className="mt-1">
                    <select
                      value={newUser.roomNumber}
                      onChange={(e) => setNewUser({ ...newUser, roomNumber: e.target.value })}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="">Select a room (optional)</option>
                      {rooms.map(room => (
                        <option key={room.id} value={room.roomNumber}>Room {room.roomNumber} ({room.occupants?.length || 0}/{room.capacity})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add User'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Mobile</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {users.map((user) => (
                    <tr key={user.uid}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{user.name}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.email}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.phone || 'N/A'}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="admin">Admin</option>
                          <option value="cook">Cook</option>
                          <option value="student">Student</option>
                          <option value="cleaner">Cleaner</option>
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <select
                          value={user.status}
                          onChange={(e) => handleStatusChange(user.uid, e.target.value)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button onClick={() => confirmDelete(user.uid)} className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setUserToDelete(null);
        }}
      />

      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title="User Created Successfully!"
        message="The new user has been added to the system. Please share these credentials with them."
        details={createdUserDetails ? [
          { label: 'Username', value: createdUserDetails.username },
          { label: 'Password', value: createdUserDetails.pass }
        ] : undefined}
      />
    </div>
  );
}
