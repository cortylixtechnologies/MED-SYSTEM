import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  hospital_id: string | null;
  hospital_name?: string;
  specialty: string | null;
  role: 'doctor' | 'admin';
}

export interface MFAChallenge {
  factorId: string;
  onVerified: () => void;
  onCancel: () => void;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  currentUser: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null; mfaRequired?: boolean; factorId?: string }>;
  signup: (email: string, password: string, fullName: string, hospitalId?: string, specialty?: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  mfaChallenge: MFAChallenge | null;
  setMfaChallenge: (challenge: MFAChallenge | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mfaChallenge, setMfaChallenge] = useState<MFAChallenge | null>(null);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, hospitals(name)')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      if (!profile) return null;

      // Fetch roles (user may have multiple, prioritize admin)
      const { data: rolesData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (roleError) {
        console.error('Error fetching role:', roleError);
      }

      // Prioritize admin role if user has multiple roles
      const isAdmin = rolesData?.some(r => r.role === 'admin');
      const userRole = isAdmin ? 'admin' : (rolesData?.[0]?.role as 'doctor' | 'admin') || 'doctor';

      const userProfile: UserProfile = {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        hospital_id: profile.hospital_id,
        hospital_name: (profile.hospitals as any)?.name || undefined,
        specialty: profile.specialty,
        role: userRole,
      };

      return userProfile;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer profile fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id).then(setCurrentUser);
          }, 0);
        } else {
          setCurrentUser(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id).then((profile) => {
          setCurrentUser(profile);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null; mfaRequired?: boolean; factorId?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }

    // Check if MFA is required
    if (data.session) {
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
        // MFA is required - get the factor
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        const verifiedFactor = factorsData?.totp?.find(f => f.status === 'verified');
        
        if (verifiedFactor) {
          return { error: null, mfaRequired: true, factorId: verifiedFactor.id };
        }
      }
    }

    return { error: null };
  };

  const signup = async (
    email: string, 
    password: string, 
    fullName: string,
    hospitalId?: string,
    specialty?: string
  ): Promise<{ error: string | null }> => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      }
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      // Create profile - role is assigned by database trigger
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        hospital_id: hospitalId || null,
        specialty: specialty || null,
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return { error: 'Account created but profile setup failed. Please contact support.' };
      }
    }

    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user,
      session,
      currentUser, 
      isLoading,
      login, 
      signup,
      logout, 
      isAuthenticated: !!user,
      mfaChallenge,
      setMfaChallenge,
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
