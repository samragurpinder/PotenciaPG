import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, secondaryAuth } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export type Role = 'admin' | 'warden' | 'cook' | 'student' | 'cleaner';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: Role;
  roomNumber?: string;
  bedNumber?: string;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (id: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  registerUser: (id: string, pass: string, name: string, role: Role, roomNumber?: string, phone?: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            // Force admin role if this is the super admin email, just in case it was accidentally saved as student
            if (user.email === 'pgadmin@gmail.com' && data.role !== 'admin') {
              await updateDoc(userDocRef, { role: 'admin' });
              setUserProfile({ ...data, role: 'admin' });
            } else {
              setUserProfile(data);
            }
          } else {
            // Should not happen normally as users are pre-created by admin,
            // If it does happen for a normal user, it means they were deleted by admin.
            if (user.email === 'pgadmin@gmail.com' || user.email === 'pinder.60006@gmail.com') {
              const newProfile: UserProfile = {
                uid: user.uid,
                name: 'Super Admin',
                email: user.email || '',
                role: 'admin',
                status: 'active',
                createdAt: new Date().toISOString()
              };
              await setDoc(doc(db, 'users', user.uid), newProfile);
              setUserProfile(newProfile);
            } else {
              // User was deleted by admin, sign them out
              await signOut(auth);
              setUserProfile(null);
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (id: string, pass: string) => {
    const email = id.includes('@') ? id : `${id}@smartpg.com`;
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      if (email === 'pgadmin@gmail.com' && pass === 'hostel2026' && error.code === 'auth/invalid-credential') {
        // Bootstrap the initial admin account
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, 'users', res.user.uid), {
          uid: res.user.uid,
          name: 'Super Admin',
          email: email,
          role: 'admin',
          status: 'active',
          createdAt: new Date().toISOString()
        });
      } else {
        throw error;
      }
    }
  };

  const registerUser = async (id: string, pass: string, name: string, role: Role, roomNumber?: string, phone?: string) => {
    const email = id.includes('@') ? id : `${id}@smartpg.com`;
    const res = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
    await setDoc(doc(db, 'users', res.user.uid), {
      uid: res.user.uid,
      name,
      email,
      role,
      roomNumber: roomNumber || '',
      phone: phone || '',
      status: 'active',
      createdAt: new Date().toISOString()
    });
    await signOut(secondaryAuth);
    return res.user.uid;
  };

  const logout = () => {
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, login, logout, registerUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

