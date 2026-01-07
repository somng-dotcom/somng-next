import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

export function createClient(): SupabaseClient {
    // Return existing client if already created
    if (client) return client

    // Create new Supabase client with persistent session & auto-refresh
    client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                persistSession: true,     // keeps session in localStorage
                autoRefreshToken: true,   // refreshes token automatically
                detectSessionInUrl: true, // for OAuth redirects
            },
        }
    )

    // Listen for auth changes (optional but recommended)
    client.auth.onAuthStateChange((event, session) => {
        switch (event) {
            case 'SIGNED_OUT':
                console.log('User signed out')
                // Clear the client instance on sign out to ensure clean state for next user
                client = undefined
                break
            case 'TOKEN_REFRESHED':
                console.log('Supabase token refreshed automatically')
                break
            case 'USER_UPDATED':
                console.log('User info updated')
                break
        }
    })

    return client
}
