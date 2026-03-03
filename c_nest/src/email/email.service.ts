import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Send an email using the configured provider.
   * Currently uses a pluggable approach — swap the implementation
   * when you choose a provider (SendGrid, Mailgun, AWS SES, etc.)
   */
  async sendEmail(options: SendEmailOptions): Promise<void> {
    const provider = this.configService.get<string>('EMAIL_PROVIDER', 'console');

    switch (provider) {
      case 'console':
        // Development: log emails to console
        this.logger.log('─── EMAIL (console mode) ───');
        this.logger.log(`To:      ${options.to}`);
        this.logger.log(`Subject: ${options.subject}`);
        this.logger.log(`Body:    ${options.text || options.html}`);
        this.logger.log('────────────────────────────');
        break;

      // Add real providers here:
      // case 'sendgrid':
      //   await this.sendViaSendGrid(options);
      //   break;
      // case 'mailgun':
      //   await this.sendViaMailgun(options);
      //   break;

      default:
        this.logger.warn(`Unknown email provider: ${provider}, falling back to console`);
        this.logger.log(`[EMAIL] To: ${options.to} | Subject: ${options.subject}`);
    }
  }

  /** Convenience: send a contact-seller email */
  async sendContactSellerEmail(
    sellerEmail: string,
    sellerName: string,
    buyerName: string,
    buyerEmail: string,
    carTitle: string,
    message: string,
  ): Promise<void> {
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

  /** Convenience: send verification-approved email */
  async sendVerificationApprovedEmail(
    userEmail: string,
    userName: string,
  ): Promise<void> {
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

  /** Convenience: send rental status update email */
  async sendRentalStatusEmail(
    userEmail: string,
    userName: string,
    carTitle: string,
    status: string,
  ): Promise<void> {
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
}
