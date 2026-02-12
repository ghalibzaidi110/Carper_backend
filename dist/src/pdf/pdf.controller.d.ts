import type { Response } from 'express';
import { PdfService } from './pdf.service';
export declare class PdfController {
    private pdfService;
    constructor(pdfService: PdfService);
    getDamageReport(carId: string, userId: string, res: Response): Promise<void>;
    getRentalReport(rentalId: string, userId: string, res: Response): Promise<void>;
}
