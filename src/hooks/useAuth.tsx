'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Profile } from '@/types/database';

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    isLoading: boolean;
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signInWithGoogle: () => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
    updatePassword: (password: string) => Promise<{ error: Error | null }>;
    resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createClient();
    const router = useRouter();

    // Fetch user profile
    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (!error && data) {
            setProfile(data as Profile);
        }
    };

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            console.log('[Auth] Initializing...');
            try {
                const { data: { session } } = await supabase.auth.getSession();
                console.log('[Auth] Session fetched:', session ? 'Found' : 'Null');
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    console.log('[Auth] User found, fetching profile...');
                    await fetchProfile(session.user.id);
                }
            } catch (error) {
                console.error('[Auth] Error initializing auth:', error);
            } finally {
                console.log('[Auth] Initialization complete, isLoading -> false');
                setIsLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('[Auth] onAuthStateChange:', event, session ? 'Session found' : 'No session');
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Revalidate session on window focus and interval
    useEffect(() => {
        const handleRevalidation = async () => {
            // Don't trigger loading state for background refreshes to avoid UI flickering
            // But for focus, maybe we want to be sure? 
            // Actually, if we just refresh, components will update.

            const { data: { session: currentSession }, error } = await supabase.auth.getSession();

            if (error || !currentSession) {
                if (session) {
                    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                    if (refreshError || !refreshData.session) {
                        // Truly expired
                        if (session) signOut(); // Consistently sign out if refresh fails
                        return;
                    }
                    // Refresh successful, state will update via onAuthStateChange
                }
            } else if (currentSession?.access_token !== session?.access_token) {
                // State will update via onAuthStateChange usually, but good to be safe
            }
        };

        const onFocus = () => {
            handleRevalidation();
        };

        window.addEventListener('focus', onFocus);

        // Refresh every 4 minutes (before typical 5-10 min issues, standard token is 60m but being safe)
        const interval = setInterval(handleRevalidation, 4 * 60 * 1000);

        return () => {
            window.removeEventListener('focus', onFocus);
            clearInterval(interval);
        };
    }, [session]);

    // Sign up
    const signUp = async (email: string, password: string, fullName: string) => {
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    // Sign in
    const signIn = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    // Sign in with Google
    const signInWithGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    // Sign out
    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            setUser(null);
            setProfile(null);
            setSession(null);
            router.push('/login');
        }
    };

    // Update profile
    const updateProfile = async (data: Partial<Profile>) => {
        if (!user) return { error: new Error('Not authenticated') };

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ ...data, updated_at: new Date().toISOString() })
                .eq('id', user.id);

            if (error) throw error;

            // Refresh profile
            await fetchProfile(user.id);
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    // Update password
    const updatePassword = async (password: string) => {
        try {
            const { error } = await supabase.auth.updateUser({
                password,
            });

            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    // Reset password for email
    const resetPasswordForEmail = async (email: string) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    // Refresh profile manually
    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                session,
                isLoading,
                signUp,
                signIn,
                signInWithGoogle,
                signOut,
                updateProfile,
                updatePassword,
                resetPasswordForEmail,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
