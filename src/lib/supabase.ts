// import { createClient } from '@supabase/supabase-js'
// import { Database } from './database.types'

import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!
// const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!

// console.log("Supabase URL exists:", !!supabaseUrl);
// console.log("Supabase ANON KEY exists:", !!supabaseAnonKey);

// if (!supabaseUrl) {
//   throw new Error("Missing VITE_SUPABASE_URL");
// }

// if (!supabaseAnonKey) {
//   throw new Error("Missing VITE_SUPABASE_ANON_KEY");
// }

// export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
//   auth: {
//     autoRefreshToken: true,
//     persistSession: true,
//     detectSessionInUrl: true
//   }
// })

// // For admin operations (server-side only)
// export const supabaseAdmin = createClient<Database>(
//   supabaseUrl,
//   supabaseServiceRoleKey,
//   {
//     auth: {
//       autoRefreshToken: false,
//       persistSession: false
//     }
//   }
// )


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY! // Ensure this has VITE_

console.log("Supabase URL exists:", !!supabaseUrl);
console.log("Supabase ANON KEY exists:", !!supabaseAnonKey);
console.log("Supabase SERVICE ROLE KEY exists:", !!supabaseServiceRoleKey); // Add this log

if (!supabaseUrl) throw new Error("Missing VITE_SUPABASE_URL");
if (!supabaseAnonKey) throw new Error("Missing VITE_SUPABASE_ANON_KEY");

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Fix: Only initialize admin client if the key is actually present
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null; // Fallback so it doesn't crash the whole app if missing