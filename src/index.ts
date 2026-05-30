import {
  createAuthClient as _createAuthClient,
  type NeonAuthPublicApi,
  type NeonAuthAdapter,
} from '@neondatabase/auth';

export function createAuthClient<T extends NeonAuthAdapter = NeonAuthAdapter>(
  url: string,
): NeonAuthPublicApi<T> {
  return _createAuthClient<T>(url);
}

export { neonAuth } from './integration';
export type { NeonAuthIntegrationConfig } from './integration';
