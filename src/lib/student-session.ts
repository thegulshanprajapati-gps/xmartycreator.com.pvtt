import { getServerSession } from 'next-auth';
import {
  getSession,
  type StudentPortalSession,
} from '@/lib/session';
import { studentAuthOptions } from '@/lib/student-auth';
import { normalizeStudentEmail } from '@/lib/student-management';

export type AuthenticatedStudentUser = {
  id: string;
  email: string;
  mobile: string;
  name: string;
  image: string;
  source: 'google' | 'credentials';
};

type StudentSessionInput = {
  id?: string;
  email: string;
  mobile?: string;
  name?: string;
  image?: string;
};

function cleanText(value: unknown, max = 300) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed.length <= max ? trimmed : trimmed.slice(0, max);
}

function toCredentialSessionStudent(
  input: StudentSessionInput
): StudentPortalSession {
  const email = normalizeStudentEmail(input.email);
  const fallbackName = email.split('@')[0] || 'Student';

  return {
    id: cleanText(input.id, 120),
    email,
    mobile: cleanText(input.mobile, 20),
    name: cleanText(input.name, 120) || fallbackName,
    image: cleanText(input.image, 600),
    source: 'credentials',
    lastLoginAt: new Date().toISOString(),
  };
}

function fromNextAuthSession(
  sessionUser: any
): AuthenticatedStudentUser | null {
  const email = normalizeStudentEmail(sessionUser?.email);
  if (!email) return null;

  return {
    id: cleanText(sessionUser?.id, 120),
    email,
    mobile: '',
    name: cleanText(sessionUser?.name, 120) || email.split('@')[0] || 'Student',
    image: cleanText(sessionUser?.image, 600),
    source: 'google',
  };
}

function fromCredentialSession(
  student: StudentPortalSession | undefined
): AuthenticatedStudentUser | null {
  const email = normalizeStudentEmail(student?.email);
  if (!email) return null;

  return {
    id: cleanText(student?.id, 120),
    email,
    mobile: cleanText(student?.mobile, 20),
    name:
      cleanText(student?.name, 120) || email.split('@')[0] || 'Student',
    image: cleanText(student?.image, 600),
    source: 'credentials',
  };
}

export async function getAuthenticatedStudentUser(): Promise<AuthenticatedStudentUser | null> {
  const nextAuthSession = await getServerSession(studentAuthOptions);
  const fromNextAuth = fromNextAuthSession(nextAuthSession?.user);
  if (fromNextAuth) return fromNextAuth;

  const appSession = await getSession();
  return fromCredentialSession(appSession.student);
}

export async function setCredentialStudentSessionUser(
  input: StudentSessionInput
) {
  const student = toCredentialSessionStudent(input);
  const session = await getSession();
  // Keep auth state exclusive: when student session is set, clear admin marker.
  if (session.isLoggedIn) {
    delete session.isLoggedIn;
  }
  if (session.username) {
    delete session.username;
  }
  session.student = student;
  await session.save();
  return student;
}

type ClearCredentialSessionOptions = {
  clearAdminAuth?: boolean;
};

export async function clearCredentialStudentSessionUser(
  options: ClearCredentialSessionOptions = {}
) {
  const session = await getSession();
  let changed = false;

  if (session.student) {
    delete session.student;
    changed = true;
  }

  if (options.clearAdminAuth) {
    if (session.isLoggedIn) {
      delete session.isLoggedIn;
      changed = true;
    }
    if (session.username) {
      delete session.username;
      changed = true;
    }
  }

  if (!changed) return;
  await session.save();
}
