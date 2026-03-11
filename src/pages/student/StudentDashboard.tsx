import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, onSnapshot, doc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Utensils, CreditCard, Bell, Coffee, Star } from 'lucide-react';

export default function StudentDashboard() {
  const { userProfile } = useAuth();
  const [todayMenu, setTodayMenu] = useState<any>(null);
  const [rentStatus, setRentStatus] = useState<any>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [rating, setRating] = useState({ mealType: 'breakfast', stars: 5, feedback: '' });
  const [isSubmittingTea, setIsSubmittingTea] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    if (!userProfile) return;

    // Today's Menu
    const today = new Date().toISOString().slice(0, 10);
    const unsubMenu = onSnapshot(doc(db, 'menu', today), (doc) => {
      if (doc.exists()) {
        setTodayMenu(doc.data());
      } else {
        setTodayMenu(null);
      }
    }, (error) => {
      console.error("Error fetching menu:", error);
    });

    // Rent Status
    const currentMonth = new Date().toISOString().slice(0, 7);
    const qRent = query(collection(db, 'rent'), where('userId', '==', userProfile.uid));
    const unsubRent = onSnapshot(qRent, (snapshot) => {
      const currentMonthRent = snapshot.docs.find(doc => doc.data().month === currentMonth);
      if (currentMonthRent) {
        setRentStatus(currentMonthRent.data());
      } else {
        setRentStatus(null);
      }
    }, (error) => {
      console.error("Error fetching rent:", error);
    });

    // Notices
    const qNotices = query(collection(db, 'notices'));
    const unsubNotices = onSnapshot(qNotices, (snapshot) => {
      const n: any[] = [];
      snapshot.forEach(doc => n.push({ id: doc.id, ...doc.data() }));
      setNotices(n);
    }, (error) => {
      console.error("Error fetching notices:", error);
    });

    return () => {
      unsubMenu();
      unsubRent();
      unsubNotices();
    };
  }, [userProfile]);

  const handleRequestTea = async () => {
    if (!userProfile) return;
    setIsSubmittingTea(true);
    try {
      await addDoc(collection(db, 'teaRequests'), {
        userId: userProfile.uid,
        userName: userProfile.name,
        roomNumber: userProfile.roomNumber || 'Unknown',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      
      await addDoc(collection(db, 'notifications'), {
        title: `Tea Request from ${userProfile.name}`,
        message: `Room ${userProfile.roomNumber || 'Unknown'} has requested tea. Please bring milk to the kitchen.`,
        type: 'tea_request',
        targetRole: ['warden', 'cook'],
        createdAt: new Date().toISOString(),
        readBy: []
      });
      
      alert("Tea request sent to Warden and Cook!");
    } catch (error) {
      console.error("Error requesting tea:", error);
      alert("Failed to request tea.");
    } finally {
      setIsSubmittingTea(false);
    }
  };

  const handleRateFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setIsSubmittingRating(true);
    try {
      await addDoc(collection(db, 'foodRatings'), {
        userId: userProfile.uid,
        userName: userProfile.name,
        mealType: rating.mealType,
        date: new Date().toISOString().slice(0, 10),
        rating: Number(rating.stars),
        feedback: rating.feedback,
        createdAt: new Date().toISOString()
      });
      alert("Thank you for your feedback!");
      setRating({ mealType: 'breakfast', stars: 5, feedback: '' });
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Welcome, {userProfile?.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Menu */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Utensils className="h-6 w-6 text-indigo-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Today's Menu</h2>
          </div>
          {todayMenu ? (
            <div className="space-y-3">
              <p><span className="font-medium text-gray-700">Breakfast:</span> {todayMenu.breakfast}</p>
              <p><span className="font-medium text-gray-700">Lunch:</span> {todayMenu.lunch}</p>
              <p><span className="font-medium text-gray-700">Dinner:</span> {todayMenu.dinner}</p>
            </div>
          ) : (
            <p className="text-gray-500">Menu not updated for today.</p>
          )}
        </div>

        {/* Rent Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <CreditCard className="h-6 w-6 text-green-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Rent Status ({new Date().toLocaleString('default', { month: 'long' })})</h2>
          </div>
          {rentStatus ? (
            <div className="space-y-3">
              <p><span className="font-medium text-gray-700">Amount:</span> ₹{rentStatus.amount}</p>
              <p>
                <span className="font-medium text-gray-700">Status:</span>{' '}
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rentStatus.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {rentStatus.status.toUpperCase()}
                </span>
              </p>
              <p><span className="font-medium text-gray-700">Due Date:</span> {new Date(rentStatus.dueDate).toLocaleDateString()}</p>
            </div>
          ) : (
            <p className="text-gray-500">No rent record found for this month.</p>
          )}
        </div>

        {/* Request Tea */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Coffee className="h-6 w-6 text-orange-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Request Tea</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">Want tea? Raise a request and the warden will be notified to provide milk to the cook.</p>
          <button 
            onClick={handleRequestTea} 
            disabled={isSubmittingTea}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
          >
            {isSubmittingTea ? 'Requesting...' : 'Request Tea Now'}
          </button>
        </div>

        {/* Rate Food */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Star className="h-6 w-6 text-yellow-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Rate Today's Food</h2>
          </div>
          <form onSubmit={handleRateFood} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Meal</label>
              <select 
                value={rating.mealType}
                onChange={e => setRating({...rating, mealType: e.target.value})}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="tea">Tea</option>
                <option value="dinner">Dinner</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rating (1-5 Stars)</label>
              <input 
                type="number" 
                min="1" max="5" 
                required
                value={rating.stars}
                onChange={e => setRating({...rating, stars: Number(e.target.value)})}
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Feedback / Problem</label>
              <textarea 
                rows={2}
                value={rating.feedback}
                onChange={e => setRating({...rating, feedback: e.target.value})}
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Any issues with the food?"
              />
            </div>
            <button 
              type="submit"
              disabled={isSubmittingRating}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
            </button>
          </form>
        </div>

        {/* Notice Board */}
        <div className="bg-white shadow rounded-lg p-6 md:col-span-2">
          <div className="flex items-center mb-4">
            <Bell className="h-6 w-6 text-yellow-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Notice Board</h2>
          </div>
          {notices.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {notices.map(notice => (
                <li key={notice.id} className="py-4">
                  <p className="text-sm font-medium text-gray-900">{notice.title}</p>
                  <p className="text-sm text-gray-500">{notice.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(notice.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No new notices.</p>
          )}
        </div>
      </div>
    </div>
  );
}
