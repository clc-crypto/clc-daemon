import { getCoin, incrementLastId } from "./ledger";
import { sha256 } from "./cryptoUtils";
import { ec } from "elliptic";
import fs from "fs";
import { mergeCoins } from "./merge";
import {Coin} from "./types/ledger";
import Config from "./types/config";

const ecdsa = new ec('secp256k1');

class InvalidSplitOriginSignatureError extends Error {
    constructor() {
        super("The split operation's origin holder's signature is invalid");
    }
}
class InvalidSplitOriginMergeSignatureError extends Error {
    constructor() {
        super("The split operation's origin holder's signature is invalid");
    }
}
class InvalidSplitVolumeError extends Error {
    constructor(emsg?: string) {
        super("The split operation's volume is invalid" + (emsg ? ",  " + emsg : ""));
    }
}
class InvalidNewCoinId extends Error {
    constructor() {
        super("Invalid split operation's new coin id");
    }
}
class FeeNotPaidError extends Error {
    constructor(id: number) {
        super("Please pay dev fees for coin #" + id);
    }
}

function splitCoins(config: Config, LEDGER_PATH: string, originId: number, targetId: number, mergeSignature: string, vol: number) {
    if (parseInt(fs.readFileSync(LEDGER_PATH + "/last.id", "utf-8")) + 1 !== targetId) throw new InvalidNewCoinId();
    const origin = getCoin(originId);

    if (vol > origin.val) throw new InvalidSplitVolumeError("not enough funds at origin.");

    if (origin.paidFee !== undefined && !origin.paidFee) throw new FeeNotPaidError(originId);

    const originKey = ecdsa.keyFromPublic(origin.transactions[origin.transactions.length - 1].holder, "hex");

    if (!originKey.verify(sha256(targetId + " 1 " + vol), mergeSignature)) throw new InvalidSplitOriginMergeSignatureError();

    incrementLastId();
    const coin: Coin = {
        val: 0,
        genesisTime: Date.now(),
        transactions: [
            {
                holder: origin.transactions[origin.transactions.length - 1].holder,
                transactionSignature: origin.transactions[origin.transactions.length - 1].transactionSignature,
            }
        ]
    }

    fs.writeFileSync(LEDGER_PATH + "/" + parseInt(fs.readFileSync(LEDGER_PATH + "/last.id", "utf-8")) + ".coin.json", JSON.stringify(coin, null, 2), "utf-8");

    mergeCoins(config, LEDGER_PATH, originId, targetId, mergeSignature, vol);
}

export { splitCoins, InvalidSplitOriginSignatureError, InvalidSplitOriginMergeSignatureError, InvalidSplitVolumeError, InvalidNewCoinId };
