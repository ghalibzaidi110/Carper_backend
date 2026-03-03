import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    // Strategy will only be used if credentials exist (checked by GoogleAuthCheckGuard)
    // Use provided values or fallback to prevent Passport initialization error
    super({
      clientID: clientID || 'dummy',
      clientSecret: clientSecret || 'dummy',
      callbackURL: callbackURL || 'http://localhost:3000/callback',
      scope: ['email', 'profile'],
    });

    if (clientID && clientSecret && callbackURL) {
      this.logger.log('Google OAuth strategy initialized');
    } else {
      this.logger.warn('Google OAuth credentials not fully configured');
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const user = {
      googleId: id,
      email: emails[0].value,
      fullName: `${name.givenName} ${name.familyName}`,
      avatarUrl: photos?.[0]?.value || null,
    };

    done(null, user);
  }
}
