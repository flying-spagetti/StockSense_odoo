import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "stocksense_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

function getAuthSecret(): string {
  return process.env.AUTH_SECRET || "stocksense-super-secret-auth-key-2026-default";
}

export type SessionPayload = {
  userId: string;
  loginId: string;
  email: string;
  role: "inventory_manager" | "warehouse_staff";
  expiresAt: number;
};

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
  return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlEncodeString(str: string): string {
  const enc = new TextEncoder();
  return base64UrlEncodeBytes(enc.encode(str));
}

function base64UrlDecodeToString(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  if (typeof atob === "function") {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const dec = new TextDecoder();
    return dec.decode(bytes);
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signToken(payload: SessionPayload): Promise<string> {
  const secret = getAuthSecret();
  const jsonStr = JSON.stringify(payload);
  const base64Data = base64UrlEncodeString(jsonStr);

  const key = await getHmacKey(secret);
  const enc = new TextEncoder();
  const signatureBuf = await crypto.subtle.sign("HMAC", key, enc.encode(base64Data));
  const signature = base64UrlEncodeBytes(new Uint8Array(signatureBuf));

  return `${base64Data}.${signature}`;
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [base64Data, signature] = parts;
    const secret = getAuthSecret();

    const key = await getHmacKey(secret);
    const enc = new TextEncoder();
    const dataBytes = enc.encode(base64Data);

    let base64Sig = signature.replace(/-/g, "+").replace(/_/g, "/");
    while (base64Sig.length % 4 !== 0) {
      base64Sig += "=";
    }
    const binarySig = typeof atob === "function" ? atob(base64Sig) : Buffer.from(base64Sig, "base64").toString("binary");
    const sigBytes = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) {
      sigBytes[i] = binarySig.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, dataBytes);
    if (!isValid) return null;

    const jsonStr = base64UrlDecodeToString(base64Data);
    const payload = JSON.parse(jsonStr) as SessionPayload;

    if (!payload.expiresAt || payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch (_e) {
    return null;
  }
}

export async function createSessionCookie(user: {
  id: string;
  loginId: string;
  email: string;
  role?: "inventory_manager" | "warehouse_staff";
}): Promise<void> {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const payload: SessionPayload = {
    userId: user.id,
    loginId: user.loginId,
    email: user.email,
    role: user.role || "inventory_manager",
    expiresAt,
  };

  const token = await signToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!cookie || !cookie.value) return null;

    return await verifyToken(cookie.value);
  } catch (_e) {
    return null;
  }
}

export async function destroySessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });
  } catch (_e) {
    // ignore
  }
}
