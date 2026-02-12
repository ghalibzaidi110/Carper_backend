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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let EmailService = EmailService_1 = class EmailService {
    configService;
    logger = new common_1.Logger(EmailService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    async sendEmail(options) {
        const provider = this.configService.get('EMAIL_PROVIDER', 'console');
        switch (provider) {
            case 'console':
                this.logger.log('─── EMAIL (console mode) ───');
                this.logger.log(`To:      ${options.to}`);
                this.logger.log(`Subject: ${options.subject}`);
                this.logger.log(`Body:    ${options.text || options.html}`);
                this.logger.log('────────────────────────────');
                break;
            default:
                this.logger.warn(`Unknown email provider: ${provider}, falling back to console`);
                this.logger.log(`[EMAIL] To: ${options.to} | Subject: ${options.subject}`);
        }
    }
    async sendContactSellerEmail(sellerEmail, sellerName, buyerName, buyerEmail, carTitle, message) {
        await this.sendEmail({
            to: sellerEmail,
            subject: `New inquiry about your listing: ${carTitle}`,
            html: `
        <h2>New Inquiry on Your Car Listing</h2>
        <p>Hi ${sellerName},</p>
        <p><strong>${buyerName}</strong> is interested in your listing <strong>"${carTitle}"</strong>.</p>
        <blockquote>${message}</blockquote>
        <p>Reply to: <a href="mailto:${buyerEmail}">${buyerEmail}</a></p>
        <hr/>
        <p style="color: #888; font-size: 12px;">This email was sent via the Car Platform marketplace.</p>
      `,
        });
    }
    async sendVerificationApprovedEmail(userEmail, userName) {
        await this.sendEmail({
            to: userEmail,
            subject: 'Your CNIC Verification Has Been Approved',
            html: `
        <h2>Verification Approved!</h2>
        <p>Hi ${userName},</p>
        <p>Your CNIC has been verified successfully. You can now create listings and rent cars on the platform.</p>
        <p>Thank you for using our platform!</p>
      `,
        });
    }
    async sendRentalStatusEmail(userEmail, userName, carTitle, status) {
        await this.sendEmail({
            to: userEmail,
            subject: `Rental Update: ${carTitle} — ${status}`,
            html: `
        <h2>Rental Status Update</h2>
        <p>Hi ${userName},</p>
        <p>Your rental for <strong>"${carTitle}"</strong> has been updated to: <strong>${status}</strong>.</p>
      `,
        });
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map