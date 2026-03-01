'use server';

import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';
import clientPromise from '@/lib/mongodb';
import { getMongoDbName, normalizeStudentEmail } from '@/lib/student-management';
import { getAuthenticatedStudentUser } from '@/lib/student-session';

async function getAuthenticatedStudentEmail() {
  const student = await getAuthenticatedStudentUser();
  return normalizeStudentEmail(student?.email);
}

export async function markNotificationAsRead(formData: FormData) {
  const studentEmail = await getAuthenticatedStudentEmail();
  if (!studentEmail) return;

  const id = String(formData.get('id') || '').trim();
  if (!id || !ObjectId.isValid(id)) return;

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  await db.collection('student_notifications').updateOne(
    { _id: new ObjectId(id), studentEmail },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  revalidatePath('/student/notifications');
  revalidatePath('/admin/dashboard/students');
}

export async function markAllNotificationsAsRead() {
  const studentEmail = await getAuthenticatedStudentEmail();
  if (!studentEmail) return;

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const now = new Date();

  await db.collection('student_notifications').updateMany(
    { studentEmail, isRead: false },
    {
      $set: {
        isRead: true,
        readAt: now,
        updatedAt: now,
      },
    }
  );

  revalidatePath('/student/notifications');
  revalidatePath('/admin/dashboard/students');
}
