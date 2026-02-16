import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── SECURITY ───────────────────────────────────────────────
  app.use(helmet.default());

  // ─── CORS ───────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ─── GLOBAL PREFIX ──────────────────────────────────────────
  app.setGlobalPrefix('api/v1', {
    exclude: ['/'], // Exclude root path from global prefix
  });

  // ─── VALIDATION PIPE ────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip non-decorated properties
      forbidNonWhitelisted: true, // Throw on unknown properties
      transform: true,            // Auto-transform payloads to DTO types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── SWAGGER API DOCS ──────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Car Damage Detection & Marketplace API')
    .setDescription(
      'API for car damage detection using YOLOv8, marketplace listings, ' +
      'car rental management, and user verification.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication & OAuth')
    .addTag('Users', 'User profile & CNIC verification')
    .addTag('Car Catalog', 'Admin-managed car catalog')
    .addTag('User Cars', 'User car registration')
    .addTag('Car Images', 'Car image management (registration, periodic, damage)')
    .addTag('Car Listings (Marketplace)', 'Resale marketplace')
    .addTag('Rentals', 'Car rental management for businesses')
    .addTag('Damage Detection', 'YOLOv8 damage detection')
    .addTag('Notifications', 'In-app notifications')
    .addTag('PDF Reports', 'Damage & rental report generation')
    .addTag('Admin', 'Platform administration')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // ─── START SERVER ───────────────────────────────────────────
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Hello from Carper - Server running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();