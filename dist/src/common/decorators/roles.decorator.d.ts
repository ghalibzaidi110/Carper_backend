import { AccountType } from '@prisma/client';
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: AccountType[]) => import("@nestjs/common").CustomDecorator<string>;
