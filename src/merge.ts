import { getCoin } from "./ledger";
import { sha256 } from "./cryptoUtils";
import { ec } from "elliptic";
import fs from "fs";
import Config from "./types/config";

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
class FeeNotPaidError extends Error {
    constructor(id: number) {
        super("Please pay dev fees for coin #" + id);
    }
}

function mergeCoins(config: Config, LEDGER_PATH: string, originId: number, targetId: number, signature: string, vol: number) {
    const origin = getCoin(originId);
    const target = getCoin(targetId);

    if (vol < 0.00000001) throw new InvalidMergeVolumeError();
    if (vol > origin.val) throw new InvalidMergeVolumeError();

    if (origin.paidFee !== undefined && !origin.paidFee && originId !== config.devFeeAddress && vol < origin.val * config.devFeePercent) throw new FeeNotPaidError(originId);

    const originKey = ecdsa.keyFromPublic(origin.transactions[origin.transactions.length - 1].holder, "hex");
    if (!originKey.verify(sha256(targetId + " " + target.transactions.length + " " + vol), signature)) throw new InvalidMergeOriginSignatureError();

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
        holder: target.transactions[target.transactions.length - 1].holder,
        transactionSignature: target.transactions[target.transactions.length - 1].transactionSignature,
        transformationType: "merge",
        transformation: {
            origin: originId,
            height: origin.transactions.length - 1,
            vol: vol
        }
    });
    target.val += vol;
    origin.paidFee = true;
    fs.writeFileSync(LEDGER_PATH + "/" + originId + ".coin.json", JSON.stringify(origin, null, 2), "utf-8");
    fs.writeFileSync(LEDGER_PATH + "/" + targetId + ".coin.json", JSON.stringify(target, null, 2), "utf-8");
}

export { mergeCoins, InvalidMergeVolumeError, InvalidMergeOriginSignatureError }