"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const ledger_1 = require("./ledger");
const mining_1 = __importDefault(require("./endpoints/mining"));
const general_1 = __importDefault(require("./endpoints/general"));
const config = JSON.parse(fs_1.default.readFileSync("config.json", 'utf8'));
const app = (0, express_1.default)();
(0, ledger_1.loadLedger)(config);
(0, mining_1.default)(app, config);
(0, general_1.default)(app, config);
app.listen(config.apiPort, () => {
    console.log(`Server running on http://localhost:${config.apiPort}`);
});
