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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pdf_service_1 = require("./pdf.service");
const decorators_1 = require("../common/decorators");
let PdfController = class PdfController {
    pdfService;
    constructor(pdfService) {
        this.pdfService = pdfService;
    }
    async getDamageReport(carId, userId, res) {
        const buffer = await this.pdfService.generateDamageReport(carId, userId);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=damage-report-${carId}.pdf`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
    async getRentalReport(rentalId, userId, res) {
        const buffer = await this.pdfService.generateRentalReport(rentalId, userId);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=rental-report-${rentalId}.pdf`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
};
exports.PdfController = PdfController;
__decorate([
    (0, common_1.Get)('damage/:carId'),
    (0, decorators_1.RequireVerification)(),
    (0, swagger_1.ApiOperation)({ summary: 'Download damage detection report PDF' }),
    __param(0, (0, common_1.Param)('carId')),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PdfController.prototype, "getDamageReport", null);
__decorate([
    (0, common_1.Get)('rental/:rentalId'),
    (0, decorators_1.RequireVerification)(),
    (0, swagger_1.ApiOperation)({ summary: 'Download rental summary report PDF' }),
    __param(0, (0, common_1.Param)('rentalId')),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PdfController.prototype, "getRentalReport", null);
exports.PdfController = PdfController = __decorate([
    (0, swagger_1.ApiTags)('PDF Reports'),
    (0, common_1.Controller)('reports'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [pdf_service_1.PdfService])
], PdfController);
//# sourceMappingURL=pdf.controller.js.map