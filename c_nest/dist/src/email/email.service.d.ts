import { ConfigService } from '@nestjs/config';
export interface SendEmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}
export declare class EmailService {
    private configService;
    private readonly logger;
    constructor(configService: ConfigService);
    sendEmail(options: SendEmailOptions): Promise<void>;
    sendContactSellerEmail(sellerEmail: string, sellerName: string, buyerName: string, buyerEmail: string, carTitle: string, message: string): Promise<void>;
    sendVerificationApprovedEmail(userEmail: string, userName: string): Promise<void>;
    sendRentalStatusEmail(userEmail: string, userName: string, carTitle: string, status: string): Promise<void>;
}
