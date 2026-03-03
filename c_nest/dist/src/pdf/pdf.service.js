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
var PdfService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const PDFDocument = require('pdfkit');
let PdfService = PdfService_1 = class PdfService {
    prisma;
    logger = new common_1.Logger(PdfService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateDamageReport(carId, userId) {
        const car = await this.prisma.userCar.findFirst({
            where: { id: carId, userId },
            include: {
                catalog: {
                    select: { manufacturer: true, modelName: true, year: true },
                },
            },
        });
        if (!car) {
            throw new common_1.NotFoundException('Car not found');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { fullName: true, email: true, phoneNumber: true },
        });
        const damageImages = await this.prisma.carImage.findMany({
            where: {
                carId,
                hasDamageDetected: true,
            },
            orderBy: { uploadedAt: 'desc' },
        });
        return this.buildPdf(car, user, damageImages);
    }
    async generateRentalReport(rentalId, userId) {
        const rental = await this.prisma.rental.findFirst({
            where: { id: rentalId, userId },
            include: {
                car: {
                    select: {
                        registrationNumber: true,
                        manufacturer: true,
                        modelName: true,
                        year: true,
                        color: true,
                    },
                },
            },
        });
        if (!rental) {
            throw new common_1.NotFoundException('Rental not found');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { fullName: true, businessName: true, email: true },
        });
        return this.buildRentalPdf(rental, user);
    }
    buildPdf(car, user, damageImages) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            doc
                .fontSize(20)
                .text('Car Damage Detection Report', { align: 'center' })
                .moveDown(0.5);
            doc
                .fontSize(10)
                .fillColor('#888')
                .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
                .moveDown(1);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ccc').moveDown(0.5);
            doc.fontSize(14).fillColor('#000').text('Vehicle Information').moveDown(0.3);
            doc.fontSize(10);
            doc.text(`Registration: ${car.registrationNumber}`);
            doc.text(`Vehicle: ${car.manufacturer} ${car.modelName} (${car.year})`);
            if (car.variant)
                doc.text(`Variant: ${car.variant}`);
            if (car.color)
                doc.text(`Color: ${car.color}`);
            if (car.mileage)
                doc.text(`Mileage: ${car.mileage.toLocaleString()} km`);
            doc.moveDown(0.5);
            doc.fontSize(14).text('Owner Information').moveDown(0.3);
            doc.fontSize(10);
            doc.text(`Name: ${user.fullName}`);
            doc.text(`Email: ${user.email}`);
            if (user.phoneNumber)
                doc.text(`Phone: ${user.phoneNumber}`);
            doc.moveDown(0.5);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ccc').moveDown(0.5);
            doc.fontSize(14).text('Damage Detection Summary').moveDown(0.3);
            doc.fontSize(10);
            doc.text(`Total images with damage: ${damageImages.length}`);
            doc.moveDown(0.5);
            if (damageImages.length === 0) {
                doc
                    .fontSize(12)
                    .fillColor('green')
                    .text('No damage detected on this vehicle.', { align: 'center' })
                    .moveDown(1);
            }
            else {
                damageImages.forEach((img, index) => {
                    if (doc.y > 700)
                        doc.addPage();
                    doc.fontSize(11).fillColor('#000').text(`${index + 1}. ${img.imageCategory} (Version ${img.version})`);
                    doc.fontSize(9).fillColor('#666');
                    doc.text(`   Uploaded: ${img.uploadedAt.toLocaleString()}`);
                    doc.text(`   Image URL: ${img.imageUrl}`);
                    if (img.damageDetectionData) {
                        const data = img.damageDetectionData;
                        if (data.confidence) {
                            doc.text(`   Confidence: ${(data.confidence * 100).toFixed(1)}%`);
                        }
                        if (data.detections && data.detections.length > 0) {
                            doc.text(`   Detections:`);
                            data.detections.forEach((d) => {
                                doc.text(`     - ${d.label}: ${(d.confidence * 100).toFixed(1)}%`);
                            });
                        }
                    }
                    doc.moveDown(0.3);
                });
            }
            doc.moveDown(1);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ccc').moveDown(0.5);
            doc
                .fontSize(8)
                .fillColor('#aaa')
                .text('This report was auto-generated by the Car Damage Detection Platform.', {
                align: 'center',
            });
            doc.end();
        });
    }
    buildRentalPdf(rental, user) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            doc
                .fontSize(20)
                .text('Rental Summary Report', { align: 'center' })
                .moveDown(0.5);
            doc
                .fontSize(10)
                .fillColor('#888')
                .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
                .moveDown(1);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ccc').moveDown(0.5);
            doc.fontSize(14).fillColor('#000').text('Business Information').moveDown(0.3);
            doc.fontSize(10);
            doc.text(`Business: ${user.businessName || user.fullName}`);
            doc.text(`Email: ${user.email}`);
            doc.moveDown(0.5);
            doc.fontSize(14).text('Vehicle Information').moveDown(0.3);
            doc.fontSize(10);
            doc.text(`Registration: ${rental.car.registrationNumber}`);
            doc.text(`Vehicle: ${rental.car.manufacturer} ${rental.car.modelName} (${rental.car.year})`);
            if (rental.car.color)
                doc.text(`Color: ${rental.car.color}`);
            doc.moveDown(0.5);
            doc.fontSize(14).text('Renter Information').moveDown(0.3);
            doc.fontSize(10);
            doc.text(`Name: ${rental.renterName}`);
            if (rental.renterPhone)
                doc.text(`Phone: ${rental.renterPhone}`);
            if (rental.renterEmail)
                doc.text(`Email: ${rental.renterEmail}`);
            if (rental.renterCnic)
                doc.text(`CNIC: ${rental.renterCnic}`);
            doc.moveDown(0.5);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ccc').moveDown(0.5);
            doc.fontSize(14).text('Rental Details').moveDown(0.3);
            doc.fontSize(10);
            doc.text(`Status: ${rental.status}`);
            doc.text(`Start Date: ${new Date(rental.startDate).toLocaleDateString()}`);
            doc.text(`End Date: ${new Date(rental.endDate).toLocaleDateString()}`);
            if (rental.actualReturnDate)
                doc.text(`Actual Return: ${new Date(rental.actualReturnDate).toLocaleDateString()}`);
            if (rental.mileageAtStart)
                doc.text(`Mileage at Start: ${rental.mileageAtStart} km`);
            if (rental.mileageAtEnd)
                doc.text(`Mileage at End: ${rental.mileageAtEnd} km`);
            doc.moveDown(0.5);
            doc.fontSize(14).text('Financial Summary').moveDown(0.3);
            doc.fontSize(10);
            doc.text(`Rental Price: PKR ${Number(rental.rentalPrice).toLocaleString()}`);
            if (rental.damageCharges)
                doc.text(`Damage Charges: PKR ${Number(rental.damageCharges).toLocaleString()}`);
            if (rental.totalCharges)
                doc.text(`Total Charges: PKR ${Number(rental.totalCharges).toLocaleString()}`);
            doc.moveDown(0.5);
            if (rental.preRentalNotes || rental.postRentalNotes) {
                doc.fontSize(14).text('Notes').moveDown(0.3);
                doc.fontSize(10);
                if (rental.preRentalNotes)
                    doc.text(`Pre-rental: ${rental.preRentalNotes}`);
                if (rental.postRentalNotes)
                    doc.text(`Post-rental: ${rental.postRentalNotes}`);
                if (rental.damageDescription)
                    doc.text(`Damage: ${rental.damageDescription}`);
            }
            doc.moveDown(1);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ccc').moveDown(0.5);
            doc
                .fontSize(8)
                .fillColor('#aaa')
                .text('This report was auto-generated by the Car Platform.', {
                align: 'center',
            });
            doc.end();
        });
    }
};
exports.PdfService = PdfService;
exports.PdfService = PdfService = PdfService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PdfService);
//# sourceMappingURL=pdf.service.js.map