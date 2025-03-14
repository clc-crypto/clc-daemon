"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const cors_1 = __importDefault(require("cors"));
const ledger_1 = require("./ledger");
const mining_1 = __importDefault(require("./endpoints/mining"));
const general_1 = __importDefault(require("./endpoints/general"));
const https = require('https');
const config = JSON.parse(fs_1.default.readFileSync("config.json", 'utf8'));
const app = (0, express_1.default)();
// Enable CORS for all origins
app.use((0, cors_1.default)());
const privateKey = fs_1.default.readFileSync('/etc/letsencrypt/live/clc.ix.tc/privkey.pem', 'utf8');
const certificate = fs_1.default.readFileSync('/etc/letsencrypt/live/clc.ix.tc/fullchain.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };
(0, ledger_1.loadLedger)(config);
(0, mining_1.default)(app, config);
(0, general_1.default)(app, config);
https.createServer(credentials, app).listen(config.apiPort, () => {
    console.log(`Server running on http://localhost:${config.apiPort}`);
});
