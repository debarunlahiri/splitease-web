// NEXT_PUBLIC_* values are inlined into the browser bundle at build time.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
  /\/+$/,
  '',
);

export const ANDROID_PACKAGE =
  process.env.NEXT_PUBLIC_ANDROID_PACKAGE ?? 'com.lambrk.splitease';

/** Where the Android app is distributed. There is no Play Store listing. */
export const DEFAULT_DOWNLOAD_URL = 'https://appverse.bitknob.com/android/splitease';

/**
 * Where visitors without the app are sent: the Appverse page by default, or whatever
 * NEXT_PUBLIC_APK_URL says (for example a direct APK file).
 */
export const APK_URL = (process.env.NEXT_PUBLIC_APK_URL ?? '').trim() || DEFAULT_DOWNLOAD_URL;

/** Where "get the app" buttons point. */
export const GET_APP_HREF = '/get-app';

export const APP_NAME = 'SplitEase';
