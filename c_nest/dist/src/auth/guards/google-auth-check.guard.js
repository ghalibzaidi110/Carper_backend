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
exports.GoogleAuthCheckGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let GoogleAuthCheckGuard = class GoogleAuthCheckGuard {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    canActivate(context) {
        const clientID = this.configService.get('GOOGLE_CLIENT_ID');
        const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
        const callbackURL = this.configService.get('GOOGLE_CALLBACK_URL');
        if (!clientID || !clientSecret || !callbackURL) {
            throw new common_1.BadRequestException('Google OAuth is not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL in environment variables.');
        }
        return true;
    }
};
exports.GoogleAuthCheckGuard = GoogleAuthCheckGuard;
exports.GoogleAuthCheckGuard = GoogleAuthCheckGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GoogleAuthCheckGuard);
//# sourceMappingURL=google-auth-check.guard.js.map