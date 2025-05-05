import { ec } from "elliptic"
import {sha256} from "./cryptoUtils";
const ecdsa = new ec('secp256k1');
(async () => {
    const kp = ecdsa.keyFromPrivate("612805dfe5e3229a9c676cea4ae4d8410eb5a6010849a200dc7dc3fc93411380")
    const cid = 64;
    const coin = (await (await fetch("https://clc.ix.tc/coin/" + cid)).json()).coin;

    const centract = `
.timeout ${Date.now() + 20000}
 abort
`
    const rkp = ecdsa.genKeyPair();
    console.log("Transacting to: " + rkp.getPublic().encode("hex", false) + " (" + rkp.getPrivate().toString("hex") + ")");
    console.log("Using centract: " + centract);
    const fee = (await (await fetch("https://clc.ix.tc/centract-fee/" + cid + "?lines=" + centract.trim().split("\n").length)).json()).fee;
    const feeLength = (await (await fetch("https://clc.ix.tc/coin/0")).json()).coin.transactions.length;
    console.log(fee, feeLength)
    const transactionSignature = kp.sign(sha256(rkp.getPublic().encode("hex", false))).toDER("hex");
    const centractSignature = kp.sign(sha256(centract.trim() + "\n" + (coin.transactions.length + 1))).toDER("hex");
    const feeSignature = kp.sign(sha256("0 " + feeLength + " " + fee)).toDER("hex");

    fetch(`https://clc.ix.tc/centract?cid=${cid}&sign=${transactionSignature}&newholder=${rkp.getPublic().encode("hex", false)}&centract=${encodeURI(centract)}&centractsign=${centractSignature}&feesign=${feeSignature}`).then(res => res.json()).then(data => {
        console.log(data);
        // const rkp2 = ecdsa.genKeyPair();
        // const cid2 = 122;
        // const kp2 = ecdsa.keyFromPrivate("428e2ba7d01c78d28b13cf552b1c61be96593f04d73fdd39393ad5b55b8dce16");
        // const sign = kp2.sign(sha256(rkp2.getPublic().encode("hex", false))).toDER("hex");
        // console.log("Going to transact coin #" + cid, "to: privkey " + rkp2.getPrivate().toString("hex"))
        // fetch("http://localhost:7070/transaction?cid=" + cid2 + "&newholder=" + rkp2.getPublic().encode("hex", false) + "&sign=" + sign).then(res => res.json()).then(data => {
        //     console.log(data);
        // });
    });
})();