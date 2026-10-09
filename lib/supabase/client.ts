import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("http") &&
    supabaseAnonKey.length > 20
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    const client = createClient(url, key);
    const { error } = await client.from("store_settings").select("id").limit(1);
    if (error && error.code !== "PGRST116") {
      return { success: false, message: error.message };
    }
    return { success: true, message: "Koneksi ke Supabase PostgreSQL berhasil terhubung!" };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal terhubung";
    return { success: false, message: errorMsg };
  }
}
