import { getCoin } from "./ledger";
import { hash } from "crypto";
import { ec } from "elliptic";
import fs from "fs";

const ecdsa = new ec('secp256k1');

class InvalidMergeOriginSignatureError extends Error {
    constructor() {
        super("The merge operation's origin holder's signature is invalid");
    }
}
class InvalidMergeVolumeError extends Error {
    constructor() {
        super("The merge operation's volume is invalid");
    }
}

function mergeCoins(LEDGER_PATH: string, originId: number, targetId: number, signature: string, vol: number) {
    const origin = getCoin(originId);
    const target = getCoin(targetId);

    if (vol < 0.000001) throw new InvalidMergeVolumeError();
    if (vol > origin.val) throw new InvalidMergeVolumeError();

    const originKey = ecdsa.keyFromPublic(origin.transactions[origin.transactions.length - 1].holder, "hex");
    if (!originKey.verify(hash("sha256", targetId + " " + target.transactions.length + " " + vol, "hex"), signature)) throw new InvalidMergeOriginSignatureError();

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

    fs.writeFileSync(LEDGER_PATH + "/" + originId + ".coin.json", JSON.stringify(origin, null, 2), "utf-8");
    fs.writeFileSync(LEDGER_PATH + "/" + targetId + ".coin.json", JSON.stringify(target, null, 2), "utf-8");
}

export { mergeCoins, InvalidMergeVolumeError, InvalidMergeOriginSignatureError }