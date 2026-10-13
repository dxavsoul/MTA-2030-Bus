import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  isUserAdmin,
  loginWithGoogle,
  logOut,
  syncUserProfile,
  seedInitialAdminDataIfNeeded,
  subscribeUsersList,
} from '../services/firebaseClient';
import { UserProfile } from '../types/admin';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isBlocked: boolean;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  isAdmin: false,
  isBlocked: false,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    seedInitialAdminDataIfNeeded();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await syncUserProfile(user);
          setUserProfile(profile);
        } catch {
          // If Firestore sync fails or permissions differ, build local profile
          setUserProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || 'Commuter',
            photoURL: user.photoURL || '',
            role: user.email === 'mxsarmiento@gmail.com' ? 'admin' : 'user',
            isBlocked: false,
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      const user = await loginWithGoogle();
      if (user) {
        const profile = await syncUserProfile(user);
        setUserProfile(profile);
      }
    } catch (err) {
      console.error('Sign in error:', err);
    }
  };

  const handleSignOut = async () => {
    await logOut();
    setUserProfile(null);
  };

  const admin = isUserAdmin(currentUser, userProfile);
  const blocked = userProfile?.isBlocked ?? false;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin: admin,
        isBlocked: blocked,
        loading,
        signIn: handleSignIn,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
