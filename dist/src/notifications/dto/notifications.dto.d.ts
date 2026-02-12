import { NotificationType } from '@prisma/client';
export declare class CreateNotificationDto {
    title: string;
    message: string;
    type?: NotificationType;
    actionUrl?: string;
    metadata?: any;
}
export declare class NotificationFilterDto {
    unreadOnly?: boolean;
    type?: NotificationType;
    page?: number;
    limit?: number;
}
