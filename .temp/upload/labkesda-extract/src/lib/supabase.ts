import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Client Supabase untuk pemakaian di server (API routes).
// Memakai SERVICE ROLE key: bypass RLS, akses penuh ke semua tabel.
// Otorisasi tetap ditangani di middleware.ts (JWT + RBAC), bukan RLS.
//
// PENTING: file ini hanya boleh diimpor dari kode server (route handlers).
// Jangan impor dari komponen client — service role key rahasia.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
}
if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
}

// Reuse instance antar hot-reload (dev) agar tidak bikin client berkali-kali.
// Kita tidak generate tipe Database dari Supabase, jadi pakai `any` sebagai
// tipe schema. Efeknya baris hasil query bertipe longgar (bukan `never`),
// sehingga akses kolom snake_case seperti row.password_hash tidak error.
const globalForSupabase = globalThis as typeof globalThis & {
  __labkesdaSupabaseAdmin?: SupabaseClient<any, "public", any>;
};

export const supabaseAdmin: SupabaseClient<any, "public", any> =
  globalForSupabase.__labkesdaSupabaseAdmin ??
  createClient<any, "public", any>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.__labkesdaSupabaseAdmin = supabaseAdmin;
}
