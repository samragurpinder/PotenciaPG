import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, onSnapshot, doc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Utensils, CreditCard, Bell, Coffee, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';

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
    <div className="space-y-10 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 font-display tracking-tight">Welcome, {userProfile?.name?.split(' ')[0]}</h1>
          <p className="text-slate-500 mt-2">Here's what's happening at Nestify today.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 self-start">
          <div className="px-4 py-2 bg-brand-50 text-brand-700 text-xs font-bold rounded-xl uppercase tracking-wider">
            Room {userProfile?.roomNumber || 'N/A'}
          </div>
          <div className="px-4 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl uppercase tracking-wider">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Menu */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-[2rem] lg:col-span-2 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Utensils className="w-32 h-32 text-slate-900" />
          </div>
          
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mr-4 shadow-sm">
              <Utensils className="h-6 w-6 text-brand-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">Today's Menu</h2>
              <p className="text-sm text-slate-500">Freshly prepared meals</p>
            </div>
          </div>

          {todayMenu ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { label: 'Breakfast', value: todayMenu.breakfast, icon: '🍳' },
                { label: 'Lunch', value: todayMenu.lunch, icon: '🥗' },
                { label: 'Dinner', value: todayMenu.dinner, icon: '🍲' }
              ].map((item) => (
                <div key={item.label} className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-lg transition-all duration-300">
                  <span className="text-2xl mb-3 block">{item.icon}</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-base font-bold text-slate-900 leading-tight">{item.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Utensils className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Menu not updated for today.</p>
            </div>
          )}
        </motion.div>

        {/* Rent Status */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-8 rounded-[2rem]"
        >
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mr-4 shadow-sm">
              <CreditCard className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">Rent Status</h2>
              <p className="text-sm text-slate-500">{new Date().toLocaleString('default', { month: 'long' })}</p>
            </div>
          </div>

          {rentStatus ? (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Amount Due</p>
                <p className="text-4xl font-bold text-slate-900 font-display">₹{rentStatus.amount.toLocaleString()}</p>
              </div>
              
              <div className="flex items-center justify-between px-2">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Status</span>
                <span className={clsx(
                  "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full",
                  rentStatus.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                )}>
                  {rentStatus.status}
                </span>
              </div>
              
              <div className="flex items-center justify-between px-2">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Due Date</span>
                <span className="text-sm font-bold text-slate-900">{new Date(rentStatus.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>

              {rentStatus.status !== 'paid' && (
                <button className="modern-button-primary w-full mt-4">Pay Now</button>
              )}
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <CreditCard className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No rent record found.</p>
            </div>
          )}
        </motion.div>

        {/* Request Tea */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-8 rounded-[2rem] relative overflow-hidden group"
        >
          <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:rotate-12 transition-transform duration-500">
            <Coffee className="w-32 h-32 text-slate-900" />
          </div>
          
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mr-4 shadow-sm">
              <Coffee className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">Request Tea</h2>
              <p className="text-sm text-slate-500">Fresh milk tea</p>
            </div>
          </div>
          
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            Craving some tea? Raise a request and we'll notify the warden to provide milk to the cook.
          </p>
          
          <button 
            onClick={handleRequestTea} 
            disabled={isSubmittingTea}
            className="modern-button w-full bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-500/20"
          >
            {isSubmittingTea ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Requesting...
              </div>
            ) : 'Request Tea Now'}
          </button>
        </motion.div>

        {/* Rate Food */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass p-8 rounded-[2rem] lg:col-span-2"
        >
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mr-4 shadow-sm">
              <Star className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">Rate Today's Food</h2>
              <p className="text-sm text-slate-500">Your feedback helps us improve</p>
            </div>
          </div>

          <form onSubmit={handleRateFood} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Which meal?</label>
                <div className="grid grid-cols-2 gap-2">
                  {['breakfast', 'lunch', 'tea', 'dinner'].map((meal) => (
                    <button
                      key={meal}
                      type="button"
                      onClick={() => setRating({...rating, mealType: meal})}
                      className={clsx(
                        "px-4 py-3 rounded-xl text-sm font-bold capitalize transition-all duration-200 border",
                        rating.mealType === meal 
                          ? "bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-500/20" 
                          : "bg-white text-slate-600 border-slate-200 hover:border-brand-200 hover:bg-brand-50/50"
                      )}
                    >
                      {meal}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Rating</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating({...rating, stars: star})}
                      className="p-1 transition-transform active:scale-90"
                    >
                      <Star 
                        className={clsx(
                          "w-8 h-8 transition-colors",
                          star <= rating.stars ? "text-amber-500 fill-current" : "text-slate-200"
                        )} 
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Feedback / Problem</label>
                <textarea 
                  rows={4}
                  value={rating.feedback}
                  onChange={e => setRating({...rating, feedback: e.target.value})}
                  className="modern-input resize-none"
                  placeholder="Tell us what you liked or what could be better..."
                />
              </div>
              
              <button 
                type="submit"
                disabled={isSubmittingRating}
                className="modern-button-primary w-full py-4"
              >
                {isSubmittingRating ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Notice Board */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass p-8 rounded-[2rem] lg:col-span-3"
        >
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mr-4 shadow-sm">
              <Bell className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">Notice Board</h2>
              <p className="text-sm text-slate-500">Important announcements</p>
            </div>
          </div>

          {notices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notices.map(notice => (
                <div key={notice.id} className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-brand-50 text-brand-700 text-[10px] font-bold uppercase tracking-widest rounded-full">Notice</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(notice.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{notice.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{notice.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No new notices.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
