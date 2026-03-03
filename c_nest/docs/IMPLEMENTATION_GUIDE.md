# Implementation Guide for Remaining Features

> **Last Updated:** February 2026  
> **Purpose:** Step-by-step guide for implementing remaining features

---

## Table of Contents

1. [Rate Limiting & Logging](#1-rate-limiting--logging)
2. [Messaging System](#2-messaging-system)
3. [Cost Estimation](#3-cost-estimation)
4. [OCR for CNIC](#4-ocr-for-cnic)
5. [Bulk Import](#5-bulk-import)
6. [Testing Suite](#6-testing-suite)

---

## 1. Rate Limiting & Logging

### Rate Limiting Implementation

#### Step 1: Install Dependencies
```bash
npm install @nestjs/throttler
npm install --save-dev @types/express
```

#### Step 2: Configure Throttler Module
```typescript
// src/app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: parseInt(process.env.RATE_LIMIT_TTL || '900'), // 15 minutes
      limit: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    }),
    // ... other modules
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // ... other providers
  ],
})
export class AppModule {}
```

#### Step 3: Custom Rate Limits for Specific Routes
```typescript
// src/auth/auth.controller.ts
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  @Throttle(5, 900) // 5 requests per 15 minutes
  @Post('login')
  async login() {
    // ...
  }
}
```

#### Step 4: Environment Variables
```env
RATE_LIMIT_TTL=900
RATE_LIMIT_MAX=100
RATE_LIMIT_AUTH_MAX=5
RATE_LIMIT_IMAGE_MAX=10
RATE_LIMIT_DAMAGE_MAX=5
```

### Logging Implementation

#### Step 1: Install Winston
```bash
npm install nest-winston winston
```

#### Step 2: Create Logging Module
```typescript
// src/common/logger/logger.module.ts
import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Module({
  imports: [
    WinstonModule.forRoot({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.File({
          filename: process.env.LOG_FILE_PATH || './logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: process.env.LOG_FILE_PATH || './logs/combined.log',
        }),
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
      ],
    }),
  ],
})
export class LoggerModule {}
```

#### Step 3: Create Logging Interceptor
```typescript
// src/common/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const userId = request.user?.id || 'anonymous';

    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const responseTime = Date.now() - now;

          this.logger.log(
            JSON.stringify({
              method,
              url,
              statusCode,
              responseTime,
              ip,
              userId,
              userAgent,
            }),
          );
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          this.logger.error(
            JSON.stringify({
              method,
              url,
              error: error.message,
              stack: error.stack,
              responseTime,
              ip,
              userId,
            }),
          );
        },
      }),
    );
  }
}
```

#### Step 4: Register Interceptor
```typescript
// src/app.module.ts
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

providers: [
  {
    provide: APP_INTERCEPTOR,
    useClass: LoggingInterceptor,
  },
]
```

---

## 2. Messaging System

### Step 1: Update Prisma Schema
```prisma
// prisma/schema.prisma

model Conversation {
  id            String   @id @default(uuid())
  participant1Id String
  participant2Id String
  lastMessageAt DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  participant1 User     @relation("Conversations1", fields: [participant1Id], references: [id], onDelete: Cascade)
  participant2 User     @relation("Conversations2", fields: [participant2Id], references: [id], onDelete: Cascade)
  messages     Message[]

  @@unique([participant1Id, participant2Id])
  @@index([participant1Id, participant2Id])
  @@map("conversations")
}

model Message {
  id            String   @id @default(uuid())
  conversationId String
  senderId      String
  recipientId   String
  content       String   @db.Text
  isRead        Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  sender       User     @relation("SentMessages", fields: [senderId], references: [id], onDelete: Cascade)
  recipient    User     @relation("ReceivedMessages", fields: [recipientId], references: [id], onDelete: Cascade)
  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId])
  @@index([recipientId, isRead])
  @@map("messages")
}

// Add to User model
model User {
  // ... existing fields
  sentMessages      Message[]      @relation("SentMessages")
  receivedMessages Message[]       @relation("ReceivedMessages")
  conversations1   Conversation[]  @relation("Conversations1")
  conversations2   Conversation[] @relation("Conversations2")
}
```

### Step 2: Generate Migration
```bash
npx prisma migrate dev --name add_messaging
```

### Step 3: Create Messages Module
```bash
nest g module messages
nest g service messages
nest g controller messages
```

### Step 4: Implement Service
```typescript
// src/messages/messages.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(senderId: string, dto: CreateMessageDto) {
    // Find or create conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          {
            participant1Id: senderId,
            participant2Id: dto.recipientId,
          },
          {
            participant1Id: dto.recipientId,
            participant2Id: senderId,
          },
        ],
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          participant1Id: senderId,
          participant2Id: dto.recipientId,
        },
      });
    }

    // Create message
    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        recipientId: dto.recipientId,
        content: dto.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        recipient: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update conversation last message time
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    // Send notification to recipient
    // ... notification logic

    return message;
  }

  async getConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
      include: {
        participant1: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        participant2: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                recipientId: userId,
                isRead: false,
              },
            },
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    return conversations.map((conv) => ({
      id: conv.id,
      participant:
        conv.participant1Id === userId
          ? conv.participant2
          : conv.participant1,
      lastMessage: conv.messages[0] || null,
      unreadCount: conv._count.messages,
    }));
  }

  async getConversationMessages(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return messages;
  }

  async markAsRead(messageId: string, userId: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        recipientId: userId,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  }
}
```

### Step 5: Create Controller
```typescript
// src/messages/messages.controller.ts
import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  async sendMessage(@CurrentUser('id') userId: string, @Body() dto: CreateMessageDto) {
    return this.messagesService.sendMessage(userId, dto);
  }

  @Get('conversations')
  async getConversations(@CurrentUser('id') userId: string) {
    return this.messagesService.getConversations(userId);
  }

  @Get('conversations/:id')
  async getConversationMessages(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.getConversationMessages(conversationId, userId);
  }

  @Put(':id/read')
  async markAsRead(@Param('id') messageId: string, @CurrentUser('id') userId: string) {
    return this.messagesService.markAsRead(messageId, userId);
  }
}
```

---

## 3. Cost Estimation

### Step 1: Update Prisma Schema
```prisma
model RepairEstimate {
  id              String   @id @default(uuid())
  damageReportId  String   // CarImage ID
  carId           String
  userId          String
  estimatedCost   Decimal  @db.Decimal(10, 2)
  currency        String   @default("PKR")
  severity        String   // MINOR, MODERATE, SEVERE
  repairShops     Json?    // Array of repair shop suggestions
  breakdown       Json?    // Cost breakdown
  createdAt       DateTime @default(now())

  car             UserCar  @relation(fields: [carId], references: [id], onDelete: Cascade)
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([carId])
  @@index([userId])
  @@map("repair_estimates")
}

// Add to User model
model User {
  // ... existing fields
  repairEstimates RepairEstimate[]
}
```

### Step 2: Create Estimates Module
```bash
nest g module estimates
nest g service estimates
nest g controller estimates
```

### Step 3: Implement Service
```typescript
// src/estimates/estimates.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EstimatesService {
  constructor(private prisma: PrismaService) {}

  async generateEstimate(imageId: string, userId: string) {
    const image = await this.prisma.carImage.findUnique({
      where: { id: imageId },
      include: {
        car: {
          where: { userId },
        },
        damageDetectionData: true,
      },
    });

    if (!image || !image.car) {
      throw new NotFoundException('Image or car not found');
    }

    if (!image.hasDamageDetected || !image.damageDetectionData) {
      throw new BadRequestException('No damage detected in this image');
    }

    const damageData = image.damageDetectionData as any;
    const detections = damageData.detections || [];

    // Calculate severity
    const severity = this.calculateSeverity(detections);

    // Calculate cost based on severity
    const estimatedCost = this.calculateCost(severity, detections);

    // Get repair shop suggestions (mock for now)
    const repairShops = await this.getRepairShopSuggestions(image.car.city);

    // Cost breakdown
    const breakdown = {
      labor: estimatedCost * 0.3,
      parts: estimatedCost * 0.5,
      paint: estimatedCost * 0.2,
    };

    const estimate = await this.prisma.repairEstimate.create({
      data: {
        damageReportId: imageId,
        carId: image.carId,
        userId,
        estimatedCost,
        severity,
        repairShops,
        breakdown,
      },
    });

    return estimate;
  }

  private calculateSeverity(detections: any[]): string {
    const totalConfidence = detections.reduce(
      (sum, d) => sum + d.confidence,
      0,
    );
    const avgConfidence = totalConfidence / detections.length;

    if (avgConfidence > 0.8 || detections.length > 5) {
      return 'SEVERE';
    } else if (avgConfidence > 0.5 || detections.length > 2) {
      return 'MODERATE';
    }
    return 'MINOR';
  }

  private calculateCost(severity: string, detections: any[]): number {
    const baseCosts = {
      MINOR: 10000,
      MODERATE: 30000,
      SEVERE: 75000,
    };

    const baseCost = baseCosts[severity] || 10000;
    const multiplier = 1 + detections.length * 0.1; // 10% per additional damage

    return Math.round(baseCost * multiplier);
  }

  private async getRepairShopSuggestions(city: string) {
    // Mock data - replace with actual API or database
    return [
      {
        name: 'Auto Repair Shop',
        address: city,
        phone: '+923001234567',
        estimatedCost: 15000,
        distance: '2.5 km',
      },
    ];
  }
}
```

---

## 4. OCR for CNIC

### Step 1: Install Google Cloud Vision
```bash
npm install @google-cloud/vision
```

### Step 2: Create OCR Service
```typescript
// src/common/services/ocr.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageAnnotatorClient } from '@google-cloud/vision';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private client: ImageAnnotatorClient;

  constructor(private configService: ConfigService) {
    const credentials = JSON.parse(
      process.env.GOOGLE_CLOUD_CREDENTIALS || '{}',
    );
    this.client = new ImageAnnotatorClient({ credentials });
  }

  async extractCNICData(imageUrl: string): Promise<{
    cnicNumber?: string;
    name?: string;
    fatherName?: string;
    dateOfBirth?: string;
    address?: string;
  }> {
    try {
      const [result] = await this.client.textDetection(imageUrl);
      const detections = result.textAnnotations;

      if (!detections || detections.length === 0) {
        return {};
      }

      const fullText = detections[0].description || '';
      const lines = fullText.split('\n');

      // Extract CNIC number (format: 12345-1234567-1)
      const cnicRegex = /\d{5}-\d{7}-\d{1}/;
      const cnicMatch = fullText.match(cnicRegex);
      const cnicNumber = cnicMatch ? cnicMatch[0] : undefined;

      // Extract name (usually first line after header)
      const name = this.extractName(lines);

      // Extract date of birth
      const dob = this.extractDateOfBirth(lines);

      return {
        cnicNumber,
        name,
        dateOfBirth: dob,
      };
    } catch (error) {
      this.logger.error(`OCR extraction failed: ${error.message}`);
      return {};
    }
  }

  private extractName(lines: string[]): string | undefined {
    // Logic to extract name from OCR text
    // This is simplified - adjust based on actual CNIC format
    for (const line of lines) {
      if (line.length > 5 && /^[A-Za-z\s]+$/.test(line)) {
        return line.trim();
      }
    }
    return undefined;
  }

  private extractDateOfBirth(lines: string[]): string | undefined {
    const dateRegex = /\d{2}\/\d{2}\/\d{4}/;
    for (const line of lines) {
      const match = line.match(dateRegex);
      if (match) {
        return match[0];
      }
    }
    return undefined;
  }
}
```

### Step 3: Integrate with Users Service
```typescript
// src/users/users.service.ts
async uploadCnic(userId: string, cnicImageUrl: string) {
  // Run OCR
  const ocrData = await this.ocrService.extractCNICData(cnicImageUrl);

  await this.prisma.user.update({
    where: { id: userId },
    data: {
      cnicImageUrl,
      cnicNumber: ocrData.cnicNumber,
      cnicExtractedAt: new Date(),
      cnicExtractionData: ocrData,
      isVerified: false,
    },
  });

  return {
    message: 'CNIC image uploaded. Awaiting admin verification.',
    cnicImageUrl,
    extractedData: ocrData,
  };
}
```

---

## 5. Bulk Import

### Step 1: Install CSV Parser
```bash
npm install csv-parse
npm install --save-dev @types/csv-parse
```

### Step 2: Create Bulk Import Service
```typescript
// src/user-cars/services/bulk-import.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BulkImportService {
  constructor(private prisma: PrismaService) {}

  async importCarsFromCSV(
    userId: string,
    fileBuffer: Buffer,
    validateOnly: boolean = false,
  ) {
    const records = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const results = {
      totalRows: records.length,
      successful: 0,
      failed: 0,
      errors: [] as any[],
      importedCars: [] as any[],
    };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        // Validate required fields
        this.validateRow(row, i + 1);

        if (!validateOnly) {
          // Import car
          const car = await this.prisma.userCar.create({
            data: {
              userId,
              registrationNumber: row.registrationNumber,
              manufacturer: row.manufacturer,
              modelName: row.modelName,
              year: parseInt(row.year),
              variant: row.variant,
              color: row.color,
              mileage: parseInt(row.mileage),
              condition: row.condition,
              purchasePrice: parseFloat(row.purchasePrice),
            },
          });

          results.importedCars.push(car);
        }

        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          error: error.message,
        });
      }
    }

    return results;
  }

  private validateRow(row: any, rowNumber: number) {
    const required = [
      'registrationNumber',
      'manufacturer',
      'modelName',
      'year',
    ];

    for (const field of required) {
      if (!row[field]) {
        throw new BadRequestException(
          `Row ${rowNumber}: Missing required field: ${field}`,
        );
      }
    }

    // Check duplicate registration
    // ... validation logic
  }
}
```

---

## 6. Testing Suite

### Step 1: Setup Test Database
```typescript
// test/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL,
    },
  },
});

beforeAll(async () => {
  // Clean database
  await prisma.$executeRaw`TRUNCATE TABLE users CASCADE`;
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

### Step 2: Example Unit Test
```typescript
// src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create a new user', async () => {
      // Test implementation
    });
  });
});
```

---

**Last Updated:** February 2026  
**Next Steps:** Start with Rate Limiting & Logging (highest priority)

