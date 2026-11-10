import { NextResponse } from 'next/server';
import { ANDROID_PACKAGE } from '@/lib/config';

export const dynamic = 'force-static';

/**
 * Lets Android verify that this website and the app belong together, so https links can open
 * the app directly. Empty until the signing certificate fingerprints are configured.
 */
export function GET() {
  const fingerprints = (process.env.ANDROID_SHA256_CERT_FINGERPRINTS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (fingerprints.length === 0) return NextResponse.json([]);
  return NextResponse.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: ANDROID_PACKAGE,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ]);
}
