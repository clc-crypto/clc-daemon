"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidMergeOriginSignatureError = exports.InvalidMergeVolumeError = void 0;
exports.mergeCoins = mergeCoins;
const ledger_1 = require("./ledger");
const cryptoUtils_1 = require("./cryptoUtils");
const elliptic_1 = require("elliptic");
const fs_1 = __importDefault(require("fs"));
const ecdsa = new elliptic_1.ec('secp256k1');
class InvalidMergeOriginSignatureError extends Error {
    constructor() {
        super("The merge operation's origin holder's signature is invalid");
    }
}
exports.InvalidMergeOriginSignatureError = InvalidMergeOriginSignatureError;
class InvalidMergeVolumeError extends Error {
    constructor() {
        super("The merge operation's volume is invalid");
    }
}
exports.InvalidMergeVolumeError = InvalidMergeVolumeError;
function mergeCoins(LEDGER_PATH, originId, targetId, signature, vol) {
    const origin = (0, ledger_1.getCoin)(originId);
    const target = (0, ledger_1.getCoin)(targetId);
    if (vol < 0.000001)
        throw new InvalidMergeVolumeError();
    if (vol > origin.val)
        throw new InvalidMergeVolumeError();
    const originKey = ecdsa.keyFromPublic(origin.transactions[origin.transactions.length - 1].holder, "hex");
    if (!originKey.verify((0, cryptoUtils_1.sha256)(targetId + " " + target.transactions.length + " " + vol), signature))
        throw new InvalidMergeOriginSignatureError();
    origin.transactions.push({
        holder: origin.transactions[origin.transactions.length - 1].holder,
        transactionSignature: origin.transactions[origin.transactions.length - 1].transactionSignature,
        transformationType: "merge",
        transformation: {
            target: targetId,
            height: target.transactions.length,
            originSignature: signature,
            vol: -vol
        }
    });
    origin.val -= vol;
    target.transactions.push({
        holder: origin.transactions[origin.transactions.length - 1].holder,
        transactionSignature: origin.transactions[origin.transactions.length - 1].transactionSignature,
        transformationType: "merge",
        transformation: {
            origin: originId,
            height: origin.transactions.length - 1,
            vol: vol
        }
    });
    target.val += vol;
    fs_1.default.writeFileSync(LEDGER_PATH + "/" + originId + ".coin.json", JSON.stringify(origin, null, 2), "utf-8");
    fs_1.default.writeFileSync(LEDGER_PATH + "/" + targetId + ".coin.json", JSON.stringify(target, null, 2), "utf-8");
}
