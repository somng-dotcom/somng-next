import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const COURSE_BUCKET = 'course-content';
const PUBLIC_BUCKET = 'public';

export async function uploadCourseContent(file: File): Promise<string> {
    // 1. Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `course-content/${fileName}`; // Keep structure if needed, or just fileName

    // 2. Upload file
    const { error: uploadError } = await supabase.storage
        .from(COURSE_BUCKET)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 3. Get public URL
    const { data } = supabase.storage
        .from(COURSE_BUCKET)
        .getPublicUrl(filePath);

    return data.publicUrl;
}

export async function uploadSiteLogo(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `site-logo-${Date.now()}.${fileExt}`;
    const filePath = `branding/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from(PUBLIC_BUCKET)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true // Allow overwriting if we use a fixed name, but here we use timestamp
        });

    if (uploadError) {
        throw new Error(`Logo upload failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage
        .from(PUBLIC_BUCKET)
        .getPublicUrl(filePath);

    return data.publicUrl;
}
