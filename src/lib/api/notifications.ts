import { createClient } from '@/lib/supabase/client';
import { NotificationTemplate, NotificationLog } from '@/types/notifications';

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

export async function updateNotificationTemplate(id: string, updates: Partial<NotificationTemplate>): Promise<{ error: any }> {
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
