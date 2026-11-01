import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { User } from '../types';
import api from '../services/api';
import { requireSupabase, supabase } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isDemo: boolean;
  loading: boolean;
  enterDemo: () => void;
  exitDemo: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const DEMO_USER: User = {
  id: 1,
  name: 'Suresh Sharma',
  email: 'suresh.sharma@rajmahal.coal.in',
  role: 'supervisor',
};

interface ProfileResponse {
  id: number;
  name: string;
  email: string;
  role: User['role'];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const fetchProfile = async (): Promise<User> => {
  const response = await api.get<ProfileResponse>('/auth/profile');
  return response.data;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    let authEventObserved = false;
    let profileRequest = 0;
    const restoreSession = async (session: Session | null) => {
      const requestId = ++profileRequest;
      if (!active) return;
      if (window.localStorage.getItem('minebrief_demo') === 'true') {
        setIsDemo(true);
        setIsAuthenticated(true);
        setUser(DEMO_USER);
        setLoading(false);
        return;
      }
      setIsDemo(false);
      if (!session) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }
      setIsAuthenticated(true);
      setLoading(false);
      try {
        const profile = await fetchProfile();
        if (active && requestId === profileRequest) setUser(profile);
      } catch {
        if (active && requestId === profileRequest) setUser(null);
      }
    };

    if (!supabase) {
      void restoreSession(null);
      return () => { active = false; };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventObserved = true;
      window.setTimeout(() => {
        void restoreSession(session);
      }, 0);
    });

    void supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (!authEventObserved) return restoreSession(data.session);
        return undefined;
      })
      .catch(() => {
        if (active && !authEventObserved) {
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
        }
      });

    return () => {
      active = false;
      profileRequest += 1;
      subscription.unsubscribe();
    };
  }, []);

  const enterDemo = () => {
    void supabase?.auth.signOut();
    window.localStorage.setItem('minebrief_demo', 'true');
    window.localStorage.removeItem('minebrief_user');
    setIsAuthenticated(true);
    setIsDemo(true);
    setUser(DEMO_USER);
    setLoading(false);
  };

  const exitDemo = () => {
    window.localStorage.removeItem('minebrief_demo');
    setIsAuthenticated(false);
    setIsDemo(false);
    setUser(null);
  };

  const login = async (email: string, password: string) => {
    const client = requireSupabase();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session) throw new Error('Sign-in did not return an authenticated session.');
    window.localStorage.removeItem('minebrief_demo');
    setIsAuthenticated(true);
    setIsDemo(false);
    setLoading(false);
    try {
      setUser(await fetchProfile());
    } catch {
      setUser(null);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    const client = requireSupabase();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    window.localStorage.removeItem('minebrief_demo');
    setIsDemo(false);
    if (!data.session) {
      setIsAuthenticated(false);
      setUser(null);
      return true;
    }
    setIsAuthenticated(true);
    setLoading(false);
    try {
      setUser(await fetchProfile());
    } catch {
      setUser(null);
    }
    return false;
  };

  const loginWithGoogle = async () => {
    const { error } = await requireSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await requireSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  };

  const logout = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    window.localStorage.removeItem('minebrief_demo');
    window.localStorage.removeItem('minebrief_user');
    setIsAuthenticated(false);
    setIsDemo(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isDemo,
      loading,
      enterDemo,
      exitDemo,
      login,
      signup,
      loginWithGoogle,
      resetPassword,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
