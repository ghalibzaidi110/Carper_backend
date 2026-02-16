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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
let CloudinaryService = class CloudinaryService {
    configService;
    constructor(configService) {
        this.configService = configService;
        cloudinary_1.v2.config({
            cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
        });
    }
    async uploadImage(file, folder, maxSizeMB = 10) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Invalid file type. Allowed: JPG, PNG, WEBP');
        }
        const maxSize = maxSizeMB * 1024 * 1024;
        if (file.size > maxSize) {
            throw new common_1.BadRequestException(`File size exceeds ${maxSizeMB}MB limit`);
        }
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder: `car-platform/${folder}`,
                resource_type: 'image',
                transformation: [
                    { width: 1920, height: 1080, crop: 'limit' },
                    { quality: 'auto', fetch_format: 'auto' },
                ],
            }, (error, result) => {
                if (error)
                    return reject(error);
                resolve(result);
            });
            const stream = stream_1.Readable.from(file.buffer);
            stream.pipe(uploadStream);
        });
    }
    async uploadMultipleImages(files, folder) {
        const uploads = files.map((file) => this.uploadImage(file, folder));
        return Promise.all(uploads);
    }
    async deleteImage(publicId) {
        return cloudinary_1.v2.uploader.destroy(publicId);
    }
    generateThumbnailUrl(imageUrl) {
        return imageUrl.replace('/upload/', '/upload/w_300,h_200,c_fill/');
    }
};
exports.CloudinaryService = CloudinaryService;
exports.CloudinaryService = CloudinaryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CloudinaryService);
//# sourceMappingURL=cloudinary.service.js.map