"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const addMinedCoin_1 = __importDefault(require("../addMinedCoin"));
function register(app, config) {
    let SEED = Math.random() + "" + Math.random() + "";
    let REWARD = config.reward; // one reward is 0.2 CLC
    let DIFF = config.startingDiff;
    let TARGET = config.target; // 6 minutes per reward
    let lastFound = Date.now();
    app.get("/get-challenge", (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            res.json({
                seed: SEED,
                diff: DIFF,
                reward: REWARD,
                lastFound: lastFound
            });
        }
        catch (e) {
            console.log(e.message);
            res.status(502);
        }
    }));
    // function createMinedCoin(LEDGER_PATH: string, val: number, holder: string, miningSignature: string, minedHash: string, seed: string, diff: string): number {
    app.get("/challenge-solved", (req, res) => {
        try {
            if (!req.query.holder)
                throw new Error("holder parameter required");
            if (!req.query.sign)
                throw new Error("sign parameter required");
            if (!req.query.hash)
                throw new Error("hash parameter required");
            const id = (0, addMinedCoin_1.default)(config.ledgerDirectory, REWARD, req.query.holder.toString(), req.query.sign.toString(), req.query.hash.toString(), SEED, DIFF);
            res.json({ id: id });
            console.log();
            console.log("Mined #" + id + " | " + req.query.hash + " | diff: " + DIFF + " | in: " + (Date.now() - lastFound));
            console.log("Took to long? " + (Date.now() - lastFound > TARGET));
            if (Date.now() - lastFound > TARGET)
                DIFF = (BigInt("0x" + DIFF) + BigInt("0x" + config.adjust)).toString(16);
            else
                DIFF = (BigInt("0x" + DIFF) - BigInt("0x" + config.adjust)).toString(16);
            console.log(DIFF);
            DIFF = DIFF.padStart(64, '0');
            SEED = Math.random() + "" + Math.random() + "";
            console.log("New seed " + SEED);
            console.log("New diff " + DIFF);
            console.log();
            console.log("=".repeat(process.stdout.columns));
            lastFound = Date.now();
        }
        catch (e) {
            res.status(400).json({ "error": e.message });
        }
    });
}
exports.default = register;
