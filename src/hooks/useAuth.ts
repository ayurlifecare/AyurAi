import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db, isFirebaseConfigured } from '../config/firebase';

export interface UserProfile {
  name?: string;
  email?: string;
  profession?: string;
  subscription?: 'free' | 'pro';
  subscriptionEndDate?: string;
  coins?: number;
  lastCoinReset?: string;
  [key: string]: any;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<'cloud' | 'local'>('cloud');

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setError("Firebase is not configured. Please add your Firebase credentials to the environment variables.");
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user && db) {
      const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          
          // Check for subscription expiration
          if (data.subscription === 'pro' && data.subscriptionEndDate) {
            const endDate = new Date(data.subscriptionEndDate);
            if (endDate < new Date()) {
              // Subscription expired
              data.subscription = 'free';
              // Update in Firestore silently
              setDoc(doc(db, 'users', user.uid), { subscription: 'free' }, { merge: true });
            }
          }
          
          setUserProfile(data);
          localStorage.setItem(`ayurai_profile_${user.uid}`, JSON.stringify(data));
          setStorageMode('cloud');
        } else {
          const localData = localStorage.getItem(`ayurai_profile_${user.uid}`);
          if (localData) {
            setUserProfile(JSON.parse(localData));
          } else {
            setUserProfile(null);
          }
        }
        setLoading(false);
      }, (err) => {
        // Silently handle permission errors by switching to local mode
        if (err.message.includes("permissions")) {
          setStorageMode('local');
          const localData = localStorage.getItem(`ayurai_profile_${user.uid}`);
          if (localData) {
            setUserProfile(JSON.parse(localData));
          }
          // Don't set global error if we have local data, just log it
          console.warn("Firestore permissions missing. Falling back to local storage.");
        } else {
          console.error("Firestore Error:", err);
          setError(err.message);
        }
        setLoading(false);
      });
      return () => unsubscribeProfile();
    }
  }, [user]);

  const loginWithGoogle = async () => {
    if (!auth || !googleProvider) throw new Error("Firebase is not configured");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (db && result.user) {
        // Ensure user document exists
        await setDoc(doc(db, 'users', result.user.uid), {
          name: result.user.displayName,
          email: result.user.email,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      if (error.code === 'auth/configuration-not-found') {
        throw new Error("Google Sign-In is not enabled. Please enable it in your Firebase Console (Authentication -> Sign-in method).");
      }
      if (error.code === 'auth/unauthorized-domain') {
        throw new Error("This domain is not authorized. Please add this app's URL to 'Authorized domains' in Firebase Console (Authentication -> Settings).");
      }
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error("Firebase is not configured");
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      console.error("Email login error:", error);
      if (error.code === 'auth/configuration-not-found') {
        throw new Error("Email/Password Sign-In is not enabled. Please enable it in your Firebase Console (Authentication -> Sign-in method).");
      }
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string, profession: string) => {
    if (!auth) throw new Error("Firebase is not configured");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      
      // Update profile with name
      await updateProfile(userCredential.user, {
        displayName: name
      });

      // Save additional details to Firestore
      if (db) {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name,
          email,
          profession,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error: any) {
      console.error("Email registration error:", error);
      if (error.code === 'auth/configuration-not-found') {
        throw new Error("Email/Password Sign-In is not enabled. Please enable it in your Firebase Console (Authentication -> Sign-in method).");
      }
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) throw new Error("Firebase is not configured");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const updateCoins = async (newCoins: number) => {
    if (!user) return;
    
    // Optimistic update
    const updatedProfile = { ...userProfile, coins: newCoins, updatedAt: new Date().toISOString() };
    setUserProfile(updatedProfile);
    localStorage.setItem(`ayurai_profile_${user.uid}`, JSON.stringify(updatedProfile));

    if (db) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          coins: newCoins,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        console.error("Error updating coins in Firestore:", error);
      }
    }
  };

  const upgradeToPro = async () => {
    if (!user) return;

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    const endDateStr = endDate.toISOString();

    // Optimistic update
    const updatedProfile = { 
      ...userProfile, 
      subscription: 'pro', 
      subscriptionEndDate: endDateStr,
      updatedAt: new Date().toISOString() 
    };
    setUserProfile(updatedProfile as UserProfile);
    localStorage.setItem(`ayurai_profile_${user.uid}`, JSON.stringify(updatedProfile));

    if (db) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          subscription: 'pro',
          subscriptionEndDate: endDateStr,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        console.error("Error upgrading to pro in Firestore:", error);
      }
    }
  };

  const resetDailyCoins = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    
    // Optimistic update
    const updatedProfile = { 
      ...userProfile, 
      coins: 20, 
      lastCoinReset: today, 
      updatedAt: new Date().toISOString() 
    };
    setUserProfile(updatedProfile);
    localStorage.setItem(`ayurai_profile_${user.uid}`, JSON.stringify(updatedProfile));

    if (db) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          coins: 20,
          lastCoinReset: today,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        console.error("Error resetting daily coins in Firestore:", error);
      }
    }
  };

  return { 
    user, userProfile, loading, error, storageMode,
    loginWithGoogle, loginWithEmail, registerWithEmail, logout,
    updateCoins, upgradeToPro, resetDailyCoins
  };
}
