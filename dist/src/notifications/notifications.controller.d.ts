import { NotificationsService } from './notifications.service';
import { NotificationFilterDto } from './dto';
export declare class NotificationsController {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(userId: string, filters: NotificationFilterDto): Promise<{
        data: {
            id: string;
            title: string;
            message: string;
            type: import("@prisma/client").$Enums.NotificationType;
            isRead: boolean;
            actionUrl: string | null;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
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
        id: string;
        title: string;
        message: string;
        type: import("@prisma/client").$Enums.NotificationType;
        isRead: boolean;
        actionUrl: string | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
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
