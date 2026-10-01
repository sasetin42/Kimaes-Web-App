import { useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '@/types';
import {
  subscribeToAuth,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  updateUserProfile,
  bootstrapInitialSuperAdmin
} from '@/services/authService';
import { toast } from 'sonner';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt auto-provision of initial super admin in background once if needed
    bootstrapInitialSuperAdmin().catch(() => {});

    // Listen to local custom event for immediate session updates
    const handleCustomAuth = (e: Event) => {
      const customEvent = e as CustomEvent<User | null>;
      setUser(customEvent.detail);
      setLoading(false);
    };
    window.addEventListener('kimae_auth_change', handleCustomAuth);

    // Listen to Firebase Auth state and Firestore profile in real-time
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      window.removeEventListener('kimae_auth_change', handleCustomAuth);
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, pass: string): Promise<boolean> => {
    try {
      const loggedUser = await loginWithEmail(email, pass);
      setUser(loggedUser);
      if (loggedUser.role === 'super_admin') {
        toast.success(`Welcome Super Administrator, ${loggedUser.name}! 🛡️`);
      } else {
        toast.success(`Welcome back, ${loggedUser.name}! 👋`);
      }
      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      let msg = 'Invalid email or password';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid credentials. Please verify your email and password.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Access temporarily disabled due to multiple failed login attempts.';
      }
      toast.error(msg);
      return false;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, mobile: string, pass: string): Promise<boolean> => {
    if (pass.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    try {
      const newUser = await registerWithEmail(name, email, mobile, pass, 'customer');
      toast.success(`Welcome to Kimae's, ${newUser.name}! 🎉`);
      return true;
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        toast.error('An account with this email already exists.');
      } else {
        toast.error(err.message || 'Failed to create account.');
      }
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
      toast.info('Logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (user) {
      try {
        await updateUserProfile(user.id, updates);
        toast.success('Profile updated in Firestore!');
      } catch (err) {
        console.error('Profile update error:', err);
        toast.error('Failed to update profile.');
      }
    }
  }, [user]);

  return { user, loading, login, register, logout, updateUser };
};
