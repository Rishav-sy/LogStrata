import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""

// Avoid fatal initialization crash if keys are placeholders/missing
const isConfigured = !!supabaseUrl && !!supabaseAnonKey && !supabaseUrl.includes("your-project-id")

export const supabase = createClient(
  isConfigured ? supabaseUrl : "https://placeholder-project.supabase.co",
  isConfigured ? supabaseAnonKey : "placeholder-key"
)
