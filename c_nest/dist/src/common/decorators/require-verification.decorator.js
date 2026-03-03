"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireVerification = exports.VERIFIED_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.VERIFIED_KEY = 'requiresVerification';
const RequireVerification = () => (0, common_1.SetMetadata)(exports.VERIFIED_KEY, true);
exports.RequireVerification = RequireVerification;
//# sourceMappingURL=require-verification.decorator.js.map