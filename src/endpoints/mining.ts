import { Socket } from 'net';
import Config from "../types/config";
import createMinedCoin from "../addMinedCoin";
import fs from "fs";

let SEED: string = Math.random() + "" + Math.random() + "";
let REWARD: number = 0;
let DIFF: string = "0";
let CIRCULATION: number = 0;
if (fs.existsSync("circulation.save")) CIRCULATION = parseFloat(fs.readFileSync("circulation.save", "utf-8"));
let TARGET: number = 60000; // x ms / reward
let lastFound = Date.now();

function setUp(config: Config) {
    REWARD = config.reward;
    TARGET = config.target;
    DIFF = config.startingDiff;
    if (fs.existsSync("diff.save")) DIFF = fs.readFileSync("diff.save", "utf-8");

    console.log("Target timeout: " + config.targetTimeout);
}

let toID: null | NodeJS.Timeout = null;
function cycle(config: Config) {
    if (toID !== null) clearTimeout(toID);
    if (Date.now() - lastFound > TARGET && BigInt("0x" + DIFF) < BigInt("0x" + config.startingDiff)) DIFF = (BigInt("0x" + DIFF) + BigInt("0x" + config.adjust)).toString(16);
    else DIFF = (BigInt("0x" + DIFF) - BigInt("0x" + config.adjust)).toString(16);
    DIFF = DIFF.replace('-', '');
    DIFF = DIFF.padStart(64, '0');

    fs.writeFileSync("diff.save", DIFF);

    SEED = Math.random() + "" + Math.random() + "";
    console.log("New seed " + SEED);
    console.log("New diff " + DIFF);
    console.log("=".repeat(process.stdout.columns));

    lastFound = Date.now();

    toID = setTimeout(() => {
        console.log("Took to long!");
        cycle(config);
    }, config.targetTimeout);
}

function register(socket: Socket, config: Config) {
    socket.on('data', (data) => {
        try {
            const request = JSON.parse(data.toString());
            if (request.endpoint === "get-challenge") {
                socket.write(JSON.stringify({
                    seed: SEED,
                    diff: DIFF,
                    reward: REWARD,
                    lastFound: lastFound
                }) + "\x1e");
            } else if (request.endpoint === "challenge-solved") {
                handleChallengeSolved(request, socket);
            }
        } catch (e: any) {
            socket.write(JSON.stringify({ error: e.message }) + "\x1e");
        }
    });

    function handleChallengeSolved(request: any, socket: Socket) {
        try {
            if (!request.data.sign) throw new Error("Missing sign parameter");
            if (!request.data.holder) throw new Error("Missing holder parameter");
            if (!request.data.hash) throw new Error("Missing hash parameter");
            const id = createMinedCoin(config.ledgerDirectory, REWARD, request.data.holder, request.data.sign, request.data.hash, SEED, DIFF);
            CIRCULATION += REWARD;
            REWARD = (-CIRCULATION / (config.maxSupply / config.reward)) + config.reward;
            fs.writeFileSync("circulation.save", CIRCULATION.toString());

            console.log("Mined #" + id + " | " + request.data.hash + " | diff: " + DIFF + " | in: " + (Date.now() - lastFound));
            console.log("Took to long? " + (Date.now() - lastFound > TARGET));
            console.log("New reward: " + REWARD);

            cycle(config);

            socket.write(JSON.stringify({ id: id }) + "\x1e");
        } catch (e: any) {
            socket.write(JSON.stringify({ error: e.message }) + "\x1e");
        }
    }
}

export {register, setUp};