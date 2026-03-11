import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Bell, CheckCircle, Clock } from 'lucide-react';
import clsx from 'clsx';

export default function NotificationCenter() {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!userProfile) return;

    const q = query(
      collection(db, 'notifications'),
      where('targetRole', 'array-contains', userProfile.role),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: any[] = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() });
      });
      setNotifications(notifs);
    }, (error) => {
      console.error("Error fetching notifications:", error);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const unreadCount = notifications.filter(n => !n.readBy?.includes(userProfile?.uid)).length;

  const markAsRead = async (notificationId: string, currentReadBy: string[]) => {
    if (!userProfile || currentReadBy.includes(userProfile.uid)) return;
    
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        readBy: [...currentReadBy, userProfile.uid]
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!userProfile) return;
    
    const unreadNotifs = notifications.filter(n => !n.readBy?.includes(userProfile.uid));
    
    for (const notif of unreadNotifs) {
      try {
        await updateDoc(doc(db, 'notifications', notif.id), {
          readBy: [...(notif.readBy || []), userProfile.uid]
        });
      } catch (error) {
        console.error("Error marking all as read:", error);
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full"
      >
        <span className="sr-only">View notifications</span>
        <Bell className="h-6 w-6" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 ring-2 ring-white text-xs text-white flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="divide-y divide-gray-100">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const isRead = notification.readBy?.includes(userProfile?.uid);
                return (
                  <div 
                    key={notification.id} 
                    className={clsx(
                      "p-4 hover:bg-gray-50 transition-colors cursor-pointer",
                      !isRead ? "bg-indigo-50/50" : ""
                    )}
                    onClick={() => markAsRead(notification.id, notification.readBy || [])}
                  >
                    <div className="flex justify-between items-start">
                      <p className={clsx("text-sm font-medium", !isRead ? "text-gray-900" : "text-gray-600")}>
                        {notification.title}
                      </p>
                      {!isRead && <span className="h-2 w-2 bg-indigo-600 rounded-full mt-1.5 flex-shrink-0"></span>}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(notification.createdAt).toLocaleString()}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                No notifications yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
