import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { VERIFIED_KEY } from '../decorators/require-verification.decorator';

/**
 * Guard that checks if the user's CNIC is verified by admin.
 * Required before buy/sell/rent transactions.
 */
@Injectable()
export class VerificationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresVerification = this.reflector.getAllAndOverride<boolean>(
      VERIFIED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresVerification) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!user.isVerified) {
      throw new ForbiddenException(
        'Your CNIC must be verified by admin before performing this action. Please upload your CNIC image from your profile settings.',
      );
    }

    return true;
  }
}
