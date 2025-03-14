"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const addMinedCoin_1 = __importDefault(require("../addMinedCoin"));
const fs_1 = __importDefault(require("fs"));
function register(app, config) {
    let SEED = Math.random() + "" + Math.random() + "";
    let REWARD = config.reward;
    let DIFF = config.startingDiff;
    let CIRCULATION = 0;
    if (fs_1.default.existsSync("diff.save"))
        DIFF = fs_1.default.readFileSync("diff.save", "utf-8");
    if (fs_1.default.existsSync("circulation.save"))
        CIRCULATION = parseFloat(fs_1.default.readFileSync("circulation.save", "utf-8"));
    let TARGET = config.target; // x ms / reward
    let lastFound = Date.now();
    app.get("/get-challenge", async (req, res) => {
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
    });
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
            CIRCULATION += REWARD;
            REWARD = (-CIRCULATION / (config.maxSupply / config.reward)) + config.reward;
            fs_1.default.writeFileSync("circulation.save", CIRCULATION.toString());
            console.log();
            console.log("Mined #" + id + " | " + req.query.hash + " | diff: " + DIFF + " | in: " + (Date.now() - lastFound));
            console.log("Took to long? " + (Date.now() - lastFound > TARGET));
            console.log("New reward: " + REWARD);
            if (Date.now() - lastFound > TARGET)
                DIFF = (BigInt("0x" + DIFF) + BigInt("0x" + config.adjust)).toString(16);
            else
                DIFF = (BigInt("0x" + DIFF) - BigInt("0x" + config.adjust)).toString(16);
            DIFF = DIFF.replace('-', '');
            DIFF = DIFF.padStart(64, '0');
            fs_1.default.writeFileSync("diff.save", DIFF);
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
