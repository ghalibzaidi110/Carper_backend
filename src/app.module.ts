import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Infrastructure
import { PrismaModule } from './prisma/prisma.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { EmailModule } from './email/email.module';
import { NotificationsModule } from './notifications/notifications.module';

// Auth & Guards
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { VerificationGuard } from './common/guards/verification.guard';

// Features
import { UsersModule } from './users/users.module';
import { CarCatalogModule } from './car-catalog/car-catalog.module';
import { UserCarsModule } from './user-cars/user-cars.module';
import { CarImagesModule } from './car-images/car-images.module';
import { CarListingsModule } from './car-listings/car-listings.module';
import { RentalsModule } from './rentals/rentals.module';
import { DamageDetectionModule } from './damage-detection/damage-detection.module';
import { AdminModule } from './admin/admin.module';
import { PdfModule } from './pdf/pdf.module';

// Common
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

@Module({
  imports: [
    // Global config — makes process.env available everywhere
    ConfigModule.forRoot({ isGlobal: true }),

    // Infrastructure (global modules)
    PrismaModule,
    CloudinaryModule,
    EmailModule,
    NotificationsModule,

    // Auth
    AuthModule,

    // Feature modules
    UsersModule,
    CarCatalogModule,
    UserCarsModule,
    CarImagesModule,
    CarListingsModule,
    RentalsModule,
    DamageDetectionModule,
    AdminModule,
    PdfModule,
  ],
  providers: [
    // Global JWT auth guard — all routes require auth unless @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Global roles guard — enforces @Roles() decorator
    { provide: APP_GUARD, useClass: RolesGuard },
    // Global verification guard — enforces @RequireVerification()
    { provide: APP_GUARD, useClass: VerificationGuard },
    // Global exception filter — standardized error responses
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Global response transform — wraps in { success, data, timestamp }
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}