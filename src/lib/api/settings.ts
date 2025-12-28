import { createClient } from '@/lib/supabase/client';
import { SiteSettings } from '@/types/settings';
import { PostgrestError } from '@supabase/supabase-js';

export async function getSiteSettings(): Promise<SiteSettings | null> {
    const supabase = createClient();

    // Fetch the single row of settings. 
    // We assume there's always one row due to our seed script, but we handle the case where there isn't.
    const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching site settings:', error);
        return null;
    }

    return data as SiteSettings;
}

export async function updateSiteSettings(id: string, updates: Partial<SiteSettings>): Promise<{ error: PostgrestError | null }> {
    const supabase = createClient();

    const { error } = await supabase
        .from('site_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

    return { error };
}
