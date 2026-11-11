import { BACKEND_URL } from './backend';

export const ADMIN_COOKIE = 'se_admin';

export const ADMIN_API = `${BACKEND_URL}/api/v1/admin`;

/** Browser requests that change data must carry this header (a simple CSRF guard). */
export const ADMIN_HEADER = 'x-splitease-admin';
