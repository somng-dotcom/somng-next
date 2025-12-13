export interface NotificationTemplate {
    id: string;
    key: string;
    label: string;
    description: string;
    subject: string;
    content: string;
    variables: string[]; // JSON array stored as string[]
    created_at: string;
    updated_at: string;
}

export interface NotificationLog {
    id: string;
    recipient_email: string;
    recipient_name: string | null;
    type: string;
    status: 'pending' | 'delivered' | 'failed';
    error_message: string | null;
    sent_at: string;
    created_at: string;
}
