import Config from "./types/config";
import {Coin} from "./types/ledger";
import {getCoin} from "./ledger";
import { ec } from "elliptic";
import fs from "fs";
import { sha256 } from "./cryptoUtils";
import {CentractEvent, executeScope, scopeCode, verify} from "./centracts/centracts";
import { ethers, formatUnits } from "ethers";

const ethProvider = new ethers.WebSocketProvider("https://eth-mainnet.alchemyapi.io/v2/o3KaxWdva97nG2BipypNJF-ocGafgjrO");

const ecdsa = new ec('secp256k1');
let LEDGER_PATH = "./ledger";

let accessingEvents = false;

type Event = {
    id: number,
    scopeId: number,
    event: CentractEvent
}

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

function execute(cid: number, result: string) {
    const coin = getCoin(cid);
    const centractTransaction = coin.transactions[coin.transactions.length - 1];
    if (!centractTransaction.centract) return;
    if (result === "resolve") {
        delete coin.locked;
        coin.transactions.push({
            holder: centractTransaction.centract.transactionAddress,
            transactionSignature: centractTransaction.centract.transactionSignature
        });
        fs.writeFileSync(LEDGER_PATH + "/" + cid + ".coin.json", JSON.stringify(coin, null, 2));
        console.log("Resolved centract for coin #" + cid);
    } else if (result === "abort") {
        delete coin.locked;
        fs.writeFileSync(LEDGER_PATH + "/" + cid + ".coin.json", JSON.stringify(coin, null, 2));
        console.log("Aborted centract for coin #" + cid);
    }
}

const usdtAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

const erc20Abi = [
  "event Transfer(address indexed from, address indexed to, uint value)"
];

const usdtContract = new ethers.Contract(usdtAddress, erc20Abi, ethProvider);

usdtContract.on("Transfer", (from, to, value, event) => {
    while (accessingEvents) continue;
    accessingEvents = true;
    let events = (fs.existsSync("centract-events.json") ? JSON.parse(fs.readFileSync("centract-events.json", "utf-8")) : []) as Event[];

    for (const event of events) {
        if (event.event.type !== "ethtx") continue;
        if (event.event.args[0].toLowerCase() === from.toLowerCase() || event.event.args[0].toLowerCase() === to.toLowerCase()) {
            console.log("TX LISTENED");
            const coin = getCoin(event.id);
            const centractTransaction = coin.transactions[coin.transactions.length - 1];
            if (!centractTransaction.centract) continue;
            const scopes = scopeCode(centractTransaction.centract.code);
            const result = executeScope(scopes[event.scopeId], {
                "tx.from": "'" + from.toLowerCase() + "'",
                "tx.to": "'" + to.toLowerCase() + "'",
                "tx.value": formatUnits(value, 6)
            });
            console.log(formatUnits(value, 6));
            execute(event.id, result)
            if (result !== "exit") events = events.filter((e: any) => e.id !== event.id);
        }
    }

    // const listeners: Record<string, Event> = {};
    // for (const event of events) {
        // if (event.event.type !== "ethtx") continue;
        // listeners[event.event.args[0] as string] = event;
    // }
    // console.log("New block:", blockNumber);
    // const block = await ethProvider.getBlock(blockNumber);
    // if (!block) {
    //     return console.log("Could not get ETH block!");
    // }
    // for (const txHash of block.transactions) {
    //     const tx = await block.getTransaction(txHash);
    //     if (!tx || !tx.to || !tx.from) {
    //         console.log("Could not get ETH tx!");
    //         continue;
    //     }
    //     if (listeners[tx.to.toLowerCase()] || listeners[tx.from.toLowerCase()]) {
    //         const event = listeners[tx.to.toLowerCase()] || listeners[tx.from.toLowerCase()]
    //         console.log("📦 Match:", tx);
            // const coin = getCoin(event.id);
            // const centractTransaction = coin.transactions[coin.transactions.length - 1];
            // if (!centractTransaction.centract) continue;
            // const scopes = scopeCode(centractTransaction.centract.code);
            // const result = executeScope(scopes[event.scopeId], {
            //     "tx.block": blockNumber,
            //     "tx.from": "'" + tx.from.toLowerCase() + "'",
            //     "tx.to": "'" + tx.from.toLowerCase() + "'",
            //     "tx.hash": "'" + txHash + "'",
            //     "tx.value": formatEther(tx.value)
            // });
            // execute(event.id, result)
            // if (result !== "exit") events = events.filter((e: any) => e.id !== event.id);
    //     }
    // }
    //     console.log("finished")
    fs.writeFileSync("centract-events.json", JSON.stringify(events, null, 2));
    accessingEvents = false;
});

function ethTxDaemon(cid: number, holder: string, newHolder: string, sign: string) {
    while (accessingEvents) continue;
    accessingEvents = true;
    let events = fs.existsSync("centract-events.json") ? JSON.parse(fs.readFileSync("centract-events.json", "utf-8")) : [];
    for (const event of events) {
        try {
            // const coin = getCoin(event.id);
            // const centractEvent = event.event as CentractEvent;
            // if (centractEvent.type === "clctx" && parseInt(centractEvent.args[0]) === cid) {
            //     const centractTransaction = coin.transactions[coin.transactions.length - 1];
            //     if (!centractTransaction.centract) continue;
            //     const scopes = scopeCode(centractTransaction.centract.code);
            //     const result = executeScope(scopes[event.scopeId], {
            //         "tx.id": cid.toString(),
            //         "tx.newholder": "'" + newHolder + "'",
            //         "tx.holder": "'" + holder + "'",
            //         "tx.sign": "'" + sign + "'",
            //         "tx.val": getCoin(parseInt(cid.toString())).val.toString()
            //     });
            //     if (result === "resolve") {
            //         delete coin.locked;
            //         coin.transactions.push({
            //             holder: centractTransaction.centract.transactionAddress,
            //             transactionSignature: centractTransaction.centract.transactionSignature
            //         });
            //         fs.writeFileSync(LEDGER_PATH + "/" + event.id + ".coin.json", JSON.stringify(coin, null, 2));
            //         console.log("Resolved centract for coin #" + event.id);
            //     } else if (result === "abort") {
            //         delete coin.locked;
            //         fs.writeFileSync(LEDGER_PATH + "/" + event.id + ".coin.json", JSON.stringify(coin, null, 2));
            //         console.log("Aborted centract for coin #" + event.id);
            //     } else continue;
            //     events = events.filter((e: any) => e.id !== event.id);
            // }
            
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
                execute(event.id, result)
                if (result !== "exit") events = events.filter((e: any) => e.id !== event.id);
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
                execute(event.id, result)
                if (result !== "exit") events = events.filter((e: any) => e.id !== event.id);
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