import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import ConfirmModal from '../../components/ConfirmModal';

export default function Rooms() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoom, setNewRoom] = useState({ roomNumber: '', capacity: 2, status: 'available' });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'rooms'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomsData: any[] = [];
      snapshot.forEach((doc) => {
        roomsData.push({ id: doc.id, ...doc.data() });
      });
      setRooms(roomsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching rooms:", error);
    });

    return unsubscribe;
  }, []);

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.roomNumber) return;
    
    try {
      await setDoc(doc(db, 'rooms', newRoom.roomNumber), {
        roomNumber: newRoom.roomNumber,
        capacity: Number(newRoom.capacity),
        occupants: [],
        status: newRoom.status
      });
      setNewRoom({ roomNumber: '', capacity: 2, status: 'available' });
    } catch (error) {
      console.error("Error adding room:", error);
      alert("Failed to add room");
    }
  };

  const confirmDelete = (roomId: string) => {
    setRoomToDelete(roomId);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!roomToDelete) return;
    try {
      await deleteDoc(doc(db, 'rooms', roomToDelete));
    } catch (error) {
      console.error("Error deleting room:", error);
    } finally {
      setDeleteModalOpen(false);
      setRoomToDelete(null);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Rooms</h1>
          <p className="mt-2 text-sm text-gray-700">Manage PG rooms, capacity, and occupancy.</p>
        </div>
      </div>

      {/* Add Room Form */}
      <div className="mt-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Add New Room</h3>
            <p className="mt-1 text-sm text-gray-500">Create a new room in the system.</p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <form onSubmit={handleAddRoom}>
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Room Number</label>
                  <input
                    type="text"
                    required
                    value={newRoom.roomNumber}
                    onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Capacity (Beds)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={Number.isNaN(newRoom.capacity) ? '' : newRoom.capacity}
                    onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) })}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Room
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Rooms List */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Room {room.roomNumber}</h3>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  room.status === 'available' ? 'bg-green-100 text-green-800' :
                  room.status === 'full' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {room.status}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Capacity: {room.capacity} beds</p>
                <p className="text-sm text-gray-500">Occupied: {room.occupants.length} beds</p>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => confirmDelete(room.id)} className="text-red-600 hover:text-red-900 text-sm font-medium">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Room"
        message="Are you sure you want to delete this room? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setRoomToDelete(null);
        }}
      />
    </div>
  );
}
