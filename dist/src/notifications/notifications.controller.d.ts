import { NotificationsService } from './notifications.service';
import { NotificationFilterDto } from './dto';
export declare class NotificationsController {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(userId: string, filters: NotificationFilterDto): Promise<{
        data: {
            title: string;
            message: string;
            type: import("@prisma/client").$Enums.NotificationType;
            actionUrl: string | null;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
            id: string;
            isRead: boolean;
            createdAt: Date;
            userId: string;
        }[];
        unreadCount: number;
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getUnreadCount(userId: string): Promise<{
        unreadCount: number;
    }>;
    markAsRead(id: string, userId: string): Promise<{
        title: string;
        message: string;
        type: import("@prisma/client").$Enums.NotificationType;
        actionUrl: string | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        id: string;
        isRead: boolean;
        createdAt: Date;
        userId: string;
    }>;
    markAllAsRead(userId: string): Promise<{
        message: string;
    }>;
    remove(id: string, userId: string): Promise<{
        message: string;
    }>;
}
