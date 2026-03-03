"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarImagesModule = void 0;
const common_1 = require("@nestjs/common");
const car_images_service_1 = require("./car-images.service");
const car_images_controller_1 = require("./car-images.controller");
const cloudinary_module_1 = require("../cloudinary/cloudinary.module");
let CarImagesModule = class CarImagesModule {
};
exports.CarImagesModule = CarImagesModule;
exports.CarImagesModule = CarImagesModule = __decorate([
    (0, common_1.Module)({
        imports: [cloudinary_module_1.CloudinaryModule],
        controllers: [car_images_controller_1.CarImagesController],
        providers: [car_images_service_1.CarImagesService],
        exports: [car_images_service_1.CarImagesService],
    })
], CarImagesModule);
//# sourceMappingURL=car-images.module.js.map