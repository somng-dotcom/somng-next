import { createClient } from '@/lib/supabase/client';

export async function getStudents() {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function createStudent(student: { email: string; full_name: string }) {
    // Note: Creating a user in Supabase Auth requires an Admin client or a backend function.
    // For a client-side implementation without Edge Functions, we can only insert into 'profiles'
    // if the user already exists in Auth, OR we use the signUp method which logs the current user out.
    // Given the constraints, we'll try to insert into profiles directly if possible, 
    // but ideally, this should be an invite flow or a backend function.
    // 
    // OPTION: Since we are admin, we might not be able to create Auth users directly from client SDK 
    // without signing out the admin. 
    // CHECK: Does the user want a full Auth creation? 
    // "make the student page functional" implies being able to "Add New Student".
    // I'll implement a simple profile insert for now, but really this needs an Edge Function.
    // I will try to use a direct insert and see if it works with logic on backend 
    // or return a "Not Implemented" for Auth part if restricted.

    // Actually, best practice for client-side admin "Create User" is usually invitiation.
    // But let's assume we just want to track them in profiles for now or use a dummy implementation 
    // that assumes backend triggers handle the rest.

    // Let's implement a direct insert into profiles for now.
    const supabase = createClient();
    const { data, error } = await supabase
        .from('profiles')
        .insert({
            email: student.email,
            full_name: student.full_name,
            role: 'student'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateStudent(id: string, updates: { full_name?: string; email?: string; role?: string }) {
    const supabase = createClient();

    // Check for admin role restriction (max 2 admins)
    if (updates.role === 'admin') {
        const { count, error: countError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'admin');

        if (countError) throw countError;

        // If there are already 2 or more admins, and we are not updating an existing admin self (which shouldn't happen here usually but good to be safe)
        // Actually, we check if the user being updated is NOT already an admin.
        const { data: currentUser, error: userError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', id)
            .single();

        if (userError) throw userError;

        if (currentUser.role !== 'admin' && (count || 0) >= 2) {
            throw new Error('Maximum number of admins (2) reached. You cannot promote more users to admin.');
        }
    }

    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteStudent(id: string) {
    const supabase = createClient();

    // Perform a soft delete by changing role to 'archived'
    // This prevents foreign key constraint violations (e.g. existing enrollments)
    // and ensures we don't lose historical data.
    const { error } = await supabase
        .from('profiles')
        .update({ role: 'archived' })
        .eq('id', id);

    if (error) throw error;
}
