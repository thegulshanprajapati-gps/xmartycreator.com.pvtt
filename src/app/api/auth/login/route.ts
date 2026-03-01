import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db-connection';
import User from '@/lib/models/user';
import {
  DEVICE_COOKIE_NAME,
  TERMS_VERSION,
  clearLoginFailures,
  generateDeviceToken,
  getLoginRateLimitKey,
  isLoginBlocked,
  isValidEmail,
  isValidMobile,
  isValidPassword,
  normalizeEmail,
  normalizeMobile,
  normalizeText,
  registerLoginFailure,
  setDeviceCookie,
  sha256,
  signSessionToken,
  verifyPassword,
} from '@/lib/auth/student-portal-auth';
import {
  createSuspendedContactLink,
  getSuspendedContactTtlSeconds,
} from '@/lib/auth/suspended-contact';
import { recordStudentLogin } from '@/lib/student-management';
import { setCredentialStudentSessionUser } from '@/lib/student-session';

export const runtime = 'nodejs';

type LoginBody = {
  email?: string;
  password?: string;
  mobile?: string;
  fingerprint?: string;
  termsAccepted?: boolean;
};

const LOGIN_SUSPEND_LIMIT = 5;

const OWN_DEVICE_REQUIRED_RESPONSE = {
  ok: false,
  code: 'OWN_DEVICE_REQUIRED',
  msg: 'Use your own device for logging in!',
} as const;

function badRequest(msg: string) {
  return NextResponse.json({ ok: false, msg }, { status: 400 });
}

function unauthorized() {
  return NextResponse.json(
    { ok: false, msg: 'Invalid email or password' },
    { status: 401 }
  );
}

function accountSuspended(
  message = 'Account suspended. Contact admin to unsuspend.',
  extras?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      ok: false,
      code: 'ACCOUNT_SUSPENDED',
      msg: message,
      ...(extras || {}),
    },
    { status: 403 }
  );
}

async function failExistingUserLogin(user: any) {
  const now = new Date();
  const failedAttempts = Number(user.failedLoginAttempts || 0) + 1;

  user.failedLoginAttempts = failedAttempts;
  user.lastFailedLoginAt = now;

  if (failedAttempts >= LOGIN_SUSPEND_LIMIT) {
    user.isSuspended = true;
    user.suspendedAt = now;
    user.suspendedBy = 'system';
    user.suspensionReason = 'AUTO_TOO_MANY_LOGIN_ATTEMPTS';
    await user.save();
    return accountSuspended(
      'Account suspended after 5 failed attempts. Ask admin to unsuspend.'
    );
  }

  await user.save();
  return NextResponse.json(OWN_DEVICE_REQUIRED_RESPONSE, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginBody;
    const email = normalizeEmail(body?.email);
    const password = normalizeText(body?.password);
    const mobile = normalizeMobile(body?.mobile);
    const fingerprint = normalizeText(body?.fingerprint);
    const termsAccepted = body?.termsAccepted === true;

    if (!isValidEmail(email)) {
      return badRequest('Invalid email format');
    }
    if (!isValidPassword(password)) {
      return badRequest('Password must be at least 8 characters long');
    }
    if (!isValidMobile(mobile)) {
      return badRequest('Mobile number must be exactly 10 digits');
    }
    if (!fingerprint) {
      return badRequest('Fingerprint is required');
    }
    if (!termsAccepted) {
      return badRequest('Please accept Terms & Conditions');
    }

    await connectDB();

    const rateKey = getLoginRateLimitKey(request, email);
    const user = await User.findOne({ email }).exec();
    if (!user) {
      const blockState = isLoginBlocked(rateKey);
      if (blockState.blocked) {
        return NextResponse.json(
          {
            ok: false,
            msg: 'Too many login attempts. Please try again later.',
            retryAfterSeconds: blockState.retryAfterSeconds,
          },
          { status: 429 }
        );
      }
      registerLoginFailure(rateKey);
      return unauthorized();
    }

    clearLoginFailures(rateKey);

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      if (user.isSuspended) {
        return unauthorized();
      }
      return await failExistingUserLogin(user);
    }
    if (user.mobile !== mobile) {
      if (user.isSuspended) {
        return unauthorized();
      }
      return await failExistingUserLogin(user);
    }

    const incomingCookieToken = request.cookies.get(DEVICE_COOKIE_NAME)?.value || '';
    const incomingCookieHash = incomingCookieToken ? sha256(incomingCookieToken) : '';
    const incomingFingerprintHash = sha256(fingerprint);
    const cookieMatchesStored =
      Boolean(user.deviceTokenHash) && incomingCookieHash === user.deviceTokenHash;
    const fingerprintMatchesStored =
      Boolean(user.fingerprintHash) && incomingFingerprintHash === user.fingerprintHash;

    if (user.isSuspended) {
      if (!cookieMatchesStored && !fingerprintMatchesStored) {
        return accountSuspended(
          'Account suspended. Use your previously bound device to contact admin.'
        );
      }

      let suspendedCookieToSet: string | null = null;
      let deviceTokenHashForLink = user.deviceTokenHash || null;
      if (!cookieMatchesStored && fingerprintMatchesStored) {
        suspendedCookieToSet = generateDeviceToken();
        deviceTokenHashForLink = sha256(suspendedCookieToSet);
        user.deviceTokenHash = deviceTokenHashForLink;
        await user.save();
      }

      const { token: suspendedToken, expiresAt } = await createSuspendedContactLink({
        email: user.email,
        mobile: user.mobile,
        deviceTokenHash: deviceTokenHashForLink,
        fingerprintHash: user.fingerprintHash || incomingFingerprintHash,
        request,
      });

      const suspendedResponse = accountSuspended(
        'Account suspended. Redirecting to secure admin contact page.',
        {
          code: 'ACCOUNT_SUSPENDED_REDIRECT',
          redirectUrl: `/login/suspended-contact?token=${encodeURIComponent(suspendedToken)}`,
          expiresAt: expiresAt.toISOString(),
          expiresInSeconds: getSuspendedContactTtlSeconds(),
        }
      );

      if (suspendedCookieToSet) {
        setDeviceCookie(suspendedResponse, suspendedCookieToSet);
      }

      return suspendedResponse;
    }

    let cookieToSet: string | null = null;
    const now = new Date();

    if (!user.deviceTokenHash) {
      cookieToSet = generateDeviceToken();
      user.deviceTokenHash = sha256(cookieToSet);
      user.fingerprintHash = incomingFingerprintHash;
      user.deviceBoundAt = now;
    } else {
      const cookieMatches =
        Boolean(incomingCookieToken) && incomingCookieHash === user.deviceTokenHash;
      const fingerprintMatches =
        Boolean(user.fingerprintHash) && incomingFingerprintHash === user.fingerprintHash;

      if (!cookieMatches && !fingerprintMatches) {
        return await failExistingUserLogin(user);
      }

      // If fingerprint matches but cookie is missing/mismatched, rotate device cookie.
      if (!cookieMatches && fingerprintMatches) {
        cookieToSet = generateDeviceToken();
        user.deviceTokenHash = sha256(cookieToSet);
      }

      if (!user.fingerprintHash) {
        user.fingerprintHash = incomingFingerprintHash;
      }
    }

    user.lastLoginAt = now;
    user.failedLoginAttempts = 0;
    user.lastFailedLoginAt = null;
    user.isSuspended = false;
    user.suspendedAt = null;
    user.suspendedBy = null;
    user.suspensionReason = null;
    user.termsAccepted = true;
    user.termsAcceptedAt = user.termsAcceptedAt || now;
    user.termsVersion = TERMS_VERSION;
    await user.save();

    let profileName = user.email.split('@')[0] || 'Student';
    let profileImage = '';
    try {
      const profile = await recordStudentLogin({
        id: String(user._id),
        email: user.email,
        name: profileName,
      });
      profileName = profile?.name || profileName;
      profileImage = profile?.image || '';
    } catch (profileError) {
      console.error('[auth/login] Failed to sync student profile:', profileError);
    }

    await setCredentialStudentSessionUser({
      id: String(user._id),
      email: user.email,
      mobile: user.mobile,
      name: profileName,
      image: profileImage,
    });

    const token = signSessionToken({
      sub: String(user._id),
      email: user.email,
      mobile: user.mobile,
    });

    const response = NextResponse.json({
      ok: true,
      token,
      user: {
        email: user.email,
        mobile: user.mobile,
      },
      profile: {
        name: profileName,
        image: profileImage,
      },
    });

    if (cookieToSet) {
      setDeviceCookie(response, cookieToSet);
    }

    return response;
  } catch (error) {
    console.error('[auth/login] Error:', error);
    return NextResponse.json({ ok: false, msg: 'Login failed' }, { status: 500 });
  }
}
