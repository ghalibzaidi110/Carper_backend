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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const dto_1 = require("./dto");
const guards_1 = require("./guards");
const google_auth_check_guard_1 = require("./guards/google-auth-check.guard");
const decorators_1 = require("../common/decorators");
const config_1 = require("@nestjs/config");
let AuthController = class AuthController {
    authService;
    configService;
    constructor(authService, configService) {
        this.authService = authService;
        this.configService = configService;
    }
    async register(dto) {
        return this.authService.register(dto);
    }
    async login(dto) {
        return this.authService.login(dto);
    }
    async refreshTokens(dto, user) {
        return this.authService.refreshTokens(user.id, user.currentRefreshToken);
    }
    async logout(userId) {
        return this.authService.logout(userId);
    }
    async googleAuth() {
    }
    async googleAuthCallback(req, res) {
        const result = await this.authService.googleLogin(req.user);
        const frontendUrl = this.configService.get('FRONTEND_URL');
        if (result.isNewUser) {
            const googleData = encodeURIComponent(JSON.stringify(result.googleData));
            res.redirect(`${frontendUrl}/auth/signup?google=true&data=${googleData}`);
        }
        else {
            const existingUserResult = result;
            res.redirect(`${frontendUrl}/auth/callback?accessToken=${existingUserResult.accessToken}&refreshToken=${existingUserResult.refreshToken}`);
        }
    }
    async completeGoogleSignup(dto) {
        const { googleId, email, fullName, avatarUrl, phoneNumber, city, address, accountType, businessName, businessLicense } = dto;
        return this.authService.completeGoogleSignup({ googleId, email, fullName, avatarUrl }, { phoneNumber, city, address, accountType, businessName, businessLicense });
    }
    async getMe(user) {
        return user;
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({
        summary: 'Register a new user account',
        description: 'Create a new account with email and password. Choose account type: INDIVIDUAL or CAR_RENTAL. All fields are required.'
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Login with email and password',
        description: 'Authenticate user and receive access & refresh tokens'
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(guards_1.JwtRefreshGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh access token' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RefreshTokenDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshTokens", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Logout and invalidate refresh token' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('google'),
    (0, common_1.UseGuards)(google_auth_check_guard_1.GoogleAuthCheckGuard, guards_1.GoogleAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Initiate Google OAuth login' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuth", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('google/callback'),
    (0, common_1.UseGuards)(google_auth_check_guard_1.GoogleAuthCheckGuard, guards_1.GoogleAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Google OAuth callback' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuthCallback", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('google/complete-signup'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Complete signup after Google OAuth',
        description: 'After Google OAuth redirects to signup page, user completes registration with additional required fields (phone, city, address, account type)'
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CompleteGoogleSignupDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "completeGoogleSignup", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current authenticated user' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getMe", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map