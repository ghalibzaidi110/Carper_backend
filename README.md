<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

**Car Damage Detection & Marketplace Platform - Backend**

A NestJS-based REST API for a car damage detection and marketplace platform. This backend provides:
- AI-powered car damage detection using YOLOv8
- Car marketplace for buying/selling vehicles
- Rental management for car rental businesses
- CNIC verification system
- User management and authentication

**Current Status:** Backend ~75% complete | Frontend 0% (not started)

See [CURRENT_STATUS.md](./docs/CURRENT_STATUS.md) for detailed progress.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL (or Neon PostgreSQL)
- Cloudinary account (for image storage)
- YOLOv8 Python microservice (for damage detection)

### Installation

```bash
# Install dependencies
$ npm install

# Setup environment variables
$ cp .env.example .env
# Edit .env with your credentials

# Generate Prisma client
$ npx prisma generate

# Run database migrations
$ npx prisma db push

# Seed admin account
$ npm run seed

# Start development server
$ npm run start:dev
```

The API will be available at `http://localhost:3000`  
Swagger documentation at `http://localhost:3000/api/docs`

## 📋 Project Status

### ✅ Completed (Backend)
- 14 core modules implemented
- Authentication (JWT + OAuth)
- User management & CNIC verification
- Car catalog, registration, images
- Marketplace listings
- Rental management
- Damage detection integration
- Admin panel
- PDF report generation

### ⚠️ In Progress
- Rate limiting & logging (missing)
- OCR for CNIC extraction (manual only)
- Async damage detection processing

### ❌ Remaining
- Messaging system
- Cost estimation
- Bulk import features
- Comprehensive testing suite
- Production deployment setup
- Frontend (not started)

See [REMAINING_FEATURES.md](./docs/REMAINING_FEATURES.md) for details.

## 📚 Documentation

- [Project Overview](./docs/PROJECT_OVERVIEW.md) - High-level project documentation
- [Current Status](./docs/CURRENT_STATUS.md) - Detailed progress tracking
- [Development Roadmap](./docs/DEVELOPMENT_ROADMAP.md) - 8-week development plan
- [Remaining Features](./docs/REMAINING_FEATURES.md) - Features to be implemented
- [API Reference](./docs/API_REFERENCE.md) - Complete API documentation
- [Database Schema](./docs/DATABASE_SCHEMA.md) - Database structure
- [User Flows](./docs/USER_FLOWS.md) - User journey documentation

## 🧪 Testing

```bash
# Unit tests (not yet implemented)
$ npm run test

# E2E tests (placeholder only)
$ npm run test:e2e

# Test coverage (target: 80%+)
$ npm run test:cov
```

**Note:** Comprehensive testing suite is planned but not yet implemented. See [REMAINING_FEATURES.md](./docs/REMAINING_FEATURES.md#6-testing-suite).

## 🏗️ Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Admin seed script
├── src/
│   ├── auth/                  # Authentication module
│   ├── users/                  # User management
│   ├── car-catalog/           # Car catalog (admin)
│   ├── user-cars/             # User car registration
│   ├── car-images/            # Image management
│   ├── car-listings/          # Marketplace
│   ├── rentals/               # Rental management
│   ├── damage-detection/      # YOLOv8 integration
│   ├── admin/                 # Admin panel
│   ├── notifications/         # In-app notifications
│   ├── pdf/                   # PDF generation
│   └── common/                # Shared utilities
└── docs/                      # Documentation
```

## 🔧 Environment Variables

See [PROJECT_OVERVIEW.md](./docs/PROJECT_OVERVIEW.md#12-environment-variables) for complete list.

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET`
- `CLOUDINARY_*` - Cloudinary credentials
- `DAMAGE_DETECTION_SERVICE_URL` - YOLOv8 service URL
- `FRONTEND_URL` - Frontend URL for CORS

## 📊 API Endpoints

52+ REST API endpoints across 11 modules:
- Authentication (8 endpoints)
- Users (6 endpoints)
- Car Catalog (5 endpoints)
- User Cars (5 endpoints)
- Car Images (8 endpoints)
- Car Listings (6 endpoints)
- Rentals (7 endpoints)
- Damage Detection (4 endpoints)
- Notifications (5 endpoints)
- PDF Reports (2 endpoints)
- Admin (6 endpoints)

Full API documentation: [API_REFERENCE.md](./docs/API_REFERENCE.md)  
Interactive Swagger: `http://localhost:3000/api/docs`

## 🚧 Next Steps

1. **Immediate (Week 1)**
   - Add rate limiting middleware
   - Add request/response logging
   - Create health check endpoint

2. **Short-term (Week 2)**
   - Implement OCR for CNIC extraction
   - Start basic testing suite

3. **Medium-term (Week 5)**
   - Messaging system
   - Cost estimation feature
   - Bulk import features

4. **Long-term**
   - Comprehensive testing (80%+ coverage)
   - Production deployment
   - Frontend development

See [DEVELOPMENT_ROADMAP.md](./docs/DEVELOPMENT_ROADMAP.md) for detailed timeline.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
