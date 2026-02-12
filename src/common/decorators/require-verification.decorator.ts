import { SetMetadata } from '@nestjs/common';

export const VERIFIED_KEY = 'requiresVerification';

/**
 * Decorator to mark a route as requiring CNIC verification.
 * Usage: @RequireVerification()
 */
export const RequireVerification = () => SetMetadata(VERIFIED_KEY, true);
