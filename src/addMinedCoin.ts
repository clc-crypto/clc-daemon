import { hash } from "crypto";
import { Coin } from "./types/ledger";
import fs from "fs";
import { incrementLastId, LedgerNotInitializedError } from "./ledger";
import { ec } from "elliptic";

const ecdsa = new ec('secp256k1');

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

function createMinedCoin(LEDGER_PATH: string, val: number, holder: string, miningSignature: string, minedHash: string, seed: string, diff: string): number {
    if (LEDGER_PATH === null) throw new LedgerNotInitializedError();

    const key = ecdsa.keyFromPublic(holder, 'hex');
    if (!key.verify(hash("sha256", holder, "hex"), miningSignature) && miningSignature !== "split") throw new InvalidMinerSignatureError();
    if (BigInt("0x" + diff) < BigInt("0x" + minedHash)) throw new InvalidMinedHashError();
    if (hash("sha256", key.getPublic().encode("hex", false) + seed) !== minedHash) throw new InvalidMinedHashError();

    incrementLastId();
    const coin: Coin = {
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
    }

    fs.writeFileSync(LEDGER_PATH + "/" + parseInt(fs.readFileSync(LEDGER_PATH + "/last.id", "utf-8")) + ".coin.json", JSON.stringify(coin, null, 2), "utf-8");
    return parseInt(fs.readFileSync(LEDGER_PATH + "/last.id", "utf-8"));
}

export default createMinedCoin;