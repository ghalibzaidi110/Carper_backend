import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto, NotificationFilterDto } from './dto';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateNotificationDto): Promise<{
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
    createForMany(userIds: string[], dto: CreateNotificationDto): Promise<import("@prisma/client").Prisma.BatchPayload>;
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
    getUnreadCount(userId: string): Promise<{
        unreadCount: number;
    }>;
}
