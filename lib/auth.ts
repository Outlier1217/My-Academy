import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE = "outlier_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function sessionKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to a random value of at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminSession(email: string) {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(sessionKey());

  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSession() {
  cookies().set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const token = cookies().get(ADMIN_COOKIE)?.value;
    if (!token) return false;
    const { payload } = await jwtVerify(token, sessionKey(), { algorithms: ["HS256"] });
    return payload.role === "admin" && payload.sub === process.env.ADMIN_EMAIL?.trim().toLowerCase();
  } catch {
    return false;
  }
}

export const USER_COOKIE = "outlier_user_session";
const USER_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export async function createUserSession(userId: string) {
  const token = await new SignJWT({ role: "user" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${USER_SESSION_TTL_SECONDS}s`)
    .sign(sessionKey());

  cookies().set(USER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: USER_SESSION_TTL_SECONDS,
  });
}

export async function clearUserSession() {
  cookies().set(USER_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const token = cookies().get(USER_COOKIE)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, sessionKey(), {
      algorithms: ["HS256"],
    });

    if (payload.role !== "user" || typeof payload.sub !== "string") {
      return null;
    }

    return payload.sub;
  } catch {
    return null;
  }
}
