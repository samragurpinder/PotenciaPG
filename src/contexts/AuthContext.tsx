import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, secondaryAuth } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { ShieldCheck } from 'lucide-react';

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
  changePassword: (currentPass: string, newPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;
    let isCurrentAuth = true;

    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          
          // First get the doc to check if we need to force admin role
          const userDoc = await getDoc(userDocRef);
          
          // If auth state changed while we were fetching, don't set up listener
          if (auth.currentUser?.uid !== user.uid) return;

          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            if (user.email === 'pgadmin@gmail.com' && data.role !== 'admin') {
              await updateDoc(userDocRef, { role: 'admin' });
            }
          } else if (user.email === 'pgadmin@gmail.com' || user.email === 'pinder.60006@gmail.com') {
            const newProfile: UserProfile = {
              uid: user.uid,
              name: 'Super Admin',
              email: user.email || '',
              role: 'admin',
              status: 'active',
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', user.uid), newProfile);
          } else {
            await signOut(auth);
            setUserProfile(null);
            setLoading(false);
            return;
          }

          // Now set up the real-time listener
          profileUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              setUserProfile(docSnap.data() as UserProfile);
            } else {
              setUserProfile(null);
            }
            setLoading(false);
          }, (error) => {
            console.error("Error in profile listener:", error);
            setLoading(false);
          });
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setLoading(false);
        }
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      isCurrentAuth = false;
      authUnsubscribe();
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
    };
  }, []);

  const login = async (id: string, pass: string) => {
    const email = id.includes('@') ? id : `${id}@smartpg.com`;
    let finalPass = pass;
    if (/^\d{4}$/.test(pass)) {
      finalPass = pass + "pg";
    }
    try {
      await signInWithEmailAndPassword(auth, email, finalPass);
    } catch (error: any) {
      if (email === 'pgadmin@gmail.com' && pass === 'hostel2026' && error.code === 'auth/invalid-credential') {
        // Bootstrap the initial admin account
        const res = await createUserWithEmailAndPassword(auth, email, finalPass);
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
    let finalPass = pass;
    if (/^\d{4}$/.test(pass)) {
      finalPass = pass + "pg";
    }
    const res = await createUserWithEmailAndPassword(secondaryAuth, email, finalPass);
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

  const changePassword = async (currentPass: string, newPass: string) => {
    if (!currentUser || !currentUser.email) throw new Error("User not logged in");
    
    let finalCurrentPass = currentPass;
    if (/^\d{4}$/.test(currentPass)) {
      finalCurrentPass = currentPass + "pg";
    }
    
    let finalNewPass = newPass;
    if (/^\d{4}$/.test(newPass)) {
      finalNewPass = newPass + "pg";
    }

    const credential = EmailAuthProvider.credential(currentUser.email, finalCurrentPass);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, finalNewPass);
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, login, logout, registerUser, changePassword }}>
      {loading ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-t-4 border-brand-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-r-4 border-indigo-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="absolute inset-4 rounded-full border-b-4 border-rose-500 animate-spin" style={{ animationDuration: '2s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-brand-600 animate-pulse" />
            </div>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-slate-900 font-display tracking-tight">Nestify</h2>
          <p className="text-sm text-slate-500 font-medium mt-2 animate-pulse">Loading your workspace...</p>
        </div>
      ) : children}
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

