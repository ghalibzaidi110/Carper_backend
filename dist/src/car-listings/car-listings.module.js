"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarListingsModule = void 0;
const common_1 = require("@nestjs/common");
const car_listings_service_1 = require("./car-listings.service");
const car_listings_controller_1 = require("./car-listings.controller");
const email_module_1 = require("../email/email.module");
let CarListingsModule = class CarListingsModule {
};
exports.CarListingsModule = CarListingsModule;
exports.CarListingsModule = CarListingsModule = __decorate([
    (0, common_1.Module)({
        imports: [email_module_1.EmailModule],
        controllers: [car_listings_controller_1.CarListingsController],
        providers: [car_listings_service_1.CarListingsService],
        exports: [car_listings_service_1.CarListingsService],
    })
], CarListingsModule);
//# sourceMappingURL=car-listings.module.js.map