"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DamageDetectionModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const damage_detection_service_1 = require("./damage-detection.service");
const damage_detection_controller_1 = require("./damage-detection.controller");
let DamageDetectionModule = class DamageDetectionModule {
};
exports.DamageDetectionModule = DamageDetectionModule;
exports.DamageDetectionModule = DamageDetectionModule = __decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule],
        controllers: [damage_detection_controller_1.DamageDetectionController],
        providers: [damage_detection_service_1.DamageDetectionService],
        exports: [damage_detection_service_1.DamageDetectionService],
    })
], DamageDetectionModule);
//# sourceMappingURL=damage-detection.module.js.map