import { PrismaService } from '../prisma/prisma.service';
export declare class PdfService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    generateDamageReport(carId: string, userId: string): Promise<Buffer>;
    generateRentalReport(rentalId: string, userId: string): Promise<Buffer>;
    private buildPdf;
    private buildRentalPdf;
}
