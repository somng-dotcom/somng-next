import { createClient } from '@/lib/supabase/server';

/**
 * Server-side utility to check if the current user is an admin.
 * Use this in Server Components or API routes that need admin protection.
 * 
 * @returns Promise<boolean> - true if user is admin, false otherwise
 */
export async function isAdminUser(): Promise<boolean> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return false;
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return false;
        }

        return profile.role === 'admin';
    } catch (error) {
        console.error('[isAdminUser] Error checking admin status:', error);
        return false;
    }
}

/**
 * Gets the current user's role from the database.
 * 
 * @returns Promise<string | null> - the user's role or null if not found
 */
export async function getUserRole(): Promise<string | null> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return null;
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return null;
        }

        return profile.role;
    } catch (error) {
        console.error('[getUserRole] Error getting user role:', error);
        return null;
    }
}
