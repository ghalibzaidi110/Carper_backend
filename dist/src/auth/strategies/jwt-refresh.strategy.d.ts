import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';
declare const JwtRefreshStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtRefreshStrategy extends JwtRefreshStrategy_base {
    private prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(req: Request, payload: {
        sub: string;
        email: string;
    }): Promise<{
        currentRefreshToken: any;
        id: string;
        email: string;
        fullName: string;
        accountType: import("@prisma/client").$Enums.AccountType;
        refreshToken: string | null;
        accountStatus: import("@prisma/client").$Enums.AccountStatus;
        isVerified: boolean;
    }>;
}
export {};
