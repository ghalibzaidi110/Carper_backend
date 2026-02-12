"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const prisma_module_1 = require("./prisma/prisma.module");
const cloudinary_module_1 = require("./cloudinary/cloudinary.module");
const email_module_1 = require("./email/email.module");
const notifications_module_1 = require("./notifications/notifications.module");
const auth_module_1 = require("./auth/auth.module");
const jwt_auth_guard_1 = require("./auth/guards/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const verification_guard_1 = require("./common/guards/verification.guard");
const users_module_1 = require("./users/users.module");
const car_catalog_module_1 = require("./car-catalog/car-catalog.module");
const user_cars_module_1 = require("./user-cars/user-cars.module");
const car_images_module_1 = require("./car-images/car-images.module");
const car_listings_module_1 = require("./car-listings/car-listings.module");
const rentals_module_1 = require("./rentals/rentals.module");
const damage_detection_module_1 = require("./damage-detection/damage-detection.module");
const admin_module_1 = require("./admin/admin.module");
const pdf_module_1 = require("./pdf/pdf.module");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            cloudinary_module_1.CloudinaryModule,
            email_module_1.EmailModule,
            notifications_module_1.NotificationsModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            car_catalog_module_1.CarCatalogModule,
            user_cars_module_1.UserCarsModule,
            car_images_module_1.CarImagesModule,
            car_listings_module_1.CarListingsModule,
            rentals_module_1.RentalsModule,
            damage_detection_module_1.DamageDetectionModule,
            admin_module_1.AdminModule,
            pdf_module_1.PdfModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
            { provide: core_1.APP_GUARD, useClass: verification_guard_1.VerificationGuard },
            { provide: core_1.APP_FILTER, useClass: all_exceptions_filter_1.AllExceptionsFilter },
            { provide: core_1.APP_INTERCEPTOR, useClass: transform_interceptor_1.TransformInterceptor },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map