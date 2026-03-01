import bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import type { NextRequest, NextResponse } from 'next/server';

const BCRYPT_ROUNDS = 12;
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

export const DEVICE_COOKIE_NAME = 'device_token';
export const TERMS_VERSION = 'v1';

type LoginAttemptState = {
  count: number;
  firstAttemptAt: number;
  blockedUntil: number;
};

type AuthJwtPayload = {
  sub: string;
  email: string;
  mobile: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __studentLoginAttempts: Map<string, LoginAttemptState> | undefined;
}

const loginAttempts =
  globalThis.__studentLoginAttempts || new Map<string, LoginAttemptState>();
if (!globalThis.__studentLoginAttempts) {
  globalThis.__studentLoginAttempts = loginAttempts;
}

function getJwtSecret() {
  return (
    process.env.STUDENT_AUTH_JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    'change-me-in-production'
  );
}

function cleanupExpiredAttempts() {
  const now = Date.now();
  for (const [key, state] of loginAttempts.entries()) {
    const windowExpired = now - state.firstAttemptAt > LOGIN_WINDOW_MS;
    const blockExpired = state.blockedUntil !== 0 && state.blockedUntil <= now;
    if (windowExpired && (state.blockedUntil === 0 || blockExpired)) {
      loginAttempts.delete(key);
    }
  }
}

export function normalizeEmail(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

export function normalizeMobile(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.replace(/\D/g, '').slice(0, 10);
}

export function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidMobile(mobile: string) {
  return /^\d{10}$/.test(mobile);
}

export function isValidPassword(password: string) {
  return password.length >= 8;
}

export function sha256(input: string) {
  return createHash('sha256').update(input).digest('hex');
}

export function generateDeviceToken() {
  return randomUUID();
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signSessionToken(payload: AuthJwtPayload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: '30d',
  });
}

export function setDeviceCookie(response: NextResponse, token: string) {
  response.cookies.set(DEVICE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: DEVICE_COOKIE_MAX_AGE,
  });
}

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

export function getLoginRateLimitKey(request: NextRequest, email: string) {
  return `${getClientIp(request)}:${email}`;
}

export function isLoginBlocked(key: string) {
  cleanupExpiredAttempts();

  const now = Date.now();
  const state = loginAttempts.get(key);
  if (!state) {
    return { blocked: false, retryAfterSeconds: 0 };
  }

  if (state.blockedUntil && state.blockedUntil > now) {
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil((state.blockedUntil - now) / 1000),
    };
  }

  return { blocked: false, retryAfterSeconds: 0 };
}

export function registerLoginFailure(key: string) {
  cleanupExpiredAttempts();

  const now = Date.now();
  const existing = loginAttempts.get(key);
  if (!existing || now - existing.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, {
      count: 1,
      firstAttemptAt: now,
      blockedUntil: 0,
    });
    return;
  }

  const updatedCount = existing.count + 1;
  const blockedUntil = updatedCount >= LOGIN_MAX_ATTEMPTS ? now + LOGIN_WINDOW_MS : 0;
  loginAttempts.set(key, {
    count: updatedCount,
    firstAttemptAt: existing.firstAttemptAt,
    blockedUntil,
  });
}

export function clearLoginFailures(key: string) {
  loginAttempts.delete(key);
}

