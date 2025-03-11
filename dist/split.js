"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidNewCoinId = exports.InvalidSplitVolumeError = exports.InvalidSplitOriginMergeSignatureError = exports.InvalidSplitOriginSignatureError = void 0;
exports.splitCoins = splitCoins;
const ledger_1 = require("./ledger");
const cryptoUtils_1 = require("./cryptoUtils");
const elliptic_1 = require("elliptic");
const fs_1 = __importDefault(require("fs"));
const merge_1 = require("./merge");
const ecdsa = new elliptic_1.ec('secp256k1');
class InvalidSplitOriginSignatureError extends Error {
    constructor() {
        super("The split operation's origin holder's signature is invalid");
    }
}
exports.InvalidSplitOriginSignatureError = InvalidSplitOriginSignatureError;
class InvalidSplitOriginMergeSignatureError extends Error {
    constructor() {
        super("The split operation's origin holder's signature is invalid");
    }
}
exports.InvalidSplitOriginMergeSignatureError = InvalidSplitOriginMergeSignatureError;
class InvalidSplitVolumeError extends Error {
    constructor() {
        super("The split operation's volume is invalid");
    }
}
exports.InvalidSplitVolumeError = InvalidSplitVolumeError;
class InvalidNewCoinId extends Error {
    constructor() {
        super("Invalid split operation's new coin id");
    }
}
exports.InvalidNewCoinId = InvalidNewCoinId;
function splitCoins(LEDGER_PATH, originId, targetId, mergeSignature, vol) {
    if (parseInt(fs_1.default.readFileSync(LEDGER_PATH + "/last.id", "utf-8")) + 1 !== targetId)
        throw new InvalidNewCoinId();
    const origin = (0, ledger_1.getCoin)(originId);
    if (vol < 0.000001)
        throw new InvalidSplitVolumeError();
    if (vol > origin.val)
        throw new InvalidSplitVolumeError();
    const originKey = ecdsa.keyFromPublic(origin.transactions[origin.transactions.length - 1].holder, "hex");
    if (!originKey.verify((0, cryptoUtils_1.sha256)(targetId + " 1 " + vol), mergeSignature))
        throw new InvalidSplitOriginMergeSignatureError();
    (0, ledger_1.incrementLastId)();
    const coin = {
        val: 0,
        genesisTime: Date.now(),
        transactions: [
            {
                holder: origin.transactions[origin.transactions.length - 1].holder,
                transactionSignature: origin.transactions[origin.transactions.length - 1].transactionSignature,
            }
        ]
    };
    fs_1.default.writeFileSync(LEDGER_PATH + "/" + parseInt(fs_1.default.readFileSync(LEDGER_PATH + "/last.id", "utf-8")) + ".coin.json", JSON.stringify(coin, null, 2), "utf-8");
    (0, merge_1.mergeCoins)(LEDGER_PATH, originId, targetId, mergeSignature, vol);
}
