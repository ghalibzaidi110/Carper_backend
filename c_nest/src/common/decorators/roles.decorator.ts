import { SetMetadata } from '@nestjs/common';
import { AccountType } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to restrict access to specific account types.
 * Usage: @Roles(AccountType.ADMIN, AccountType.CAR_RENTAL)
 */
export const Roles = (...roles: AccountType[]) =>
  SetMetadata(ROLES_KEY, roles);
