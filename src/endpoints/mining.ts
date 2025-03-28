import { Socket } from 'net';
import Config from "../types/config";
import createMinedCoin from "../addMinedCoin";
import fs from "fs";

let SEED: string = Math.random() + "" + Math.random() + "";
let REWARD: number = 0;
let DIFF: string = "0";
let CIRCULATION: number = 0;
if (fs.existsSync("diff.save")) DIFF = fs.readFileSync("diff.save", "utf-8");
if (fs.existsSync("circulation.save")) CIRCULATION = parseFloat(fs.readFileSync("circulation.save", "utf-8"));
let TARGET: number = 60000; // x ms / reward
function setUp(config: Config) {
    REWARD = config.reward;
    TARGET = config.target;
    DIFF = config.startingDiff;
}

function register(socket: Socket, config: Config) {
    let lastFound = Date.now();
    socket.on('data', (data) => {
        try {
            const request = JSON.parse(data.toString());
            if (request.endpoint === "get-challenge") {
                socket.write(JSON.stringify({
                    seed: SEED,
                    diff: DIFF,
                    reward: REWARD,
                    lastFound: lastFound
                }));
            } else if (request.endpoint === "challenge-solved") {
                handleChallengeSolved(request, socket);
            }
        } catch (e: any) {
            console.log({ error: e.message });
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

            if (Date.now() - lastFound > TARGET) DIFF = (BigInt("0x" + DIFF) + BigInt("0x" + config.adjust)).toString(16);
            else DIFF = (BigInt("0x" + DIFF) - BigInt("0x" + config.adjust)).toString(16);
            DIFF = DIFF.replace('-', '');
            DIFF = DIFF.padStart(64, '0');

            fs.writeFileSync("diff.save", DIFF);

            SEED = Math.random() + "" + Math.random() + "";
            console.log("New seed " + SEED);
            console.log("New diff " + DIFF);
            console.log("=".repeat(process.stdout.columns));

            lastFound = Date.now();
            socket.write(JSON.stringify({ id: id }));
        } catch (e: any) {
            socket.write(JSON.stringify({ error: e.message }));
        }
    }
}

export {register,  setUp};
