"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256 = sha256;
const crypto_1 = require("crypto");
function sha256(cnt) {
    return (0, crypto_1.createHash)('sha256').update(cnt).digest('hex');
}
