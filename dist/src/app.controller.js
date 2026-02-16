"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const decorators_1 = require("./common/decorators");
let AppController = class AppController {
    getWelcome() {
        return {
            message: 'Hello from Carper API 🚗',
            version: '1.0.0',
            status: 'running',
            docs: '/api/docs',
            endpoints: {
                auth: '/api/v1/auth',
                users: '/api/v1/users',
                cars: '/api/v1/user-cars',
                marketplace: '/api/v1/car-listings',
                rentals: '/api/v1/rentals',
                damageDetection: '/api/v1/damage-detection',
            },
            timestamp: new Date().toISOString(),
        };
    }
};
exports.AppController = AppController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'API health check and welcome message' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getWelcome", null);
exports.AppController = AppController = __decorate([
    (0, swagger_1.ApiTags)('Root'),
    (0, common_1.Controller)()
], AppController);
//# sourceMappingURL=app.controller.js.map