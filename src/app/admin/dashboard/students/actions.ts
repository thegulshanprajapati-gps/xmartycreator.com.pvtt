'use server';

import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';
import clientPromise from '@/lib/mongodb';
import { getSession } from '@/lib/session';
import {
  getMongoDbName,
  isStudentNotificationCategory,
  normalizeStudentEmail,
  syncStudentProfile,
} from '@/lib/student-management';
import { hashPassword } from '@/lib/auth/student-portal-auth';

type NotificationActionState = {
  message: string;
  success: boolean;
};

const DEFAULT_STATE: NotificationActionState = {
  message: '',
  success: false,
};

function clean(value: unknown, max = 400) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed.length <= max ? trimmed : trimmed.slice(0, max);
}

export async function sendStudentNotification(
  _prevState: NotificationActionState = DEFAULT_STATE,
  formData: FormData
): Promise<NotificationActionState> {
  try {
    const adminSession = await getSession();
    if (!adminSession?.isLoggedIn) {
      return {
        message: 'Unauthorized. Please login as admin.',
        success: false,
      };
    }

    const targetRaw = clean(formData.get('targetEmail'), 200);
    const title = clean(formData.get('title'), 120);
    const message = clean(formData.get('message'), 2000);
    const categoryRaw = clean(formData.get('category'), 40);
    const ctaLabel = clean(formData.get('ctaLabel'), 60);
    const ctaHref = clean(formData.get('ctaHref'), 300);

    if (!title || !message) {
      return {
        message: 'Title and message are required.',
        success: false,
      };
    }

    const category = isStudentNotificationCategory(categoryRaw)
      ? categoryRaw
      : 'general';

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    let recipients: Array<{ email: string; name: string; image: string }> = [];

    if (targetRaw === 'all') {
      const studentDocs = await db
        .collection('students')
        .find({
          email: { $type: 'string', $ne: '' },
        })
        .project({ email: 1, name: 1, image: 1 })
        .toArray();

      recipients = studentDocs
        .map((student: any) => {
          const email = normalizeStudentEmail(student?.email);
          if (!email) return null;
          return {
            email,
            name: clean(student?.name, 120) || email.split('@')[0],
            image: clean(student?.image, 600),
          };
        })
        .filter(Boolean) as Array<{ email: string; name: string; image: string }>;
    } else {
      const email = normalizeStudentEmail(targetRaw);
      if (!email) {
        return {
          message: 'Select a valid student target.',
          success: false,
        };
      }

      const student = await db.collection('students').findOne({ email });
      if (!student) {
        return {
          message: 'Selected student not found.',
          success: false,
        };
      }

      recipients = [
        {
          email,
          name: clean(student?.name, 120) || email.split('@')[0],
          image: clean(student?.image, 600),
        },
      ];
    }

    if (recipients.length === 0) {
      return {
        message: 'No students found to notify.',
        success: false,
      };
    }

    const now = new Date();
    const sender = clean(adminSession.username, 80) || 'admin';

    const notificationDocs = recipients.map((recipient) => ({
      studentEmail: recipient.email,
      studentName: recipient.name,
      studentImage: recipient.image,
      title,
      message,
      category,
      ctaLabel,
      ctaHref,
      isRead: false,
      sentBy: sender,
      createdAt: now,
      updatedAt: now,
      readAt: null,
    }));

    await db.collection('student_notifications').insertMany(notificationDocs, {
      ordered: false,
    });

    await Promise.all(
      recipients.map((recipient) =>
        syncStudentProfile({
          email: recipient.email,
          name: recipient.name,
          image: recipient.image,
        })
      )
    );

    revalidatePath('/admin/dashboard/students');
    revalidatePath('/student/notifications');

    return {
      message: `Notification sent to ${notificationDocs.length} student${notificationDocs.length === 1 ? '' : 's'}.`,
      success: true,
    };
  } catch (error: any) {
    console.error('[students] sendStudentNotification failed:', error);
    return {
      message: `Failed to send notification: ${error?.message || 'Unknown error'}`,
      success: false,
    };
  }
}

export async function adminResetStudentDevice(
  formData: FormData
): Promise<{ message: string; success: boolean }> {
  try {
    const adminSession = await getSession();
    if (!adminSession?.isLoggedIn) {
      return {
        message: 'Unauthorized. Please login as admin.',
        success: false,
      };
    }

    const email = normalizeStudentEmail(formData.get('studentEmail'));
    if (!email) {
      return {
        message: 'Student email is required.',
        success: false,
      };
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const now = new Date();

    const result = await db.collection('users').updateOne(
      { email },
      {
        $set: {
          deviceTokenHash: null,
          fingerprintHash: null,
          deviceBoundAt: null,
          updatedAt: now,
        },
      }
    );

    revalidatePath('/admin/dashboard/students');

    if (!result.matchedCount) {
      return {
        message: 'Student account not found in auth database.',
        success: false,
      };
    }

    return {
      message: 'Device fingerprint reset successfully.',
      success: true,
    };
  } catch (error: any) {
    console.error('[students] adminResetStudentDevice failed:', error);
    return {
      message: `Failed to reset device: ${error?.message || 'Unknown error'}`,
      success: false,
    };
  }
}

export async function adminSetStudentPassword(
  formData: FormData
): Promise<{ message: string; success: boolean }> {
  try {
    const adminSession = await getSession();
    if (!adminSession?.isLoggedIn) {
      return {
        message: 'Unauthorized. Please login as admin.',
        success: false,
      };
    }

    const email = normalizeStudentEmail(formData.get('studentEmail'));
    const newPassword = clean(formData.get('newPassword'), 200);

    if (!email) {
      return {
        message: 'Student email is required.',
        success: false,
      };
    }
    if (!newPassword || newPassword.length < 8) {
      return {
        message: 'New password must be at least 8 characters.',
        success: false,
      };
    }

    const passwordHash = await hashPassword(newPassword);
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const now = new Date();

    const result = await db.collection('users').updateOne(
      { email },
      {
        $set: {
          passwordHash,
          updatedAt: now,
        },
      }
    );

    revalidatePath('/admin/dashboard/students');

    if (!result.matchedCount) {
      return {
        message: 'Student account not found in auth database.',
        success: false,
      };
    }

    return {
      message: 'Student password updated successfully.',
      success: true,
    };
  } catch (error: any) {
    console.error('[students] adminSetStudentPassword failed:', error);
    return {
      message: `Failed to update password: ${error?.message || 'Unknown error'}`,
      success: false,
    };
  }
}

export async function adminUnsuspendStudent(
  formData: FormData
): Promise<{ message: string; success: boolean }> {
  try {
    const adminSession = await getSession();
    if (!adminSession?.isLoggedIn) {
      return {
        message: 'Unauthorized. Please login as admin.',
        success: false,
      };
    }

    const email = normalizeStudentEmail(formData.get('studentEmail'));
    if (!email) {
      return {
        message: 'Student email is required.',
        success: false,
      };
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const now = new Date();

    const result = await db.collection('users').updateOne(
      { email },
      {
        $set: {
          isSuspended: false,
          suspendedAt: null,
          suspendedBy: null,
          suspensionReason: null,
          failedLoginAttempts: 0,
          lastFailedLoginAt: null,
          updatedAt: now,
        },
      }
    );

    revalidatePath('/admin/dashboard/students');

    if (!result.matchedCount) {
      return {
        message: 'Student account not found in auth database.',
        success: false,
      };
    }

    return {
      message: 'Student account unsuspended successfully.',
      success: true,
    };
  } catch (error: any) {
    console.error('[students] adminUnsuspendStudent failed:', error);
    return {
      message: `Failed to unsuspend student: ${error?.message || 'Unknown error'}`,
      success: false,
    };
  }
}

export async function approveDeviceResetRequest(
  formData: FormData
): Promise<{ message: string; success: boolean }> {
  try {
    const adminSession = await getSession();
    if (!adminSession?.isLoggedIn) {
      return {
        message: 'Unauthorized. Please login as admin.',
        success: false,
      };
    }

    const requestId = clean(formData.get('requestId'), 80);
    const reviewNote = clean(formData.get('reviewNote'), 300);
    if (!requestId || !ObjectId.isValid(requestId)) {
      return {
        message: 'Invalid request id.',
        success: false,
      };
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const now = new Date();
    const reviewer = clean(adminSession.username, 80) || 'admin';

    const requestDoc = await db.collection('device_reset_requests').findOne({
      _id: new ObjectId(requestId),
      status: 'pending',
    });

    if (!requestDoc) {
      return {
        message: 'Request not found or already processed.',
        success: false,
      };
    }

    const email = normalizeStudentEmail(requestDoc.studentEmail);
    if (!email) {
      return {
        message: 'Invalid student email on request.',
        success: false,
      };
    }

    const userResult = await db.collection('users').updateOne(
      { email },
      {
        $set: {
          deviceTokenHash: null,
          fingerprintHash: null,
          deviceBoundAt: null,
          failedLoginAttempts: 0,
          lastFailedLoginAt: null,
          isSuspended: false,
          suspendedAt: null,
          suspendedBy: null,
          suspensionReason: null,
          updatedAt: now,
        },
      }
    );

    if (!userResult.matchedCount) {
      return {
        message: 'Student account not found in auth database.',
        success: false,
      };
    }

    await db.collection('device_reset_requests').updateOne(
      { _id: new ObjectId(requestId) },
      {
        $set: {
          status: 'approved',
          reviewedAt: now,
          reviewedBy: reviewer,
          reviewNote,
          updatedAt: now,
        },
      }
    );

    revalidatePath('/admin/dashboard/students');
    revalidatePath('/login');

    return {
      message: 'Device reset request approved and account reset completed.',
      success: true,
    };
  } catch (error: any) {
    console.error('[students] approveDeviceResetRequest failed:', error);
    return {
      message: `Failed to approve request: ${error?.message || 'Unknown error'}`,
      success: false,
    };
  }
}

export async function rejectDeviceResetRequest(
  formData: FormData
): Promise<{ message: string; success: boolean }> {
  try {
    const adminSession = await getSession();
    if (!adminSession?.isLoggedIn) {
      return {
        message: 'Unauthorized. Please login as admin.',
        success: false,
      };
    }

    const requestId = clean(formData.get('requestId'), 80);
    const reviewNote = clean(formData.get('reviewNote'), 300);
    if (!requestId || !ObjectId.isValid(requestId)) {
      return {
        message: 'Invalid request id.',
        success: false,
      };
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const now = new Date();
    const reviewer = clean(adminSession.username, 80) || 'admin';

    const result = await db.collection('device_reset_requests').updateOne(
      { _id: new ObjectId(requestId), status: 'pending' },
      {
        $set: {
          status: 'rejected',
          reviewedAt: now,
          reviewedBy: reviewer,
          reviewNote: reviewNote || 'Rejected by admin',
          updatedAt: now,
        },
      }
    );

    if (!result.matchedCount) {
      return {
        message: 'Request not found or already processed.',
        success: false,
      };
    }

    revalidatePath('/admin/dashboard/students');

    return {
      message: 'Device reset request rejected.',
      success: true,
    };
  } catch (error: any) {
    console.error('[students] rejectDeviceResetRequest failed:', error);
    return {
      message: `Failed to reject request: ${error?.message || 'Unknown error'}`,
      success: false,
    };
  }
}
