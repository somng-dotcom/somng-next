'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import { PageLoader } from '@/components/ui/PageLoader';
import { Button } from '@/components/ui/Button';
import { AdminGuard } from '@/components/auth/AdminGuard';

export default function DebugPage() {
    const { user, profile, isLoading: authLoading } = useAuth();
    const [logs, setLogs] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const log = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    const runDiagnostics = async () => {
        setIsLoading(true);
        setLogs([]);
        log(`Diagnostics Started. Auth User: ${user?.id || 'NULL'} (AuthLoading: ${authLoading})`);

        try {
            const supabase = createClient();

            // Check Config
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            log(`Config Check: URL=${url ? 'OK' : 'MISSING'}, Key=${key ? 'OK' : 'MISSING'}`);
            if (url) log(`URL Preview: ${url.substring(0, 15)}...`);

            // 1. Check Auth (Double Check)
            if (!user) {
                log('⚠️ WARNING: User session is missing. Proceeding anyway (Force Run)...');
            }

            // 2. Check RPC is_admin
            log('Step 2: Checking is_admin() function...');
            const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin');

            if (rpcError) {
                log(`❌ RPC FAILED: ${rpcError.message}`);
                log(`Hint: Did you run the force_fix_all.sql script?`);
            } else {
                log(`✅ RPC Success. is_admin returned: ${isAdmin}`);
                if (isAdmin === false) {
                    log('❌ WARNING: User is NOT an admin in the database.');
                }
            }

            // 3. Check Profile Read
            if (user) {
                log('Step 3: Reading Profile...');
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    log(`❌ Read Profile FAILED: ${profileError.message}`);
                } else {
                    log(`✅ Read Profile Success. Role: ${profile?.role}`);
                }
            } else {
                log('Step 3: Skipped Profile Read (No User ID)');
            }

            // 4. Test Course Insert
            const testId = new Date().getTime();
            log(`Step 4: Testing Course Insert (ID: ${testId})...`);

            const testCourse = {
                title: 'Debug Test Course ' + testId,
                slug: 'debug-test-' + testId,
                instructor_id: user?.id // might be null if forced
            };

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timed Out (10s)')), 10000)
            );

            let courseId: string | null = null;
            let moduleId: string | null = null;

            // INSERT COURSE
            try {
                const insertPromise = supabase.from('courses').insert(testCourse).select().single();
                const { data: inserted, error: insertError } = await Promise.race([insertPromise, timeoutPromise]) as any;

                if (insertError) {
                    log(`❌ Insert Course FAILED: ${insertError.message || 'Unknown Error'}`);
                    log(`Code: ${insertError.code}, Details: ${insertError.details}, Hint: ${insertError.hint}`);
                    throw insertError;
                }
                log('✅ Insert Course Success!');
                courseId = inserted.id;
            } catch (err: any) {
                log(`❌ Insert Course CRASHED: ${err.message || JSON.stringify(err)}`);
            }

            // 5. Test Course Update
            if (courseId) {
                log('Step 5: Testing Course Update...');
                const updatePromise = supabase.from('courses').update({ title: 'Updated Debug Title' }).eq('id', courseId).select();
                try {
                    const { error: updateError } = await Promise.race([updatePromise, timeoutPromise]) as any;
                    if (updateError) {
                        log(`❌ Update Course FAILED: ${updateError.message}`);
                        log(`Code: ${updateError.code}, Details: ${updateError.details}`);
                    } else {
                        log('✅ Update Course Success!');
                    }
                } catch (e: any) { log(`❌ Update Course TIMEOUT: ${e.message}`); }
            }

            // 6. Test Module Create
            if (courseId) {
                log('Step 6: Testing Module Insert...');
                const modulePromise = supabase.from('modules').insert({
                    course_id: courseId,
                    title: 'Debug Module',
                    order_index: 1
                }).select().single();

                try {
                    const { data: mod, error: modError } = await Promise.race([modulePromise, timeoutPromise]) as any;
                    if (modError) {
                        log(`❌ Insert Module FAILED: ${modError.message}`);
                        log(`Code: ${modError.code}, Details: ${modError.details}`);
                    } else {
                        log('✅ Insert Module Success!');
                        moduleId = mod.id;
                    }
                } catch (e: any) { log(`❌ Insert Module TIMEOUT: ${e.message}`); }
            }

            // 7. Test Lesson Create
            if (moduleId) {
                log('Step 7: Testing Lesson Insert...');
                const lessonPromise = supabase.from('lessons').insert({
                    module_id: moduleId,
                    title: 'Debug Lesson',
                    content_type: 'text',
                    order_index: 1
                }).select();

                try {
                    const { error: lessonError } = await Promise.race([lessonPromise, timeoutPromise]) as any;
                    if (lessonError) {
                        log(`❌ Insert Lesson FAILED: ${lessonError.message}`);
                        log(`Code: ${lessonError.code}, Details: ${lessonError.details}`);
                    } else {
                        log('✅ Insert Lesson Success!');
                    }
                } catch (e: any) { log(`❌ Insert Lesson TIMEOUT: ${e.message}`); }
            }

            // Cleanup
            if (courseId) {
                log('Cleaning up test data...');
                await supabase.from('courses').delete().eq('id', courseId);
                log('✅ Cleanup Success');
            }

        } catch (e: any) {
            log(`❌ CRITICAL ERROR: ${e.message}`);
        } finally {
            setIsLoading(false);
            log('Diagnostics Complete.');
        }
    };

    if (authLoading) {
        return <PageLoader role="admin" />;
    }

    return (
        <AdminGuard profile={profile} isLoading={authLoading}>
            <div className="flex h-screen bg-background-light dark:bg-background-dark font-display text-text-primary-light dark:text-text-primary-dark">
                <Sidebar role="admin" />
                <main className="flex-1 overflow-y-auto lg:ml-64 p-8">
                    <div className="max-w-2xl mx-auto">
                        <h1 className="text-2xl font-bold mb-4 text-text-primary-light dark:text-text-primary-dark">System Diagnostics</h1>
                        <div className="mb-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                            Use this page to debug database connection and permission issues.
                        </div>

                        <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 text-xs font-mono border border-yellow-200 dark:border-yellow-800 rounded text-yellow-800 dark:text-yellow-200">
                            DEBUG INFO:
                            User: {user ? user.id : 'NULL'} |
                            Auth Loading: {authLoading ? 'YES' : 'NO'} |
                            Busy: {isLoading ? 'YES' : 'NO'}
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={runDiagnostics} disabled={isLoading}>
                                {isLoading ? 'Running...' : 'Run Diagnostics (Force)'}
                            </Button>
                        </div>

                        <div className="mt-6 p-4 bg-black text-green-400 font-mono text-sm rounded-lg min-h-[300px] whitespace-pre-wrap">
                            {logs.length === 0 ? 'Ready to run...' : logs.join('\n')}
                        </div>
                    </div>
                </main>
                <MobileNav role="admin" />
            </div>
        </AdminGuard>
    );
}
