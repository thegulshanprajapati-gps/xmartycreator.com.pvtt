import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import connectDB from '@/lib/db-connection';
import CourseModel from '@/lib/models/course';
import type { Course } from '@/lib/courses';
import { getSession } from '@/lib/session';
import { getAuthenticatedStudentUser } from '@/lib/student-session';
import BceceLeCourseClient from './bcece-le-course-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'BCECE LE Course | Xmarty Creator',
  description: 'Protected BCECE LE course page.',
  robots: { index: false, follow: false },
};

const PROTECTED_SLUG = 'bcece-le';

type CourseDoc = {
  _id?: unknown;
  id?: unknown;
  title?: unknown;
  slug?: unknown;
  shortDescription?: unknown;
  fullDescription?: unknown;
  coverImage?: unknown;
  duration?: unknown;
  rating?: unknown;
  studentsEnrolled?: unknown;
  reviews?: unknown;
  level?: unknown;
  price?: unknown;
  discount?: unknown;
  originalPrice?: unknown;
  features?: unknown;
  curriculum?: unknown;
  instructor?: unknown;
  whatYouLearn?: unknown;
  requirements?: unknown;
  enrollClickCount?: unknown;
  shareCount?: unknown;
  viewsCount?: unknown;
  enrollRedirectUrl?: unknown;
};

const toText = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value.trim() : fallback;

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeLevel = (value: unknown): Course['level'] => {
  const lvl = toText(value).toLowerCase();
  if (lvl === 'advanced') return 'Advanced';
  if (lvl === 'intermediate') return 'Intermediate';
  return 'Beginner';
};

const normalizeStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => toText(item)).filter(Boolean) : [];

const normalizeCurriculum = (value: unknown): Course['curriculum'] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((module: any) => ({
      moduleId: toText(module?.moduleId),
      moduleName: toText(module?.moduleName),
      lessons: Array.isArray(module?.lessons)
        ? module.lessons
            .map((lesson: any) => ({
              lessonId: toText(lesson?.lessonId),
              title: toText(lesson?.title),
              duration: toText(lesson?.duration),
            }))
            .filter((lesson: any) => lesson.lessonId || lesson.title)
        : [],
    }))
    .filter((module) => module.moduleId || module.moduleName);
};

const normalizeInstructor = (value: unknown): Course['instructor'] => {
  const instructor = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    name: toText(instructor.name, 'Instructor'),
    title: toText(instructor.title, 'Expert Instructor'),
    bio: toText(instructor.bio),
    image: toText(instructor.image),
  };
};

const normalizeCourse = (doc: CourseDoc): Course => {
  return {
    _id: String(doc._id || ''),
    id: String(doc.id || doc._id || ''),
    title: toText(doc.title),
    slug: toText(doc.slug),
    shortDescription: toText(doc.shortDescription),
    fullDescription: toText(doc.fullDescription),
    coverImage: toText(doc.coverImage),
    duration: toText(doc.duration, 'Self-paced'),
    rating: toNumber(doc.rating, 0),
    studentsEnrolled: toNumber(doc.studentsEnrolled, 0),
    reviews: toNumber(doc.reviews, 0),
    level: normalizeLevel(doc.level),
    price: toNumber(doc.price, 0),
    discount: toNumber(doc.discount, 0),
    originalPrice: toNumber(doc.originalPrice, 0) || undefined,
    features: normalizeStringArray(doc.features),
    curriculum: normalizeCurriculum(doc.curriculum),
    instructor: normalizeInstructor(doc.instructor),
    whatYouLearn: normalizeStringArray(doc.whatYouLearn),
    requirements: normalizeStringArray(doc.requirements),
    enrollClickCount: toNumber(doc.enrollClickCount, 0),
    shareCount: toNumber(doc.shareCount, 0),
    viewsCount: toNumber(doc.viewsCount, 0),
    enrollRedirectUrl: toText(doc.enrollRedirectUrl),
  };
};

async function getCourseBySlug(slug: string): Promise<Course | null> {
  try {
    await connectDB();
    const doc = await CourseModel.findOne({ slug })
      .select(
        'id title slug shortDescription fullDescription coverImage duration rating studentsEnrolled reviews level price discount originalPrice features curriculum instructor whatYouLearn requirements enrollClickCount shareCount viewsCount enrollRedirectUrl updatedAt createdAt'
      )
      .lean<CourseDoc>()
      .exec();

    if (!doc) return null;
    return normalizeCourse(doc);
  } catch (error) {
    console.error(`[bcece-le] Failed to fetch course "${slug}":`, error);
    return null;
  }
}

async function hasCourseAccess(): Promise<boolean> {
  try {
    const [student, adminSession] = await Promise.all([
      getAuthenticatedStudentUser(),
      getSession(),
    ]);

    return Boolean(student?.email || adminSession?.isLoggedIn);
  } catch (error) {
    console.error('[bcece-le] Access check failed:', error);
    return false;
  }
}

export default async function BceceLePage() {
  const hasAccess = await hasCourseAccess();
  if (!hasAccess) {
    redirect('/login?callbackUrl=%2Fbcece-le');
  }

  const course = await getCourseBySlug(PROTECTED_SLUG);
  if (!course) {
    notFound();
  }

  return <BceceLeCourseClient slug={PROTECTED_SLUG} initialCourse={course} />;
}
