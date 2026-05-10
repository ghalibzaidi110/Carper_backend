import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard, IAuthModuleOptions } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  private readonly logger = new Logger(GoogleAuthGuard.name);

  constructor(private configService: ConfigService) {
    super();
  }

  // Round-trips the originating page ("login" | "register") through the OAuth
  // `state` parameter so the callback can show contextual messaging.
  getAuthenticateOptions(context: ExecutionContext): IAuthModuleOptions {
    const req = context.switchToHttp().getRequest();
    const from = req.query?.from === 'register' ? 'register' : 'login';
    return { state: from };
  }

  // When Passport fails (user denies consent, Google returns an error,
  // bad code exchange) the default behavior throws UnauthorizedException
  // and Nest renders JSON. Instead, redirect back to the originating
  // frontend page with a friendly error so the existing UI can display it.
  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      const req = context.switchToHttp().getRequest();
      const res = context.switchToHttp().getResponse<Response>();
      const stateRaw = (req.query?.state as string) || 'login';
      const from = stateRaw === 'register' ? 'register' : 'login';
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || '';

      // Log the FULL diagnostic so we can debug why Passport rejected the callback.
      this.logger.error(
        `Google OAuth failed. err=${JSON.stringify(err, Object.getOwnPropertyNames(err || {}))} ` +
          `info=${JSON.stringify(info, Object.getOwnPropertyNames(info || {}))} ` +
          `query=${JSON.stringify(req.query || {})}`,
      );

      const message =
        err?.message ||
        info?.message ||
        'Google sign-in was cancelled or failed. Please try again.';
      res.redirect(
        `${frontendUrl}/auth/${from}?oauth_error=${encodeURIComponent(message)}`,
      );
      return undefined as unknown as TUser;
    }
    return user as TUser;
  }
}

@Injectable()
export class FacebookAuthGuard extends AuthGuard('facebook') {}
