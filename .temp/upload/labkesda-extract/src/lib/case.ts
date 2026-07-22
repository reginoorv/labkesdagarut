// Helper konversi penamaan kolom.
// Supabase/PostgREST mengembalikan kolom apa adanya (snake_case), sedangkan
// seluruh frontend membaca field camelCase (lab_no -> labNo). Semua hasil
// query DB dilewatkan toCamel() sebelum dikirim sebagai JSON, sehingga bentuk
// respons tetap sama persis seperti versi Drizzle sebelumnya.

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

type AnyObj = Record<string, unknown>;

// Ubah key objek/array (rekursif) dari snake_case ke camelCase.
export function toCamel<T = any>(input: unknown): T {
  if (Array.isArray(input)) {
    return input.map((item) => toCamel(item)) as unknown as T;
  }
  if (input && typeof input === "object" && !(input instanceof Date)) {
    const out: AnyObj = {};
    for (const [key, value] of Object.entries(input as AnyObj)) {
      out[snakeToCamel(key)] = toCamel(value);
    }
    return out as T;
  }
  return input as T;
}

// Ubah key objek (satu level) dari camelCase ke snake_case.
// Dipakai bila perlu mengirim payload dinamis ke Supabase.
export function toSnake<T extends AnyObj = AnyObj>(input: AnyObj): T {
  const out: AnyObj = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) out[camelToSnake(key)] = value;
  }
  return out as T;
}
