import clientPromise from '@/lib/mongodb';

export type StudentActivityType =
  | 'course_view'
  | 'course_share'
  | 'course_enroll_click';

export type StudentNotificationCategory =
  | 'general'
  | 'course'
  | 'support'
  | 'reminder';

export const STUDENT_NOTIFICATION_CATEGORIES: StudentNotificationCategory[] = [
  'general',
  'course',
  'support',
  'reminder',
];

type StudentUser = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type RecordStudentActivityInput = {
  user?: StudentUser | null;
  activityType: StudentActivityType;
  courseId?: string;
  courseSlug?: string;
  courseTitle?: string;
  metadata?: Record<string, unknown>;
};

function truncate(value: string, max: number) {
  return value.length <= max ? value : value.slice(0, max);
}

function asCleanText(value: unknown, max = 200) {
  if (typeof value !== 'string') return '';
  return truncate(value.trim(), max);
}

export function normalizeStudentEmail(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

export function getMongoDbName() {
  return process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
}

function toSafeMetadata(input?: Record<string, unknown>) {
  if (!input) return {};

  const entries = Object.entries(input)
    .slice(0, 20)
    .map(([key, value]) => {
      if (typeof value === 'string') return [asCleanText(key, 60), asCleanText(value, 500)];
      if (typeof value === 'number' || typeof value === 'boolean') return [asCleanText(key, 60), value];
      return null;
    })
    .filter(Boolean) as Array<[string, string | number | boolean]>;

  return Object.fromEntries(entries.filter(([key]) => key));
}

export async function syncStudentProfile(user?: StudentUser | null) {
  const email = normalizeStudentEmail(user?.email);
  if (!email) return null;

  const now = new Date();
  const name = asCleanText(user?.name, 120) || email.split('@')[0] || 'Student';
  const image = asCleanText(user?.image, 600);

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  await db.collection('students').updateOne(
    { email },
    {
      $set: {
        email,
        name,
        image,
        role: 'student',
        provider: 'google',
        lastSeenAt: now,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  return { email, name, image };
}

export async function recordStudentLogin(user?: StudentUser | null) {
  const email = normalizeStudentEmail(user?.email);
  if (!email) return null;

  const now = new Date();
  const name = asCleanText(user?.name, 120) || email.split('@')[0] || 'Student';
  const image = asCleanText(user?.image, 600);

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  await db.collection('students').updateOne(
    { email },
    {
      $set: {
        email,
        name,
        image,
        role: 'student',
        provider: 'google',
        lastLoginAt: now,
        lastSeenAt: now,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
      $inc: {
        loginCount: 1,
      },
    },
    { upsert: true }
  );

  return { email, name, image };
}

export async function recordStudentActivity(input: RecordStudentActivityInput) {
  const student = await syncStudentProfile(input.user);
  if (!student?.email) return;

  const now = new Date();
  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  await db.collection('student_activities').insertOne({
    studentEmail: student.email,
    studentName: student.name,
    studentImage: student.image || '',
    studentId: asCleanText(input.user?.id, 120),
    activityType: input.activityType,
    courseId: asCleanText(input.courseId, 80),
    courseSlug: asCleanText(input.courseSlug, 180),
    courseTitle: asCleanText(input.courseTitle, 200),
    metadata: toSafeMetadata(input.metadata),
    createdAt: now,
  });

  await db.collection('students').updateOne(
    { email: student.email },
    {
      $set: {
        lastActiveAt: now,
        updatedAt: now,
      },
      $inc: {
        [`metrics.${input.activityType}`]: 1,
        'metrics.total': 1,
      },
    }
  );
}

export function isStudentNotificationCategory(
  value: string
): value is StudentNotificationCategory {
  return STUDENT_NOTIFICATION_CATEGORIES.includes(
    value as StudentNotificationCategory
  );
}
