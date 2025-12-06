import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface ProfileUpdates {
    full_name?: string;
    avatar_url?: string;
    // Add other fields here if needed in the future
}

export async function updateProfile(userId: string, updates: ProfileUpdates) {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
}
