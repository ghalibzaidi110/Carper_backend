import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import {
  JwtStrategy,
  JwtRefreshStrategy,
  GoogleStrategy,
  FacebookStrategy,
} from './strategies';

// Only register OAuth strategies when credentials are set (avoids "OAuth2Strategy requires clientID" on startup)
const hasGoogleOAuth =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
const hasFacebookOAuth =
  process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET;

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    ...(hasGoogleOAuth ? [GoogleStrategy] : []),
    ...(hasFacebookOAuth ? [FacebookStrategy] : []),
  ],
  exports: [AuthService],
})
export class AuthModule {}
