import { Express } from 'express';
import Config from "../types/config";
import createMinedCoin from "../addMinedCoin";
import fs from "fs";
import https from 'https';
import fetch from 'node-fetch';

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
    if (config.filterChanges) return;
    toID = setTimeout(() => {
        console.log("Took too long!");
        cycle(config);
    }, config.targetTimeout);
}

function cycle(config: Config) {
    const agent = new https.Agent({
        localAddress: config.myIp
    });
    function mirror(endpoint: string, data: any) {
        for (const mirror of JSON.parse(fs.readFileSync("./mirrors.json", "utf-8"))) {
            fetch(mirror + "/" + endpoint, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                agent: agent
            }).catch((e: any) => console.log("Error mirroring: " + e.message));
        }
    }

    if (toID) clearTimeout(toID);
    if (Date.now() - lastFound > TARGET && BigInt("0x" + DIFF) < BigInt("0x" + config.startingDiff))
        DIFF = (BigInt("0x" + DIFF) + BigInt("0x" + config.adjust)).toString(16);
    else
        DIFF = (BigInt("0x" + DIFF) - BigInt("0x" + config.adjust)).toString(16);

    DIFF = DIFF.replace('-', '').padStart(64, '0');
    fs.writeFileSync("diff.save", DIFF);

    SEED = Math.random() + "" + Math.random() + "";
    lastFound = Date.now();

    mirror("set-challenge", {
        seed: SEED,
        diff: DIFF,
        reward: REWARD,
        circulation: CIRCULATION,
        lf: lastFound
    });

    toID = setTimeout(() => {
        console.log("Took too long!");
        cycle(config);
    }, config.targetTimeout);
}

function register(app: Express, config: Config) {
    const agent = new https.Agent({
        localAddress: config.myIp
    });
    function mirror(endpoint: string, data: any) {
        for (const mirror of JSON.parse(fs.readFileSync("./mirrors.json", "utf-8"))) {
            fetch(mirror + "/" + endpoint, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                agent: agent
            }).catch(e => console.log("Error mirroring: " + e.message));
        }
    }

    function restrict(req: any, res: any, next: any) {
        if (!config.filterChanges) return next();
        const clientIP = req.ip || req.connection.remoteAddress;

        // IPv6-mapped IPv4 address handling
        const normalizedIP = clientIP.replace('::ffff:', '');

        if (normalizedIP === config.filterChanges) {
            next();
        } else {
            res.status(403).send('IP not allowed: ' + normalizedIP);
            console.log("Denied ip: " + normalizedIP);
        }
    }
    const dualRoute = (path: string, handler: any, restrictor?: any) => {
        if (restrictor) {
            app.get(path, restrictor, handler);
            app.post(path, restrictor, handler);
        } else {
            app.get(path, handler);
            app.post(path, handler);
        }
    };

    // @ts-ignore
    dualRoute("/get-challenge", (_, res) => {
        res.json({
            seed: SEED,
            diff: DIFF,
            reward: REWARD,
            lastFound
        });
    });

    // @ts-ignore
    dualRoute("/challenge-solved", (req, res) => {
        const { holder, sign, hash } = Object.keys(req.body).length !== 0 ? req.body : req.query;
        if (!sign || !holder || !hash) return res.status(400).json({ error: "Missing parameters" });

        try {
            mirror("challenge-solved", { holder, sign, hash });
            const id = createMinedCoin(config.ledgerDirectory, REWARD, holder, sign, hash, SEED, DIFF);
            console.log(`Mined #${id}`);
            if (config.filterChanges) return res.json({ id });
            CIRCULATION += REWARD;
            REWARD = (-CIRCULATION / (config.maxSupply / config.reward)) + config.reward;
            fs.writeFileSync("circulation.save", CIRCULATION.toString());
            console.log(`hash: ${hash} | diff: ${DIFF} | in: ${Date.now() - lastFound}`);
            console.log("New reward:", REWARD);

            cycle(config);
            res.json({ id });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }, restrict);

    if (config.filterChanges) {
        dualRoute("/set-challenge", (req: any, res: any) => {
            const { seed, diff, circulation, reward, lf } = Object.keys(req.body).length !== 0 ? req.body : req.query;
            if (!seed || !diff || !circulation || !reward || !lf) return res.status(400).json({ error: "Missing parameters" });
            console.log("Received job from master:", seed, diff, circulation, reward, lf)
            setJob(diff, seed, circulation, reward, lf);
        }, restrict);
    }
}

function setJob(diff: string, seed: string, circulation: number, reward: number, lf: number) {
    DIFF = diff;
    SEED = seed;
    CIRCULATION = circulation;
    REWARD = reward;
    lastFound = lf;
    fs.writeFileSync("circulation.save", CIRCULATION.toString());
    fs.writeFileSync("diff.save", DIFF);
}

export { register, setUp, setJob };
