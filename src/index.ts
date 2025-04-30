import express from 'express';
import https from 'https';
import cors from 'cors';
import fs from 'fs';
import { loadLedger } from "./ledger";
import Config from "./types/config";
import {setUp, register as registerMining, setJob} from "./endpoints/mining";
import {setUp as setUpMirror} from "./endpoints/mirrorJob";
import registerGeneral from "./endpoints/general";
import syncDaemon from "./syncDaemon";
import {init} from "./centractDaemon";

const useHttps = false;

// Load config
const config: Config = JSON.parse(fs.readFileSync("config.json", 'utf8'));
loadLedger(config);
setUpMirror(config);

// Start Express app
const app = express();
app.use(express.json());
app.use(cors());
app.set('trust proxy', true);

(async () => {
    if (process.argv.length == 4 && (process.argv[2] === "--sync" || process.argv[2] === "-s")) {
        await syncDaemon(process.argv[3], config);
        console.log("Synced!");
    }

    setUp(config);
    registerGeneral(app, config);
    registerMining(app, config);
    if (!config.filterChanges) init(config);

    if (process.argv.length == 4 && (process.argv[2] === "--sync" || process.argv[2] === "-s")) {
        fetch(process.argv[3] + "/get-challenge").then(res => res.json()).then(data => {
            fetch(process.argv[3] + "/circulation").then(res => res.json()).then(cdata => {
                setJob(data.diff, data.seed, cdata.circulation, data.reward, data.lastFound);
            });
        });
    }

    if (useHttps) {
        const privateKey = fs.readFileSync('/etc/letsencrypt/live/clc.ix.tc/privkey.pem', 'utf8');
        const certificate = fs.readFileSync('/etc/letsencrypt/live/clc.ix.tc/fullchain.pem', 'utf8');
        const credentials = {key: privateKey, cert: certificate};

        const server = https.createServer(credentials, app);
        server.listen(config.apiPort, '0.0.0.0', () => {
            console.log(`HTTPS Server running on https://localhost:${config.apiPort}`);
        });
    } else {
        app.listen(config.apiPort, '0.0.0.0', () => {
            console.log(`HTTPS Server running on https://localhost:${config.apiPort}`);
        });
    }
})();
