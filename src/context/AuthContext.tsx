import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import {
  supabase,
  isSupabaseConfigured,
  fetchUserProfileAndRole,
  updateProfileRecord,
  updateAccountPassword,
} from '../lib/supabase';
import { Profile } from '../types';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  roleLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; isAdmin?: boolean }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; user?: User | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<{ mobile: string | null; full_name: string | null }>) => Promise<{ error: Error | null; profile?: Profile }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [roleLoading, setRoleLoading] = useState<boolean>(true);

  // Prevent stale async state updates
  const activeUserIdRef = useRef<string | null>(null);

  /**
   * Use the existing Supabase public.is_admin() RPC/function as the source of truth for admin detection.
   * After authentication/session restore, call supabase.rpc('is_admin').
   * If it returns true, set the user's role to admin and isAdmin to true; otherwise use user and false.
   * Remove any incorrect fallback that automatically sets the role to user when the profile query fails.
   */
  const syncRoleFromDatabase = useCallback(async (userId: string, authFullName?: string): Promise<{ profile: Profile | null; isAdmin: boolean }> => {
    try {
      setRoleLoading(true);

      // 1. Call supabase.rpc('is_admin') as the source of truth for admin detection
      let isRpcAdmin = false;
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('is_admin');
        if (rpcError) {
          console.warn('[AuthContext] supabase.rpc("is_admin") error:', rpcError.message);
        } else {
          isRpcAdmin = rpcData === true || String(rpcData).toLowerCase() === 'true';
        }
      } catch (rpcErr) {
        console.error('[AuthContext] Error calling supabase.rpc("is_admin"):', rpcErr);
      }

      // If it returns true, set the user's role to admin and isAdmin to true; otherwise use user and false
      const isAdminUser = isRpcAdmin;
      const role: 'admin' | 'user' = isAdminUser ? 'admin' : 'user';

      // 2. Fetch user's profile from public.profiles without letting any failure override admin status
      let profileResult: Profile | null = null;
      try {
        const { data: profileRow, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) {
          console.warn('[AuthContext] Profile query failed (admin detection preserved via is_admin):', profileError.message);
        } else if (profileRow) {
          profileResult = profileRow as Profile;
          
          // 3. Sync full_name if available in auth metadata but missing in profile
          if (authFullName && (!profileResult.full_name || profileResult.full_name.trim() === '')) {
            try {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ full_name: authFullName.trim() })
                .eq('id', userId);
                
              if (!updateError) {
                profileResult.full_name = authFullName.trim();
              }
            } catch (updateErr) {
              console.warn('[AuthContext] Non-fatal: could not auto-sync full_name to profile', updateErr);
            }
          }
        } else if (!profileRow && authFullName) {
          // If profile doesn't exist at all, try inserting it
          try {
            await supabase.from('profiles').insert({
              id: userId,
              role: 'user',
              full_name: authFullName.trim(),
            });
            profileResult = { id: userId, role: 'user', full_name: authFullName.trim(), mobile: null };
          } catch (insertErr) {
            console.warn('[AuthContext] Non-fatal: could not auto-insert profile with full_name', insertErr);
          }
        }
      } catch (profileErr) {
        console.warn('[AuthContext] Profile fetch error (admin detection preserved via is_admin):', profileErr);
      }

      // Build final profile ensuring role matches the source of truth
      const finalProfile: Profile = profileResult
        ? {
            ...profileResult,
            role: isAdminUser ? 'admin' : (profileResult.role === 'admin' ? 'admin' : 'user'),
          }
        : {
            id: userId,
            mobile: null,
            full_name: authFullName || null,
            role,
          };

      // Only apply if this is still the active user
      if (activeUserIdRef.current === userId) {
        setProfile(finalProfile);
        setIsAdmin(isAdminUser);
        console.log(`[AuthContext] is_admin RPC resolved: ${isRpcAdmin} -> role: "${role}" (isAdmin: ${isAdminUser})`);
      }

      return { profile: finalProfile, isAdmin: isAdminUser };
    } catch (err) {
      console.error('[AuthContext] Error in syncRoleFromDatabase:', err);
      return { profile: null, isAdmin: false };
    } finally {
      if (activeUserIdRef.current === userId) {
        setRoleLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setRoleLoading(false);
      return;
    }

    let isMounted = true;

    // 1. After session restoration, get current authenticated user using Supabase Auth
    const restoreSessionAndRole = async () => {
      try {
        setRoleLoading(true);

        // Fetch authenticated user directly via Supabase Auth
        const { data: userData, error: userError } = await supabase.auth.getUser();
        const currentAuthUser = userData?.user ?? null;

        if (userError || !currentAuthUser) {
          // Check cached session as fallback
          const { data: sessionData } = await supabase.auth.getSession();
          const fallbackUser = sessionData?.session?.user ?? null;

          if (!fallbackUser) {
            if (isMounted) {
              activeUserIdRef.current = null;
              setUser(null);
              setSession(null);
              setProfile(null);
              setIsAdmin(false);
              setRoleLoading(false);
              setLoading(false);
            }
            return;
          }

          if (isMounted) {
            activeUserIdRef.current = fallbackUser.id;
            setUser(fallbackUser);
            setSession(sessionData?.session ?? null);
            // 2. Fetch that user's row from public.profiles where profiles.id = auth.uid()
            await syncRoleFromDatabase(fallbackUser.id, fallbackUser.user_metadata?.full_name);
          }
          return;
        }

        if (isMounted) {
          activeUserIdRef.current = currentAuthUser.id;
          setUser(currentAuthUser);
          const { data: sessionData } = await supabase.auth.getSession();
          setSession(sessionData?.session ?? null);

          // 2. Fetch user's row from public.profiles where profiles.id = auth.uid()
          // 3. Read role column as single source of truth
          await syncRoleFromDatabase(currentAuthUser.id, currentAuthUser.user_metadata?.full_name);
        }
      } catch (err) {
        console.error('[AuthContext] Failed to restore session and role:', err);
        if (isMounted) {
          activeUserIdRef.current = null;
          setUser(null);
          setSession(null);
          setProfile(null);
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          setRoleLoading(false);
          setLoading(false);
        }
      }
    };

    restoreSessionAndRole();

    // Listen for auth state changes (e.g. token refresh, sign-in, sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        console.log(`[AuthContext] onAuthStateChange event: ${event}`);

        if (event === 'SIGNED_OUT' || !currentSession?.user) {
          activeUserIdRef.current = null;
          setUser(null);
          setSession(null);
          setProfile(null);
          setIsAdmin(false);
          setRoleLoading(false);
          setLoading(false);
          return;
        }

        const authUser = currentSession.user;
        activeUserIdRef.current = authUser.id;
        setUser(authUser);
        setSession(currentSession);

        // Fetch fresh role on auth state updates
        await syncRoleFromDatabase(authUser.id, authUser.user_metadata?.full_name);
        setRoleLoading(false);
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncRoleFromDatabase]);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured. Please check environment variables.') };
    }

    try {
      setRoleLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setRoleLoading(false);
        return { error };
      }

      if (data.user) {
        activeUserIdRef.current = data.user.id;
        setUser(data.user);
        setSession(data.session);

        // 1. Get current authenticated user using Supabase Auth
        const { data: authUserData } = await supabase.auth.getUser();
        const verifiedUser = authUserData?.user || data.user;

        // 2. Fetch that user's row from public.profiles where profiles.id = auth.uid()
        // 3. Read role column from the database and use it as the single source of truth
        const roleResult = await syncRoleFromDatabase(verifiedUser.id, verifiedUser.user_metadata?.full_name);
        setRoleLoading(false);
        setLoading(false);

        return { error: null, isAdmin: roleResult.isAdmin };
      }

      setRoleLoading(false);
      return { error: null, isAdmin: false };
    } catch (err: any) {
      setRoleLoading(false);
      return { error: err || new Error('An unexpected error occurred during sign in.') };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured. Please check environment variables.') };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        return { error };
      }

      // Automatically update public.profiles if the trigger didn't handle it yet
      // or to ensure full_name is correctly saved right away
      if (data.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            role: 'user', // Default role for new signups
          }, { onConflict: 'id' });
        } catch (profileError) {
          console.warn('[Supabase] Non-fatal: could not immediately upsert profile full_name', profileError);
        }
      }

      return { error: null, user: data.user };
    } catch (err: any) {
      return { error: err || new Error('An unexpected error occurred during registration.') };
    }
  };

  const signOut = async () => {
    activeUserIdRef.current = null;
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setRoleLoading(false);

    if (!isSupabaseConfigured) return;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await syncRoleFromDatabase(user.id, user.user_metadata?.full_name);
    }
  };

  const updateProfile = async (updates: Partial<{ mobile: string | null; full_name: string | null }>) => {
    if (!user) {
      return { error: new Error('User is not authenticated.') };
    }

    try {
      const updated = await updateProfileRecord(user.id, updates);
      if (updated) {
        setProfile((prev) => ({
          ...prev,
          ...updated,
          role: isAdmin ? 'admin' : (updated.role || 'user'),
        }));
      }
      return { error: null, profile: updated };
    } catch (err: any) {
      console.error('Error updating profile:', err);
      return { error: err || new Error('Failed to update profile.') };
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) {
      return { error: new Error('User is not authenticated.') };
    }

    try {
      await updateAccountPassword(newPassword);
      return { error: null };
    } catch (err: any) {
      console.error('Error updating password:', err);
      return { error: err || new Error('Failed to update password.') };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        loading,
        roleLoading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        updateProfile,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
