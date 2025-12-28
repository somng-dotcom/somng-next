import { createClient } from '@/lib/supabase/client';
import { NotificationTemplate, NotificationLog } from '@/types/notifications';
import { PostgrestError } from '@supabase/supabase-js';

export async function getNotificationTemplates(): Promise<NotificationTemplate[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('label', { ascending: true });

    if (error) {
        console.error('Error fetching notification templates:', error);
        return [];
    }

    return data as NotificationTemplate[];
}

export async function updateNotificationTemplate(id: string, updates: Partial<NotificationTemplate>): Promise<{ error: PostgrestError | null }> {
    const supabase = createClient();

    const { error } = await supabase
        .from('notification_templates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

    return { error };
}

export async function getNotificationLogs(): Promise<NotificationLog[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .order('sent_at', { ascending: false });

    if (error) {
        console.error('Error fetching notification logs:', error);
        return [];
    }

    return data as NotificationLog[];
}

export async function createNotificationLog(logData: Omit<NotificationLog, 'id' | 'created_at' | 'sent_at' | 'status' | 'error_message'>): Promise<void> {
    const supabase = createClient();

    // Use service role if available (server-side) to ensure we can always log
    // Note: createClient in this file might be the standard client depending on imports.
    // If we need service role, we might need a separate instance or pass it in.
    // For now, we'll try standard client and see if RLS permits. 
    // If not, we'll rely on the API route which definitely uses service role.

    try {
        const { error } = await supabase
            .from('notification_logs')
            .insert({
                ...logData,
                status: 'pending', // Default status, effectively "logged only"
                sent_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error creating notification log:', error);
        }
    } catch (err) {
        console.error('Exception creating notification log:', err);
    }
}
