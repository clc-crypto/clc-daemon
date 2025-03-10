"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const fs_1 = __importDefault(require("fs"));
const ledger_1 = require("./ledger");
const elliptic_1 = require("elliptic");
const ecdsa = new elliptic_1.ec('secp256k1');
class InvalidMinerSignatureError extends Error {
    constructor() {
        super("The miner provided an invalid signature when creating a coin");
    }
}
class InvalidMinedHashError extends Error {
    constructor() {
        super("The miner provided an invalid mined hash");
    }
}
function createMinedCoin(LEDGER_PATH, val, holder, miningSignature, minedHash, seed, diff) {
    if (LEDGER_PATH === null)
        throw new ledger_1.LedgerNotInitializedError();
    const key = ecdsa.keyFromPublic(holder, 'hex');
    if (!key.verify((0, crypto_1.hash)("sha256", holder, "hex"), miningSignature) && miningSignature !== "split")
        throw new InvalidMinerSignatureError();
    if (BigInt("0x" + diff) < BigInt("0x" + minedHash))
        throw new InvalidMinedHashError();
    if ((0, crypto_1.hash)("sha256", key.getPublic().encode("hex", false) + seed) !== minedHash)
        throw new InvalidMinedHashError();
    (0, ledger_1.incrementLastId)();
    const coin = {
        val: val,
        genesisTime: Date.now(),
        seed: seed,
        diff: diff,
        hash: minedHash,
        transactions: [
            {
                holder: holder,
                transactionSignature: miningSignature
            }
        ]
    };
    fs_1.default.writeFileSync(LEDGER_PATH + "/" + parseInt(fs_1.default.readFileSync(LEDGER_PATH + "/last.id", "utf-8")) + ".coin.json", JSON.stringify(coin, null, 2), "utf-8");
    return parseInt(fs_1.default.readFileSync(LEDGER_PATH + "/last.id", "utf-8"));
}
exports.default = createMinedCoin;
