"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerNotInitializedError = exports.NonexistentCoinError = exports.InvalidTransactionSignatureError = exports.loadLedger = exports.getCoin = exports.addTransaction = exports.incrementLastId = void 0;
const elliptic_1 = require("elliptic");
const fs_1 = __importDefault(require("fs"));
const cryptoUtils_1 = require("./cryptoUtils");
const ecdsa = new elliptic_1.ec('secp256k1');
let LEDGER_PATH = null;
let lastId = -1;
class InvalidTransactionSignatureError extends Error {
    constructor() {
        super("The user initiating the transaction provided an invalid signature when trying to transact");
    }
}
exports.InvalidTransactionSignatureError = InvalidTransactionSignatureError;
class LedgerNotInitializedError extends Error {
    constructor() {
        super("Ledger has not yet been initialized");
    }
}
exports.LedgerNotInitializedError = LedgerNotInitializedError;
class NonexistentCoinError extends Error {
    constructor(id) {
        super("Coin #" + id + " doesn't exist");
    }
}
exports.NonexistentCoinError = NonexistentCoinError;
function incrementLastId() {
    lastId++;
    fs_1.default.writeFileSync(LEDGER_PATH + "/last.id", lastId + "", 'utf-8');
}
exports.incrementLastId = incrementLastId;
function loadLedger(config) {
    LEDGER_PATH = config.ledgerDirectory;
    if (!fs_1.default.existsSync(LEDGER_PATH)) {
        fs_1.default.mkdirSync(LEDGER_PATH, { recursive: true });
    }
    if (!fs_1.default.existsSync(LEDGER_PATH + "/last.id"))
        fs_1.default.writeFileSync(LEDGER_PATH + "/last.id", "-1", 'utf8');
    else
        lastId = parseInt(fs_1.default.readFileSync(LEDGER_PATH + "/last.id", "utf-8"));
}
exports.loadLedger = loadLedger;
function getCoin(id) {
    if (LEDGER_PATH === null)
        throw new LedgerNotInitializedError();
    if (id > lastId)
        throw new NonexistentCoinError(id);
    return JSON.parse(fs_1.default.readFileSync(LEDGER_PATH + "/" + id + ".coin.json", "utf-8"));
}
exports.getCoin = getCoin;
function addTransaction(id, newHolder, transactionSignature) {
    const coin = getCoin(id);
    const previousOwner = coin.transactions[coin.transactions.length - 1].holder;
    const key = ecdsa.keyFromPublic(previousOwner, 'hex');
    if (!key.verify((0, cryptoUtils_1.sha256)(newHolder), transactionSignature))
        throw new InvalidTransactionSignatureError();
    coin.transactions.push({
        holder: newHolder,
        transactionSignature: transactionSignature
    });
    fs_1.default.writeFileSync(LEDGER_PATH + "/" + lastId + ".coin.json", JSON.stringify(coin, null, 2), "utf-8");
}
exports.addTransaction = addTransaction;
