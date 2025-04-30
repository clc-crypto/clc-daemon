import Config from "./types/config";
import {Coin} from "./types/ledger";
import {getCoin} from "./ledger";
import { ec } from "elliptic";
import fs from "fs";
import { sha256 } from "./cryptoUtils";
import {CentractEvent, executeScope, scopeCode, verify} from "./centracts/centracts";

const ecdsa = new ec('secp256k1');
let LEDGER_PATH = "./ledger";

class InvalidTransactionSignatureError extends Error {
    constructor() {
        super("The user initiating the transaction provided an invalid signature when trying to transact");
    }
}
class InvalidCentractSignatureError extends Error {
    constructor() {
        super("The user initiating the centract provided an invalid signature when trying to set up a new centract");
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

let accessingEvents = false;

function ethTxDaemon(cid: number, holder: string, newHolder: string, sign: string) {
    while (accessingEvents) continue;
    accessingEvents = true;
    let events = fs.existsSync("centract-events.json") ? JSON.parse(fs.readFileSync("centract-events.json", "utf-8")) : [];
    for (const event of events) {
        try {
            const coin = getCoin(event.id);
            const centractEvent = event.event as CentractEvent;
            if (centractEvent.type === "clctx" && parseInt(centractEvent.args[0]) === cid) {
                const centractTransaction = coin.transactions[coin.transactions.length - 1];
                if (!centractTransaction.centract) continue;
                const scopes = scopeCode(centractTransaction.centract.code);
                const result = executeScope(scopes[event.scopeId], {
                    "tx.id": cid.toString(),
                    "tx.newholder": "'" + newHolder + "'",
                    "tx.holder": "'" + holder + "'",
                    "tx.sign": "'" + sign + "'",
                    "tx.val": getCoin(parseInt(cid.toString())).val.toString()
                });
                if (result === "resolve") {
                    delete coin.locked;
                    coin.transactions.push({
                        holder: centractTransaction.centract.transactionAddress,
                        transactionSignature: centractTransaction.centract.transactionSignature
                    });
                    fs.writeFileSync(LEDGER_PATH + "/" + event.id + ".coin.json", JSON.stringify(coin, null, 2));
                    console.log("Resolved centract for coin #" + event.id);
                } else if (result === "abort") {
                    delete coin.locked;
                    fs.writeFileSync(LEDGER_PATH + "/" + event.id + ".coin.json", JSON.stringify(coin, null, 2));
                    console.log("Aborted centract for coin #" + event.id);
                } else continue;
                events = events.filter((e: any) => e.id !== event.id);
            }
        } catch (e: any) {
            console.log("Error in timeout daemon for event: " + JSON.stringify(event));
            console.log("Error: " + e.message);
        }
    }
    fs.writeFileSync("centract-events.json", JSON.stringify(events, null, 2));
    accessingEvents = false;
}

function clcTxDaemon(cid: number, holder: string, newHolder: string, sign: string) {
    while (accessingEvents) continue;
    accessingEvents = true;
    let events = fs.existsSync("centract-events.json") ? JSON.parse(fs.readFileSync("centract-events.json", "utf-8")) : [];
    for (const event of events) {
        try {
            const coin = getCoin(event.id);
            const centractEvent = event.event as CentractEvent;
            if (centractEvent.type === "clctx" && parseInt(centractEvent.args[0]) === cid) {
                const centractTransaction = coin.transactions[coin.transactions.length - 1];
                if (!centractTransaction.centract) continue;
                const scopes = scopeCode(centractTransaction.centract.code);
                const result = executeScope(scopes[event.scopeId], {
                    "tx.id": cid.toString(),
                    "tx.newholder": "'" + newHolder + "'",
                    "tx.holder": "'" + holder + "'",
                    "tx.sign": "'" + sign + "'",
                    "tx.val": getCoin(parseInt(cid.toString())).val.toString()
                });
                if (result === "resolve") {
                    delete coin.locked;
                    coin.transactions.push({
                        holder: centractTransaction.centract.transactionAddress,
                        transactionSignature: centractTransaction.centract.transactionSignature
                    });
                    fs.writeFileSync(LEDGER_PATH + "/" + event.id + ".coin.json", JSON.stringify(coin, null, 2));
                    console.log("Resolved centract for coin #" + event.id);
                } else if (result === "abort") {
                    delete coin.locked;
                    fs.writeFileSync(LEDGER_PATH + "/" + event.id + ".coin.json", JSON.stringify(coin, null, 2));
                    console.log("Aborted centract for coin #" + event.id);
                } else continue;
                events = events.filter((e: any) => e.id !== event.id);
            }
        } catch (e: any) {
            console.log("Error in timeout daemon for event: " + JSON.stringify(event));
            console.log("Error: " + e.message);
        }
    }
    fs.writeFileSync("centract-events.json", JSON.stringify(events, null, 2));
    accessingEvents = false;
}

function timeoutDaemon() {
    while (accessingEvents) continue;
    accessingEvents = true;
    let events = fs.existsSync("centract-events.json") ? JSON.parse(fs.readFileSync("centract-events.json", "utf-8")) : [];
    for (const event of events) {
        try {
            const coin = getCoin(event.id);
            const centractEvent = event.event as CentractEvent;
            if (centractEvent.type === "timeout" && parseInt(centractEvent.args[0]) <= Date.now()) {
                const centractTransaction = coin.transactions[coin.transactions.length - 1];
                if (!centractTransaction.centract) continue;
                const scopes = scopeCode(centractTransaction.centract.code);
                const result = executeScope(scopes[event.scopeId], {});
                if (result === "resolve") {
                    delete coin.locked;
                    coin.transactions.push({
                        holder: centractTransaction.centract.transactionAddress,
                        transactionSignature: centractTransaction.centract.transactionSignature
                    });
                    fs.writeFileSync(LEDGER_PATH + "/" + event.id + ".coin.json", JSON.stringify(coin, null, 2));
                    console.log("Resolved centract for coin #" + event.id);
                } else if (result === "abort") {
                    delete coin.locked;
                    fs.writeFileSync(LEDGER_PATH + "/" + event.id + ".coin.json", JSON.stringify(coin, null, 2));
                    console.log("Aborted centract for coin #" + event.id);
                } else continue;
                events = events.filter((e: any) => e.id !== event.id);
            }
        } catch (e: any) {
            console.log("Error in timeout daemon for event: " + JSON.stringify(event));
            console.log("Error: " + e.message);
        }
    }
    fs.writeFileSync("centract-events.json", JSON.stringify(events, null, 2));
    accessingEvents = false;
}

function init(config: Config) {
    LEDGER_PATH = config.ledgerDirectory;
    setInterval(timeoutDaemon, 1000);
}

function addCentract(id: number, transactionSignature: string, newHolder: string, centract: string, centractSignature: string) {
    const coin: Coin = getCoin(id);
    if (!coin) throw new NonexistentCoinError(id);
    if (coin.paidFee !== undefined && !coin.paidFee) throw new FeeNotPaidError(id);
    const previousOwner: string = coin.transactions[coin.transactions.length - 1].holder;
    const key = ecdsa.keyFromPublic(previousOwner, 'hex');
    if (!key.verify(sha256(newHolder), transactionSignature)) throw new InvalidTransactionSignatureError();
    if (!key.verify(sha256(centract.trim() + "\n" + coin.transactions.length), centractSignature)) throw new InvalidCentractSignatureError();

    const scopes = verify(centract);
    const events = fs.existsSync("centract-events.json") ? JSON.parse(fs.readFileSync("centract-events.json", "utf-8")) : [];
    let scopeId = 0;
    for (const scope of scopes) {
        events.push({
            id,
            scopeId,
            event: scope.event
        })
        scopeId++;
    }
    fs.writeFileSync("centract-events.json", JSON.stringify(events, null, 2));

    coin.transactions.push({
        holder: previousOwner,
        transactionSignature: coin.transactions[coin.transactions.length - 1].transactionSignature,
        centract: {
            centractSignature,
            transactionSignature,
            transactionAddress: newHolder,
            code: centract
        }
    });
    coin.locked = true;
    fs.writeFileSync(LEDGER_PATH + "/" + id + ".coin.json", JSON.stringify(coin, null, 2), "utf-8");
}

export default addCentract;
export { init, clcTxDaemon };