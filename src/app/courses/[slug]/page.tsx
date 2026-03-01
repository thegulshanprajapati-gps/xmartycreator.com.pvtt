import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import connectDB from '@/lib/db-connection';
import CourseModel from '@/lib/models/course';
import type { Course } from '@/lib/courses';
import CourseDetailClient from './course-detail-client';

export const revalidate = 600;

const BASE_URL = (process.env.NEXT_PUBLIC_URL || 'https://xmartycreator.com').replace(/\/+$/, '');

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
  updatedAt?: Date | string;
  createdAt?: Date | string;
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
    console.error(`[courses/[slug]] Failed to fetch course "${slug}":`, error);
    return null;
  }
}

export async function generateStaticParams() {
  try {
    await connectDB();
    const docs = await CourseModel.find({})
      .select('slug')
      .lean<Array<{ slug?: string }>>()
      .exec();

    return docs
      .map((doc) => toText(doc.slug))
      .filter(Boolean)
      .map((slug) => ({ slug }));
  } catch (error) {
    console.error('[courses/[slug]] generateStaticParams failed:', error);
    return [];
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    return {
      title: 'Course Not Found | Xmarty Creator',
      robots: { index: false, follow: false },
    };
  }

  const title = `${course.title} | Xmarty Creator`;
  const description =
    course.shortDescription ||
    course.fullDescription ||
    'Explore this course on Xmarty Creator and learn with structured, practical content.';
  const canonical = `${BASE_URL}/courses/${course.slug}`;
  const image = course.coverImage || `${BASE_URL}/logo.png`;

  return {
    title,
    description,
    alternates: { canonical },
    keywords: [course.title, 'course', 'xmarty creator', ...(course.whatYouLearn || []).slice(0, 5)],
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      images: [{ url: image, alt: course.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) notFound();

  const canonical = `${BASE_URL}/courses/${course.slug}`;
  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.shortDescription || course.fullDescription || '',
    provider: {
      '@type': 'Organization',
      name: 'Xmarty Creator',
      url: BASE_URL,
    },
    image: course.coverImage || undefined,
    url: canonical,
    educationalLevel: course.level,
    offers: {
      '@type': 'Offer',
      url: canonical,
      price: String(course.price || 0),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <CourseDetailClient slug={slug} initialCourse={course} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
    </>
  );
}
