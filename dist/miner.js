"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const elliptic_1 = require("elliptic");
const fs_1 = __importDefault(require("fs"));
const ecdsa = new elliptic_1.ec('secp256k1');
let SEED = "wait";
let DIFF = BigInt("0x0000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
function isValidKey(hash) {
    // Convert hash to an integer
    const hashInt = BigInt("0x" + hash);
    // Compare with difficulty
    return hashInt <= DIFF;
}
let i = 1;
function updateJob() {
    fetch("http://localhost:3000/get-challenge").then(res => res.json()).then(data => {
        if (data.seed !== SEED) {
            console.log();
            console.log("NEW JOB");
            console.log("DIFF: " + data.diff);
            console.log("SEED: " + data.seed);
            console.log("REWARD: " + data.reward);
            console.log();
            i = 0;
            SEED = data.seed;
            DIFF = BigInt("0x" + data.diff);
        }
    });
}
setInterval(() => updateJob(), 500);
updateJob();
console.log("Starting CLC miner...");
console.log("Syncing job...");
setInterval(() => {
    if (SEED === "wait")
        return;
    try {
        const key = ecdsa.genKeyPair();
        const publicKeyHex = key.getPublic().encode("hex", false);
        // Compute SHA-256 hash
        const hashHex = (0, crypto_1.hash)("sha256", publicKeyHex + SEED, "hex");
        if (i % 100 === 0)
            console.log("Mining... " + i + " | " + hashHex);
        if (isValidKey(hashHex)) {
            console.log("Found CLC!");
            console.log("Public Key");
            console.log(key.getPublic().encode("hex", false));
            console.log("Private Key");
            console.log(key.getPrivate().toString("hex"));
            console.log("Hash");
            console.log(hashHex);
            console.log("Mining Signature");
            const sign = key.sign((0, crypto_1.hash)("sha256", key.getPublic().encode("hex", false), "hex")).toDER("hex");
            console.log(sign);
            (() => __awaiter(void 0, void 0, void 0, function* () {
                console.log("Requesting reward...");
                const res = yield fetch("http://localhost:3000/challenge-solved?holder=" + key.getPublic().encode("hex", false) + "&sign=" + sign + "&hash=" + hashHex);
                updateJob();
                if (res.status !== 200)
                    console.log("Bad Request");
                else {
                    console.log("Accepted!");
                    console.log("Saving to rewards/" + hashHex + "...");
                    fs_1.default.writeFileSync("rewards/" + hashHex, "priv\n" + key.getPrivate().toString("hex") + "\npub\n" + key.getPublic().encode("hex", false) + "\nhash\n" + hashHex + "\nsign\n" + sign, "utf-8");
                }
            }))();
        }
        i++;
    }
    catch (e) {
        console.log(e.message);
    }
}, 0);
