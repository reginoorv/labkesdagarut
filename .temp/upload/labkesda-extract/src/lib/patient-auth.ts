import { SignJWT, jwtVerify } from "jose";

// Auth khusus PASIEN (aplikasi mobile). TERPISAH dari auth staff (cookie
// labkesda_session). Pasien memakai Bearer token JWT di header Authorization.
// Secret bisa dibedakan lewat PATIENT_JWT_SECRET; fallback ke JWT_SECRET.

const PATIENT_JWT_SECRET = new TextEncoder().encode(
  process.env.PATIENT_JWT_SECRET || process.env.JWT_SECRET || "labkesda-garut-lis-secret-key-2026-change-me"
);
const TOKEN_DURATION = 30 * 24 * 60 * 60; // 30 hari (detik) — app mobile long-lived

export interface PatientTokenPayload {
  accountId: number;
  nik: string;
  phone: string;
  patientId: number | null;
  exp?: number;
}

export async function createPatientToken(payload: Omit<PatientTokenPayload, "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${TOKEN_DURATION}s`)
    .setIssuedAt()
    .sign(PATIENT_JWT_SECRET);
}

export async function verifyPatientToken(token: string): Promise<PatientTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, PATIENT_JWT_SECRET);
    return payload as unknown as PatientTokenPayload;
  } catch {
    return null;
  }
}

// Ambil & verifikasi token dari header "Authorization: Bearer <token>".
export async function getPatientFromRequest(req: Request): Promise<PatientTokenPayload | null> {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  return verifyPatientToken(auth.slice(7).trim());
}
