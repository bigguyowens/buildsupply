import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "./db";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = "bs_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

type UserRow = {
  id: number;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  force_password_change: boolean;
};

// ── User creation ────────────────────────────────────────
export async function createUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<SessionUser> {
  const existing = await query<UserRow>(
    "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
    [email]
  );
  if (existing.length > 0) throw new Error("Email already registered.");

  const hashed = await bcrypt.hash(password, 12);
  const rows = await query<UserRow>(
    `INSERT INTO users (email, password, first_name, last_name)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, first_name, last_name, role`,
    [email.toLowerCase(), hashed, firstName, lastName]
  );
  return mapUser(rows[0]);
}

// ── Verify credentials ───────────────────────────────────
export async function verifyCredentials(
  email: string,
  password: string
): Promise<SessionUser & { forcePasswordChange: boolean }> {
  const rows = await query<UserRow>(
    "SELECT id, email, password, first_name, last_name, role, force_password_change FROM users WHERE LOWER(email) = LOWER($1)",
    [email]
  );
  if (rows.length === 0) throw new Error("Invalid email or password.");

  const valid = await bcrypt.compare(password, rows[0].password);
  if (!valid) throw new Error("Invalid email or password.");

  return {
    ...mapUser(rows[0]),
    forcePasswordChange: rows[0].force_password_change ?? false,
  };
}

// ── Token helpers ────────────────────────────────────────
export function signToken(user: SessionUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}

// ── Cookie helpers (server-side) ─────────────────────────
export async function setSessionCookie(user: SessionUser) {
  const token = signToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ── Helpers ──────────────────────────────────────────────
function mapUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
  };
}
