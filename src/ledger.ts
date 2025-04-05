import Config from "./types/config";
import { ec } from "elliptic";
import { Coin } from "./types/ledger";
import fs from "fs";
import { sha256 } from "./cryptoUtils";

const ecdsa = new ec('secp256k1');

let LEDGER_PATH: null | string = null;
let lastId: number = -1;

class InvalidTransactionSignatureError extends Error {
    constructor() {
        super("The user initiating the transaction provided an invalid signature when trying to transact");
    }
}
class LedgerNotInitializedError extends Error {
    constructor() {
        super("Ledger has not yet been initialized");
    }
}
class NonexistentCoinError extends Error {
    constructor(id: number) {
        super("Coin #" + id + " doesn't exist");
    }
}
class FeeNotPaidError extends Error {
    constructor(id: number) {
        super("Please pay dev fees for coin #" + id);
    }
}

function incrementLastId() {
    lastId++;
    fs.writeFileSync(LEDGER_PATH + "/last.id", lastId + "", 'utf-8');
}

function loadLedger(config: Config) {
    LEDGER_PATH = config.ledgerDirectory;
    if (!fs.existsSync(LEDGER_PATH)) {
        fs.mkdirSync(LEDGER_PATH, { recursive: true });
    }
    if (!fs.existsSync(LEDGER_PATH + "/last.id")) fs.writeFileSync(LEDGER_PATH + "/last.id", "-1", 'utf8');
    else lastId = parseInt(fs.readFileSync(LEDGER_PATH + "/last.id", "utf-8"));
}

function getCoin(id: number): Coin {
    if (LEDGER_PATH === null) throw new LedgerNotInitializedError();
    if (id > lastId) throw new NonexistentCoinError(id);
    return JSON.parse(fs.readFileSync(LEDGER_PATH + "/" + id + ".coin.json", "utf-8"));
}

function addTransaction(id: number, newHolder: string, transactionSignature: string) {
    const coin: Coin = getCoin(id);
    if (coin.paidFee !== undefined && !coin.paidFee) throw new FeeNotPaidError(id);
    const previousOwner: string = coin.transactions[coin.transactions.length - 1].holder;
    const key = ecdsa.keyFromPublic(previousOwner, 'hex');
    if (!key.verify(sha256(newHolder), transactionSignature)) throw new InvalidTransactionSignatureError();
    coin.transactions.push({
        holder: newHolder,
        transactionSignature: transactionSignature
    });
    fs.writeFileSync(LEDGER_PATH + "/" + id + ".coin.json", JSON.stringify(coin, null, 2), "utf-8");
}

export { incrementLastId, addTransaction, getCoin, loadLedger, InvalidTransactionSignatureError, NonexistentCoinError, LedgerNotInitializedError };
