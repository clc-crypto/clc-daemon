import { Express } from 'express';
import Config from "../types/config";
import createMinedCoin from "../addMinedCoin";
import fs from "fs";

let SEED = Math.random() + "" + Math.random() + "";
let REWARD = 0;
let DIFF = "0";
let CIRCULATION = 0;
if (fs.existsSync("circulation.save")) CIRCULATION = parseFloat(fs.readFileSync("circulation.save", "utf-8"));
let TARGET = 60000;
let lastFound = Date.now();
let toID: null | NodeJS.Timeout = null;

function setUp(config: Config) {
    REWARD = config.reward;
    TARGET = config.target;
    DIFF = config.startingDiff;
    if (fs.existsSync("diff.save")) DIFF = fs.readFileSync("diff.save", "utf-8");

    toID = setTimeout(() => {
        console.log("Took too long!");
        cycle(config);
    }, config.targetTimeout);
}

function cycle(config: Config) {
    if (toID) clearTimeout(toID);
    if (Date.now() - lastFound > TARGET && BigInt("0x" + DIFF) < BigInt("0x" + config.startingDiff))
        DIFF = (BigInt("0x" + DIFF) + BigInt("0x" + config.adjust)).toString(16);
    else
        DIFF = (BigInt("0x" + DIFF) - BigInt("0x" + config.adjust)).toString(16);

    DIFF = DIFF.replace('-', '').padStart(64, '0');
    fs.writeFileSync("diff.save", DIFF);

    SEED = Math.random() + "" + Math.random() + "";
    lastFound = Date.now();

    toID = setTimeout(() => {
        console.log("Took too long!");
        cycle(config);
    }, config.targetTimeout);
}

function register(app: Express, config: Config) {
    const dualRoute = (path: string, handler: any) => {
        app.get(path, handler);
        app.post(path, handler);
    };

    // @ts-ignore
    dualRoute("/get-challenge", (req, res) => {
        res.json({
            seed: SEED,
            diff: DIFF,
            reward: REWARD,
            lastFound
        });
    });

    // @ts-ignore
    dualRoute("/challenge-solved", (req, res) => {
        const { holder, sign, hash } = req.body || req.query;
        if (!sign || !holder || !hash) return res.status(400).json({ error: "Missing parameters" });

        try {
            const id = createMinedCoin(config.ledgerDirectory, REWARD, holder, sign, hash, SEED, DIFF);
            CIRCULATION += REWARD;
            REWARD = (-CIRCULATION / (config.maxSupply / config.reward)) + config.reward;
            fs.writeFileSync("circulation.save", CIRCULATION.toString());

            console.log(`Mined #${id} | ${hash} | diff: ${DIFF} | in: ${Date.now() - lastFound}`);
            console.log("New reward:", REWARD);

            cycle(config);
            res.json({ id });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });
}

export { register, setUp };
