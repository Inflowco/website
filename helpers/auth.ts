import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'compressedair-ai-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: number;
  email: string;
  organizationId: number;
  role: 'admin' | 'manager' | 'viewer';
}

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: number;
  role: 'admin' | 'manager' | 'viewer';
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: AuthUser): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    organizationId: user.organizationId,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function createSession(userId: number): Promise<string> {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await db.insertInto('sessions')
    .values({
      userId,
      token,
      expiresAt,
    })
    .execute();

  return token;
}

export async function validateSession(token: string): Promise<AuthUser | null> {
  const session = await db.selectFrom('sessions')
    .innerJoin('users', 'users.id', 'sessions.userId')
    .select([
      'users.id',
      'users.email',
      'users.firstName',
      'users.lastName',
      'users.organizationId',
      'users.role',
      'sessions.expiresAt',
    ])
    .where('sessions.token', '=', token)
    .executeTakeFirst();

  if (!session) return null;

  // Check if session expired
  if (new Date(session.expiresAt) < new Date()) {
    await db.deleteFrom('sessions').where('token', '=', token).execute();
    return null;
  }

  return {
    id: session.id,
    email: session.email,
    firstName: session.firstName,
    lastName: session.lastName,
    organizationId: session.organizationId,
    role: session.role as 'admin' | 'manager' | 'viewer',
  };
}

export async function invalidateSession(token: string): Promise<void> {
  await db.deleteFrom('sessions').where('token', '=', token).execute();
}

export async function getUserFacilities(userId: number): Promise<number[]> {
  const access = await db.selectFrom('userFacilityAccess')
    .select('facilityId')
    .where('userId', '=', userId)
    .execute();

  return access.map(a => a.facilityId);
}

export async function userHasFacilityAccess(userId: number, facilityId: number): Promise<boolean> {
  const access = await db.selectFrom('userFacilityAccess')
    .select('id')
    .where('userId', '=', userId)
    .where('facilityId', '=', facilityId)
    .executeTakeFirst();

  return !!access;
}

// Middleware helper for Hono
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}
