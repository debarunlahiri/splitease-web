// NEXT_PUBLIC_* values are inlined into the browser bundle at build time.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
  /\/+$/,
  '',
);

export const ANDROID_PACKAGE =
  process.env.NEXT_PUBLIC_ANDROID_PACKAGE ?? 'com.lambrk.splitease';

/** Direct link to the latest Android APK. Empty until one is published. */
export const APK_URL = (process.env.NEXT_PUBLIC_APK_URL ?? '').trim();

/** Where "get the app" buttons point. */
export const GET_APP_HREF = '/get-app';

export const APP_NAME = 'SplitEase';
