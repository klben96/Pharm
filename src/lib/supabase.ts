import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://unvlpbpchxpknkdqvzlo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmxwYnBjaHhwa25rZHF2emxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMzk0OTYsImV4cCI6MjA5NjgxNTQ5Nn0.Mz92UW1GsLbX8eNp6neINmCHK3mKpf-X_RLMOCfj8zI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
